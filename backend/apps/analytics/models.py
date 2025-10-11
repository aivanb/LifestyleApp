from django.db import models


class ApiUsageLog(models.Model):
    """Tracks API usage for cost monitoring"""
    api_log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id', null=True, blank=True)
    request_type = models.CharField(max_length=100)
    model_used = models.CharField(max_length=50)
    tokens_used = models.IntegerField()
    cost = models.DecimalField(max_digits=10, decimal_places=4)
    response_time = models.DecimalField(max_digits=8, decimal_places=3)  # seconds
    request = models.TextField()
    response = models.TextField()
    success = models.BooleanField()
    error_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'api_usage_log'

    def __str__(self):
        return f"API Log - {self.request_type} ({self.created_at})"


class ErrorLog(models.Model):
    """System error tracking for debugging"""
    error_log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id', null=True, blank=True)
    error_type = models.CharField(max_length=100)
    error_message = models.TextField()
    user_input = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'error_log'

    def __str__(self):
        return f"Error Log - {self.error_type} ({self.created_at})"
