"""Database Setup App Configuration"""

from django.apps import AppConfig


class DatabaseSetupConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.database_setup'
    verbose_name = 'Database Setup'

