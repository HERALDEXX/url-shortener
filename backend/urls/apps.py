from django.apps import AppConfig
from django.conf import settings

class UrlsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'urls'

    def ready(self):
        if not getattr(settings, 'USE_MOCK', False):
            import urls.signals