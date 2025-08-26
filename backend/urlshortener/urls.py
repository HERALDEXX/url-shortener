# backend/urlshortener/urls.py
from django.contrib import admin
from django.urls import path, include
from urls.views import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('urls.urls')),
    path('<str:short_code>/', RedirectView.as_view(), name='redirect_url'),
]
