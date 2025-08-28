# backend/urls/serializers.py
from rest_framework import serializers
from .models import URLModel

class URLSerializer(serializers.ModelSerializer):
    class Meta:
        model = URLModel
        fields = ['short_code', 'original_url', 'click_count', 'created_at']
        
    def to_representation(self, instance):
        return {
            'shortCode': instance.short_code,
            'originalUrl': instance.original_url,
            'clickCount': instance.click_count
        }
