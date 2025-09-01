# backend/urls/views.py
"""
API views for URL Shortener (improved)
- Uses DRF parsing (request.data)
- Normalizes and extracts redirect targets from tracking URLs
- Clear logging and error handling
- Keeps mock-file mode support
"""

import logging
import json
import os
import random
import string
import base64
from pathlib import Path
from urllib.parse import urlparse, parse_qs, unquote

from django.conf import settings
from django.shortcuts import get_object_or_404, redirect
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import csrf_protect
from django.utils.decorators import method_decorator
from django.views.decorators.http import require_http_methods

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

import validators

from .models import URLModel
from .serializers import URLSerializer

logger = logging.getLogger(__name__)

def config_view(request):
    return JsonResponse({
        "use_mock": settings.USE_MOCK,
    })

# BASE_DIR and MOCK_FILE_PATH (matches your project layout)
BASE_DIR = Path(__file__).resolve().parents[2]
MOCK_FILE_PATH = str(getattr(settings, "MOCK_DATA_FILE", settings.BASE_DIR / "frontend" / "mock_data.json"))

def generate_short_code(length=6):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))


# -------------------------
# URL normalization helpers
# -------------------------
def _try_base64_decode(s: str):
    """
    Try to base64-decode a string and return decoded text if possible.
    Return None on failure.
    """
    try:
        padded = s + '=' * (-len(s) % 4)
        decoded = base64.b64decode(padded)
        return decoded.decode('utf-8')
    except Exception:
        return None


def extract_redirect_target(candidate_url: str):
    """
    If candidate_url is a redirect/tracking URL containing parameters like
    'u', 'url', 'q', 'redirect', try to extract and return a real target URL.
    """
    try:
        parsed = urlparse(candidate_url)
        qs = parse_qs(parsed.query)
        for key in ('u', 'url', 'q', 'redirect', 'target'):
            if key in qs and qs[key]:
                v = qs[key][0]
                v = unquote(v)

                # try base64 decode if looks like that
                maybe = _try_base64_decode(v)
                if maybe:
                    if urlparse(maybe).scheme in ('http', 'https') and urlparse(maybe).netloc:
                        return maybe

                # if the raw param value is a valid URL, return it
                if urlparse(v).scheme in ('http', 'https') and urlparse(v).netloc:
                    return v
    except Exception:
        logger.exception("extract_redirect_target failed for: %s", candidate_url)
    return None


def normalize_url(raw_url: str):
    """
    Normalize and validate the incoming URL string.
    Returns a normalized URL string (with scheme) or None if invalid.
    Strategy:
    1. Ensure scheme exists (default to http://)
    2. Try validators.url
    3. Try to extract redirect target from common params
    4. Fallback: accept if urlparse shows scheme+netloc
    """
    if not raw_url:
        return None
    raw = raw_url.strip()

    # ensure scheme exists before parsing
    parsed0 = urlparse(raw)
    if not parsed0.scheme:
        raw = 'http://' + raw
        parsed0 = urlparse(raw)

    # try strict validator first
    try:
        if validators.url(raw):
            return raw
    except Exception:
        # if validators import fails, ignore and fall back
        logger.debug("validators.url raised; falling back to parse-only check")

    # try to extract target from common tracking params
    target = extract_redirect_target(raw)
    if target:
        tparsed = urlparse(target)
        if tparsed.scheme in ('http', 'https') and tparsed.netloc:
            return target

    # last-resort: accept basic parse with scheme/netloc
    if parsed0.scheme in ('http', 'https') and parsed0.netloc:
        return raw

    return None


# -------------------------
# API endpoints
# -------------------------

@api_view(['POST'])
def shorten_url(request):
    """
    Create a shortened URL (mock or real)
    POST /shorten
    """
    try:
        # log raw body for debugging
        try:
            raw_body = request.body.decode('utf-8')
        except Exception:
            raw_body = str(request.body)
        logger.info("shorten_url raw body: %s", raw_body)

        # use DRF parsing which supports json/form/multipart robustly
        data = request.data
        logger.info("shorten_url parsed data: %s", data)

        raw = (data.get('url') or '').strip()
        normalized = normalize_url(raw)
        logger.info("shorten_url normalized url: %s (from raw=%s)", normalized, raw)

        if not normalized:
            return Response({'error': 'Invalid URL format'}, status=status.HTTP_400_BAD_REQUEST)

        original_url = normalized

        if getattr(settings, "USE_MOCK", False):
            # Load existing mock data
            if os.path.exists(MOCK_FILE_PATH):
                try:
                    with open(MOCK_FILE_PATH, 'r', encoding='utf-8') as f:
                        urls = json.load(f)
                except json.JSONDecodeError:
                    logger.exception("Mock file exists but failed to parse JSON: %s", MOCK_FILE_PATH)
                    urls = []
            else:
                urls = []

            # Check if already exists
            existing = next((u for u in urls if u.get('originalUrl') == original_url), None)
            if existing:
                return Response({**existing, 'message': 'URL already exists'}, status=status.HTTP_200_OK)

            new_entry = {
                'shortCode': generate_short_code(),
                'originalUrl': original_url,
                'clickCount': 0
            }
            urls.append(new_entry)

            # Save back to mock file
            try:
                os.makedirs(os.path.dirname(MOCK_FILE_PATH), exist_ok=True)
                with open(MOCK_FILE_PATH, 'w', encoding='utf-8') as f:
                    json.dump(urls, f, indent=2)
                logger.info(f"✅ Successfully saved {len(urls)} URLs to mock file")
            except Exception:
                logger.exception("Failed to write to mock file: %s", MOCK_FILE_PATH)
            response_data = {
                **new_entry,
                'shortUrl': f"{request.build_absolute_uri('/')[:-1]}/{new_entry['shortCode']}"
            }
            logger.info(f"📤 Returning shorten response: {response_data}")
            return Response(response_data, status=status.HTTP_201_CREATED)

        # Real DB workflow
        existing_url = URLModel.objects.filter(original_url=original_url).first()
        if existing_url:
            return Response({
                'shortCode': existing_url.short_code,
                'originalUrl': existing_url.original_url,
                'message': 'URL already exists'
            }, status=status.HTTP_200_OK)

        if request.user and request.user.is_authenticated:
            url_obj = URLModel.objects.create(original_url=original_url, owner=request.user)
        else:
            url_obj = URLModel.objects.create(original_url=original_url)
        logger.info("Created URLModel id=%s short_code=%s", url_obj.pk, url_obj.short_code)
        return Response({
            'shortCode': url_obj.short_code,
            'originalUrl': url_obj.original_url
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.exception("Error in shorten_url")
        return Response({'error': f'Server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_stats(request):
    """
    Get statistics for all URLs
    GET /stats
    """
    try:
        if getattr(settings, "USE_MOCK", False):
            if os.path.exists(MOCK_FILE_PATH):
                with open(MOCK_FILE_PATH, 'r', encoding='utf-8') as f:
                    try:
                        urls = json.load(f)
                    except json.JSONDecodeError:
                        logger.exception("Failed to parse mock file for stats: %s", MOCK_FILE_PATH)
                        urls = []
            else:
                urls = []
            return Response(urls, status=status.HTTP_200_OK)
        else:
            urls = URLModel.objects.all().order_by('-created_at')
            serializer = URLSerializer(urls, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.exception("Error in get_stats")
        return Response({'error': f'Server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class RedirectView(View):
    def get(self, request, short_code):
        # Handle mock mode redirects
        if getattr(settings, "USE_MOCK", False):
            try:
                logger.info(f"🔗 Mock mode redirect for shortCode: {short_code}")
                
                # Load mock data
                if os.path.exists(MOCK_FILE_PATH):
                    with open(MOCK_FILE_PATH, 'r', encoding='utf-8') as f:
                        urls = json.load(f)
                    
                    # Find the URL
                    url_entry = next((u for u in urls if u.get('shortCode') == short_code), None)
                    if url_entry:
                        # Increment click count in mock data
                        url_entry['clickCount'] = url_entry.get('clickCount', 0) + 1
                        
                        # Save updated mock data
                        with open(MOCK_FILE_PATH, 'w', encoding='utf-8') as f:
                            json.dump(urls, f, indent=2)
                        
                        logger.info(f"✅ Mock redirect to: {url_entry['originalUrl']}")
                        return redirect(url_entry['originalUrl'], permanent=False)
                    else:
                        logger.warning(f"❌ Short code {short_code} not found in mock data")
                        return JsonResponse({'error': 'Short URL not found'}, status=404)
                else:
                    logger.warning(f"❌ Mock file not found: {MOCK_FILE_PATH}")
                    return JsonResponse({'error': 'Short URL not found'}, status=404)
                    
            except Exception as e:
                logger.exception(f"Error in mock mode redirect for {short_code}")
                return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)
        
        # Real DB mode
        try:
            url_obj = URLModel.objects.get(short_code=short_code)
            url_obj.increment_click_count()
            return redirect(url_obj.original_url, permanent=False)
        except URLModel.DoesNotExist:
            return JsonResponse({'error': 'Short URL not found'}, status=404)
        except Exception as e:
            logger.exception("Error in RedirectView")
            return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)

@api_view(['DELETE'])
def delete_url(request, short_code):
    """
    Delete a shortened URL.
    Requires JWT authentication (Authorization: Bearer <token>).
    Only the owner or staff can delete. If owner is null, only staff can delete.
    """
    # Bypass authentication in mock mode
    if getattr(settings, "USE_MOCK", False):
        try:
            # Load existing mock data
            if os.path.exists(MOCK_FILE_PATH):
                with open(MOCK_FILE_PATH, 'r', encoding='utf-8') as f:
                    urls = json.load(f)
            else:
                return Response({'error': 'URL not found'}, status=status.HTTP_404_NOT_FOUND)

            # Find and remove the URL
            urls = [u for u in urls if u.get('shortCode') != short_code]
            
            # Save back to mock file
            try:
                os.makedirs(os.path.dirname(MOCK_FILE_PATH), exist_ok=True)
                with open(MOCK_FILE_PATH, 'w', encoding='utf-8') as f:
                    json.dump(urls, f, indent=2)
            except Exception:
                logger.exception("Failed to write to mock file: %s", MOCK_FILE_PATH)

            return Response({"message": f"URL {short_code} deleted successfully."}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Error deleting URL %s in mock mode: %s", short_code, e)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # Real DB workflow (requires authentication)
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        url_obj = get_object_or_404(URLModel, short_code=short_code)

        owner = getattr(url_obj, 'owner', None)

        if owner:
            # require owner or staff
            if owner != request.user and not request.user.is_staff:
                return Response({'error': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)
        else:
            # no owner -> only staff can delete
            if not request.user.is_staff:
                return Response({'error': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)

        url_obj.delete()
        return Response({"message": f"URL {short_code} deleted successfully."}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.exception("Error deleting URL %s: %s", short_code, e)
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Health check endpoint
@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint
    """
    return Response({
        'status': 'healthy',
        'service': 'url-shortener',
        'version': '1.0.0'
    })


# Root API info endpoint
@api_view(['GET'])
def api_info(request):
    """
    API information endpoint
    """
    return Response({
        'message': 'URL Shortener API',
        'version': '1.0.0',
        'endpoints': {
            'shorten': 'POST /api/shorten',
            'stats': 'GET /api/stats',
            'redirect': 'GET /{short_code}',
            'health': 'GET /api/health'
        }
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    Return basic info for the authenticated user.
    Called by frontend to show login/admin state.
    """
    # Bypass authentication in mock mode
    if getattr(settings, "USE_MOCK", False):
        return Response({
            "id": 1,
            "username": "mock_user",
            "is_staff": True,
            "is_superuser": True,
        })

    # Real DB workflow (requires authentication)
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
    })