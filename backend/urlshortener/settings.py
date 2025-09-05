# backend/urlshortener/settings.py
"""
Django settings for URL Shortener project.
Modified to completely bypass database in mock mode.
"""

from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parents[2]

# Load environment variables from root directory
load_dotenv(BASE_DIR / '.env')

# Toggle for Mock Database
USE_MOCK = os.getenv('USE_MOCK', 'false').lower() == 'true'

# Mock Database File Path
MOCK_DATA_FILE = BASE_DIR / 'frontend' / 'mock-data.json'

# Database configuration display based on USE_MOCK
_mock_printed = False
if not _mock_printed:
    if USE_MOCK:
        print(f"🎭 MOCK MODE ENABLED")
        print(f"📁 Mock data file: {MOCK_DATA_FILE}")
        print(f"🚫 Database: BYPASSED (no migrations needed)")
        print(f"🔧 Admin interface: DISABLED")
        print(f"🔑 Authentication: DISABLED")
        print("")
    else:
        print(f"💾 DATABASE MODE")
        print(f"🗄️  Database: {os.getenv('DATABASE_NAME')} @ {os.getenv('DATABASE_HOST')}:{os.getenv('DATABASE_PORT')}")
        print("")
_mock_printed = True

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = [
    origin.strip() for origin in os.getenv("ALLOWED_HOSTS", "").split(",") if origin.strip()
]

# Application definition - completely different for mock vs real mode
if USE_MOCK:
    # Minimal apps for mock mode - NO database dependencies
    INSTALLED_APPS = [
        'django.contrib.contenttypes',  # Required for Django to work
        'django.contrib.staticfiles',   # For serving static files
        'rest_framework',               # For API functionality
        'corsheaders',                  # For CORS handling
        'urls.apps.UrlsConfig',        # Our app (will work without DB)
    ]
    
    # Minimal middleware for mock mode
    MIDDLEWARE = [
        'django.middleware.security.SecurityMiddleware',
        'whitenoise.middleware.WhiteNoiseMiddleware',
        'corsheaders.middleware.CorsMiddleware',
        'django.middleware.common.CommonMiddleware',
        # NO CSRF, Sessions, Auth, Messages - these need database
    ]
    
else:
    # Full apps for database mode
    INSTALLED_APPS = [
        'django.contrib.admin',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.messages',
        'django.contrib.staticfiles',
        'rest_framework',
        'corsheaders',
        'urls.apps.UrlsConfig',
    ]
    
    # Full middleware for database mode
    MIDDLEWARE = [
        'django.middleware.security.SecurityMiddleware',
        'whitenoise.middleware.WhiteNoiseMiddleware',
        'corsheaders.middleware.CorsMiddleware',
        'django.contrib.sessions.middleware.SessionMiddleware',
        'django.middleware.common.CommonMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
        'django.contrib.auth.middleware.AuthenticationMiddleware',
        'django.contrib.messages.middleware.MessageMiddleware',
        'django.middleware.clickjacking.XFrameOptionsMiddleware',
    ]

ROOT_URLCONF = 'urlshortener.urls'

# Templates - simplified for mock mode
if USE_MOCK:
    TEMPLATES = [
        {
            'BACKEND': 'django.template.backends.django.DjangoTemplates',
            'DIRS': [],
            'APP_DIRS': True,
            'OPTIONS': {
                'context_processors': [
                    'django.template.context_processors.debug',
                    'django.template.context_processors.request',
                    'django.template.context_processors.static',
                ],
            },
        },
    ]
else:
    TEMPLATES = [
        {
            'BACKEND': 'django.template.backends.django.DjangoTemplates',
            'DIRS': [],
            'APP_DIRS': True,
            'OPTIONS': {
                'context_processors': [
                    'django.template.context_processors.debug',
                    'django.template.context_processors.request',
                    'django.contrib.auth.context_processors.auth',
                    'django.contrib.messages.context_processors.messages',
                    'django.template.context_processors.static',
                ],
            },
        },
    ]

WSGI_APPLICATION = 'urlshortener.wsgi.application'

# Database configuration - DUMMY database for mock mode
if USE_MOCK:
    # Use a dummy database backend that doesn't actually connect
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.dummy',
        }
    }
    
    # Disable database operations completely
    DATABASE_ROUTERS = ['urlshortener.routers.MockDatabaseRouter']
    
else:
    # Real MySQL configuration
    import pymysql
    pymysql.install_as_MySQLdb()

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.getenv('DATABASE_NAME', 'url_shortener'),
            'USER': os.getenv('DATABASE_USER', 'root'),
            'PASSWORD': os.getenv('DATABASE_PASSWORD', ''),
            'HOST': os.getenv('DATABASE_HOST', 'localhost'),
            'PORT': os.getenv('DATABASE_PORT', '3306'),
            'OPTIONS': {
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
                'charset': 'utf8mb4',
            },
        }
    }

# Password validation (only for database mode)
if not USE_MOCK:
    AUTH_PASSWORD_VALIDATORS = [
        {
            'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
        },
    ]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = os.getenv("STATIC_URL", "/static/")
STATICFILES_DIRS = [
    BASE_DIR / p for p in (
        p.strip() for p in os.getenv("STATICFILES_DIRS", "backend/static").split(",")
    ) if p
]

STATIC_ROOT = Path(os.getenv("STATIC_ROOT", "backend/staticfiles"))
if not STATIC_ROOT.is_absolute():
    STATIC_ROOT = BASE_DIR / STATIC_ROOT

STATIC_ROOT = STATIC_ROOT.resolve()
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100
}

# Authentication only for database mode
if not USE_MOCK:
    REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES'] = (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    )
    
    SIMPLE_JWT = {
        'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
        'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
        'AUTH_HEADER_TYPES': ('Bearer',),
    }

# CORS settings
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",") if origin.strip()
]

CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOW_CREDENTIALS = os.getenv("CORS_ALLOW_CREDENTIALS", "True").lower() == 'true'

CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Custom settings
SHORT_CODE_LENGTH = int(os.getenv('SHORT_CODE_LENGTH', 6))
BASE_URL = os.getenv('BASE_URL', 'http://localhost:8000')

# Create static directories
for static_dir in STATICFILES_DIRS:
    if not static_dir.exists():
        static_dir.mkdir(parents=True, exist_ok=True)