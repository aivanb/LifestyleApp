from django.apps import AppConfig


class AuthenticationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.authentication'


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'


class FoodsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.foods'


class MealsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.meals'


class LoggingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.logging'


class WorkoutsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.workouts'


class HealthConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.health'


class AnalyticsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.analytics'


class OpenaiServiceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.openai_service'
