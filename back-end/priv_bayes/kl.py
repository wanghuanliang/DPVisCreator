from scipy.spatial.distance import cdist
from scipy.optimize import linear_sum_assignment
import numpy as np


def get_w_distance(d1_val, d2_val):
    d = cdist(d1_val, d2_val)
    assignment = linear_sum_assignment(d)

    return d[assignment].sum() / (np.shape(d1_val)[0] * np.shape(d2_val)[0]) ** 0.5

