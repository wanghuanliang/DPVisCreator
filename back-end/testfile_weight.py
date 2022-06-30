import itertools
import json
import requests
import pandas as pd
import numpy as np
"""
    1. Run the backend server.
    2. Read the constraints file.
    3. Assign session_id.
    Now, for clusters, we provide (distance to the original center), (similarity of nodes number)
    for correlation, we provide (DTW), (Euclidean Distance), (Pearson Correlation Difference)
    for order, we provide (NDCG_score), (Manhattan Distance), (similarity of nodes number)
"""
base_url = "http://0.0.0.0:8000/api/"
headers = {'content-type': "application/json"}
session_dic = {'session_id': 'carlwang'}

f = open("constraints_weight.json")
model_dic = json.load(f)
model_dic.update(session_dic)
df = pd.DataFrame()
BASE_BASE_WEIGHT = 1
WEIGHT = [1, 4, 9]
BASE_WEIGHT = sum(WEIGHT) * BASE_BASE_WEIGHT

# EPS_LIST = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 10, 15, 20]
EPS_LIST = [2]
for BAYES_EPS in EPS_LIST:
    for WEIGHT_LIST in itertools.product(WEIGHT, WEIGHT, WEIGHT):
        max_w = max(WEIGHT_LIST)
        cnt = 0
        for cur_w in WEIGHT_LIST:
            if cur_w == max_w:
                cnt += 1
        if cnt > 1:
            continue
    # 临时
    # for WEIGHT_LIST in [[1, 1, 5], [1, 5, 1], [5, 1, 1]]:
    #     if WEIGHT_LIST[0] > WEIGHT_LIST[1] or WEIGHT_LIST[1] > WEIGHT_LIST[2]:
    #         continue
        weight_dic = {"weights": [{"id": "P0", "weight": WEIGHT_LIST[0]}, {"id": "P1", "weight": WEIGHT_LIST[1]}, {"id": "P2", "weight": WEIGHT_LIST[2]}],
                      "bayes_budget": BAYES_EPS}
        weight_dic.update(session_dic)
        # for tt in range(10):
        # 临时
        for tt in range(5):
            result_dict = {}
            dt = requests.get(base_url + "init", data=json.dumps(
                {'session_id': 'carlwang', 'bayes_eps': BAYES_EPS, 'BASE_WEIGHT': BASE_WEIGHT, "randomize": False}), headers=headers)  # 初始化
            dt = requests.get(base_url + "getBaseData",
                              params=session_dic)  # 初始化
            dt = requests.get(base_url + "getModelData",
                              data=json.dumps(model_dic), headers=headers)  # 初始化
            dt = requests.get(base_url + "setWeights",
                              data=json.dumps(weight_dic), headers=headers)
            dt = requests.get(base_url + "getMetrics",
                              params=session_dic)  # 初始化
            cluster_result = json.loads(dt.text)
            print(BAYES_EPS, "list: ", cluster_result[0], cluster_result[1])
            result_dict.update({
                "epsilon": BAYES_EPS,
                "BASE_WEIGHT": BASE_WEIGHT,
                "pattern_weight": WEIGHT_LIST
            })
            result_dict.update(cluster_result[0])
            result_dict.update(cluster_result[1])
            # df = df.append(
            #     [[BAYES_EPS] + [BASE_WEIGHT] + np.array(cluster_result).flatten().tolist()])
            df = df.append(result_dict, ignore_index=True)

            # df = df.append([[BAYES_EPS] + list(WEIGHT_LIST) + np.array(cluster_result).flatten().tolist()])
df.to_csv("shopping_3ptns_base1_iter5_eps2_with_weight_9_composition.csv")

# 数组第一行pcbayes指标，第二行privbayes指标
