from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class SleepLog(models.Model):
    """Sleep tracking and analysis data"""
    sleep_log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    date_time = models.DateField()
    time_went_to_bed = models.TimeField()
    time_got_out_of_bed = models.TimeField()
    time_fell_asleep = models.TimeField(null=True, blank=True)
    time_in_light_sleep = models.IntegerField(null=True, blank=True)  # minutes
    time_in_deep_sleep = models.IntegerField(null=True, blank=True)  # minutes
    time_in_rem_sleep = models.IntegerField(null=True, blank=True)  # minutes
    number_of_times_woke_up = models.IntegerField(null=True, blank=True)
    resting_heart_rate = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sleep_log'

    def __str__(self):
        return f"{self.user.username} - Sleep ({self.date_time})"


class HealthMetricsLog(models.Model):
    """Daily health metrics and wellness tracking"""
    health_metrics_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    resting_heart_rate = models.IntegerField(null=True, blank=True)
    blood_pressure_systolic = models.IntegerField(null=True, blank=True)
    blood_pressure_diastolic = models.IntegerField(null=True, blank=True)
    morning_energy = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)], null=True, blank=True)
    stress_level = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)], null=True, blank=True)
    mood = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)], null=True, blank=True)
    soreness = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)], null=True, blank=True)
    illness_level = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)], null=True, blank=True)
    date_time = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'health_metrics_log'

    def __str__(self):
        return f"{self.user.username} - Health Metrics ({self.date_time})"
