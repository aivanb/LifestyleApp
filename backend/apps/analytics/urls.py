"""
URL configuration for analytics app
"""

from django.urls import path
from . import views

urlpatterns = [
    # Workout Analytics
    path('workouts/body-measurement-progression/', views.body_measurement_progression, name='body_measurement_progression'),
    path('workouts/progression/', views.workout_progression, name='workout_progression'),
    path('workouts/rest-time-analysis/', views.workout_rest_time_analysis, name='workout_rest_time_analysis'),
    path('workouts/attributes-analysis/', views.workout_attributes_analysis, name='workout_attributes_analysis'),
    path('workouts/steps-cardio-distance/', views.steps_cardio_distance, name='steps_cardio_distance'),
    path('workouts/activation-progress/', views.activation_progress, name='activation_progress'),
    
    # Food Analytics
    path('foods/metadata-progress/', views.food_metadata_progress, name='food_metadata_progress'),
    path('foods/timing/', views.food_timing, name='food_timing'),
    path('foods/macro-split/', views.macro_split, name='macro_split'),
    path('foods/frequency/', views.food_frequency, name='food_frequency'),
    path('foods/cost/', views.food_cost, name='food_cost'),
    path('foods/radar-chart/', views.food_radar_chart, name='food_radar_chart'),
    path('foods/workout-tracking-heatmap/', views.workout_tracking_heatmap, name='workout_tracking_heatmap'),
    
    # Health Analytics
    path('health/weight-progression/', views.weight_progression, name='weight_progression'),
    path('health/metrics-radial/', views.health_metrics_radial, name='health_metrics_radial'),
]
