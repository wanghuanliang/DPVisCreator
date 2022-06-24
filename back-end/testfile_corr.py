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
EPS_LIST = [2]
W_LIST = [1.99]

df.append(["epsilon", "weight"])

for BASE_WEIGHT in W_LIST:
    for BAYES_EPS in EPS_LIST:
        dt = requests.get(base_url + "init", data=json.dumps(
            {'session_id': 'carlwang', 'bayes_eps': BAYES_EPS, 'BASE_WEIGHT': BASE_WEIGHT}), headers=headers)  # 初始化
        dt = requests.get(base_url + "getBaseData", params=session_dic)  # 初始化
        dt = requests.get(base_url + "getModelData",
                          data=json.dumps(model_dic), headers=headers)  # 初始化
        dt = requests.get(base_url + "getMetrics", params=session_dic)  # 初始化
        cluster_result = json.loads(dt.text)
        print(BAYES_EPS, ", ", BASE_WEIGHT, ": ", cluster_result)
        df = df.append(
            [[BAYES_EPS] + [BASE_WEIGHT] + np.array(cluster_result).flatten().tolist()])
df.to_csv("adult-pattern2-weightx3.csv")

# 数组第一行pcbayes指标，第二行privbayes指标
