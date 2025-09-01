# backend/urls/urls.py
from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path('shorten', views.shorten_url, name='shorten_url'),
    path('stats', views.get_stats, name='get_stats'),
    path('health', views.health_check, name='health_check'),
    path('urls/<str:short_code>/', views.delete_url, name='delete_url'),

    # JWT Authentication endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me', views.current_user, name='current_user'),

    # Config endpoint
    path('config/', views.config_view, name='config'),

    path('', views.api_info, name='api_info'),
]
