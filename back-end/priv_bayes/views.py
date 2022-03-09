from django.shortcuts import render
from django.http import HttpResponse

def index(request):
    return HttpResponse("Hello")

def getData(request):
    return HttpResponse(request.GET.get('title'))

def getPostData(request):
    return HttpResponse(request.POST.get('title'))