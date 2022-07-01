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


# seed_list = [21394, 21394, 60471, 60471, 1763, 1763, 36727, 36727, 32364, 32364, 62609, 62609, 3177, 3177, 22646, 22646, 8538, 8538, 35036, 35036]
seed_list = [21394, 21394, 60471, 60471, 1763, 1763, 36727, 36727, 32364, 32364]
seed_cnt = 0


def set_random_seed(randomize, seed=0):
    global seed_list, seed_cnt
    if not randomize:    # 不是随机的，设个种子
        print("set seed: ", seed_list[seed_cnt])
        random.seed(seed_list[seed_cnt])
        np.random.seed(seed_list[seed_cnt])
        seed_cnt = (seed_cnt + 1) % 10

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


    tmp_data_storage[session_id] = {
        "DATA_PATH": 'priv_bayes/data/shopping_filter1.csv',
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
    constraints = tmp_data_storage[session_id]['constraints'] = orjson.loads(
        request.body).get('constraints')  # 每个点的权重百分比
    tmp_data_storage[session_id]['weights'] = [{"id": constraint['id'], "weight": 1 / len(constraints)} for constraint
                                               in constraints]
    return HttpResponse(orjson.dumps({"status": "success, for evaluation function"}))


def setWeights(request):
    global tmp_data_storage
    session_id = orjson.loads(request.body).get("session_id")
    if not check_session_id(session_id):
        return HttpResponse(orjson.dumps({
            "status": "failed",
            "err_msg": "disconnected with the server"
        }))
    tmp_data_storage[session_id]['weights'] = orjson.loads(
        request.body).get('weights')
    tmp_data_storage[session_id]['bayes_epsilon'] = orjson.loads(
        request.body).get('bayes_budget')
    ret = {"status": "success"}
    return HttpResponse(orjson.dumps(ret))


def get_bayes_with_weights(session_id):
    description_file = "priv_bayes/out/dscrpt.json"
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
    set_random_seed(tmp_data_storage[session_id]['randomize'])
    if not check_session_id(session_id):
        return HttpResponse(orjson.dumps({
            "status": "failed",
            "err_msg": "disconnected with the server"
        }))
    ret = get_bayes_with_weights(session_id)
    description_file = "priv_bayes/out/dscrpt.json"
    synthetic_data = "priv_bayes/out/syndata.csv"
    bayes_epsilon = tmp_data_storage[session_id]['bayes_epsilon']
    ORI_DATA = tmp_data_storage[session_id]['ORI_DATA']

    generator = DataGenerator()
    generator.generate_dataset_in_correlated_attribute_mode(
        len(ORI_DATA), description_file, 0, tmp_data_storage[session_id]["randomize"])
    generator.save_synthetic_data(synthetic_data)
    synthetic_df = pd.read_csv(synthetic_data)

    # 存放base方案各项指标
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
    set_random_seed(tmp_data_storage[session_id]['randomize'])
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
    base_scheme = tmp_data_storage[session_id]['BASE_SCHEME']

    get_bayes_with_weights(session_id)  # 根据当前tmp_data_storage中的weight

    generator = DataGenerator()
    generator.generate_dataset_in_correlated_attribute_mode(
        len(ORI_DATA), description_file, 0, tmp_data_storage[session_id]["randomize"])
    generator.save_synthetic_data(synthetic_data)

    pcbayes_df = pd.read_csv(synthetic_data)
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

            # 使用sdv库计算KL散度
            # pcbayes_KL_ori = evaluate(pcbayes_selected_data, ori_selected_data, metrics=[
            #                           'ContinuousKLDivergence'])   # sdv打开注释
            # privbayes_KL_ori = evaluate(privbayes_selected_data, ori_selected_data, metrics=[
            #                             'ContinuousKLDivergence'])  # sdv打开注释

            # intra_cluster_dis: 新数据中每个点到原始数据均值点的距离的平均值
            ori_center = ori_selected_data.values.mean(axis=0)
            diff1 = pcbayes_selected_data.values - ori_center
            diff2 = privbayes_selected_data.values - ori_center

            pcbayes_intra_cluster_dis = np.sum([np.sqrt(item ** 2)
                                for item in diff1]) / len(pcbayes_selected_data)
            privbayes_intra_cluster_dis = np.sum([np.sqrt(item ** 2)
                                  for item in diff2]) / len(privbayes_selected_data)

            # 处理WDis
            pcbayes_WDis = get_w_distance(
                pcbayes_selected_data.values, ori_selected_data.values)
            privbayes_WDis = get_w_distance(
                privbayes_selected_data.values, ori_selected_data.values)

            pcbayes_patterns.update({
                # "klpc": float(pcbayes_KL_ori)    # sdv打开注释
                "distocenterpc": float(pcbayes_intra_cluster_dis),
                "wdispc": float(pcbayes_WDis),
                "nodessimpc": 1 - abs(len(ori_selected_data) - len(pcbayes_selected_data)) / len(ori_selected_data),
                "pc_node_num": len(pcbayes_selected_data)
            })

            privbayes_patterns.update({
                # "klpriv": float(privbayes_KL_ori),   # sdv打开注释
                "distocenterpriv": float(privbayes_intra_cluster_dis),
                "wdispriv": float(privbayes_WDis),
                "nodessimpriv": 1 - abs(len(ori_selected_data) - len(privbayes_selected_data)) / len(ori_selected_data),
                "priv_node_num": len(privbayes_selected_data),
                "cluster_intra_dis_diff_pc_priv": abs(float(privbayes_intra_cluster_dis)
                                                      - float(pcbayes_intra_cluster_dis)),
                "cluster_real_node_num":len(ori_selected_data)
            })

        if cons["type"] == "correlation":
            cons['params']['range'][1] += cons['x_step']    # 右端点向右扩展，作为最后一个端点的区间
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
                    cons['params']['range'][0], cons['params']['range'][1] + 1e-6, cons['x_step'])
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

            pcbayes_patterns.update({
                "DTWpc": float(pcbayes_DTW),
                "Eucpc_corr": float(pcbayes_Euc_ori),
                "PCDpc": float(pcbayes_PCD),
                "Pearson_ori": float(ori_coef[0][1]),
                "Pearson_pc": float(np.corrcoef(pcbayes_coef_data[:, 0], pcbayes_coef_data[:, 1])[0][1])
            })
            privbayes_patterns.update({
                "DTWpriv": float(privbayes_DTW),
                "Eucpriv_corr": float(privbayes_Euc_ori),
                "PCDpriv": float(privbayes_PCD),
                "Pearson_priv": float(np.corrcoef(privbayes_coef_data[:, 0], privbayes_coef_data[:, 1])[0][1])
            })

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

            pcbayes_patterns.update({
                "ndcgpc": float(ndcg_score([ori_arr], [pcbayes_arr])),
                "diffpc": int(np.sum(np.abs(ori_arr - pcbayes_arr))),
                "Eucpc": float(np.sqrt(np.sum(np.square(pcbayes_arr - ori_arr)))),
                "reldiffpc": float(np.sum(np.abs(ori_arr - pcbayes_arr) / ori_arr)),
                "nodes_real": len(ori_selected_data),
                "nodes_pc": len(pcbayes_selected_data),
            })
            privbayes_patterns.update({
                "ndcgpriv": float(ndcg_score([ori_arr], [privbayes_arr])),
                "diffpriv": int(np.sum(np.abs(ori_arr - privbayes_arr))),
                "Eucpriv":  float(np.sqrt(np.sum(np.square(privbayes_arr - ori_arr)))),
                "reldiffpriv": float(np.sum(np.abs(ori_arr - privbayes_arr) / ori_arr)),
                "nodessimpriv": 1 - abs(len(ori_selected_data) - len(privbayes_selected_data)) / len(ori_selected_data),
                "nodes_priv": len(privbayes_selected_data)
            })
    ret = [pcbayes_patterns, privbayes_patterns]
    return HttpResponse(orjson.dumps(ret))
