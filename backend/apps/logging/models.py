from django.db import models


class FoodLog(models.Model):
    """Individual food consumption entries"""
    macro_log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    food = models.ForeignKey('foods.Food', on_delete=models.CASCADE, db_column='food_id')
    meal = models.ForeignKey('foods.Meal', on_delete=models.CASCADE, db_column='meal_id', null=True, blank=True)
    servings = models.DecimalField(max_digits=8, decimal_places=2)
    measurement = models.CharField(max_length=20)
    date_time = models.DateTimeField()
    voice_input = models.TextField(null=True, blank=True)
    ai_response = models.TextField(null=True, blank=True)
    tokens_used = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'food_log'

    def __str__(self):
        return f"{self.user.username} - {self.food.food_name} ({self.date_time})"


class WeightLog(models.Model):
    """User weight tracking"""
    weight_log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    weight = models.DecimalField(max_digits=5, decimal_places=2)
    weight_unit = models.CharField(max_length=10)
    date_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'weight_log'

    def __str__(self):
        return f"{self.user.username} - {self.weight} {self.weight_unit}"


class BodyMeasurementLog(models.Model):
    """User body measurement tracking"""
    measurement_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    upper_arm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    lower_arm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    waist = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    shoulder = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    leg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    calf = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    date_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'body_measurement_log'

    def __str__(self):
        return f"{self.user.username} - Body Measurements ({self.date_time})"


class WaterLog(models.Model):
    """Water intake tracking"""
    water_log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    unit = models.CharField(max_length=10)
    date_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'water_log'

    def __str__(self):
        return f"{self.user.username} - {self.amount} {self.unit} water"


class StepsLog(models.Model):
    """The log of steps a user does each day"""
    step_log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    steps = models.IntegerField()
    date_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'steps_log'

    def __str__(self):
        return f"{self.user.username} - {self.steps} steps ({self.date_time})"


class CardioLog(models.Model):
    """The log of cardio done by the user"""
    cardio_log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    cardio_type = models.CharField(max_length=100)
    duration = models.DecimalField(max_digits=8, decimal_places=2)  # in minutes
    distance = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    distance_unit = models.CharField(max_length=10, null=True, blank=True)
    calories_burned = models.IntegerField(null=True, blank=True)
    heart_rate = models.IntegerField(null=True, blank=True)
    date_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cardio_log'

    def __str__(self):
        return f"{self.user.username} - {self.cardio_type} ({self.date_time})"
