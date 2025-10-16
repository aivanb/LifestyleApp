from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db.models import Q
from datetime import date, timedelta

from apps.health.models import SleepLog, HealthMetricsLog
from apps.health.serializers import SleepLogSerializer, HealthMetricsLogSerializer


# --- Sleep Log Views ---
class SleepLogListCreateView(generics.ListCreateAPIView):
    serializer_class = SleepLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = SleepLog.objects.filter(user=user).order_by('-date_time')
        
        # Filter by date if provided
        date_param = self.request.query_params.get('date')
        if date_param:
            try:
                log_date = date.fromisoformat(date_param)
                queryset = queryset.filter(date_time=log_date)
            except ValueError:
                pass
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SleepLogRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SleepLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SleepLog.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sleep_streak(request):
    """Calculate consecutive days of sleep logging"""
    user = request.user
    today = date.today()
    streak = 0
    
    # Check backwards from today
    for i in range(365):  # Max 1 year back
        check_date = today - timedelta(days=i)
        if SleepLog.objects.filter(user=user, date_time=check_date).exists():
            streak += 1
        else:
            break
    
    return Response({"streak": streak}, status=status.HTTP_200_OK)


# --- Health Metrics Log Views ---
class HealthMetricsLogListCreateView(generics.ListCreateAPIView):
    serializer_class = HealthMetricsLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = HealthMetricsLog.objects.filter(user=user).order_by('-date_time')
        
        # Filter by date if provided
        date_param = self.request.query_params.get('date')
        if date_param:
            try:
                log_date = date.fromisoformat(date_param)
                queryset = queryset.filter(date_time=log_date)
            except ValueError:
                pass
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class HealthMetricsLogRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HealthMetricsLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return HealthMetricsLog.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_health_metrics_streak(request):
    """Calculate consecutive days of health metrics logging"""
    user = request.user
    today = date.today()
    streak = 0
    
    # Check backwards from today
    for i in range(365):  # Max 1 year back
        check_date = today - timedelta(days=i)
        if HealthMetricsLog.objects.filter(user=user, date_time=check_date).exists():
            streak += 1
        else:
            break
    
    return Response({"streak": streak}, status=status.HTTP_200_OK)