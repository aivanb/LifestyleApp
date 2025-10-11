from django.db import models


class Food(models.Model):
    """Nutritional information for food items (master food database)"""
    food_id = models.AutoField(primary_key=True)
    food_name = models.CharField(max_length=200, unique=True)
    serving_size = models.DecimalField(max_digits=8, decimal_places=2)
    unit = models.CharField(max_length=20)
    calories = models.DecimalField(max_digits=8, decimal_places=2)
    protein = models.DecimalField(max_digits=8, decimal_places=2)
    fat = models.DecimalField(max_digits=8, decimal_places=2)
    carbohydrates = models.DecimalField(max_digits=8, decimal_places=2)
    fiber = models.DecimalField(max_digits=8, decimal_places=2)
    sodium = models.DecimalField(max_digits=8, decimal_places=2)
    sugar = models.DecimalField(max_digits=8, decimal_places=2)
    saturated_fat = models.DecimalField(max_digits=8, decimal_places=2)
    trans_fat = models.DecimalField(max_digits=8, decimal_places=2)
    calcium = models.DecimalField(max_digits=8, decimal_places=2)
    iron = models.DecimalField(max_digits=8, decimal_places=2)
    magnesium = models.DecimalField(max_digits=8, decimal_places=2)
    cholesterol = models.DecimalField(max_digits=8, decimal_places=2)
    vitamin_a = models.DecimalField(max_digits=8, decimal_places=2)
    vitamin_c = models.DecimalField(max_digits=8, decimal_places=2)
    vitamin_d = models.DecimalField(max_digits=8, decimal_places=2)
    caffeine = models.DecimalField(max_digits=8, decimal_places=2)
    food_group = models.CharField(max_length=20, choices=[
        ('fruit', 'Fruit'),
        ('vegetable', 'Vegetable'),
        ('grain', 'Grain'),
        ('protein', 'Protein'),
        ('dairy', 'Dairy'),
        ('other', 'Other'),
    ])
    brand = models.CharField(max_length=100, null=True, blank=True)
    cost = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    make_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'foods'

    def __str__(self):
        return self.food_name


class Meal(models.Model):
    """Groups food entries into meals"""
    meal_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='user_id')
    meal_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'meals'
        unique_together = ('user', 'meal_name')

    def __str__(self):
        return f"{self.user.username} - {self.meal_name}"


class MealFood(models.Model):
    """Connects meals with many foods"""
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE, db_column='meal_id')
    food = models.ForeignKey(Food, on_delete=models.CASCADE, db_column='food_id')
    servings = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        db_table = 'meals_foods'
        unique_together = ('meal', 'food')

    def __str__(self):
        return f"{self.meal.meal_name} - {self.food.food_name} ({self.servings} servings)"
