from django.urls import path
from . import views

urlpatterns = [
    path('prompt/', views.send_prompt, name='send_prompt'),
    path('usage/', views.usage_stats, name='usage_stats'),
    path('parse-food/', views.parse_food_input, name='parse_food_input'),
    path('generate-metadata/', views.generate_metadata, name='generate_metadata'),
    path('transcribe/', views.transcribe_audio, name='transcribe_audio'),
    path('transcription-status/', views.transcription_status, name='transcription_status'),
]
