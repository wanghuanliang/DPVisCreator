import copy
import pandas as pd
import numpy as np
from pandarallel import pandarallel
import orjson
from sklearn.manifold import MDS
from priv_bayes.kl import get_w_distance, KLdivergence
from django.http import HttpResponse
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import networkx as nx
from dtw import dtw
import itertools
import random
from sklearn.metrics import ndcg_score, average_precision_score
# from sdv.evaluation import evaluate  # sdv打开注释
# from sdv.metrics.tabular import KSTest, CSTest, LogisticDetection, CategoricalCAP, NumericalMLP  # sdv打开注释
# 隐私保护相关包

from priv_bayes.DataSynthesizer.DataDescriber import DataDescriber
from priv_bayes.DataSynthesizer.DataGenerator import DataGenerator
from priv_bayes.DataSynthesizer.lib.utils import display_bayesian_network
from priv_bayes.utils import ndcg, mAP, get_matrix_data

tmp_data_storage = {}
pandarallel.initialize()


seed_list = [12004, 11124, 47324, 22162, 40388]
seed_cnt = 0


def set_random_seed(randomize, seed=0):
    global seed_list, seed_cnt
    if not randomize:    # 不是随机的，设个种子
        print("set seed: ", seed_list[seed_cnt])
        random.seed(seed_list[seed_cnt])
        np.random.seed(seed_list[seed_cnt])
        seed_cnt = (seed_cnt + 1) % 5

def point_inside_polygon(x, y, poly, include_edges=True):
    '''
    Test if point (x,y) is inside polygon poly.

    poly is N-vertices polygon defined as
    [(x1,y1),...,(xN,yN)] or [(x1,y1),...,(xN,yN),(x1,y1)]
    (function works fine in both cases)

    Geometrical idea: point is inside polygon if horisontal beam
    to the right from point crosses polygon even number of times.
    Works fine for non-convex polygons.
    '''
    n = len(poly)
    inside = False

    p1x, p1y = poly[0]
    for i in range(1, n + 1):
        p2x, p2y = poly[i % n]
        if p1y == p2y:
            if y == p1y:
                if min(p1x, p2x) <= x <= max(p1x, p2x):
                    # point is on horisontal edge
                    inside = include_edges
                    break
                elif x < min(p1x, p2x):  # point is to the left from current edge
                    inside = not inside
        else:  # p1y!= p2y
            if min(p1y, p2y) <= y <= max(p1y, p2y):
                xinters = (y - p1y) * (p2x - p1x) / float(p2y - p1y) + p1x

                if x == xinters:  # point is right on the edge
                    inside = include_edges
                    break

                if x < xinters:  # point is to the left from current edge
                    inside = not inside

        p1x, p1y = p2x, p2y

    return inside


def check_session_id(session_id):
    global tmp_data_storage
    if session_id is None or tmp_data_storage.get(session_id) is None:
        return False
    return True


def index(request):
    return HttpResponse("priv_bayes_backend")


def solveOriginalData(session_id):
    global tmp_data_storage
    tmp_data_storage[session_id]['Measures'] = []
    tmp_data_storage[session_id]['Dimensions'] = []
    ORI_DATA = tmp_data_storage[session_id]['ORI_DATA']
    threshold_value = tmp_data_storage[session_id]['threshold_value']
    df = copy.deepcopy(ORI_DATA)
    df['index'] = range(len(df))  # 给每条记录按顺序编号，后续可能会用到
    original_data = orjson.loads(df.to_json(orient="records"))
    attribute_character = {}
    for col in df:
        if col == 'index':
            continue
        if df[col].dtype == int or df[col].dtype == np.int64:  # 记录整型数据
            tmp_data_storage[session_id]['INT_TYPE'].append(col)
        if len(df[col].value_counts()) > threshold_value and df[col].dtype != object:  # 需要类别多，同时不能是数值型
            tmp_data_storage[session_id]['Measures'].append(col)
            minn = min(df[col])
            maxx = max(df[col])
            mean = np.mean(df[col])
            attribute_character[col] = {
                "attribute_type": "Measures",
                "min": minn,
                "max": maxx,
                "average": mean,
            }
        else:
            tmp_data_storage[session_id]['Dimensions'].append(col)  # 离散型
            attribute_character[col] = {
                "attribute_type": "Dimensions",
                "values": np.unique(df[col]).tolist(),
            }
    ret = {
        "status": "success",
        "data": {
            "original_data": original_data,
            "statistics": {},
            "attribute_data": {
                "Dimensions": tmp_data_storage[session_id]['Dimensions'],
                "Measures": tmp_data_storage[session_id]['Measures'],
                "Computations": []
            },
            "attribute_character": attribute_character
        }
    }
    return ret


def getOriginalData(request):  # 获取原始数据
    global tmp_data_storage
    BAYES_EPS = 0.1
    data = request.FILES['file']
    session_id = request.POST.get("session_id")
    if not check_session_id(session_id):
        return HttpResponse(orjson.dumps({
            "status": "failed",
            "err_msg": "disconnected with the server"
        }))
    DATA_PATH = default_storage.save(
        'priv_bayes/data/1.csv', ContentFile(data.read()))
    df = pd.read_csv(DATA_PATH)
    tmp_data_storage[session_id] = {
        "DATA_PATH": DATA_PATH,
        "constraints": None,
        "threshold_value": 20,  # 离散型和数值型分界点
        "bayes_epsilon": BAYES_EPS,  # 贝叶斯网络的隐私预算
        "weights": None,
        "Dimensions": [],
        "Measures": [],
        "INT_TYPE": [],
        "ORI_DATA": df,
        "RAW_DATA": copy.deepcopy(df),
        "BASE_SCHEME": None
    }
    ret = solveOriginalData(session_id)

    return HttpResponse(orjson.dumps(ret))


def cnt_poly(x, params):  # 根据x和多项式系数params计算返回值
    ans = 0
    for item in params:
        ans *= x
        ans += item
    return ans


def initialize(request):
    global tmp_data_storage


    BAYES_EPS = orjson.loads(request.body).get('bayes_eps')
    # BAYES_EPS = 0.1
    session_id = orjson.loads(request.body).get('session_id')
    randomize = orjson.loads(request.body).get('randomize')
    set_random_seed(randomize)

    tmp_data_storage[session_id] = {
        "DATA_PATH": 'priv_bayes/data/insurance.csv',
        "constraints": None,
        "threshold_value": 20,  # 离散型和数值型分界点
        "bayes_epsilon": BAYES_EPS,  # 贝叶斯网络的隐私预算
        "weights": None,
        "Dimensions": [],
        "Measures": [],
        "INT_TYPE": [],
        "ORI_DATA": None,
        "BASE_SCHEME": None,
        "BASE_WEIGHT": 1,
        "randomize": randomize
    }
    df = pd.read_csv(tmp_data_storage[session_id]['DATA_PATH'])
    # ORI_DATA中的数据是filter过的，用于后续处理
    tmp_data_storage[session_id]['BASE_WEIGHT'] = orjson.loads(
        request.body).get('BASE_WEIGHT')
    tmp_data_storage[session_id]['ORI_DATA'] = df
    tmp_data_storage[session_id]['RAW_DATA'] = copy.deepcopy(df)  # 这个是真的原始数据
    solveOriginalData(session_id)
    ret = {
        "status": "success",
    }
    tmp_file_path = "priv_bayes/data/1" + session_id + ".csv"  # 为了用筛选后的数据建贝叶斯网络
    df.to_csv(tmp_file_path)
    return HttpResponse(orjson.dumps(ret))


def destroyed(request):
    global tmp_data_storage
    session_id = orjson.loads(request.body).get('session_id')
    if not check_session_id(session_id):
        return HttpResponse(orjson.dumps({
            "status": "failed",
            "err_msg": "disconnected with the server"
        }))
    del tmp_data_storage[session_id]
    return HttpResponse(orjson.dumps({"status": "success"}))


def get_mds_result(session_id):
    constraints = tmp_data_storage[session_id]['constraints']
    ORI_DATA = tmp_data_storage[session_id]['ORI_DATA']
    Dimensions = tmp_data_storage[session_id]['Dimensions']

    num_of_constraints = len(constraints)
    if num_of_constraints == 1:
        return np.array([[50, 50]])
    kl_df = copy.deepcopy(ORI_DATA)
    kl_df['index'] = range(len(kl_df))
    for dim in Dimensions:  # 将类别型数据重新编码
        if ORI_DATA[dim].dtype == object:  # string类型，重新编码
            vals = np.unique(ORI_DATA[dim]).tolist()
            value_to_bin_idx = {value: idx for idx, value in enumerate(vals)}
            kl_df[dim] = kl_df[dim].map(
                lambda x: value_to_bin_idx[x], na_action='ignore')
    matrix_data = np.zeros((num_of_constraints, num_of_constraints))

    for i in range(num_of_constraints):
        for j in range(i + 1, num_of_constraints):
            if i == j:
                continue
            data_c1 = constraints[i]['data']  # 第一个constraints对应的数据编号
            data_c2 = constraints[j]['data']  # 第二个constraints对应的数据编号
            df_c1 = kl_df.loc[kl_df['index'].isin(
                data_c1)]  # 第一个constraints对应数据
            df_c2 = kl_df.loc[kl_df['index'].isin(
                data_c2)]  # 第二个constraints对应数据
            del df_c1['index']
            del df_c2['index']
            matrix_data[i][j] = matrix_data[j][i] = get_w_distance(
                df_c1.values, df_c2.values)

    embedding = MDS(
        n_components=2, dissimilarity='precomputed', random_state=9)
    D2_MDS_data = embedding.fit_transform(matrix_data)
    D2_MDS_data = (D2_MDS_data - np.min(D2_MDS_data)) / \
        (np.max(D2_MDS_data) - np.min(D2_MDS_data)) * 60 + 20
    return D2_MDS_data


def getFilteredData(request):
    global tmp_data_storage
    session_id = orjson.loads(request.body).get('session_id')
    if not check_session_id(session_id):
        return HttpResponse(orjson.dumps({
            "status": "failed",
            "err_msg": "disconnected with the server"
        }))
    drops = orjson.loads(request.body).get('drops')
    filters = orjson.loads(request.body).get('filter')
    drops = orjson.loads(request.body).get('drops')
    cur_df = tmp_data_storage[session_id]['RAW_DATA']
    for filter_axis in filters:
        if filters[filter_axis]['attribute_type'] == "Dimensions":
            vals = filters[filter_axis]['values']
            cur_df = cur_df.loc[cur_df[filter_axis].isin(vals)]
        if filters[filter_axis]['attribute_type'] == "Measures":
            minn = filters[filter_axis]['min']
            maxx = filters[filter_axis]['max']
            cur_df = cur_df[(cur_df[filter_axis] >= minn) &
                            (cur_df[filter_axis] <= maxx)]
    for it in drops:
        del cur_df[it]
    tmp_data_storage[session_id]['ORI_DATA'] = cur_df
    ret = solveOriginalData(session_id)
    return HttpResponse(orjson.dumps(ret))


def getModelData(request):
    global tmp_data_storage
    session_id = orjson.loads(request.body).get('session_id')
    if not check_session_id(session_id):
        return HttpResponse(orjson.dumps({
            "status": "failed",
            "err_msg": "disconnected with the server"
        }))
    Measures = tmp_data_storage[session_id]['Measures']

    ORI_DATA = tmp_data_storage[session_id]['ORI_DATA']
    cur_df = copy.deepcopy(ORI_DATA)
    DEFAULT_CATEGORIES = 3
    constraints = tmp_data_storage[session_id]['constraints'] = orjson.loads(
        request.body).get('constraints')  # 每个点的权重百分比
    tmp_data_storage[session_id]['weights'] = [{"id": constraint['id'], "weight": 1 / len(constraints)} for constraint
                                               in constraints]
    weights = np.ones((len(constraints))) * 5
    # slice_methods = orjson.loads(request.body).get('slice_methods')
    slice_methods = {}  # 暂无slice_methods
    axis_order = ORI_DATA.columns.tolist()
    return HttpResponse(orjson.dumps({"status": "success, for evaluation function"}))
    # 补全所有需要处理的坐标轴
    # for constraint in constraints:
    #     if constraint['x_axis'] is not None and constraint['x_axis'] not in axis_order:
    #         axis_order.append(constraint['x_axis'])
    #     if constraint['y_axis'] is not None and constraint['y_axis'] not in axis_order:
    #         axis_order.append(constraint['y_axis'])

    # 对每个坐标轴，如果是Measures类型数据，则做一个分位数分段
    new_df = pd.DataFrame()
    for axis in axis_order:
        if axis not in Measures:  # 不是数值型的数据，不需要离散化
            new_df[axis] = ORI_DATA[axis]
            continue
        # 根据K-Means和elbow_method去选择合适的切分份数

        categories = slice_methods.get(axis)
        if categories is None:  # 未提供切分份数
            categories = DEFAULT_CATEGORIES
        cut_points = [100 / categories *
                      item for item in range(0, categories + 1)]
        cut_points = [np.percentile(ORI_DATA[axis], item)
                      for item in cut_points]
        cut_points[-1] += 1e-10  # 最后一个分位点加一个微小的偏移量
        cut_points = np.unique(cut_points)
        new_df[axis] = pd.cut(ORI_DATA[axis], cut_points, right=False)
    cur_df['index'] = range(len(cur_df))
    for constraint in constraints:
        cur_df['constraint_' + constraint['id']] = False

    matrix_data = get_mds_result(session_id)

    for constraint in constraints:
        cur_df.loc[cur_df['index'].isin(
            constraint['data']), 'constraint_' + constraint['id']] = True
    print("111111")
    new_df['count'] = 1
    constraint_axis_list = []
    for constraint in constraints:
        cur_cons = 'constraint_' + constraint['id']
        constraint_axis_list.append(cur_cons)
        new_df[cur_cons] = cur_df[cur_cons]
    print("222222")
    data_df = new_df.groupby(axis_order + constraint_axis_list).agg('count')
    print("222222-2")

    c_df = pd.DataFrame(data_df)
    c_df.reset_index(inplace=True)
    print("222222")
    c_df = c_df[c_df['count'] != 0]
    filtered_data = orjson.loads(c_df.to_json(orient="records"))
    # raw_data = orjson.loads(c_df.to_json(orient="records"))
    # filtered_data = [dt for dt in raw_data if dt['count'] != 0]  # 千万不要用for去循环10w以上的数据
    proportion_data = {}
    print("222222")

    for axis in axis_order:
        tmp_df = pd.DataFrame()
        tmp_df[axis] = new_df[axis]
        tmp_df['count'] = 1
        cc_df = pd.DataFrame(tmp_df.groupby(axis).agg('count'))
        cc_df.reset_index(inplace=True)
        cur_proportiondata = []
        tmp_data = orjson.loads(cc_df.to_json(orient="columns"))
        if axis in Measures:
            for key in tmp_data[axis]:
                cur_bin = dict()
                cur_bin['minn'] = tmp_data[axis][key]['left']
                cur_bin['maxx'] = tmp_data[axis][key]['right']
                cur_bin['num'] = tmp_data['count'][key]
                cur_proportiondata.append(cur_bin)
        else:
            for key in tmp_data[axis]:
                cur_bin = dict()
                cur_bin['value'] = tmp_data[axis][key]
                cur_bin['num'] = tmp_data['count'][key]
                cur_proportiondata.append(cur_bin)

        proportion_data[axis] = cur_proportiondata
    print("333333")

    flow_data = []
    for_background_flow_data = []
    idx = 0
    for item in filtered_data:
        cur_bk_flow = {"flow_index": idx, "num": item['count'], "pos": {}}
        for key in axis_order:
            if key in Measures:
                for i in range(len(proportion_data[key])):
                    if proportion_data[key][i]['minn'] == item[key]['left']:
                        cur_bk_flow['pos'][key] = i
                        break
            else:
                for i in range(len(proportion_data[key])):
                    if proportion_data[key][i]['value'] == item[key]:
                        cur_bk_flow['pos'][key] = i
                        break
        for cons in constraint_axis_list:
            if item[cons] == False:
                continue
            cur_flow = {"flow_index": idx, "constraint_id": cons.split(
                '_')[1], "num": item['count'], "pos": {}}
            for key in axis_order:
                if key in Measures:
                    for i in range(len(proportion_data[key])):
                        if proportion_data[key][i]['minn'] == item[key]['left']:
                            cur_flow['pos'][key] = i
                            break
                else:
                    for i in range(len(proportion_data[key])):
                        if proportion_data[key][i]['value'] == item[key]:
                            cur_flow['pos'][key] = i
                            break
            flow_data.append(cur_flow)
            idx = idx + 1
        for_background_flow_data.append(cur_bk_flow)
    print("555555")

    sankey_data = []
    conses_ret = [{"id": constraint['id'], "type": constraint['type'], "pos": matrix_data[idx].tolist(
    ), "r": float(weights[idx])} for idx, constraint in enumerate(constraints)]
    conses = [constraint['id'] for constraint in constraints]
    for axis_id in range(len(axis_order) - 1):
        x = axis_order[axis_id]
        y = axis_order[axis_id + 1]
        x_len = len(proportion_data[x])
        y_len = len(proportion_data[y])
        back_ground = []
        for i in range(x_len):
            for j in range(y_len):
                tar = sum(
                    [flow['num'] for flow in for_background_flow_data if flow['pos'][x] == i and flow['pos'][y] == j])
                if tar == 0:
                    continue
                back_ground.append({
                    "source": i,
                    "target": j,
                    "num": tar
                })
        cur_conses = {}
        for cons in conses:
            cons_dt = []
            for i in range(x_len):
                for j in range(y_len):
                    tar = sum([flow['num'] for flow in flow_data if
                               flow['pos'][x] == i and flow['pos'][y] == j and flow['constraint_id'] == cons])
                    if tar == 0:
                        continue
                    cons_dt.append({
                        "source": i,
                        "target": j,
                        "num": tar
                    })
            cur_conses[cons] = cons_dt
        cur_data = {
            "source_attr": x,
            "target_attr": y,
            "background": back_ground,
            "constraints": cur_conses
        }
        sankey_data.append(cur_data)
    print("666666")

    threshold_value = tmp_data_storage[session_id]['threshold_value']
    print(threshold_value)
    weights = tmp_data_storage[session_id]['weights']
    tmp_file_path = "priv_bayes/data/1" + session_id + ".csv"   # 为了用筛选后的数据建贝叶斯网络
    matrix_data = get_matrix_data(
        threshold_value, tmp_file_path, constraints, weights, ORI_DATA, DataDescriber)
    # matrix_data = None
    ret = {
        "status": "success",
        "data": {
            "total_num": len(ORI_DATA),
            "axis_order": axis_order,
            "proportion_data": proportion_data,
            "constraints": conses_ret,
            "sankey_data": sankey_data,
            "matrix_data": matrix_data
        }
    }
    return HttpResponse(orjson.dumps(ret))


def setWeights(request):
    global tmp_data_storage
    session_id = orjson.loads(request.body).get("session_id")
    if not check_session_id(session_id):
        return HttpResponse(orjson.dumps({
            "status": "failed",
            "err_msg": "disconnected with the server"
        }))
    constraints = tmp_data_storage[session_id]['constraints']
    weights = tmp_data_storage[session_id]['weights'] = orjson.loads(
        request.body).get('weights')
    threshold_value = tmp_data_storage[session_id]['threshold_value']
    DATA_PATH = tmp_data_storage[session_id]['DATA_PATH']
    ORI_DATA = tmp_data_storage[session_id]['ORI_DATA']
    tmp_file_path = "priv_bayes/data/1" + session_id + ".csv"   # 为了用筛选后的数据建贝叶斯网络
    matrix_data = get_matrix_data(
        threshold_value, tmp_file_path, constraints, weights, ORI_DATA, DataDescriber, randomize=tmp_data_storage[session_id]['randomize'])
    # c_weights = [w["weight"] for w in weights if w["id"] != "others"]
    # if np.max(c_weights) != np.min(c_weights):
    #     c_weights = (c_weights - np.min(c_weights)) / (np.max(c_weights) - np.min(c_weights)) * 5 + 5
    # else:
    #     c_weights = np.ones(len(c_weights)) * 5
    tmp_data_storage[session_id]['bayes_epsilon'] = orjson.loads(
        request.body).get('bayes_budget')
    # matrix_data = get_mds_result(session_id)
    # conses_ret = [{"id": constraint['id'], "type": constraint['type'], "pos": matrix_data[idx].tolist(),
    #                "r": c_weights[idx]} for idx, constraint in enumerate(constraints)]
    # ret = {
    #     "status": "success",
    #     "constraints": conses_ret
    # }
    # ret = get_bayes_with_weights(session_id)
    ret = {
        "status": "success",
        "matrix_data": matrix_data
    }
    # ret['data']['matrix_data'] = matrix_data

    return HttpResponse(orjson.dumps(ret))


def get_bayes_with_weights(session_id):
    description_file = "priv_bayes/out/dscrpt.json"
    DATA_PATH = tmp_data_storage[session_id]['DATA_PATH']
    ORI_DATA = tmp_data_storage[session_id]['ORI_DATA']
    BASE_WEIGHT = tmp_data_storage[session_id]['BASE_WEIGHT']
    print("weight", tmp_data_storage[session_id]['BASE_WEIGHT'])
    constraints = tmp_data_storage[session_id]['constraints']
    weights = tmp_data_storage[session_id]['weights']
    threshold_value = tmp_data_storage[session_id]['threshold_value']
    print(threshold_value)
    bayes_epsilon = tmp_data_storage[session_id]['bayes_epsilon']
    cur_scheme_weights = None
    if weights is not None:
        # 构建一个weights数组
        weight_df = copy.deepcopy(ORI_DATA)
        weight_df[weight_df.columns] = 1.0
        ssum = sum(np.array([w["weight"] for w in weights]))
        # 建立一张axis到id的索引表
        axis2id = {}
        for idx, val in enumerate(weight_df.columns):
            axis2id[val] = idx
        arr = weight_df.values

        for w in weights:
            if w["id"] == "others":
                continue
            cons = [c for c in constraints if c["id"] == w["id"]][0]
            x_id = axis2id.get(cons["x_axis"])
            y_id = axis2id.get(cons["y_axis"])
            cur_ids = cons["data"]
            for id in cur_ids:
                if x_id is not None:
                    arr[id][x_id] = max(
                        arr[id][x_id], w["weight"] / ssum * BASE_WEIGHT)
                if y_id is not None:
                    arr[id][y_id] = max(
                        arr[id][y_id], w["weight"] / ssum * BASE_WEIGHT)
            for axis in axis2id:
                weight_df[axis] = arr[:, axis2id[axis]]
        cur_scheme_weights = {}
        dtdt = orjson.loads(weight_df.to_json(orient="records"))
        for idx, dt in enumerate(dtdt):
            if idx not in cur_ids:
                continue
            cur_scheme_weights[idx] = dt
    tmp_file_path = "priv_bayes/data/1" + session_id + ".csv"
    ORI_DATA.to_csv(tmp_file_path, index=False)
    describer = DataDescriber(
        histogram_bins=15, category_threshold=threshold_value)
    describer.describe_dataset_in_correlated_attribute_mode(dataset_file=tmp_file_path,
                                                            epsilon=bayes_epsilon,
                                                            k=3,
                                                            attribute_to_is_categorical={},
                                                            attribute_to_is_candidate_key={},
                                                            weights=cur_scheme_weights,
                                                            randomize=tmp_data_storage[session_id]["randomize"],
                                                            )

    describer.save_dataset_description_to_file(description_file)

    display_bayesian_network(describer.bayesian_network)

    # 认为贝叶斯网络中边权是-1，使用bellman-ford算法得到每个点的最长路径长度
    axis_ls = ORI_DATA.columns.tolist()
    G = nx.DiGraph()
    G.add_nodes_from(axis_ls)
    linkData = []
    start_point = describer.bayesian_network[0][1][0]
    for item in describer.bayesian_network:
        for fa in item[1]:
            G.add_edge(fa, item[0], weight=-1)
            linkData.append([fa, item[0]])
    res = dict(nx.single_source_bellman_ford_path_length(G, start_point))
    maxx = 1 - min([val for val in res.values()])
    nodeData = [[] for i in range(maxx)]

    for dot in res:
        nodeData[-res[dot]].append(dot)

    ret = {
        "data": {
            "network": {
                "nodeData": nodeData,
                "linkData": linkData
            }
        }
    }
    return ret


def getBaseData(request):
    global tmp_data_storage
    session_id = request.GET.get('session_id')
    if not check_session_id(session_id):
        return HttpResponse(orjson.dumps({
            "status": "failed",
            "err_msg": "disconnected with the server"
        }))
    ret = get_bayes_with_weights(session_id)
    # 增加ret['data']['base']，存放base方案各项指标
    description_file = "priv_bayes/out/dscrpt.json"
    synthetic_data = "priv_bayes/out/syndata.csv"
    bayes_epsilon = tmp_data_storage[session_id]['bayes_epsilon']
    ORI_DATA = tmp_data_storage[session_id]['ORI_DATA']

    generator = DataGenerator()
    generator.generate_dataset_in_correlated_attribute_mode(
        len(ORI_DATA), description_file, 0, tmp_data_storage[session_id]["randomize"])
    generator.save_synthetic_data(synthetic_data)
    synthetic_df = pd.read_csv(synthetic_data)
    ret['data']['base'] = {
        "id": "base",
        "metrics": {
            "privacy_budget": bayes_epsilon,
            "statistical_metrics": {
                # "KSTest": 0.85,
                # "CSTest": 0.85,
                # "KSTest": KSTest.compute(ORI_DATA, synthetic_df),
                # "CSTest": CSTest.compute(ORI_DATA, synthetic_df)
            },
            "detection_metrics": {
                # "LogisticDetection": LogisticDetection.compute(ORI_DATA, synthetic_df)
            },
            "privacy_metrics": {
                # "MLP": NumericalMLP.compute(ORI_DATA, synthetic_df, key_fields=list(set(Measures).difference(['charges'])), sensitive_fields=['charges']),
                # "CAP": CategoricalCAP.compute(ORI_DATA, synthetic_df, key_fields=list(set(Dimensions).difference(['children'])), sensitive_fields=['children'])
                # "MLP": 0.85,
                # "CAP": 0.85
            }
        },
        "protected_data": synthetic_df,
    }
    # 将base存入缓存
    tmp_data_storage[session_id]['BASE_SCHEME'] = ret['data']['base']
    ret['data']['base']['protected_data'] = orjson.loads(
        synthetic_df.to_json(orient="records"))  # 在返回值中再做转json操作
    return HttpResponse(orjson.dumps(ret))


def getNetwork(request):
    global tmp_data_storage
    session_id = request.GET.get('session_id')
    if not check_session_id(session_id):
        return HttpResponse(orjson.dumps({
            "status": "failed",
            "err_msg": "disconnected with the server"
        }))
    ret = get_bayes_with_weights(session_id)
    return HttpResponse(orjson.dumps(ret))


def getMetrics(request):
    global tmp_data_storage
    session_id = request.GET.get('session_id')
    if not check_session_id(session_id):
        return HttpResponse(orjson.dumps({
            "status": "failed",
            "err_msg": "disconnected with the server"
        }))
    description_file = "priv_bayes/out/dscrpt.json"
    synthetic_data = "priv_bayes/out/syndata.csv"
    ORI_DATA = copy.deepcopy(tmp_data_storage[session_id]['ORI_DATA'])
    Dimensions = tmp_data_storage[session_id]['Dimensions']
    constraints = tmp_data_storage[session_id]['constraints']
    bayes_epsilon = tmp_data_storage[session_id]['bayes_epsilon']
    base_scheme = tmp_data_storage[session_id]['BASE_SCHEME']

    get_bayes_with_weights(session_id)  # 这里修改了贝叶斯网络的生成

    generator = DataGenerator()
    generator.generate_dataset_in_correlated_attribute_mode(
        len(ORI_DATA), description_file, 0, tmp_data_storage[session_id]["randomize"])
    generator.save_synthetic_data(synthetic_data)
    pcbayes_df = pd.read_csv(synthetic_data)
    raw_pcbayes_df = pd.read_csv(synthetic_data)

    privbayes_df = pd.DataFrame(base_scheme['protected_data'])

    # 对类别型数据做个离散化记录
    for dim in Dimensions:
        if ORI_DATA[dim].dtype == object:  # string类型，重新编码
            vals = np.unique(ORI_DATA[dim]).tolist()
            value_to_bin_idx = {value: idx for idx, value in enumerate(vals)}
            ORI_DATA[dim] = ORI_DATA[dim].map(
                lambda x: value_to_bin_idx[x], na_action='ignore')
            pcbayes_df[dim] = pcbayes_df[dim].map(
                lambda x: value_to_bin_idx[x], na_action='ignore')
            privbayes_df[dim] = privbayes_df[dim].map(
                lambda x: value_to_bin_idx[x], na_action='ignore')
    pcbayes_patterns = {}
    privbayes_patterns = {}
    for cons in constraints:
        pcbayes_selected_data = None
        privbayes_selected_data = None
        selected_legends = None
        if cons['color']:
            # selected_legends = [item for item in cons['selectedLegend'] if cons['selectedLegend'][item]]
            selected_legends = None
            print(selected_legends)
        if cons["type"] == "cluster":
            area = cons["params"]["area"]
            dt_x = pcbayes_df[cons["x_axis"]]
            dt_y = pcbayes_df[cons["y_axis"]]
            base_dt_x = privbayes_df[cons["x_axis"]]
            base_dt_y = privbayes_df[cons["y_axis"]]
            ori_dt_x = ORI_DATA[cons["x_axis"]]
            ori_dt_y = ORI_DATA[cons["y_axis"]]
            if cons["params"]["type"] == "rect":
                pcbayes_selected_data = pcbayes_df[(dt_x >= area[0][0]) & (dt_x <= area[1][0]) & (dt_y >= area[1][1])
                                                   & (dt_y <= area[0][1])]
                privbayes_selected_data = privbayes_df[(base_dt_x >= area[0][0]) & (base_dt_x <= area[1][0]) & (base_dt_y >= area[1][1])
                                                       & (base_dt_y <= area[0][1])]
                ori_selected_data = ORI_DATA[(ori_dt_x >= area[0][0]) & (ori_dt_x <= area[1][0]) & (ori_dt_y >= area[1][1])
                                             & (ori_dt_y <= area[0][1])]
            if cons["params"]["type"] == "polygon":
                pcbayes_selected_data = []
                for idx, row in pcbayes_df.iterrows():
                    if point_inside_polygon(row[cons["x_axis"]], row[cons["y_axis"]], cons["params"]["area"]):
                        pcbayes_selected_data.append(idx)
                privbayes_selected_data = []
                for idx, row in privbayes_df.iterrows():
                    if point_inside_polygon(row[cons["x_axis"]], row[cons["y_axis"]], cons["params"]["area"]):
                        privbayes_selected_data.append(idx)
                ori_selected_data = []
                for idx, row in ORI_DATA.iterrows():
                    if point_inside_polygon(row[cons["x_axis"]], row[cons["y_axis"]], cons["params"]["area"]):
                        ori_selected_data.append(idx)

                pcbayes_selected_data = pcbayes_df.iloc[pcbayes_selected_data]
                privbayes_selected_data = privbayes_df.iloc[privbayes_selected_data]
                ori_selected_data = ORI_DATA.iloc[ori_selected_data]
            pcbayes_selected_data = pcbayes_selected_data[[
                cons["x_axis"], cons["y_axis"]]]
            privbayes_selected_data = privbayes_selected_data[[
                cons["x_axis"], cons["y_axis"]]]
            ori_selected_data = ori_selected_data[[
                cons["x_axis"], cons["y_axis"]]]
            # 处理KL
            # pcbayes_KL = KLdivergence(pcbayes_selected_data.values, ori_selected_data.values)
            # privbayes_KL = KLdivergence(privbayes_selected_data.values, ori_selected_data.values)
            # maxKL = max(pcbayes_KL, privbayes_KL) * 1.1
            # pcbayes_KL = 1 - pcbayes_KL / maxKL
            # privbayes_KL = 1 - privbayes_KL / maxKL

            # 处理KL sdv逻辑
            # pcbayes_KL_ori = evaluate(pcbayes_selected_data, ori_selected_data, metrics=[
            #                           'ContinuousKLDivergence'])   # sdv打开注释
            # privbayes_KL_ori = evaluate(privbayes_selected_data, ori_selected_data, metrics=[
            #                             'ContinuousKLDivergence'])  # sdv打开注释

            # 占用KL的接口去返回一个轮廓系数
            # labels_0 = np.ones((len(ori_selected_data), 1)) * 0
            # labels_1 = np.ones((len(pcbayes_selected_data), 1))
            # labels_2 = np.ones((len(privbayes_selected_data), 1)) * 2
            # con_labels_pc = np.vstack((labels_0, labels_1))
            # con_labels_priv = np.vstack((labels_0, labels_2))
            # print(len(ori_selected_data))
            # print(len(pd.concat([ori_selected_data, pcbayes_selected_data])))
            # pc_eff = metrics.silhouette_score(pd.concat([ori_selected_data, pcbayes_selected_data]), con_labels_pc.tolist(), metric='euclidean')
            # priv_eff = metrics.silhouette_score(pd.concat([ori_selected_data, privbayes_selected_data]), con_labels_priv.tolist(), metric='euclidean')
            # pc_eff = 1 - abs(pc_eff)
            # priv_eff = 1 - abs(priv_eff)

            # 新数据中每个点到原始数据 均值点的距离 => 再除以点数算个均值

            ori_center = ori_selected_data.values.mean(axis=0)
            diff1 = pcbayes_selected_data.values - ori_center
            diff2 = privbayes_selected_data.values - ori_center

            pcbayes_KL = np.sum([np.sqrt(item ** 2)
                                for item in diff1]) / len(pcbayes_selected_data)
            privbayes_KL = np.sum([np.sqrt(item ** 2)
                                  for item in diff2]) / len(privbayes_selected_data)

            area_arr = np.array(cons['params']['area'])
            x_edge = [min(area_arr[:, 0]), max(area_arr[:, 0])]
            y_edge = [min(area_arr[:, 1]), max(area_arr[:, 1])]
            margin_nodes = np.array(list(itertools.product(x_edge, y_edge)))
            diff = margin_nodes - ori_center
            maxKL = max(np.array([np.sqrt(sum(item ** 2)) for item in diff]))
            # pcbayes_KL = 1 - pcbayes_KL / maxKL
            # privbayes_KL = 1 - privbayes_KL / maxKL

            # 处理WDis
            pcbayes_WDis = get_w_distance(
                pcbayes_selected_data.values, ori_selected_data.values)
            privbayes_WDis = get_w_distance(
                privbayes_selected_data.values, ori_selected_data.values)
            maxWDis = max(pcbayes_WDis, privbayes_WDis) * 1.1
            # pcbayes_WDis = 1 - pcbayes_WDis / maxWDis
            # privbayes_WDis = 1 - privbayes_WDis / maxWDis
            # pcbayes_patterns.append({
            #     "id": cons["id"],
            #     "Concentration": {
            #         "original": 1,
            #         "protected": pcbayes_KL
            #     },
            #     "dots_stab": {
            #         "original": 1,
            #         "protected": 1 - abs(len(ori_selected_data) - len(pcbayes_selected_data)) / len(ori_selected_data)
            #     },
            # })
            # privbayes_patterns.append({
            #     "id": cons["id"],
            #     "Concentration": {
            #         "original": 1,
            #         "protected": privbayes_KL
            #     },
            #     "dots_stab": {
            #         "original": 1,
            #         "protected": 1 - abs(len(ori_selected_data) - len(privbayes_selected_data)) / len(ori_selected_data)
            #     },
            # })
            pcbayes_patterns['distocenterpc'] = float(pcbayes_KL)
            pcbayes_patterns['wdispc'] = float(pcbayes_WDis)
            pcbayes_patterns['nodessimpc'] = 1 - abs(
                len(ori_selected_data) - len(pcbayes_selected_data)) / len(ori_selected_data)
            pcbayes_patterns['pc_node_num'] = len(pcbayes_selected_data)
            # pcbayes_patterns['klpc'] = float(pcbayes_KL_ori)    # sdv打开注释
            # privbayes_patterns['klpriv'] = float(privbayes_KL_ori)  # sdv打开注释

            privbayes_patterns['distocenterpriv'] = float(privbayes_KL)
            privbayes_patterns['wdispriv'] = float(privbayes_WDis)
            privbayes_patterns['nodessimpriv'] = 1 - abs(
                len(ori_selected_data) - len(privbayes_selected_data)) / len(ori_selected_data)
            privbayes_patterns['priv_node_num'] = len(privbayes_selected_data)

            privbayes_patterns['cluster_dis_diff'] = abs(
                float(privbayes_KL) - float(pcbayes_KL))
            privbayes_patterns['cluster_real_node_num'] = len(
                ori_selected_data)

            # pcbayes_patterns += [float(pcbayes_KL), float(pcbayes_WDis), 1 - abs(
            #     len(ori_selected_data) - len(pcbayes_selected_data)) / len(ori_selected_data)]
            # privbayes_patterns += [float(privbayes_KL), float(privbayes_WDis), 1 - abs(
            #     len(ori_selected_data) - len(privbayes_selected_data)) / len(ori_selected_data)]
            # pcbayes_patterns = [float(pcbayes_WDis)]
            # privbayes_patterns = [float(privbayes_WDis)]
        if cons["type"] == "correlation":
            cond11 = pcbayes_df[cons['x_axis']] <= cons['params']['range'][1]
            cond12 = pcbayes_df[cons['x_axis']] >= cons['params']['range'][0]
            cond21 = privbayes_df[cons['x_axis']] <= cons['params']['range'][1]
            cond22 = privbayes_df[cons['x_axis']] >= cons['params']['range'][0]
            cond31 = ORI_DATA[cons['x_axis']] <= cons['params']['range'][1]
            cond32 = ORI_DATA[cons['x_axis']] >= cons['params']['range'][0]
            if selected_legends:
                cond13 = pcbayes_df[cons['color']].isin(selected_legends)
                cond23 = privbayes_df[cons['color']].isin(selected_legends)
                cond33 = ORI_DATA[cons['color']].isin(selected_legends)

            if cons['computation'] == 'count':
                if selected_legends:
                    pcbayes_selected_data = pcbayes_df[cond11 & cond12 & cond13][[
                        cons["x_axis"]]]
                    privbayes_selected_data = privbayes_df[cond21 & cond22 & cond23][[
                        cons["x_axis"]]]
                    ori_selected_data = ORI_DATA[cond31 &
                                                 cond32 & cond33][[cons["x_axis"]]]
                else:
                    pcbayes_selected_data = pcbayes_df[cond11 & cond12][[
                        cons["x_axis"]]]
                    privbayes_selected_data = privbayes_df[cond21 & cond22][[
                        cons["x_axis"]]]
                    ori_selected_data = ORI_DATA[cond31 & cond32][[
                        cons["x_axis"]]]
                cut_points = np.arange(
                    cons['params']['range'][0], cons['params']['range'][1] + 1e-6, cons['x_step'])
                cut_points[-1] += 1e-6
                pcbayes_selected_data[cons["x_axis"]] = pd.cut(pcbayes_selected_data[cons['x_axis']], cut_points,
                                                               right=False)
                pcbayes_selected_data['index'] = len(pcbayes_selected_data)
                pcbayes_data = pcbayes_selected_data.groupby(
                    cons["x_axis"]).count().sort_index().values

                privbayes_selected_data[cons["x_axis"]] = pd.cut(privbayes_selected_data[cons['x_axis']], cut_points,
                                                                 right=False)
                privbayes_selected_data['index'] = len(privbayes_selected_data)
                privbayes_data = privbayes_selected_data.groupby(
                    cons["x_axis"]).count().sort_index().values

                ori_selected_data[cons["x_axis"]] = pd.cut(ori_selected_data[cons['x_axis']], cut_points,
                                                           right=False)
                ori_selected_data['index'] = len(ori_selected_data)
                ori_data = ori_selected_data.groupby(
                    cons["x_axis"]).count().sort_index().values
            elif cons['computation'] == 'average':
                cut_points = np.arange(
                    cons['params']['range'][0], cons['params']['range'][1] + cons['x_step'] + 1e-6, cons['x_step'])
                cut_points[-1] += 1e-6
                if selected_legends:
                    pcbayes_selected_data = pcbayes_df[cond11 & cond12 & cond13][[
                        cons["x_axis"], cons["y_axis"]]]
                    privbayes_selected_data = privbayes_df[cond21 & cond22 & cond23][[
                        cons["x_axis"], cons["y_axis"]]]
                    ori_selected_data = ORI_DATA[cond31 & cond32 & cond33][[
                        cons["x_axis"], cons["y_axis"]]]
                else:
                    pcbayes_selected_data = pcbayes_df[cond11 & cond12][[
                        cons["x_axis"], cons["y_axis"]]]
                    privbayes_selected_data = privbayes_df[cond21 & cond22][[
                        cons["x_axis"], cons["y_axis"]]]
                    ori_selected_data = ORI_DATA[cond31 & cond32][[
                        cons["x_axis"], cons["y_axis"]]]
                pcbayes_selected_data[cons["x_axis"]] = pd.cut(pcbayes_selected_data[cons['x_axis']], cut_points,
                                                               right=False)

                privbayes_selected_data[cons["x_axis"]] = pd.cut(privbayes_selected_data[cons['x_axis']], cut_points,
                                                                 right=False)

                ori_selected_data[cons["x_axis"]] = pd.cut(ori_selected_data[cons['x_axis']], cut_points,
                                                           right=False)
                pcbayes_data = pcbayes_selected_data.groupby(
                    cons["x_axis"]).mean().sort_index().values
                privbayes_data = privbayes_selected_data.groupby(
                    cons["x_axis"]).mean().sort_index().values
                ori_data = ori_selected_data.groupby(
                    cons["x_axis"]).mean().sort_index().values

            def manhattan_distance(x, y): return np.abs(x - y)

            pcbayes_DTW, cost_matrix, acc_cost_matrix, path = dtw(
                pcbayes_data, ori_data, dist=manhattan_distance)
            privbayes_DTW, cost_matrix, acc_cost_matrix, path = dtw(
                privbayes_data, ori_data, dist=manhattan_distance)
            pcbayes_DTW_ori = pcbayes_DTW
            privbayes_DTW_ori = privbayes_DTW
            maxDTW = max(pcbayes_DTW, privbayes_DTW) * 1.1
            pcbayes_DTW = 1 - pcbayes_DTW / maxDTW
            privbayes_DTW = 1 - privbayes_DTW / maxDTW

            pcbayes_Euc = np.sqrt(np.sum(np.square(pcbayes_data - ori_data)))
            privbayes_Euc = np.sqrt(
                np.sum(np.square(privbayes_data - ori_data)))
            pcbayes_Euc_ori = pcbayes_Euc
            privbayes_Euc_ori = privbayes_Euc
            maxEuc = max(pcbayes_Euc, privbayes_Euc) * 1.1
            pcbayes_Euc = 1 - pcbayes_Euc / maxEuc
            privbayes_Euc = 1 - privbayes_Euc / maxEuc
            if cons['computation'] == 'count':
                ori_coef_data = ori_selected_data.groupby(
                    cons['x_axis']).count().sort_index().reset_index()
                ori_coef_data[cons['x_axis']] = range(
                    1, len(ori_coef_data) + 1)
                ori_coef_data = ori_coef_data.values

                pcbayes_coef_data = pcbayes_selected_data.groupby(
                    cons['x_axis']).count().sort_index().reset_index()
                pcbayes_coef_data[cons['x_axis']] = range(
                    1, len(pcbayes_coef_data) + 1)
                pcbayes_coef_data = pcbayes_coef_data.values

                privbayes_coef_data = privbayes_selected_data.groupby(
                    cons['x_axis']).count().sort_index().reset_index()
                privbayes_coef_data[cons['x_axis']] = range(
                    1, len(privbayes_coef_data) + 1)
                privbayes_coef_data = privbayes_coef_data.values
            elif cons['computation'] == 'average':
                ori_coef_data = ori_selected_data.groupby(
                    cons['x_axis']).mean().sort_index().reset_index()
                ori_coef_data[cons['x_axis']] = range(
                    1, len(ori_coef_data) + 1)
                ori_coef_data = ori_coef_data.values
                pcbayes_coef_data = pcbayes_selected_data.groupby(
                    cons['x_axis']).mean().sort_index().reset_index()
                pcbayes_coef_data[cons['x_axis']] = range(
                    1, len(pcbayes_coef_data) + 1)
                pcbayes_coef_data = pcbayes_coef_data.values
                privbayes_coef_data = privbayes_selected_data.groupby(
                    cons['x_axis']).mean().sort_index().reset_index()
                privbayes_coef_data[cons['x_axis']] = range(
                    1, len(privbayes_coef_data) + 1)
                privbayes_coef_data = privbayes_coef_data.values

            ori_coef = np.corrcoef(ori_coef_data[:, 0], ori_coef_data[:, 1])
            pcbayes_PCD = abs(np.corrcoef(
                pcbayes_coef_data[:, 0], pcbayes_coef_data[:, 1]) - ori_coef)[0][1]
            privbayes_PCD = abs(np.corrcoef(
                privbayes_coef_data[:, 0], privbayes_coef_data[:, 1]) - ori_coef)[0][1]

            pcbayes_patterns['DTWpc'] = float(pcbayes_DTW_ori)
            pcbayes_patterns['Eucpc_corr'] = float(pcbayes_Euc_ori)
            pcbayes_patterns['PCDpc'] = float(pcbayes_PCD)
            pcbayes_patterns['Pearson_ori'] = float(ori_coef[0][1])
            pcbayes_patterns['Pearson_pc'] = float(np.corrcoef(
                pcbayes_coef_data[:, 0], pcbayes_coef_data[:, 1])[0][1])
            privbayes_patterns['DTWpriv'] = float(privbayes_DTW_ori)
            privbayes_patterns['Eucpriv_corr'] = float(privbayes_Euc_ori)
            privbayes_patterns['PCDpriv'] = float(privbayes_PCD)
            privbayes_patterns['Pearson_priv'] = float(np.corrcoef(
                privbayes_coef_data[:, 0], privbayes_coef_data[:, 1])[0][1])

        if cons["type"] == "order":
            raw_pcbayes_df = pd.read_csv(synthetic_data)
            raw_privbayes_df = pd.DataFrame(base_scheme['protected_data'])
            ORI_DATA = tmp_data_storage[session_id]['ORI_DATA']
            if ORI_DATA[cons['x_axis']].dtype != object:
                cons['params']['values'] = [
                    int(item) for item in cons["params"]["values"]]
            ori_selected_data = ORI_DATA[ORI_DATA[cons['x_axis']].isin(
                cons["params"]["values"])]
            pcbayes_selected_data = raw_pcbayes_df[raw_pcbayes_df[cons['x_axis']].isin(
                cons["params"]["values"])]
            privbayes_selected_data = raw_privbayes_df[raw_privbayes_df[cons['x_axis']].isin(
                cons["params"]["values"])]
            pcbayes_selected_data['index'] = range(len(pcbayes_selected_data))
            privbayes_selected_data['index'] = range(
                len(privbayes_selected_data))
            ori_selected_data['index'] = range(len(ori_selected_data))
            ori_arr = ori_selected_data[[cons['x_axis'], 'index']].groupby(
                cons['x_axis']).count().sort_index().values.flatten()
            pcbayes_arr = pcbayes_selected_data[[cons['x_axis'], 'index']].groupby(
                cons['x_axis']).count().sort_index().values.flatten()
            privbayes_arr = privbayes_selected_data[[cons['x_axis'], 'index']].groupby(
                cons['x_axis']).count().sort_index().values.flatten()
            pcbayes_patterns['ndcgpc'] = float(
                ndcg_score([ori_arr], [pcbayes_arr]))
            pcbayes_patterns['diffpc'] = int(
                np.sum(np.abs(ori_arr - pcbayes_arr)))
            pcbayes_patterns['Eucpc'] = float(
                np.sqrt(np.sum(np.square(pcbayes_arr - ori_arr))))
            pcbayes_patterns['reldiffpc'] = float(
                np.sum(np.abs(ori_arr - pcbayes_arr) / ori_arr))
            pcbayes_patterns['nodessimpc'] = 1 - abs(len(ori_selected_data) - len(
                pcbayes_selected_data)) / len(ori_selected_data)
            privbayes_patterns['ndcgpriv'] = float(
                ndcg_score([ori_arr], [privbayes_arr]))
            privbayes_patterns['diffpriv'] = int(
                np.sum(np.abs(ori_arr - privbayes_arr)))
            privbayes_patterns['Eucpriv'] = float(
                np.sqrt(np.sum(np.square(privbayes_arr - ori_arr))))
            privbayes_patterns['reldiffpriv'] = float(
                np.sum(np.abs(ori_arr - privbayes_arr) / ori_arr))
            privbayes_patterns['nodessimpriv'] = 1 - abs(
                len(ori_selected_data) - len(privbayes_selected_data)) / len(ori_selected_data)

    baseret = copy.deepcopy(tmp_data_storage[session_id]['BASE_SCHEME'])
    baseret['pattern'] = privbayes_patterns
    # baseret['protected_data'] = orjson.loads(privbayes_df.to_json(orient="records")),
    # ret = {
    #     "status": "success",
    #     "scheme": {
    #         "metrics": {
    #             "privacy_budget": bayes_epsilon,
    #             "statistical_metrics": {
    #                 # "KSTest": 0.85,
    #                 # "CSTest": 0.85,
    #                 # "KSTest": KSTest.compute(ORI_DATA, pcbayes_df),
    #                 # "CSTest": CSTest.compute(ORI_DATA, pcbayes_df)
    #             },
    #             "detection_metrics": {
    #                 # "LogisticDetection": LogisticDetection.compute(ORI_DATA, pcbayes_df)
    #             },
    #             "privacy_metrics": {
    #                 # "MLP": NumericalMLP.compute(ORI_DATA, pcbayes_df, key_fields=list(set(Measures).difference(['charges'])), sensitive_fields=['charges']),
    #                 # "CAP": CategoricalCAP.compute(ORI_DATA, pcbayes_df, key_fields=list(set(Dimensions).difference(['children'])), sensitive_fields=['children'])
    #                 # "MLP": 0.85,
    #                 # "CAP": 0.85
    #             }
    #         },
    #         "protected_data": orjson.loads(raw_pcbayes_df.to_json(orient="records")),
    #         "pattern": pcbayes_patterns
    #     },
    #     "base": baseret
    # }
    # pcbayes_patterns['kstestpc'] = float(
    #     KSTest.compute(ORI_DATA, pcbayes_df))  # sdv打开注释
    # privbayes_patterns['kstestpriv'] = float(
    #     KSTest.compute(ORI_DATA, privbayes_df))  # sdv打开注释
    # 临时
    # print(ORI_DATA)
    # print("23333")
    # print(pcbayes_df)
    # pcbayes_patterns['cstestpc'] = float(
    #     CSTest.compute(ORI_DATA, pcbayes_df))  # sdv打开注释
    # privbayes_patterns['cstestpriv'] = float(
    #     CSTest.compute(ORI_DATA, privbayes_df))  # sdv打开注释
    ret = [pcbayes_patterns, privbayes_patterns]
    return HttpResponse(orjson.dumps(ret))
