"""
URL configuration for tracking_app backend.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/foods/', include('apps.foods.urls')),
    path('api/meals/', include('apps.meals.urls')),
    path('api/logging/', include('apps.logging.urls')),
    path('api/workouts/', include('apps.workouts.urls')),
    path('api/health/', include('apps.health.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/openai/', include('apps.openai_service.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
