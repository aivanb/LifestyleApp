from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator


class AccessLevel(models.Model):
    """User application access levels"""
    access_level_id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=20, unique=True, choices=[
        ('admin', 'Admin'),
        ('user', 'User'),
        ('guest', 'Guest'),
    ])

    class Meta:
        db_table = 'access_levels'

    def __str__(self):
        return self.role_name


class Unit(models.Model):
    """A list of usable units"""
    unit_id = models.AutoField(primary_key=True)
    unit_name = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'units'

    def __str__(self):
        return self.unit_name


class ActivityLevel(models.Model):
    """Activity levels for users"""
    activity_level_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()

    class Meta:
        db_table = 'activity_levels'

    def __str__(self):
        return self.name


class User(AbstractUser):
    """Custom user model extending Django's AbstractUser"""
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    access_level = models.ForeignKey(AccessLevel, on_delete=models.CASCADE, db_column='access_level_id', null=True, blank=True)
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    birthday = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ], null=True, blank=True)
    unit_preference = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, blank=True, db_column='unit_preference')
    activity_level = models.ForeignKey(ActivityLevel, on_delete=models.SET_NULL, null=True, blank=True, db_column='activity_level_id')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.username


class UserGoal(models.Model):
    """Stores user defined tracking goals"""
    user_goal_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    tokens_goal = models.IntegerField(null=True, blank=True)
    cost_goal = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    weight_goal = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    lean_mass_goal = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    fat_mass_goal = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    calories_goal = models.IntegerField(null=True, blank=True)
    protein_goal = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    fat_goal = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    carbohydrates_goal = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    fiber_goal = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    sodium_goal = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    sugar_goal = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    saturated_fat_goal = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    trans_fat_goal = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    calcium_goal = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    iron_goal = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    magnesium_goal = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    cholesterol_goal = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    vitamin_a_goal = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    vitamin_c_goal = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    vitamin_d_goal = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    caffeine_goal = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_goal'

    def __str__(self):
        return f"{self.user.username}'s Goals"
