import json
import pandas as pd
import numpy as np
from django.http import HttpResponse
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

DATA_PATH = None

def index(request):
    print(333333)
    return HttpResponse("Hello")

def getOriginalData(request):
    data = request.FILES['file']
    DATA_PATH = default_storage.save('priv_bayes/data/1.csv', ContentFile(data.read()))
    df = pd.read_csv(DATA_PATH)
    df['index'] = range(len(df))
    original_data = json.loads(df.to_json(orient="records"))
    Dimensions = []
    Measures = []
    attribute_character = {}
    for col in df:
        if col == 'index':
            continue
        if len(df[col].value_counts()) > 10:  # 数值型
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

def setPattern(request):
    return HttpResponse(request.POST.get('title'))

def setWeights(request):
    return HttpResponse(request.POST.get('title'))

def getMetrics(request):
    return HttpResponse(request.POST.get('title'))