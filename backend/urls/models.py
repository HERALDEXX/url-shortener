# backend/urls/models.py
"""
Django models for URL Shortener
"""

from django.db import models
from django.utils import timezone
import string
import random

class URLModel(models.Model):
    """
    Model to store shortened URLs
    """
    original_url = models.URLField(max_length=2048)
    short_code = models.CharField(max_length=10, unique=True, db_index=True)
    click_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'urls'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['short_code']),
            models.Index(fields=['created_at']),
            models.Index(fields=['click_count']),
        ]

    def __str__(self):
        return f"{self.short_code} -> {self.original_url}"

    def save(self, *args, **kwargs):
        """
        Generate short code if not provided
        """
        if not self.short_code:
            self.short_code = self.generate_short_code()
        super().save(*args, **kwargs)

    def generate_short_code(self, length=6):
        """
        Generate a random short code
        """
        characters = string.ascii_letters + string.digits
        while True:
            short_code = ''.join(random.choice(characters) for _ in range(length))
            if not URLModel.objects.filter(short_code=short_code).exists():
                return short_code

    def increment_click_count(self):
        """
        Increment click count atomically
        """
        self.click_count = models.F('click_count') + 1
        self.save(update_fields=['click_count'])
        self.refresh_from_db()