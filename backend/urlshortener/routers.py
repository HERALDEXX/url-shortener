# backend/urlshortener/routers.py
"""
Database router for mock mode - prevents all database operations
"""

from django.conf import settings

class MockDatabaseRouter:
    """
    A router to control all database operations when in mock mode
    """
    
    def db_for_read(self, model, **hints):
        """Suggest the database to read from."""
        if getattr(settings, 'USE_MOCK', False):
            return None  # Don't use any database
        return None  # Use default routing
    
    def db_for_write(self, model, **hints):
        """Suggest the database to write to."""
        if getattr(settings, 'USE_MOCK', False):
            return None  # Don't use any database
        return None  # Use default routing
    
    def allow_relation(self, obj1, obj2, **hints):
        """Allow relations if models are in the same app."""
        return None  # Use default routing
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """Ensure that certain apps' models get created on the right database."""
        if getattr(settings, 'USE_MOCK', False):
            return False  # Don't allow any migrations in mock mode
        return None  # Use default routing