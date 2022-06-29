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

f = open("constraints.json")
model_dic = json.load(f)
model_dic.update(session_dic)
df = pd.DataFrame()
EPS_LIST = [0.1, 0.5, 1, 3, 5]
# W_LIST = [1, 1.2, 1.4, 1.6, 1.8, 2.0]
W_LIST = list(range(2, 11))

for BASE_WEIGHT in W_LIST:
    for BAYES_EPS in EPS_LIST:
        # 添加多组
        for tt in range(5):
            result_dict = {}
            dt = requests.get(base_url + "init", data=json.dumps(
                {'session_id': 'carlwang', 'bayes_eps': BAYES_EPS, 'BASE_WEIGHT': BASE_WEIGHT, "randomize": False}), headers=headers)  # 初始化
            dt = requests.get(base_url + "getBaseData",
                              params=session_dic)  # 初始化
            dt = requests.get(base_url + "getModelData",
                              data=json.dumps(model_dic), headers=headers)  # 初始化
            dt = requests.get(base_url + "getMetrics",
                              params=session_dic)  # 初始化
            cluster_result = json.loads(dt.text)
            print(BAYES_EPS, ", ", BASE_WEIGHT, ": ", cluster_result)
            result_dict.update({
                "epsilon": BAYES_EPS,
                "BASE_WEIGHT": BASE_WEIGHT
            })
            result_dict.update(cluster_result[0])
            result_dict.update(cluster_result[1])
            # df = df.append(
            #     [[BAYES_EPS] + [BASE_WEIGHT] + np.array(cluster_result).flatten().tolist()])
            df = df.append(result_dict, ignore_index=True)
df.to_csv("test-adult2.csv")

# 数组第一行pcbayes指标，第二行privbayes指标
