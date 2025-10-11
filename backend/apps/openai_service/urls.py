from django.urls import path
from . import views

urlpatterns = [
    path('prompt/', views.send_prompt, name='send_prompt'),
    path('usage/', views.usage_stats, name='usage_stats'),
]
