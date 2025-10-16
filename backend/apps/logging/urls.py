from django.urls import path
from . import views

urlpatterns = [
    # Weight Log
    path('weight/', views.WeightLogListCreateView.as_view(), name='weight-log-list-create'),
    path('weight/<int:pk>/', views.WeightLogRetrieveUpdateDestroyView.as_view(), name='weight-log-retrieve-update-destroy'),
    path('weight/streak/', views.get_weight_streak, name='weight-log-streak'),
    
    # Body Measurement Log
    path('body-measurement/', views.BodyMeasurementLogListCreateView.as_view(), name='body-measurement-log-list-create'),
    path('body-measurement/<int:pk>/', views.BodyMeasurementLogRetrieveUpdateDestroyView.as_view(), name='body-measurement-log-retrieve-update-destroy'),
    path('body-measurement/streak/', views.get_body_measurement_streak, name='body-measurement-log-streak'),
    
    # Water Log
    path('water/', views.WaterLogListCreateView.as_view(), name='water-log-list-create'),
    path('water/<int:pk>/', views.WaterLogRetrieveUpdateDestroyView.as_view(), name='water-log-retrieve-update-destroy'),
    path('water/streak/', views.get_water_streak, name='water-log-streak'),
    
    # Steps Log
    path('steps/', views.StepsLogListCreateView.as_view(), name='steps-log-list-create'),
    path('steps/<int:pk>/', views.StepsLogRetrieveUpdateDestroyView.as_view(), name='steps-log-retrieve-update-destroy'),
    path('steps/streak/', views.get_steps_streak, name='steps-log-streak'),
    
    # Cardio Log
    path('cardio/', views.CardioLogListCreateView.as_view(), name='cardio-log-list-create'),
    path('cardio/<int:pk>/', views.CardioLogRetrieveUpdateDestroyView.as_view(), name='cardio-log-retrieve-update-destroy'),
    path('cardio/streak/', views.get_cardio_streak, name='cardio-log-streak'),
    
    # Sleep Log
    path('sleep/', views.SleepLogListCreateView.as_view(), name='sleep-log-list-create'),
    path('sleep/<int:pk>/', views.SleepLogRetrieveUpdateDestroyView.as_view(), name='sleep-log-retrieve-update-destroy'),
    path('sleep/streak/', views.get_sleep_streak, name='sleep-log-streak'),
    
    # Health Metrics Log
    path('health-metrics/', views.HealthMetricsLogListCreateView.as_view(), name='health-metrics-log-list-create'),
    path('health-metrics/<int:pk>/', views.HealthMetricsLogRetrieveUpdateDestroyView.as_view(), name='health-metrics-log-retrieve-update-destroy'),
    path('health-metrics/streak/', views.get_health_metrics_streak, name='health-metrics-log-streak'),
    
    # All Trackers
    path('streaks/', views.get_all_tracker_streaks, name='all-tracker-streaks'),
]