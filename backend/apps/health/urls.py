from django.urls import path
from . import views

urlpatterns = [
    # Sleep Log
    path('sleep/', views.SleepLogListCreateView.as_view(), name='sleep-log-list-create'),
    path('sleep/<int:pk>/', views.SleepLogRetrieveUpdateDestroyView.as_view(), name='sleep-log-retrieve-update-destroy'),
    path('sleep/streak/', views.get_sleep_streak, name='sleep-log-streak'),
    
    # Health Metrics Log
    path('health-metrics/', views.HealthMetricsLogListCreateView.as_view(), name='health-metrics-log-list-create'),
    path('health-metrics/<int:pk>/', views.HealthMetricsLogRetrieveUpdateDestroyView.as_view(), name='health-metrics-log-retrieve-update-destroy'),
    path('health-metrics/streak/', views.get_health_metrics_streak, name='health-metrics-log-streak'),
]