from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('getOriginalData', views.getOriginalData, name='gsd'),
    path('setPattern', views.setPattern, name='gpd'),
    path('setWeights', views.setWeights, name='gpd'),
    path('getMetrics', views.getMetrics, name='gpd'),
]
