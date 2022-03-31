import numpy as np
from scipy import sparse as sp
from scipy import stats
from sklearn.metrics import ndcg_score
import itertools
import json
import copy

def contingency_matrix(
    labels_true, labels_pred, *, eps=None, sparse=False, dtype=np.int64
):
    """Build a contingency matrix describing the relationship between labels.

    Parameters
    ----------
    labels_true : int array, shape = [n_samples]
        Ground truth class labels to be used as a reference.

    labels_pred : array-like of shape (n_samples,)
        Cluster labels to evaluate.

    eps : float, default=None
        If a float, that value is added to all values in the contingency
        matrix. This helps to stop NaN propagation.
        If ``None``, nothing is adjusted.

    sparse : bool, default=False
        If `True`, return a sparse CSR continency matrix. If `eps` is not
        `None` and `sparse` is `True` will raise ValueError.

        .. versionadded:: 0.18

    dtype : numeric type, default=np.int64
        Output dtype. Ignored if `eps` is not `None`.

        .. versionadded:: 0.24

    Returns
    -------
    contingency : {array-like, sparse}, shape=[n_classes_true, n_classes_pred]
        Matrix :math:`C` such that :math:`C_{i, j}` is the number of samples in
        true class :math:`i` and in predicted class :math:`j`. If
        ``eps is None``, the dtype of this array will be integer unless set
        otherwise with the ``dtype`` argument. If ``eps`` is given, the dtype
        will be float.
        Will be a ``sklearn.sparse.csr_matrix`` if ``sparse=True``.
    """

    if eps is not None and sparse:
        raise ValueError("Cannot set 'eps' when sparse=True")

    classes, class_idx = np.unique(labels_true, return_inverse=True)
    clusters, cluster_idx = np.unique(labels_pred, return_inverse=True)
    n_classes = classes.shape[0]
    n_clusters = clusters.shape[0]
    # Using coo_matrix to accelerate simple histogram calculation,
    # i.e. bins are consecutive integers
    # Currently, coo_matrix is faster than histogram2d for simple cases
    contingency = sp.coo_matrix(
        (np.ones(class_idx.shape[0]), (class_idx, cluster_idx)),
        shape=(n_classes, n_clusters),
        dtype=dtype,
    )
    if sparse:
        contingency = contingency.tocsr()
        contingency.sum_duplicates()
    else:
        contingency = contingency.toarray()
        if eps is not None:
            # don't use += as contingency is integer
            contingency = contingency + eps
    return contingency, classes, class_idx, clusters, cluster_idx


def ndcg(rel_true, rel_pred, p=None, form="linear"):
    """Returns normalized Discounted Cumulative Gain
    Args:
        rel_true (1-D Array): relevance lists for particular user, (n_songs,)
        rel_pred (1-D Array): predicted relevance lists, (n_pred,)
        p (int): particular rank position
        form (string): two types of nDCG formula, 'linear' or 'exponential'
    Returns:
        ndcg (float): normalized discounted cumulative gain score [0, 1]
    """
    rel_true = np.sort(rel_true)[::-1]
    p = min(len(rel_true), min(len(rel_pred), p))
    discount = 1 / (np.log2(np.arange(p) + 2))

    if form == "linear":
        idcg = np.sum(rel_true[:p] * discount)
        dcg = np.sum(rel_pred[:p] * discount)
    elif form == "exponential" or form == "exp":
        idcg = np.sum([2 ** x - 1 for x in rel_true[:p]] * discount)
        dcg = np.sum([2 ** x - 1 for x in rel_pred[:p]] * discount)
    else:
        raise ValueError("Only supported for two formula, 'linear' or 'exp'")

    return dcg / idcg


def mAP(target_map, target_index, current_index):
    # target_map = {_f: _i for _i, (_f, _) in enumerate(target_rank)}
    # target_index = [_f for _f, _ in target_rank]
    # target_index = target_rank
    # target_map = {_f: _i for _i, _f in enumerate(target_rank)}

    current_map = {_f: _i for _i, _f in enumerate(current_index)}
    # current_index = [_f for _f, _ in current_ranks]
    # current_map = {_f: _i for _i, _f in enumerate(current_ranks)}
    # current_index = current_ranks
    result = 0
    count = 0
    for f_id in current_index:
        tp = 0
        all_ture = 0
        for _f_id in target_index:
            if target_map[f_id] >= target_map[_f_id]:
                all_ture += 1
                if current_map[f_id] >= current_map[_f_id]:
                    tp += 1
        count += 1
        result += tp / all_ture
    result /= count
    return result


def get_matrix_data(threshold_value, DATA_PATH, constraints, weights, ORI_DATA, DataDescriber):
    describer = DataDescriber(histogram_bins=15, category_threshold=threshold_value)
    describer.get_mutual_info_init(dataset_file=DATA_PATH,
                                   epsilon=None)

    # 构建一个weights数组

    ssum = sum(np.array([w["weight"] for w in weights]))
    # 建立一张axis到id的索引表
    cur_scheme_weights = []
    axis2id = {}
    weight_df = copy.deepcopy(ORI_DATA)
    for idx, val in enumerate(weight_df.columns):
        axis2id[val] = idx
    for w in weights:
        cur_scheme_weight = {}
        weight_df = copy.deepcopy(ORI_DATA)
        weight_df[weight_df.columns] = 1
        arr = weight_df.values
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
        dtdt = json.loads(weight_df.to_json(orient="records"))
        for idx, dt in enumerate(dtdt):
            if idx not in cur_ids:
                continue
            cur_scheme_weight[idx] = dt
        cur_scheme_weights.append(cur_scheme_weight)


    mutual_dict = {}
    for idx, constraint in enumerate(constraints):
        cur_scheme_weight = cur_scheme_weights[idx]
        res_list = describer.get_mutual_info_list(cur_scheme_weight)  # describer根据全部的数据加权计算
        mutual_dict[constraint['id']] = res_list

    # num_of_constraints = len(constraints)
    k = 2
    matrix_data = []
    # matrix_data = np.zeros((num_of_constraints, num_of_constraints))
    axes = ORI_DATA.columns.tolist()
    cons2id = {}
    for idx, constraint in enumerate(constraints):
        cons2id[constraint['id']] = idx
    for per in itertools.product(constraints, constraints):
        if per[0]['id'] == per[1]['id']:
            continue
        ans = 0
        for axis in axes:
            per1 = [item for item in mutual_dict[per[0]['id']] if item[0] == axis]
            per2 = [item for item in mutual_dict[per[1]['id']] if item[0] == axis]
            per1.sort(key=lambda x: x[2])
            per2.sort(key=lambda x: x[2])
            per1 = [item[1] for item in per1]
            per2 = [item[1] for item in per2]
            intersection = len([val for val in per1[-2:] if val in per2[-2:]])
            ans += intersection
            ans -= (k - intersection)
        matrix_data.append({
            "source": per[0]['id'],
            "target": per[1]['id'],
            "value": ans / len(ORI_DATA.columns.tolist())
        })
        # matrix_data[cons2id[per[0]['id']]][cons2id[per[1]['id']]] = ans
    return matrix_data