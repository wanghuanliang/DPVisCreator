from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('getOriginalData', views.getOriginalData, name='gsd'),
    path('setWeights', views.setWeights, name='sw'),
    path('getMetrics', views.getMetrics, name='gm'),
    path('getModelData', views.getModelData, name='gmd'),
    path('getFilteredData', views.getFilteredData, name='gfd'),
    path('getNetwork', views.getNetwork, name='gnet'),
    path('getBaseData', views.getBaseData, name='gbd'),
    path('init', views.initialize, name='init'),
    path('destroy', views.destroyed, name='des')
]
