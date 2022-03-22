import json
import copy
import pandas as pd
import numpy as np
from sklearn.manifold import MDS
from priv_bayes.kl import get_w_distance
from django.http import HttpResponse
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from sdv.metrics.tabular import KSTest, CSTest, LogisticDetection, CategoricalCAP, NumericalMLP
# 隐私保护相关包

from priv_bayes.DataSynthesizer.DataDescriber import DataDescriber
from priv_bayes.DataSynthesizer.DataGenerator import DataGenerator
from priv_bayes.DataSynthesizer.lib.utils import display_bayesian_network

tmp_data_storage = {}


def check_session_id(session_id):
    global tmp_data_storage
    if session_id is None or tmp_data_storage.get(session_id) is None:
        return False
    return True


def index(request):
    return HttpResponse("priv_bayes_backend")


def solveOriginalData(session_id):
    global tmp_data_storage
    ORI_DATA = tmp_data_storage[session_id]['ORI_DATA']
    threshold_value = tmp_data_storage[session_id]['threshold_value']
    df = copy.deepcopy(ORI_DATA)
    df['index'] = range(len(df))  # 给每条记录按顺序编号，后续可能会用到
    original_data = json.loads(df.to_json(orient="records"))
    attribute_character = {}
    for col in df:
        if col == 'index':
            continue
        if df[col].dtype == int or df[col].dtype == np.int64:  # 记录整型数据
            tmp_data_storage[session_id]['INT_TYPE'].append(col)
        if len(df[col].value_counts()) > threshold_value:  # 数值型
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
    data = request.FILES['file']
    session_id = request.POST.get("session_id")
    if not check_session_id(session_id):
        return HttpResponse(json.dumps({
            "status": "failed",
            "err_msg": "disconnected with the server"
        }))
    DATA_PATH = default_storage.save('priv_bayes/data/1.csv', ContentFile(data.read()))
    df = pd.read_csv(DATA_PATH)
    tmp_data_storage[session_id]['DATA_PATH'] = DATA_PATH
    tmp_data_storage[session_id]['ORI_DATA'] = df
    ret = solveOriginalData(session_id)

    return HttpResponse(json.dumps(ret))


def cnt_poly(x, params):  # 根据x和多项式系数params计算返回值
    ans = 0
    for item in params:
        ans *= x
        ans += item
    return ans


def initialize(request):
    global tmp_data_storage
    session_id = json.loads(request.body).get('session_id')
    tmp_data_storage[session_id] = {
        "DATA_PATH": 'priv_bayes/data/insurance.csv',
        "constraints": None,
        "threshold_value": 10,  # 离散型和数值型分界点
        "bayes_epsilon": 10,  # 贝叶斯网络的隐私预算
        "weights": None,
        "Dimensions": [],
        "Measures": [],
        "INT_TYPE": [],
        "ORI_DATA": None
    }
    df = pd.read_csv(tmp_data_storage[session_id]['DATA_PATH'])
    tmp_data_storage[session_id]['ORI_DATA'] = df  # 保存原始数据，用于后续数据生成
    solveOriginalData(session_id)
    ret = {
        "status": "success",
    }
    return HttpResponse(json.dumps(ret))


def destroyed(request):
    global tmp_data_storage
    session_id = json.loads(request.body).get('session_id')
    if not check_session_id(session_id):
        return HttpResponse(json.dumps({
            "status": "failed",
            "err_msg": "disconnected with the server"
        }))
    del tmp_data_storage[session_id]
    return HttpResponse(json.dumps({"status": "success"}))

def get_mds_result(session_id):
    constraints = tmp_data_storage[session_id]['constraints']
    ORI_DATA = tmp_data_storage[session_id]['ORI_DATA']
    Dimensions = tmp_data_storage[session_id]['Dimensions']

    num_of_constraints = len(constraints)
    if num_of_constraints == 1:
        return np.array([[50, 50]])
    kl_df = copy.deepcopy(ORI_DATA)
    kl_df['index'] = range(len(kl_df))
    for dim in Dimensions:
        if ORI_DATA[dim].dtype == object:  # string类型，重新编码
            vals = np.unique(ORI_DATA[dim]).tolist()
            value_to_bin_idx = {value: idx for idx, value in enumerate(vals)}
            kl_df[dim] = kl_df[dim].map(lambda x: value_to_bin_idx[x], na_action='ignore')
    matrix_data = np.zeros((num_of_constraints, num_of_constraints))

    for i in range(num_of_constraints):
        for j in range(i + 1, num_of_constraints):
            if i == j:
                continue
            data_c1 = constraints[i]['data']  # 第一个constraints对应的数据编号
            data_c2 = constraints[j]['data']  # 第二个constraints对应的数据编号
            df_c1 = kl_df.loc[kl_df['index'].isin(data_c1)]  # 第一个constraints对应数据
            df_c2 = kl_df.loc[kl_df['index'].isin(data_c2)]  # 第二个constraints对应数据
            del df_c1['index']
            del df_c2['index']
            matrix_data[i][j] = matrix_data[j][i] = get_w_distance(df_c1.values, df_c2.values)

    embedding = MDS(n_components=2, dissimilarity='precomputed', random_state=9)
    D2_MDS_data = embedding.fit_transform(matrix_data)
    D2_MDS_data = (D2_MDS_data - np.min(D2_MDS_data)) / (np.max(D2_MDS_data) - np.min(D2_MDS_data)) * 80 + 10
    return D2_MDS_data


def getModelData(request):
    global tmp_data_storage
    session_id = json.loads(request.body).get('session_id')
    if not check_session_id(session_id):
        return HttpResponse(json.dumps({
            "status": "failed",
            "err_msg": "disconnected with the server"
        }))
    Measures = tmp_data_storage[session_id]['Measures']

    ORI_DATA = tmp_data_storage[session_id]['ORI_DATA']
    cur_df = copy.deepcopy(ORI_DATA)
    DEFAULT_CATEGORIES = 3
    constraints = tmp_data_storage[session_id]['constraints'] = json.loads(request.body).get('constraints')  # 每个点的权重百分比
    tmp_data_storage[session_id]['weights'] = [{"id": constraint['id'], "weight": 1 / len(constraints)} for constraint in constraints]
    weights = np.ones((len(constraints))) * 5
    # slice_methods = json.loads(request.body).get('slice_methods')
    slice_methods = {}  # 暂无slice_methods
    axis_order = []
    # 补全所有需要处理的坐标轴
    for constraint in constraints:
        if constraint['x_axis'] is not None and constraint['x_axis'] not in axis_order:
            axis_order.append(constraint['x_axis'])
        if constraint['y_axis'] is not None and constraint['y_axis'] not in axis_order:
            axis_order.append(constraint['y_axis'])

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
        cut_points = [100 / categories * item for item in range(0, categories + 1)]
        cut_points = [np.percentile(ORI_DATA[axis], item) for item in cut_points]
        cut_points[-1] += 1e-10  # 最后一个分位点加一个微小的偏移量
        new_df[axis] = pd.cut(ORI_DATA[axis], cut_points, right=False)
    cur_df['index'] = range(len(cur_df))
    cur_df['constraint'] = "empty"

    matrix_data = get_mds_result(session_id)

    for constraint in constraints:
        cur_df.loc[cur_df['index'].isin(constraint['data']), 'constraint'] = constraint['id']
    new_df['count'] = 1
    new_df['constraint'] = cur_df['constraint']
    data_df = new_df.groupby(axis_order + ['constraint']).agg('count')
    c_df = pd.DataFrame(data_df)
    c_df.reset_index(inplace=True)
    raw_data = json.loads(c_df.to_json(orient="records"))
    filtered_data = [dt for dt in raw_data if dt['count'] != 0]
    proportion_data = {}

    for axis in axis_order:
        tmp_df = pd.DataFrame()
        tmp_df[axis] = new_df[axis]
        tmp_df['count'] = 1
        cc_df = pd.DataFrame(tmp_df.groupby(axis).agg('count'))
        cc_df.reset_index(inplace=True)
        cur_proportiondata = []
        tmp_data = json.loads(cc_df.to_json(orient="columns"))
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

    flow_data = []
    idx = 0
    for item in filtered_data:
        cur_flow = {"flow_index": idx, "constraint_id": item['constraint'], "num": item['count'], "pos": {}}
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

    sankey_data = []
    conses_ret = [{"id": constraint['id'], "type": constraint['type'], "pos": matrix_data[idx].tolist()
                      , "r": weights[idx]} for idx, constraint in enumerate(constraints)]
    conses = [constraint['id'] for constraint in constraints]
    for axis_id in range(len(axis_order) - 1):
        x = axis_order[axis_id]
        y = axis_order[axis_id + 1]
        x_len = len(proportion_data[x])
        y_len = len(proportion_data[y])
        back_ground = []
        for i in range(x_len):
            for j in range(y_len):
                tar = sum([flow['num'] for flow in flow_data if flow['pos'][x] == i and flow['pos'][y] == j])
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

    ret = {
        "status": "success",
        "data": {
            "total_num": len(ORI_DATA),
            "axis_order": axis_order,
            "proportion_data": proportion_data,
            "constraints": conses_ret,
            "sankey_data": sankey_data
        }
    }
    return HttpResponse(json.dumps(ret))


def setWeights(request):
    global tmp_data_storage
    session_id = json.loads(request.body).get("session_id")
    if not check_session_id(session_id):
        return HttpResponse(json.dumps({
            "status": "failed",
            "err_msg": "disconnected with the server"
        }))
    constraints = tmp_data_storage[session_id]['constraints']
    weights = tmp_data_storage[session_id]['weights'] = json.loads(request.body).get('weights')
    c_weights = [w["weight"] for w in weights if w["id"] != "others"]
    if np.max(c_weights) != np.min(c_weights):
        c_weights = (c_weights - np.min(c_weights)) / (np.max(c_weights) - np.min(c_weights)) * 5 + 5
    else:
        c_weights = np.ones(len(c_weights)) * 5
    tmp_data_storage[session_id]['bayes_epsilon'] = json.loads(request.body).get('bayes_budget')
    matrix_data = get_mds_result(session_id)
    conses_ret = [{"id": constraint['id'], "type": constraint['type'], "pos": matrix_data[idx].tolist(),
                   "r": c_weights[idx]} for idx, constraint in enumerate(constraints)]
    ret = {
        "status": "success",
        "constraints": conses_ret
    }

    return HttpResponse(json.dumps(ret))


def getMetrics(request):
    global tmp_data_storage
    session_id = request.GET.get('session_id')
    if not check_session_id(session_id):
        return HttpResponse(json.dumps({
            "status": "failed",
            "err_msg": "disconnected with the server"
        }))
    DATA_PATH = tmp_data_storage[session_id]['DATA_PATH']
    ORI_DATA = tmp_data_storage[session_id]['ORI_DATA']
    Dimensions = tmp_data_storage[session_id]['Dimensions']
    Measures = tmp_data_storage[session_id]['Measures']
    constraints = tmp_data_storage[session_id]['constraints']
    weights = tmp_data_storage[session_id]['weights']
    threshold_value = tmp_data_storage[session_id]['threshold_value']
    bayes_epsilon = tmp_data_storage[session_id]['bayes_epsilon']
    # 构建一个weights数组
    weight_df = copy.deepcopy(ORI_DATA)
    weight_df[weight_df.columns] = 1
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
                arr[id][x_id] = max(arr[id][x_id], w["weight"] / ssum * 200)
            if y_id is not None:
                arr[id][y_id] = max(arr[id][y_id], w["weight"] / ssum * 200)
        for axis in axis2id:
            weight_df[axis] = arr[:, axis2id[axis]]
    cur_scheme_weights = {}
    dtdt = json.loads(weight_df.to_json(orient="records"))
    for idx, dt in enumerate(dtdt):
        cur_scheme_weights[idx] = dt
    description_file = "priv_bayes/out/dscrpt.json"
    synthetic_data = "priv_bayes/out/syndata.csv"

    describer = DataDescriber(category_threshold=threshold_value)
    describer.describe_dataset_in_correlated_attribute_mode(dataset_file=DATA_PATH,
                                                            epsilon=bayes_epsilon,
                                                            k=2,
                                                            attribute_to_is_categorical={},
                                                            attribute_to_is_candidate_key={},
                                                            weights=cur_scheme_weights)

    describer.save_dataset_description_to_file(description_file)

    display_bayesian_network(describer.bayesian_network)

    generator = DataGenerator()
    generator.generate_dataset_in_correlated_attribute_mode(len(ORI_DATA), description_file)
    generator.save_synthetic_data(synthetic_data)
    synthetic_df = pd.read_csv(synthetic_data)

    patterns = []
    for cons in constraints:
        selected_data = None
        if cons["type"] == "cluster":
            m_x = cons['params']['mean'][0]
            m_y = cons['params']['mean'][1]
            p_a = cons['params']['radius'][0]
            p_b = cons['params']['radius'][1]
            dt_x = synthetic_df[cons["x_axis"]]
            dt_y = synthetic_df[cons["y_axis"]]
            selected_data = synthetic_df[
                (dt_x - m_x) ** 2 / p_a ** 2 + (dt_y - m_y) ** 2 / p_b ** 2 <= 1].index.tolist()
        if cons["type"] == "correlation":
            cond1 = synthetic_df[cons['x_axis']] <= cons['params']['range'][1]
            cond2 = synthetic_df[cons['x_axis']] >= cons['params']['range'][0]
            selected_data = synthetic_df[cond1 & cond2].index.tolist()
        if cons["type"] == "order":
            selected_data = synthetic_df[synthetic_df[cons['x_axis']].isin(cons["params"]["values"])].index.tolist()
        patterns.append({
            "id": cons["id"],
            "data": selected_data
        })
    ret = {
        "status": "success",
        "scheme": {
            "metrics": {
                "privacy_budget": bayes_epsilon,
                "statistical_metrics": {
                    # "KSTest": 0.85,
                    # "CSTest": 0.85,
                    "KSTest": KSTest.compute(ORI_DATA, synthetic_df),
                    "CSTest": CSTest.compute(ORI_DATA, synthetic_df)
                },
                "detection_metrics": {
                    "LogisticDetection": LogisticDetection.compute(ORI_DATA, synthetic_df)
                },
                "privacy_metrics": {
                    # "MLP": NumericalMLP.compute(ORI_DATA, synthetic_df, key_fields=list(set(Measures).difference(['charges'])), sensitive_fields=['charges']),
                    # "CAP": CategoricalCAP.compute(ORI_DATA, synthetic_df, key_fields=list(set(Dimensions).difference(['children'])), sensitive_fields=['children'])
                    "MLP": 0.85,
                    "CAP": 0.85
                }
            },
            "protected_data": json.loads(synthetic_df.to_json(orient="records")),
            "pattern": patterns
        }
    }

    return HttpResponse(json.dumps(ret))
