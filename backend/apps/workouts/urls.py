"""
Workout URLs - Complete rewrite from scratch
"""

from django.urls import path
from . import views

urlpatterns = [
    # Workout CRUD
    path('', views.workout_list_create, name='workout_list_create'),
    path('<int:workout_id>/', views.workout_detail, name='workout_detail'),
    
    # Muscle management
    path('muscles/', views.muscle_list, name='muscle_list'),
    path('muscle-priorities/', views.muscle_priorities, name='muscle_priorities'),
    
    # Workout logging
    path('logs/', views.workout_logs, name='workout_logs'),
    
    # Split management
    path('splits/', views.splits, name='splits'),
    path('splits/<int:split_id>/', views.split_detail, name='split_detail'),
    path('splits/<int:split_id>/activate/', views.split_activate, name='split_activate'),
    path('current-split-day/', views.current_split_day, name='current_split_day'),
    
    # Statistics and utilities
    path('stats/', views.workout_stats, name='workout_stats'),
    path('recently-logged/', views.recently_logged_workouts, name='recently_logged_workouts'),
    path('icons/', views.workout_icons, name='workout_icons'),
]
