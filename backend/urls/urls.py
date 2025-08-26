# backend/urls/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('shorten', views.shorten_url, name='shorten_url'),
    path('stats', views.get_stats, name='get_stats'),
    path('health', views.health_check, name='health_check'),
    path('', views.api_info, name='api_info'),
]
