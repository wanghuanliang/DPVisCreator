import os
import json
import copy
import pandas as pd
import numpy as np
from priv_bayes.kl import KLdivergence
from django.http import HttpResponse
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
# 隐私保护相关包

from priv_bayes.DataSynthesizer.DataDescriber import DataDescriber
from priv_bayes.DataSynthesizer.DataGenerator import DataGenerator
from priv_bayes.DataSynthesizer.ModelInspector import ModelInspector
from priv_bayes.DataSynthesizer.lib.utils import read_json_file, display_bayesian_network
os.chdir("../")
DATA_PATH = 'priv_bayes/data/1.csv'
constraints = None
ORI_DATA = None
threshold_value = 10  # 离散型和数值型分界点
epsilon = 0.3         # 分布叠加的隐私预算
bayes_epsilon = 10    # 贝叶斯网络的隐私预算
dot_basenum = 1000    # 增强分布时加点的基础数量
degree_of_bayesian_network = 2  # 贝叶斯每个节点父亲最多个数
perturbation = 0.10   # 根据约束采样属性值的扰动范围
weights = None
Dimensions = []
Measures = []
INT_TYPE = []


def index(request):
    return HttpResponse("priv_bayes_backend")


def getOriginalData(request):   # 获取原始数据
    global DATA_PATH, ORI_DATA, Dimensions, Measures, INT_TYPE
    data = request.FILES['file']
    DATA_PATH = default_storage.save('priv_bayes/data/1.csv', ContentFile(data.read()))
    df = pd.read_csv(DATA_PATH)
    ORI_DATA = copy.deepcopy(df)  # 保存原始数据，用于后续数据生成
    df['index'] = range(len(df))  # 给每条记录按顺序编号，后续可能会用到
    original_data = json.loads(df.to_json(orient="records"))
    attribute_character = {}
    for col in df:
        if col == 'index':
            continue
        if df[col].dtype == int or df[col].dtype == np.int64:  # 记录整型数据
            INT_TYPE.append(col)
        if len(df[col].value_counts()) > threshold_value:  # 数值型
            Measures.append(col)
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
            Dimensions.append(col)  # 离散型
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
                "Dimensions": Dimensions,
                "Measures": Measures,
                "Computations": []
            },
            "attribute_character": attribute_character
        }
    }
    return HttpResponse(json.dumps(ret))


def cnt_poly(x, params):  # 根据x和多项式系数params计算返回值
    ans = 0
    for item in params:
        ans *= x
        ans += item
    return ans


def getConstrainedResponse(request, flag=False):
    global constraints, ORI_DATA, Dimensions, Measures, INT_TYPE, weights
    if flag:  # setConstraints过来的，需要更新constraints
        constraints = json.loads(request.body).get('constraints')
    if not os.path.exists('priv_bayes/out'):  # 创建输出文件夹
        os.mkdir('priv_bayes/out')

    # 随机生成10000个数据点服务后续采样
    describer = DataDescriber(category_threshold=threshold_value)
    description_file = "priv_bayes/out/original_data.json"  # 贝叶斯网络描述文件
    synthetic_data = "priv_bayes/out/synthetic_data.csv"    #
    # ORI_DATA = pd.read_csv(DATA_PATH)  # 接口测试开启，正式使用关闭
    describer.describe_dataset_in_correlated_attribute_mode(dataset_file=DATA_PATH,
                                                            epsilon=0,
                                                            k=degree_of_bayesian_network)
    describer.save_dataset_description_to_file(description_file)
    generator = DataGenerator()
    generator.generate_dataset_in_correlated_attribute_mode(10000, description_file)
    generator.save_synthetic_data(synthetic_data)
    synthetic_df = pd.read_csv(synthetic_data)  # 内含10w数据，用于后续采样生成增强数据点
    aug_df = pd.DataFrame()
    augmented_data = []
    if constraints is None:
        return HttpResponse("no constraints")
    for constraint in constraints:
        if weights is None:
            cur_epsilon = epsilon
        else:
            try:  # 若没有对应权重，则采用默认epsilon
                selected = [weight for weight in weights if weight['id'] == constraint['id']][0]
                cur_epsilon = selected['weight']
            except:
                cur_epsilon = epsilon
        cur_df = pd.DataFrame()
        cur_aug_data = {
            "id": constraint['id'],
            "data": None,
        }
        x_axis = constraint['x_axis']
        y_axis = constraint['y_axis']
        params = constraint['params']
        type = constraint['type']
        if type == "cluster":  # 聚类 => 叠加一个正态分布
            mean = params['mean']  # 均值
            radius = params['radius']  # 方差
            mean = np.array(mean)
            cov = np.array([[radius[0], 0], [0, radius[1]]])
            f_xy = np.random.multivariate_normal(mean, cov, int(dot_basenum * cur_epsilon))
            for item in f_xy:
                try:
                    filtered_data = synthetic_df[
                        (synthetic_df[x_axis] < item[0] * (1 + perturbation)) &
                        (synthetic_df[x_axis] > item[0] * (1 - perturbation)) &
                        (synthetic_df[y_axis] > item[1] * (1 - perturbation)) &
                        (synthetic_df[y_axis] > item[1] * (1 - perturbation))
                        ].sample(1).to_json(orient="records")
                    filtered_data = json.loads(filtered_data)  # 得到的是一个数组
                    if x_axis in INT_TYPE:
                        item[0] = int(item[0])
                    if y_axis in INT_TYPE:
                        item[1] = int(item[1])
                    filtered_data[0][x_axis] = item[0]
                    filtered_data[0][y_axis] = item[1]
                    cur_df = cur_df.append(filtered_data)
                except:
                    pass
        if type == "correlation":  # 相关关系 => 叠加一个多项式函数
            polynomial_params = params['polynomial_params']  # 多项式系数
            padding = params['padding']  # 宽度
            cur_range = params['range']  # 横轴范围
            x = np.random.uniform(cur_range[0], cur_range[1], int(epsilon * dot_basenum))
            y = np.array([cnt_poly(it, polynomial_params) for it in x])
            for i in range(len(x)):
                try:
                    filtered_data = synthetic_df[
                        (synthetic_df[x_axis] < x[i] * (1 + perturbation)) &
                        (synthetic_df[x_axis] > x[i] * (1 - perturbation)) &
                        (synthetic_df[y_axis] > y[i] * (1 - perturbation)) &
                        (synthetic_df[y_axis] > y[i] * (1 - perturbation))
                        ].sample(1).to_json(orient="records")
                    filtered_data = json.loads(filtered_data)  # 得到的是一个数组
                    if x_axis in INT_TYPE:
                        x[i] = int(x[i])
                    if y_axis in INT_TYPE:
                        y[i] = int(y[i])
                    filtered_data[0][x_axis] = x[i]
                    filtered_data[0][y_axis] = y[i]
                    cur_df = cur_df.append(filtered_data)
                except:
                    pass
            pass
        if type == "order":  # 顺序
            values = params['values']  # 保持order的数据，根据比例扩展数据
            dot_num = int(dot_basenum * cur_epsilon)  # 实际增加的点数
            if ORI_DATA[x_axis].dtype != object:  # 如果不是object类型，则其是数值型
                values = [float(id) for id in values]
            ls = [len(ORI_DATA[ORI_DATA[x_axis] == id]) for id in values]
            wghts = np.array(ls) / sum(ls)
            cur_df = pd.DataFrame()
            for id in range(len(values)):
                val = values[id]
                filtered_data = synthetic_df[
                    synthetic_df[x_axis] == val
                    ].sample(int(wghts[id] * dot_num)).to_json(orient="records")
                filtered_data = json.loads(filtered_data)  # 得到的是一个数组
                cur_df = cur_df.append(filtered_data)
            pass
        print(len(cur_df))
        cur_aug_data['data'] = json.loads(cur_df.to_json(orient="records"))
        augmented_data.append(cur_aug_data)
        aug_df = aug_df.append(cur_aug_data['data'])
    # 使用aug_df做一轮隐私保护数据生成
    AUG_PATH = 'priv_bayes/data/augmented_data.csv'
    aug_df = aug_df.append(ORI_DATA)
    aug_df.to_csv(AUG_PATH, index=False)
    augmented_description_file = "priv_bayes/out/augmented_data.json"
    augmented_synthetic_data = "priv_bayes/out/augmented_synthetic_data.csv"
    describer.describe_dataset_in_correlated_attribute_mode(dataset_file=AUG_PATH,
                                                            epsilon=bayes_epsilon,
                                                            k=degree_of_bayesian_network)
    describer.save_dataset_description_to_file(augmented_description_file)
    generator.generate_dataset_in_correlated_attribute_mode(len(ORI_DATA), augmented_description_file)
    generator.save_synthetic_data(augmented_synthetic_data)
    augmented_synthetic_df = pd.read_csv(augmented_synthetic_data)  # 内含10w数据，用于后续采样生成增强数据点
    ret = {
        "status": "success",
        "augmented_data": augmented_data,
        "protected_data": json.loads(augmented_synthetic_df.to_json(orient="records")),
    }
    return ret


def getModelData(request):
    global constraints
    cur_df = copy.deepcopy(ORI_DATA)
    kl_df = copy.deepcopy(ORI_DATA)
    DEFAULT_CATEGORIES = 3
    slice_methods = json.loads(request.body).get('slice_methods')
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
        if axis not in Measures:    # 不是数值型的数据，不需要离散化
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
    kl_df['index'] = range(len(kl_df))
    for dim in Dimensions:
        if ORI_DATA[dim].dtype == object:  # string类型，重新编码
            vals = np.unique(ORI_DATA[dim]).tolist()
            value_to_bin_idx = {value: idx for idx, value in enumerate(vals)}
            kl_df[dim] = kl_df[dim].map(lambda x: value_to_bin_idx[x], na_action='ignore')
    cur_df['constraint'] = "empty"
    num_of_constraints = len(constraints)
    matrix_data = np.zeros((num_of_constraints, num_of_constraints))
    for i in range(num_of_constraints):
        for j in range(num_of_constraints):
            if i == j:
                continue
            data_c1 = constraints[i]['data']
            data_c2 = constraints[j]['data']
            data_c1_diff = list(set(data_c1).difference(set(data_c2)))
            data_c2_diff = list(set(data_c2).difference(set(data_c1)))
            df_c1 = kl_df.loc[kl_df['index'].isin(data_c1_diff)]
            df_c2 = kl_df.loc[kl_df['index'].isin(data_c2_diff)]
            matrix_data[i][j] = KLdivergence(df_c1.values.tolist(), df_c2.values.tolist())

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
    conses = [{"id": constraint['id'], "type": constraint['type']} for constraint in constraints]

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
            "flow_data": flow_data,
            "constraints": conses,
            "matrix_data": ((matrix_data - np.min(matrix_data)) / (np.max(matrix_data) - np.min(matrix_data))).tolist(),
            "sankey_data": sankey_data
        }
    }
    return HttpResponse(json.dumps(ret))


def getSankeyData(request):

    pass


def setPattern(request):
    ret = getConstrainedResponse(request, True)
    return HttpResponse(json.dumps(ret))


def setWeights(request):
    global bayes_epsilon, weights
    weights = json.loads(request.body).get('weights')
    bayes_epsilon = json.loads(request.body).get('bayes_budget')
    ret = getConstrainedResponse(request)
    return HttpResponse(json.dumps(ret))


def getMetrics(request):
    return HttpResponse(request.GET.get('title'))
