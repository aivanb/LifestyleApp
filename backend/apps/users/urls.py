from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.profile_detail, name='profile_detail'),
    path('goals/', views.goals_detail, name='goals_detail'),
    path('calculate-macros/', views.calculate_macro_goals, name='calculate_macro_goals'),
    path('body-metrics/', views.body_metrics, name='body_metrics'),
    path('historical-data/', views.historical_data, name='historical_data'),
]
