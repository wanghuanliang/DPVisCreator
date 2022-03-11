import json
import pandas as pd
import numpy as np
from django.http import HttpResponse
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
# 隐私保护相关包
from DataSynthesizer.DataDescriber import DataDescriber
from DataSynthesizer.DataGenerator import DataGenerator
from DataSynthesizer.ModelInspector import ModelInspector
from DataSynthesizer.lib.utils import read_json_file, display_bayesian_network

DATA_PATH = 'priv_bayes/data/1.csv'
constraints = None
ORI_DATA = None
threshold_value = 10  # 离散型和数值型分界点
epsilon = 0.3         # 分布叠加的隐私预算
bayes_epsilon = 10    # 贝叶斯网络的隐私预算
dot_basenum = 1000    # 增强分布时加点的基础数量
degree_of_bayesian_network = 2  # 贝叶斯每个节点父亲最多个数
perturbation = 0.10   # 根据约束采样属性值的扰动范围


def index(request):
    return HttpResponse("priv_bayes_backend")


def getOriginalData(request):
    global DATA_PATH, ORI_DATA
    data = request.FILES['file']
    DATA_PATH = default_storage.save('priv_bayes/data/1.csv', ContentFile(data.read()))
    df = pd.read_csv(DATA_PATH)
    ORI_DATA = df  # 保存原始数据，用于后续数据生成
    df['index'] = range(len(df))
    original_data = json.loads(df.to_json(orient="records"))
    Dimensions = []
    Measures = []
    attribute_character = {}
    for col in df:
        if col == 'index':
            continue
        if len(df[col].value_counts()) > threshold_value:  # 数值型
            Measures.append(col)
            minn = min(df[col])
            maxx = max(df[col])
            mean = np.mean(df[col])
            attribute_character[col] = {
                "attribute_type": "Dimensions",
                "min": minn,
                "max": maxx,
                "average": mean,
            }
        else:
            Dimensions.append(col)  # 离散型
            attribute_character[col] = {
                "attribute_type": "Measures",
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


def cnt_poly(x, params):
    ans = 0
    for item in params:
        ans *= x
        ans += item
    return ans


def setPattern(request):
    global constraints, ORI_DATA
    constraints = json.loads(request.GET['constraints'])
    describer = DataDescriber(category_threshold=threshold_value)
    description_file = "priv_bayes/out/original_data.json"
    synthetic_data = "priv_bayes/out/synthetic_data.csv"
    # ORI_DATA = pd.read_csv(DATA_PATH) # 接口测试开启，正式使用关闭
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
    for constraint in constraints:
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
            f_xy = np.random.multivariate_normal(mean, cov, int(dot_basenum * epsilon))
            for item in f_xy:
                try:
                    filtered_data = synthetic_df[
                        (synthetic_df[x_axis] < item[0] * (1 + perturbation)) &
                        (synthetic_df[x_axis] > item[0] * (1 - perturbation)) &
                        (synthetic_df[y_axis] > item[1] * (1 - perturbation)) &
                        (synthetic_df[y_axis] > item[1] * (1 - perturbation))
                        ].sample(1).to_json(orient="records")
                    filtered_data = json.loads(filtered_data)  # 得到的是一个数组
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
                    filtered_data[0][x_axis] = x[i]
                    filtered_data[0][y_axis] = y[i]
                    cur_df = cur_df.append(filtered_data)
                except:
                    pass
            pass
        if type == "order":  # 顺序
            values = params['values']  # 保持order的数据，根据比例扩展数据

            pass
        print(len(cur_df))
        cur_aug_data['data'] = json.loads(cur_df.to_json(orient="records"))
        augmented_data.append(cur_aug_data)
        aug_df = aug_df.append(cur_aug_data['data'])
    # 使用aug_df做一轮隐私保护数据生成
    AUG_PATH = 'priv_bayes/data/augmented_data.csv'
    aug_df.to_csv('priv_bayes/data/augmented_data.csv', index=False)
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
    return HttpResponse(json.dumps(ret))

def setWeights(request):
    return HttpResponse(request.POST.get('title'))

def getMetrics(request):
    return HttpResponse(request.POST.get('title'))