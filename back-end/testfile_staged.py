import json
import numpy as np
import pandas as pd
from dtw import dtw
import orjson
import copy
import random
from sklearn.metrics import ndcg_score
from sdv.evaluation import evaluate  # sdv打开注释
from priv_bayes.kl import get_w_distance
from priv_bayes.DataSynthesizer.DataDescriber import DataDescriber
from priv_bayes.DataSynthesizer.DataGenerator import DataGenerator
from priv_bayes.DataSynthesizer.lib.utils import display_bayesian_network


def set_random_seed(seed):
    random.seed(seed)
    np.random.seed(seed)


# 判断点是否在多边形内

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


# 参数
# BAYES_LIST = [0]
BAYES_LIST = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6,
              0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 10, 15, 20]
BASE_WEIGHT = 6

# 读入原始数据
DATA_PATH = "priv_bayes/data/adult_filter1.csv"
SELECTED_DATA_PATH = "selected_data.csv"
DES_PATH = "description.json"
DES_SELECTED_PATH = "description_selected.json"

df = pd.read_csv(DATA_PATH)

# 保存筛选过后的数据
f = open("constraints_staged.json")
constraint = json.load(f)['constraints'][0]
selected_df = df.iloc[constraint['data']]
selected_df.to_csv(SELECTED_DATA_PATH, index=False)


def is_isomorphic(network1, network2):
    dict1 = {}
    dict2 = {}
    for child, parents in network1:
        dict1[child] = set(parents)
    for child, parents in network2:
        dict2[child] = set(parents)

    flag = True
    for child, parents in network1:
        if dict1[child] != dict2[child]:
            flag = False
            break
    return flag


if __name__ == '__main__':
    result_df = pd.DataFrame()

    cur_scheme_weights = None

    # 构建一个weights数组
    weight_df = copy.deepcopy(df)
    weight_df[weight_df.columns] = 1.0
    # 建立一张axis到id的索引表
    axis2id = {}
    for idx, val in enumerate(weight_df.columns):
        axis2id[val] = idx
    arr = weight_df.values
    x_id = axis2id.get(constraint["x_axis"])
    y_id = axis2id.get(constraint["y_axis"])
    cur_ids = constraint["data"]
    for id in cur_ids:
        if x_id is not None:
            arr[id][x_id] = max(
                arr[id][x_id], BASE_WEIGHT)
        if y_id is not None:
            arr[id][y_id] = max(
                arr[id][y_id], BASE_WEIGHT)
    for axis in axis2id:
        weight_df[axis] = arr[:, axis2id[axis]]
    cur_scheme_weights = {}
    dtdt = orjson.loads(weight_df.to_json(orient="records"))
    for idx, dt in enumerate(dtdt):
        if idx not in cur_ids:
            continue
        cur_scheme_weights[idx] = dt

    for bayes_epsilon in BAYES_LIST:
        for iter in range(10):
            # 生成原始数据的描述文件
            describer = DataDescriber(
                histogram_bins=15, category_threshold=20)
            describer.describe_dataset_in_correlated_attribute_mode(dataset_file=DATA_PATH,
                                                                    epsilon=bayes_epsilon,
                                                                    k=2,
                                                                    attribute_to_is_categorical={},
                                                                    attribute_to_is_candidate_key={},
                                                                    )
            describer.save_dataset_description_to_file(DES_PATH)
            display_bayesian_network(describer.bayesian_network)

            # 生成新数据的描述文件
            describer_selected = DataDescriber(
                histogram_bins=15, category_threshold=20)
            describer_selected.describe_dataset_in_correlated_attribute_mode(dataset_file=DATA_PATH,  # 使用原数据构建概率表
                                                                            epsilon=bayes_epsilon,
                                                                            k=2,
                                                                            attribute_to_is_categorical={},
                                                                            attribute_to_is_candidate_key={},
                                                                            weights=cur_scheme_weights  # 加上weights建表
                                                                            )  # 使用df_selected数据建网络
            describer_selected.save_dataset_description_to_file(DES_SELECTED_PATH)
            display_bayesian_network(describer_selected.bayesian_network)
            # res_isomorphic = is_isomorphic(describer.bayesian_network, describer_selected.bayesian_network)
            # result_df.append({
            #     "bayes_epsilon": bayes_epsilon,
            #     "is_isomorphic": 1 if res_isomorphic else 0
            # }, ignore_index=True)
            # result_df.to_csv("match_result.csv")
            set_random_seed(iter)
            generator = DataGenerator()
            generator.generate_dataset_in_correlated_attribute_mode(
                len(df), DES_PATH, 0)
            set_random_seed(iter)
            generator_selected = DataGenerator()
            generator_selected.generate_dataset_in_correlated_attribute_mode(
                len(df), DES_SELECTED_PATH, 0)
            synthetic_ori = generator.get_synthetic_data()
            synthetic_p = generator_selected.get_synthetic_data()

            p_patterns = {}
            privbayes_patterns = {}

            if constraint['type'] == "cluster":
                area = constraint["params"]["area"]
                dt_x = synthetic_p[constraint["x_axis"]]
                dt_y = synthetic_p[constraint["y_axis"]]
                base_dt_x = synthetic_ori[constraint["x_axis"]]
                base_dt_y = synthetic_ori[constraint["y_axis"]]
                ori_dt_x = df[constraint["x_axis"]]
                ori_dt_y = df[constraint["y_axis"]]
                if constraint["params"]["type"] == "rect":
                    p_selected_data = synthetic_p[(dt_x >= area[0][0]) & (dt_x <= area[1][0]) & (dt_y >= area[1][1])
                                                  & (dt_y <= area[0][1])]
                    privbayes_selected_data = synthetic_ori[
                        (base_dt_x >= area[0][0]) & (
                            base_dt_x <= area[1][0]) & (base_dt_y >= area[1][1])
                        & (base_dt_y <= area[0][1])]
                    ori_selected_data = df[(ori_dt_x >= area[0][0]) & (ori_dt_x <= area[1][0]) & (ori_dt_y >= area[1][1])
                                           & (ori_dt_y <= area[0][1])]
                if constraint["params"]["type"] == "polygon":
                    p_selected_data = []
                    for idx, row in synthetic_p.iterrows():
                        if point_inside_polygon(row[constraint["x_axis"]], row[constraint["y_axis"]], constraint["params"]["area"]):
                            p_selected_data.append(idx)
                    privbayes_selected_data = []
                    for idx, row in synthetic_ori.iterrows():
                        if point_inside_polygon(row[constraint["x_axis"]], row[constraint["y_axis"]], constraint["params"]["area"]):
                            privbayes_selected_data.append(idx)
                    ori_selected_data = []
                    for idx, row in df.iterrows():
                        if point_inside_polygon(row[constraint["x_axis"]], row[constraint["y_axis"]], constraint["params"]["area"]):
                            ori_selected_data.append(idx)

                    p_selected_data = synthetic_p.iloc[p_selected_data]
                    privbayes_selected_data = synthetic_ori.iloc[privbayes_selected_data]
                    ori_selected_data = df.iloc[ori_selected_data]
                p_selected_data = p_selected_data[[
                    constraint["x_axis"], constraint["y_axis"]]]
                privbayes_selected_data = privbayes_selected_data[[
                    constraint["x_axis"], constraint["y_axis"]]]
                ori_selected_data = ori_selected_data[[
                    constraint["x_axis"], constraint["y_axis"]]]

                ori_center = ori_selected_data.values.mean(axis=0)
                diff1 = p_selected_data.values - ori_center
                diff2 = privbayes_selected_data.values - ori_center

                p_intra_cluster_dis = np.sum([np.sqrt(item ** 2)
                                              for item in diff1]) / len(p_selected_data)
                privbayes_intra_cluster_dis = np.sum([np.sqrt(item ** 2)
                                                      for item in diff2]) / len(privbayes_selected_data)

                # 处理WDis
                p_WDis = get_w_distance(
                    p_selected_data.values, ori_selected_data.values)
                privbayes_WDis = get_w_distance(
                    privbayes_selected_data.values, ori_selected_data.values)
                # 使用sdv库计算KL散度
                p_KL = evaluate(p_selected_data, ori_selected_data, metrics=[
                    'ContinuousKLDivergence'])   # sdv打开注释
                privbayes_KL = evaluate(privbayes_selected_data, ori_selected_data, metrics=[
                    'ContinuousKLDivergence'])  # sdv打开注释

                p_patterns.update({
                    "klpc": float(p_KL),    # sdv打开注释
                    "distocenterpc": float(p_intra_cluster_dis),
                    "wdispc": float(p_WDis),
                    "nodessimpc": 1 - abs(len(ori_selected_data) - len(p_selected_data)) / len(ori_selected_data),
                    "pc_node_num": len(p_selected_data)
                })

                privbayes_patterns.update({
                    "klpriv": float(privbayes_KL),   # sdv打开注释
                    "distocenterpriv": float(privbayes_intra_cluster_dis),
                    "wdispriv": float(privbayes_WDis),
                    "nodessimpriv": 1 - abs(len(ori_selected_data) - len(privbayes_selected_data)) / len(ori_selected_data),
                    "priv_node_num": len(privbayes_selected_data),
                    "cluster_intra_dis_diff_pc_priv": abs(float(privbayes_intra_cluster_dis)
                                                          - float(p_intra_cluster_dis)),
                    "cluster_real_node_num": len(ori_selected_data)
                })

            if constraint['type'] == "correlation":
                # 右端点向右扩展，作为最后一个端点的区间
                constraint['params']['range'][1] += constraint['x_step']
                cond11 = synthetic_p[constraint['x_axis']
                                     ] <= constraint['params']['range'][1]
                cond12 = synthetic_p[constraint['x_axis']
                                     ] >= constraint['params']['range'][0]
                cond21 = synthetic_ori[constraint['x_axis']
                                       ] <= constraint['params']['range'][1]
                cond22 = synthetic_ori[constraint['x_axis']
                                       ] >= constraint['params']['range'][0]
                cond31 = df[constraint['x_axis']
                            ] <= constraint['params']['range'][1]
                cond32 = df[constraint['x_axis']
                            ] >= constraint['params']['range'][0]
                if constraint['computation'] == 'count':
                    p_selected_data = synthetic_p[cond11 & cond12][[
                        constraint["x_axis"]]]
                    privbayes_selected_data = synthetic_ori[cond21 & cond22][[
                        constraint["x_axis"]]]
                    ori_selected_data = df[cond31 & cond32][[
                        constraint["x_axis"]]]
                    cut_points = np.arange(
                        constraint['params']['range'][0], constraint['params']['range'][1] + 1e-6, constraint['x_step'])
                    cut_points[-1] += 1e-6
                    p_selected_data[constraint["x_axis"]] = pd.cut(p_selected_data[constraint['x_axis']], cut_points,
                                                                   right=False)
                    p_selected_data['index'] = len(p_selected_data)
                    p_data = p_selected_data.groupby(
                        constraint["x_axis"]).count().sort_index().values

                    privbayes_selected_data[constraint["x_axis"]] = pd.cut(privbayes_selected_data[constraint['x_axis']], cut_points,
                                                                           right=False)
                    privbayes_selected_data['index'] = len(
                        privbayes_selected_data)
                    privbayes_data = privbayes_selected_data.groupby(
                        constraint["x_axis"]).count().sort_index().values

                    ori_selected_data[constraint["x_axis"]] = pd.cut(ori_selected_data[constraint['x_axis']], cut_points,
                                                                     right=False)
                    ori_selected_data['index'] = len(ori_selected_data)
                    ori_data = ori_selected_data.groupby(
                        constraint["x_axis"]).count().sort_index().values
                elif constraint['computation'] == 'average':
                    cut_points = np.arange(
                        constraint['params']['range'][0], constraint['params']['range'][1] + 1e-6, constraint['x_step'])
                    cut_points[-1] += 1e-6
                    p_selected_data = synthetic_p[cond11 & cond12][[
                        constraint["x_axis"], constraint["y_axis"]]]
                    privbayes_selected_data = synthetic_ori[cond21 & cond22][[
                        constraint["x_axis"], constraint["y_axis"]]]
                    ori_selected_data = df[cond31 & cond32][[
                        constraint["x_axis"], constraint["y_axis"]]]
                    p_selected_data[constraint["x_axis"]] = pd.cut(p_selected_data[constraint['x_axis']], cut_points,
                                                                   right=False)

                    privbayes_selected_data[constraint["x_axis"]] = pd.cut(privbayes_selected_data[constraint['x_axis']], cut_points,
                                                                           right=False)

                    ori_selected_data[constraint["x_axis"]] = pd.cut(ori_selected_data[constraint['x_axis']], cut_points,
                                                                     right=False)
                    p_data = p_selected_data.groupby(
                        constraint["x_axis"]).mean().fillna(0).sort_index().values
                    privbayes_data = privbayes_selected_data.groupby(
                        constraint["x_axis"]).mean().fillna(0).sort_index().values
                    ori_data = ori_selected_data.groupby(
                        constraint["x_axis"]).mean().fillna(0).sort_index().values

                def manhattan_distance(x, y):
                    return np.abs(x - y)

                p_DTW, cost_matrix, acc_cost_matrix, path = dtw(
                    p_data, ori_data, dist=manhattan_distance)
                privbayes_DTW, cost_matrix, acc_cost_matrix, path = dtw(
                    privbayes_data, ori_data, dist=manhattan_distance)

                p_Euc = np.sqrt(np.sum(np.square(p_data - ori_data)))
                privbayes_Euc = np.sqrt(
                    np.sum(np.square(privbayes_data - ori_data)))
                p_Euc_ori = p_Euc
                privbayes_Euc_ori = privbayes_Euc
                maxEuc = max(p_Euc, privbayes_Euc) * 1.1
                p_Euc = 1 - p_Euc / maxEuc
                privbayes_Euc = 1 - privbayes_Euc / maxEuc
                if constraint['computation'] == 'count':
                    ori_coef_data = ori_selected_data.groupby(
                        constraint['x_axis']).count().fillna(0).sort_index().reset_index()
                    ori_coef_data[constraint['x_axis']] = range(
                        1, len(ori_coef_data) + 1)
                    ori_coef_data = ori_coef_data.values

                    p_coef_data = p_selected_data.groupby(
                        constraint['x_axis']).count().fillna(0).sort_index().reset_index()
                    p_coef_data[constraint['x_axis']] = range(
                        1, len(p_coef_data) + 1)
                    p_coef_data = p_coef_data.values

                    privbayes_coef_data = privbayes_selected_data.groupby(
                        constraint['x_axis']).count().fillna(0).sort_index().reset_index()
                    privbayes_coef_data[constraint['x_axis']] = range(
                        1, len(privbayes_coef_data) + 1)
                    privbayes_coef_data = privbayes_coef_data.values
                elif constraint['computation'] == 'average':
                    ori_coef_data = ori_selected_data.groupby(
                        constraint['x_axis']).mean().fillna(0).sort_index().reset_index()
                    ori_coef_data[constraint['x_axis']] = range(
                        1, len(ori_coef_data) + 1)
                    ori_coef_data = ori_coef_data.values
                    p_coef_data = p_selected_data.groupby(
                        constraint['x_axis']).mean().fillna(0).sort_index().reset_index()
                    p_coef_data[constraint['x_axis']] = range(
                        1, len(p_coef_data) + 1)
                    p_coef_data = p_coef_data.values
                    privbayes_coef_data = privbayes_selected_data.groupby(
                        constraint['x_axis']).mean().fillna(0).sort_index().reset_index()
                    privbayes_coef_data[constraint['x_axis']] = range(
                        1, len(privbayes_coef_data) + 1)
                    privbayes_coef_data = privbayes_coef_data.values

                ori_coef = np.corrcoef(
                    ori_coef_data[:, 0], ori_coef_data[:, 1])
                p_PCD = abs(np.corrcoef(
                    p_coef_data[:, 0], p_coef_data[:, 1]) - ori_coef)[0][1]
                privbayes_PCD = abs(np.corrcoef(
                    privbayes_coef_data[:, 0], privbayes_coef_data[:, 1]) - ori_coef)[0][1]

                p_patterns.update({
                    "DTWpc": float(p_DTW),
                    "Eucpc_corr": float(p_Euc_ori),
                    "PCDpc": float(p_PCD),
                    "Pearson_ori": float(ori_coef[0][1]),
                    "Pearson_pc": float(np.corrcoef(p_coef_data[:, 0], p_coef_data[:, 1])[0][1])
                })
                privbayes_patterns.update({
                    "DTWpriv": float(privbayes_DTW),
                    "Eucpriv_corr": float(privbayes_Euc_ori),
                    "PCDpriv": float(privbayes_PCD),
                    "Pearson_priv": float(np.corrcoef(privbayes_coef_data[:, 0], privbayes_coef_data[:, 1])[0][1])
                })
            if constraint['type'] == "order":
                if df[constraint['x_axis']].dtype != object:
                    constraint['params']['values'] = [
                        int(item) for item in constraint["params"]["values"]]
                ori_selected_data = df[df[constraint['x_axis']].isin(
                    constraint["params"]["values"])]
                p_selected_data = synthetic_p[synthetic_p[constraint['x_axis']].isin(
                    constraint["params"]["values"])]
                privbayes_selected_data = synthetic_ori[synthetic_ori[constraint['x_axis']].isin(
                    constraint["params"]["values"])]
                p_selected_data['index'] = range(len(p_selected_data))
                privbayes_selected_data['index'] = range(
                    len(privbayes_selected_data))
                ori_selected_data['index'] = range(len(ori_selected_data))
                ori_arr = ori_selected_data[[constraint['x_axis'], 'index']].groupby(
                    constraint['x_axis']).count().sort_index().values.flatten()
                pcbayes_arr = p_selected_data[[constraint['x_axis'], 'index']].groupby(
                    constraint['x_axis']).count().sort_index().values.flatten()
                privbayes_arr = privbayes_selected_data[[constraint['x_axis'], 'index']].groupby(
                    constraint['x_axis']).count().sort_index().values.flatten()

                p_patterns.update({
                    "ndcgpc": float(ndcg_score([ori_arr], [pcbayes_arr])),
                    "diffpc": int(np.sum(np.abs(ori_arr - pcbayes_arr))),
                    "Eucpc": float(np.sqrt(np.sum(np.square(pcbayes_arr - ori_arr)))),
                    "reldiffpc": float(np.sum(np.abs(ori_arr - pcbayes_arr) / ori_arr)),
                    "nodes_real": len(ori_selected_data),
                    "nodes_pc": len(p_selected_data),
                })
                privbayes_patterns.update({
                    "ndcgpriv": float(ndcg_score([ori_arr], [privbayes_arr])),
                    "diffpriv": int(np.sum(np.abs(ori_arr - privbayes_arr))),
                    "Eucpriv": float(np.sqrt(np.sum(np.square(privbayes_arr - ori_arr)))),
                    "reldiffpriv": float(np.sum(np.abs(ori_arr - privbayes_arr) / ori_arr)),
                    "nodessimpriv": 1 - abs(len(ori_selected_data) - len(privbayes_selected_data)) / len(ori_selected_data),
                    "nodes_priv": len(privbayes_selected_data)
                })
            p_patterns.update(privbayes_patterns)
            p_patterns.update({
                "epsilon": bayes_epsilon
            })
            print(p_patterns)
            result_df = result_df.append(p_patterns, ignore_index=True)

    result_df.to_csv("epsilon_0.1-20_adult_cluster.csv")
