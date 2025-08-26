# backend/urls/views.py
"""
API views for URL Shortener
"""

from django.shortcuts import get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from urllib.parse import urlparse
import json
import validators

from .models import URLModel
from .serializers import URLSerializer

@api_view(['POST'])
def shorten_url(request):
    """
    Create a shortened URL
    POST /shorten
    """
    try:
        data = json.loads(request.body)
        original_url = data.get('url', '').strip()
        
        # Validate URL
        if not original_url:
            return Response(
                {'error': 'URL is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not validators.url(original_url):
            return Response(
                {'error': 'Invalid URL format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if URL already exists
        existing_url = URLModel.objects.filter(original_url=original_url).first()
        if existing_url:
            return Response({
                'shortCode': existing_url.short_code,
                'originalUrl': existing_url.original_url,
                'message': 'URL already exists'
            })
        
        # Create new shortened URL
        url_obj = URLModel.objects.create(original_url=original_url)
        
        return Response({
            'shortCode': url_obj.short_code,
            'originalUrl': url_obj.original_url
        }, status=status.HTTP_201_CREATED)
        
    except json.JSONDecodeError:
        return Response(
            {'error': 'Invalid JSON data'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Server error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_stats(request):
    """
    Get statistics for all URLs
    GET /stats
    """
    try:
        urls = URLModel.objects.all().order_by('-created_at')
        serializer = URLSerializer(urls, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        return Response(
            {'error': f'Server error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@method_decorator(csrf_exempt, name='dispatch')
class RedirectView(View):
    """
    Handle short URL redirects
    GET /{short_code}
    """
    def get(self, request, short_code):
        try:
            # Find URL by short code
            url_obj = get_object_or_404(URLModel, short_code=short_code)
            
            # Increment click count
            url_obj.increment_click_count()
            
            # Redirect to original URL
            return redirect(url_obj.original_url, permanent=False)
            
        except URLModel.DoesNotExist:
            return JsonResponse(
                {'error': 'Short URL not found'}, 
                status=404
            )
        except Exception as e:
            return JsonResponse(
                {'error': f'Server error: {str(e)}'}, 
                status=500
            )

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