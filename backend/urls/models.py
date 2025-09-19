# backend/urls/models.py
"""
Django models for Link Crush
"""

from django.conf import settings
from django.db import models
from django.db.models import F
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
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='urls',
    )

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
        Atomically increment click_count using a queryset update to avoid race conditions,
        then refresh the instance from the database so `self.click_count` is up-to-date.
        """
        # Perform atomic increment at DB level
        type(self).objects.filter(pk=self.pk).update(click_count=F('click_count') + 1)

        # Refresh only the click_count field for this instance
        try:
            self.refresh_from_db(fields=['click_count'])
        except Exception:
            # Fallback to full refresh if fields param not supported (depends on Django version)
            self.refresh_from_db()
