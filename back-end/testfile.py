import json
import requests
import pandas as pd
import numpy as np
"""
    1. Run the backend server.
    2. Read the constraints file.
    3. Assign session_id.
    Now, for clusters, we provide (distance to the original center), (similarity of nodes number)
    for correlation, we provide (DTW), (Euclidean Distance)
    for order, we provide (NDCG_score), (Manhattan Distance), (similarity of nodes number)
"""
base_url = "http://0.0.0.0:8000/api/"
headers = {'content-type': "application/json"}
session_dic = {'session_id': 'carlwang'}

f = open("constraints_4_619.json")
model_dic = json.load(f)
model_dic.update(session_dic)
df = pd.DataFrame()
EPS_LIST = [0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 10, 15, 20]
for BAYES_EPS in EPS_LIST:
    for tt in range(10):
        dt = requests.get(base_url + "init", data=json.dumps({'session_id': 'carlwang_619', 'bayes_eps': BAYES_EPS}), headers=headers)  # 初始化
        dt = requests.get(base_url + "getBaseData", params=session_dic)  # 初始化
        dt = requests.get(base_url + "getModelData", data=json.dumps(model_dic), headers=headers)  # 初始化
        dt = requests.get(base_url + "getMetrics", params=session_dic)  # 初始化
        cluster_result = json.loads(dt.text)
        print(BAYES_EPS, ": ", cluster_result)
        df = df.append([[BAYES_EPS] + np.array(cluster_result).flatten().tolist()])
df.to_csv("test_bankdataset_0.csv")

# 数组第一行pcbayes指标，第二行privbayes指标

