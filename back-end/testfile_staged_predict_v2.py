import json
import numpy as np
import pandas as pd
from dtw import dtw
import orjson
import copy
import random
from sklearn.metrics import ndcg_score
from sdv.evaluation import evaluate  # sdv打开注释
from priv_bayes.kl import get_w_distance, KLdivergence
from priv_bayes.DataSynthesizer.DataDescriber import DataDescriber
from priv_bayes.DataSynthesizer.DataGenerator import DataGenerator
from priv_bayes.DataSynthesizer.lib.utils import display_bayesian_network
from scipy.stats import entropy, wasserstein_distance
from scipy.special import rel_entr, kl_div
from sklearn.metrics import mutual_info_score
from scipy.spatial.distance import euclidean
import bnlearn as bn
from pgmpy.factors.discrete import TabularCPD
import matplotlib.pyplot as plt


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


def read_json_file(filename):
    with open(filename, encoding='utf-8') as file:
        return json.load(file)

# 构建贝叶斯网络


def construct_bayesian_network(des_file):
    # 首节点
    first_node = None
    # 描述文件
    des = read_json_file(des_file)
    # 构建边表
    bayesian_network = des['bayesian_network']
    edge_list = []
    par = {}
    for el in bayesian_network:
        v = el[0]
        par[v] = el[1]
        for u in el[1]:
            edge_list.append((u, v))
    # 构建dag
    dag = bn.make_DAG(edge_list)
    # 构建条件概率表
    cpd_list = []
    node2dis_num = {}
    node = des['meta']['attributes_in_BN']
    for n in node:
        node_info = des['attribute_description'][n]
        discrete_num = len(node_info["distribution_bins"])
        node2dis_num[n] = discrete_num
    for n in node:
        node_info = des['attribute_description'][n]
        discrete_num = len(node_info["distribution_bins"])
        # dis_prob = node_info["distribution_probabilities"]
        # 目前只考虑最多两个父节点
        if n in par:
            cond_prob = des["conditional_probabilities"][n]
            # 只有一个父节点
            if len(par[n]) == 1:
                value_list = []
                for i in range(node2dis_num[par[n][0]]):
                    value_list.append(cond_prob[str([i])])
                value_list = list(zip(*value_list))
                cpd = TabularCPD(variable=n, variable_card=discrete_num, values=value_list,
                                 evidence=par[n], evidence_card=[node2dis_num[par[n][0]]])
            # 有两个父节点
            else:
                value_list = []
                for i in range(node2dis_num[par[n][0]]):
                    for j in range(node2dis_num[par[n][1]]):
                        value_list.append(cond_prob[str([i, j])])
                value_list = list(zip(*value_list))
                cpd = TabularCPD(variable=n, variable_card=discrete_num, values=value_list, evidence=par[n], evidence_card=[
                                 node2dis_num[par[n][0]], node2dis_num[par[n][1]]])
        # 首节点
        else:
            first_node = n
            dis_prob = des["conditional_probabilities"][n]
            dis_prob = [[el] for el in dis_prob]
            cpd = TabularCPD(
                variable=n, variable_card=discrete_num, values=dis_prob)
        cpd_list.append(cpd)
    model = bn.make_DAG(dag, cpd_list)
    return des, model, first_node

# 得到带约束的两个节点的联合概率分布


def constraint_joint_prob(des, x_node, y_node, model, first_node):
    # first_node_info = des["attribute_description"][first_node]
    # first_node_prob = first_node_info["distribution_probabilities"]
    first_node_prob = des["conditional_probabilities"][first_node]
    total_p = 0
    total_df = None
    for i in range(len(first_node_prob)):
        if first_node == x_node:
            query = bn.inference.fit(
                model, variables=[y_node], evidence={first_node: i})
            df = query.df.copy()
            df.p *= first_node_prob[i]
            df.insert(0, first_node, i)
        elif first_node == y_node:
            query = bn.inference.fit(
                model, variables=[x_node], evidence={first_node: i})
            df = query.df.copy()
            df.p *= first_node_prob[i]
            df.insert(1, first_node, i)
        else:
            query = bn.inference.fit(
                model, variables=[x_node, y_node], evidence={first_node: i})
            df = query.df.copy()
            df.p *= first_node_prob[i]
        if total_df is None:
            total_df = df.copy()
        else:
            total_df = pd.concat([total_df, df]).groupby(
                [x_node, y_node]).sum().reset_index()
        total_p += df['p'].sum()
    return total_df


def discrete_histogram(des, x_node, y_node, df):
    x_node_info = des['attribute_description'][x_node]
    x_node_edges = []
    x_node_edges += x_node_info["distribution_bins"]
    x_node_edges.append(x_node_info["max"])

    y_node_info = des['attribute_description'][y_node]
    y_node_edges = []
    y_node_edges += y_node_info["distribution_bins"]
    y_node_edges.append(y_node_info["max"])

    x_data = df[x_node].to_numpy()
    y_data = df[y_node].to_numpy()

    H, x_node_edges, y_node_edges = np.histogram2d(
        x_data, y_data, bins=(x_node_edges, y_node_edges))
    H = H.T
    # H = H / np.sum(H)

    X, Y = np.meshgrid(x_node_edges, y_node_edges)
    # plt.pcolormesh(X, Y, H)

    return H


def cal_kl(original_df, synthetic_df):
    return entropy(original_df.flatten(), synthetic_df.flatten())


def cal_wdis(original_df, synthetic_df):
    return wasserstein_distance(original_df.flatten(), synthetic_df.flatten())


def cal_euc(original_df, synthetic_df):
    return euclidean(original_df.flatten(), synthetic_df.flatten())\



def get_xy(constraint_file_path):
    constraint = read_json_file(constraint_file_path)
    x_node = constraint['x_axis']
    y_node = constraint['y_axis']
    return x_node, y_node


def get_edges(mi, ma, bin_num):
    return np.linspace(mi, ma, bin_num + 1, endpoint=True)


def get_histogram_from_data(x_node_edges, y_node_edges, x_node, y_node, data_df):
    x_data = data_df[x_node].to_numpy()
    y_data = data_df[y_node].to_numpy()

    H, x_node_edges, y_node_edges = np.histogram2d(
        x_data, y_data, bins=(x_node_edges, y_node_edges))
    H = H.T
    H = H / np.sum(H)

    X, Y = np.meshgrid(x_node_edges, y_node_edges)
    # plt.pcolormesh(X, Y, H)
    return H


def get_predict_histogram_from_network(des_file_path, x_node, y_node, x_edges, y_edges):
    des, model, first_node = construct_bayesian_network(des_file_path)
    total_df = constraint_joint_prob(des, x_node, y_node, model, first_node)
    total_df = total_df.pivot(y_node, x_node, 'p').values
    X, Y = np.meshgrid(x_edges, y_edges)
    # plt.pcolormesh(X, Y, total_df)
    return total_df


# 参数
# BAYES_LIST = [2]
# BAYES_LIST = [0.1, 0.5, 1,  3,  5, 7, 9, 11, 13, 15, 17, 19, 21]
BAYES_LIST = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6,
              0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 10, 15, 20]
BAYES_LIST = list(np.repeat(BAYES_LIST, 10))
# BAYES_LIST = [0.1, 0.1, 0.2, 0.2, 0.3, 0.3, 0.4, 0.4, 0.5, 0.5, 0.6, 0.6,
#               0.7, 0.7, 0.8, 0.8, 0.9, 0.9, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 10, 10, 15, 15, 20, 20]
# BAYES_LIST = [0.2]
BASE_WEIGHT = 2

# 读入原始数据
DATA_PATH = "priv_bayes/data/bank_filter2.csv"
# DATA_PATH = "./priv_bayes/data/shopping_filter4.csv"
SELECTED_DATA_PATH = "selected_data.csv"
DES_PATH = "description.json"
DES_SELECTED_PATH = "description_selected.json"

df = pd.read_csv(DATA_PATH)

# 保存筛选过后的数据
# f = open("constraints_staged.json")
f = open("constraints_staged_cluster.json")
# f = open("constraints_staged_order.json")
constraint = json.load(f)['constraints'][0]
selected_df = df.iloc[constraint['data']]
selected_df.to_csv(SELECTED_DATA_PATH, index=False)

x_node = constraint['x_axis']
y_node = constraint['y_axis']
original_bin_num = 15
x_edges = get_edges(np.min(df[x_node]), np.max(df[x_node]), original_bin_num)
y_edges = get_edges(np.min(df[y_node]), np.max(df[y_node]), original_bin_num)
original_H = get_histogram_from_data(x_edges, y_edges, x_node, y_node, df)


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

    rs_list = random.sample(range(1, 65536), len(BAYES_LIST))
    rs_idx = 0

    rs2_list = random.sample(range(1, 65536), len(BAYES_LIST) * 10)
    rs2_idx = 0

    for bayes_epsilon in BAYES_LIST:
        rs = rs_list[rs_idx]
        rs_idx += 1
        # set_random_seed(int(bayes_epsilon*10))
        set_random_seed(rs)
        # 生成原始数据的描述文件
        describer = DataDescriber(
            histogram_bins=15, category_threshold=20)
        describer.describe_dataset_in_correlated_attribute_mode(dataset_file=DATA_PATH,
                                                                # epsilon=0,
                                                                epsilon=bayes_epsilon,
                                                                k=2,
                                                                attribute_to_is_categorical={},
                                                                attribute_to_is_candidate_key={},
                                                                )
        describer.save_dataset_description_to_file(DES_PATH)
        display_bayesian_network(describer.bayesian_network)
        zz_des = read_json_file(DES_PATH)

        privbayes_H = get_predict_histogram_from_network(
            DES_PATH, x_node, y_node, x_edges, y_edges)

        cnt = 0
        BASE_WEIGHT = 4
        while cnt < 1:
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
                    # 选中数据的所有属性都加权
                    for i in range(len(axis2id)):
                        if i == x_id or i == y_id:
                            arr[id][i] = max(arr[id][i], BASE_WEIGHT)
                        else:
                            arr[id][i] = max(arr[id][i], BASE_WEIGHT)
                    # 只有图表涉及到的属性加权
                    # arr[id][x_id] = max(
                    #     arr[id][x_id], BASE_WEIGHT)
                if y_id is not None:
                    for i in range(len(axis2id)):
                        if i == x_id or i == y_id:
                            arr[id][i] = max(arr[id][i], BASE_WEIGHT)
                        else:
                            arr[id][i] = max(arr[id][i], BASE_WEIGHT)
                    # arr[id][y_id] = max(
                    #     arr[id][y_id], BASE_WEIGHT)
            for axis in axis2id:
                weight_df[axis] = arr[:, axis2id[axis]]
            cur_scheme_weights = {}
            dtdt = orjson.loads(weight_df.to_json(orient="records"))
            for idx, dt in enumerate(dtdt):
                if idx not in cur_ids:
                    continue
                cur_scheme_weights[idx] = dt

            # set_random_seed(int(bayes_epsilon*10))
            set_random_seed(rs)
            # 生成新数据的描述文件
            describer_selected = DataDescriber(
                histogram_bins=15, category_threshold=20)
            describer_selected.describe_dataset_in_correlated_attribute_mode(dataset_file=DATA_PATH,  # 使用原数据构建概率表
                                                                             # epsilon=0,
                                                                             epsilon=bayes_epsilon,
                                                                             k=2,
                                                                             attribute_to_is_categorical={},
                                                                             attribute_to_is_candidate_key={},
                                                                             weights=cur_scheme_weights  # 加上weights建表
                                                                             )  # 使用df_selected数据建网络
            describer_selected.save_dataset_description_to_file(
                DES_SELECTED_PATH)
            display_bayesian_network(describer_selected.bayesian_network)
            zz_privis_des = read_json_file(DES_SELECTED_PATH)

            privis_H = get_predict_histogram_from_network(
                DES_SELECTED_PATH, x_node, y_node, x_edges, y_edges)

            isTheoricalGood = 1
            euc_ori_privbayes = cal_euc(original_H, privbayes_H)
            euc_ori_privis = cal_euc(original_H, privis_H)
            wdis_ori_privbayes = cal_wdis(original_H, privbayes_H)
            wdis_ori_privis = cal_wdis(original_H, privis_H)

            isEucBetter = euc_ori_privis < euc_ori_privbayes
            isWdisBetter = wdis_ori_privis < wdis_ori_privbayes
            dis_info = {}
            dis_info.update({
                "BASE_WEIGHT": BASE_WEIGHT,
                "isEucBetter": isEucBetter,
                "isWdisBetter": isWdisBetter,
                "euc_ori_privis": euc_ori_privis,
                "euc_ori_privbayes": euc_ori_privbayes,
                "wdis_ori_privis": wdis_ori_privis,
                "wdis_ori_privbayes": wdis_ori_privbayes,
                "privis_network": str(describer_selected.bayesian_network),
                "privbayes_network": str(describer.bayesian_network)
            })

            euc_ratio = euc_ori_privis / euc_ori_privbayes
            wdis_ratio = wdis_ori_privis / wdis_ori_privbayes
            if isEucBetter and isWdisBetter and euc_ratio <= 0.7 and wdis_ratio <= 0.7:
                break
            else:
                cnt += 1
                BASE_WEIGHT *= 2
                # BASE_WEIGHT = BASE_WEIGHT + cnt

        # for iter in range(5):
        for iter in range(10):

            # result_df = result_df.append(dis_info, ignore_index=True)
            # res_isomorphic = is_isomorphic(describer.bayesian_network, describer_selected.bayesian_network)
            # result_df.append({
            #     "bayes_epsilon": bayes_epsilon,
            #     "is_isomorphic": 1 if res_isomorphic else 0
            # }, ignore_index=True)
            # result_df.to_csv("match_result.csv")
            rs2 = rs2_list[rs2_idx]
            rs2_idx += 1
            # rs2 = random.randint(1, 65536)
            set_random_seed(rs2)
            # set_random_seed(iter)
            generator = DataGenerator()
            generator.generate_dataset_in_correlated_attribute_mode(
                len(df), DES_PATH, iter)
            set_random_seed(rs2)
            # set_random_seed(iter)
            generator_selected = DataGenerator()
            generator_selected.generate_dataset_in_correlated_attribute_mode(
                len(df), DES_SELECTED_PATH, iter)
            synthetic_ori = generator.get_synthetic_data()
            synthetic_p = generator_selected.get_synthetic_data()
            # synthetic_ori.to_csv("result_data/synthetic_ori"+str(iter)+".csv")
            # synthetic_p.to_csv("result_data/synthetic_p"+str(iter)+".csv")

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

                zz_x_node = constraint['x_axis']
                zz_y_node = constraint['y_axis']
                zz_privis_H = discrete_histogram(
                    zz_privis_des, zz_x_node, zz_y_node, synthetic_p)
                # zz_privis_H = discrete_histogram(zz_privis_des, zz_x_node, zz_y_node, p_selected_data)
                zz_privbayes_H = discrete_histogram(
                    zz_privis_des, zz_x_node, zz_y_node, synthetic_ori)
                # zz_privbayes_H = discrete_histogram(zz_privis_des, zz_x_node, zz_y_node, privbayes_selected_data)
                zz_ori_H = discrete_histogram(
                    zz_privis_des, zz_x_node, zz_y_node, df)
                # zz_ori_H = discrete_histogram(zz_privis_des, zz_x_node, zz_y_node, ori_selected_data)

                # 临时，转成2d直方图计算
                p_WDis = cal_wdis(zz_ori_H, zz_privis_H)
                privbayes_WDis = cal_wdis(zz_ori_H, zz_privbayes_H)

                # 处理WDis
                # p_WDis = get_w_distance(
                #     p_selected_data.values, ori_selected_data.values)
                # privbayes_WDis = get_w_distance(
                #     privbayes_selected_data.values, ori_selected_data.values)

                # 临时，转成2d直方图计算，kl会有inf，计算euclidean
                p_KL = euclidean(zz_ori_H.flatten(), zz_privis_H.flatten())
                # p_KL = cal_kl(zz_ori_H, zz_privis_H)
                privbayes_KL = euclidean(
                    zz_ori_H.flatten(), zz_privbayes_H.flatten())
                # privbayes_KL = cal_kl(zz_ori_H, zz_privbayes_H)

                # 使用sdv库计算KL散度
                # p_KL = KLdivergence(ori_selected_data, p_selected_data)
                # p_KL = evaluate(p_selected_data, ori_selected_data, metrics=[
                #     'ContinuousKLDivergence'])   # sdv打开注释
                # privbayes_KL = KLdivergence(ori_selected_data, privbayes_selected_data)
                # privbayes_KL = evaluate(privbayes_selected_data, ori_selected_data, metrics=[
                #     'ContinuousKLDivergence'])  # sdv打开注释

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
                    constraint['x_axis']).count().fillna(0).sort_index().values.flatten()
                pcbayes_arr = p_selected_data[[constraint['x_axis'], 'index']].groupby(
                    constraint['x_axis']).count().fillna(0).sort_index().values.flatten()
                privbayes_arr = privbayes_selected_data[[constraint['x_axis'], 'index']].groupby(
                    constraint['x_axis']).count().fillna(0).sort_index().values.flatten()
                if len(ori_arr) == 1:
                    ori_arr = np.append(ori_arr, -1)
                if len(pcbayes_arr) == 1:
                    pcbayes_arr = np.append(pcbayes_arr, -1)
                if len(privbayes_arr) == 1:
                    privbayes_arr = np.append(privbayes_arr, -1)
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
            p_patterns.update(dis_info)
            p_patterns.update({
                "rs": rs,
                "rs2": rs2
            })
            print(p_patterns)
            result_df = result_df.append(p_patterns, ignore_index=True)
        synthetic_ori.to_csv("result_data/synthetic_ori_" +
                             str(bayes_epsilon)+".csv")
        synthetic_p.to_csv("result_data/synthetic_p_" +
                           str(bayes_epsilon)+".csv")

    result_df.to_csv("result_cluster.csv")
