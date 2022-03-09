from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('test', views.getData, name='gsd'),
    path('test', views.getPostData, name='gpd'),
]