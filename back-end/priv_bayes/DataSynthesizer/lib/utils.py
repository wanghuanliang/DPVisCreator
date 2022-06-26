import json
import random
import numba
from multiprocessing.dummy import Pool as ThreadPool
from string import ascii_lowercase

import numpy as np
from math import log
from pandas import Series, DataFrame
from scipy import sparse as sp
from priv_bayes.utils import contingency_matrix
from sklearn.metrics import normalized_mutual_info_score


def set_random_seed(randomize, seed=0):
    if not randomize:    # 不是随机的，设个种子
        random.seed(seed)
        np.random.seed(seed)


def process(paras):  # 并行去处理联合分布概率修改
    labels_true, labels_pred, class_idx, cluster_idx, nzx, nzy, nz_val, weights, axes, id = paras
    x_bin = labels_true[id]
    x_bin = class_idx[labels_true.tolist().index(x_bin)]
    y_bin = labels_pred[id]
    y_bin = cluster_idx[labels_pred.tolist().index(y_bin)]
    target = None
    for i in range(len(nzx)):
        if nzx[i] == x_bin and nzy[i] == y_bin:
            target = i
            break

    all_weights = [weights[id].get(axis) or 1 for axis in axes]
    avg_weight = sum(all_weights) / len(all_weights)
    # ans += (avg_weight - 1)
    # print(target)
    # nz_val[target] += (avg_weight - 1)
    return target, avg_weight

# @numba.jit(nopython=True)


def mutual_info_score(labels_true, labels_pred, axes, weights):
    labels_true = labels_true.values
    labels_pred = labels_pred.values
    contingency, classes, class_idx, clusters, cluster_idx = contingency_matrix(
        labels_true, labels_pred, sparse=True)
    nzx, nzy, nz_val = sp.find(contingency)

    contingency_sum = contingency.sum()
    pi = np.ravel(contingency.sum(axis=1))
    pj = np.ravel(contingency.sum(axis=0))

    flag = False
    if weights is not None:  # 权重如果传空，这里不再做任何操作
        flag = True  # 添加权重的开关
    if flag:
        ori_sum = np.sum(nz_val)
        nz_val = np.float64(nz_val)
        # ans = 0
        # pool = ThreadPool()
        # res_list = pool.map(process, [(labels_true, labels_pred, class_idx, cluster_idx, nzx, nzy, nz_val, weights, axes, id) for id in weights])
        # for item in res_list:
        #     nz_val[item[0]] += (nz_val[item[1]] - 1)
        for id in weights:  # 考虑分布式权重
            x_bin = labels_true[id]
            x_bin = class_idx[labels_true.tolist().index(x_bin)]
            y_bin = labels_pred[id]
            y_bin = cluster_idx[labels_pred.tolist().index(y_bin)]
            target = None
            for i in range(len(nzx)):
                if nzx[i] == x_bin and nzy[i] == y_bin:
                    target = i
                    break

            all_weights = [weights[id].get(axis) or 1 for axis in axes]
            avg_weight = sum(all_weights) / len(all_weights)
            # ans += (avg_weight - 1)
            # print(target)
            # if avg_weight != 1:
            #     print(all_weights)
            nz_val[target] += (avg_weight - 1)
        # print("nz_val之和:", np.sum(nz_val))
        # print("sum:", ans)
        nz_val = nz_val / np.sum(nz_val) * ori_sum

    log_contingency_nm = np.log(nz_val)

    contingency_nm = nz_val / contingency_sum
    # Don't need to calculate the full outer product, just for non-zeroes
    outer = pi.take(nzx).astype(np.int64, copy=False) * pj.take(nzy).astype(
        np.int64, copy=False
    )
    log_outer = -np.log(outer) + log(pi.sum()) + log(pj.sum())
    mi = (
        contingency_nm * (log_contingency_nm - log(contingency_sum))
        + contingency_nm * log_outer
    )
    mi = np.where(np.abs(mi) < np.finfo(mi.dtype).eps, 0.0, mi)
    return np.clip(mi.sum(), 0.0, None)


def mutual_information(labels_x: Series, labels_y: DataFrame, weights: {}):
    """Mutual information of distributions in format of Series or DataFrame.

    Parameters
    ----------
    labels_x : Series
    labels_y : DataFrame
    """
    # 根据x、y的列名，得到一张新表，为每个样本的权重值
    axes = [labels_x.name] + labels_y.columns.values.tolist()
    if labels_y.shape[1] == 1:
        labels_y = labels_y.iloc[:, 0]
    else:
        labels_y = labels_y.apply(lambda x: ' '.join(x.values), axis=1)

    return mutual_info_score(labels_x, labels_y, axes, weights=weights)


def pairwise_attributes_mutual_information(dataset):
    """Compute normalized mutual information for all pairwise attributes. Return a DataFrame."""
    sorted_columns = sorted(dataset.columns)
    mi_df = DataFrame(columns=sorted_columns,
                      index=sorted_columns, dtype=float)
    for row in mi_df.columns:
        for col in mi_df.columns:
            mi_df.loc[row, col] = normalized_mutual_info_score(dataset[row].astype(str),
                                                               dataset[col].astype(
                                                                   str),
                                                               average_method='arithmetic')
    return mi_df


def normalize_given_distribution(frequencies):
    distribution = np.array(frequencies, dtype=float)
    distribution = distribution.clip(0)  # replace negative values with 0
    summation = distribution.sum()
    if summation > 0:
        if np.isinf(summation):
            return normalize_given_distribution(np.isinf(distribution))
        else:
            return distribution / summation
    else:
        return np.full_like(distribution, 1 / distribution.size)


def read_json_file(json_file):
    with open(json_file, 'r') as file:
        return json.load(file)


def infer_numerical_attributes_in_dataframe(dataframe):
    describe = dataframe.describe()
    # DataFrame.describe() usually returns 8 rows.
    if describe.shape[0] == 8:
        return set(describe.columns)
    # DataFrame.describe() returns less than 8 rows when there is no numerical attribute.
    else:
        return set()


def display_bayesian_network(bn):
    length = 0
    for child, _ in bn:
        if len(child) > length:
            length = len(child)

    print('Constructed Bayesian network:')
    for child, parents in bn:
        print("    {0:{width}} has parents {1}.".format(
            child, parents, width=length))


def generate_random_string(length):
    return ''.join(np.random.choice(list(ascii_lowercase), size=length))
