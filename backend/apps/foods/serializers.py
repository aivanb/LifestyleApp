from rest_framework import serializers
from .models import Food, Meal, MealFood
from apps.logging.models import FoodLog
from decimal import Decimal


class FoodSerializer(serializers.ModelSerializer):
    """Serializer for Food model with macro preview"""
    
    class Meta:
        model = Food
        fields = '__all__'
        read_only_fields = ('food_id', 'created_at', 'updated_at')
    
    def to_representation(self, instance):
        """Add computed macro preview"""
        data = super().to_representation(instance)
        
        # Add basic macro preview
        data['macro_preview'] = {
            'calories': float(instance.calories) if instance.calories else 0,
            'protein': float(instance.protein) if instance.protein else 0,
            'carbohydrates': float(instance.carbohydrates) if instance.carbohydrates else 0,
            'fat': float(instance.fat) if instance.fat else 0,
        }
        
        return data


class FoodCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new food entries"""
    create_and_log = serializers.BooleanField(write_only=True, required=False, default=False)
    servings = serializers.DecimalField(max_digits=8, decimal_places=2, write_only=True, required=False, default=1)
    
    class Meta:
        model = Food
        fields = '__all__'
        read_only_fields = ('food_id', 'created_at', 'updated_at')
    
    def create(self, validated_data):
        """Create food and optionally log it immediately"""
        create_and_log = validated_data.pop('create_and_log', False)
        servings = validated_data.pop('servings', Decimal('1'))
        
        # Create the food
        food = Food.objects.create(**validated_data)
        
        # Optionally create food log entry
        if create_and_log:
            user = self.context.get('user')
            if user:
                from datetime import datetime
                FoodLog.objects.create(
                    user=user,
                    food=food,
                    servings=servings,
                    measurement=food.unit,
                    date_time=datetime.now()
                )
        
        return food


class MealFoodSerializer(serializers.ModelSerializer):
    """Serializer for foods within a meal"""
    food_name = serializers.CharField(source='food.food_name', read_only=True)
    food_details = FoodSerializer(source='food', read_only=True)
    
    class Meta:
        model = MealFood
        fields = ('food', 'food_name', 'food_details', 'servings')


class MealSerializer(serializers.ModelSerializer):
    """Serializer for Meal model with foods and macro preview"""
    foods = MealFoodSerializer(source='mealfood_set', many=True, read_only=True)
    
    class Meta:
        model = Meal
        fields = ('meal_id', 'meal_name', 'foods', 'created_at', 'updated_at')
        read_only_fields = ('meal_id', 'created_at', 'updated_at')
    
    def to_representation(self, instance):
        """Add computed total macros for the meal"""
        data = super().to_representation(instance)
        
        # Calculate total macros from all foods in meal
        total_calories = Decimal('0')
        total_protein = Decimal('0')
        total_carbs = Decimal('0')
        total_fat = Decimal('0')
        
        for meal_food in instance.mealfood_set.all():
            servings = meal_food.servings
            food = meal_food.food
            
            total_calories += (food.calories or 0) * servings
            total_protein += (food.protein or 0) * servings
            total_carbs += (food.carbohydrates or 0) * servings
            total_fat += (food.fat or 0) * servings
        
        data['macro_preview'] = {
            'calories': float(total_calories),
            'protein': float(total_protein),
            'carbohydrates': float(total_carbs),
            'fat': float(total_fat),
        }
        
        return data


class MealCreateSerializer(serializers.Serializer):
    """Serializer for creating new meal entries"""
    meal_name = serializers.CharField(max_length=100)
    foods = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField()),
        write_only=True
    )
    create_and_log = serializers.BooleanField(write_only=True, required=False, default=False)
    
    def validate_foods(self, value):
        """Validate foods list structure"""
        if not value:
            raise serializers.ValidationError("At least one food is required")
        
        for food_item in value:
            if 'food_id' not in food_item or 'servings' not in food_item:
                raise serializers.ValidationError("Each food must have 'food_id' and 'servings'")
        
        return value
    
    def create(self, validated_data):
        """Create meal with foods and optionally log it"""
        user = self.context.get('user')
        meal_name = validated_data['meal_name']
        foods_data = validated_data['foods']
        create_and_log = validated_data.get('create_and_log', False)
        
        # Create meal
        meal = Meal.objects.create(
            user=user,
            meal_name=meal_name
        )
        
        # Add foods to meal
        for food_item in foods_data:
            food_id = food_item['food_id']
            servings = Decimal(str(food_item['servings']))
            
            try:
                food = Food.objects.get(food_id=food_id)
                MealFood.objects.create(
                    meal=meal,
                    food=food,
                    servings=servings
                )
                
                # Optionally create food log entries
                if create_and_log:
                    from datetime import datetime
                    FoodLog.objects.create(
                        user=user,
                        food=food,
                        meal=meal,
                        servings=servings,
                        measurement=food.unit,
                        date_time=datetime.now()
                    )
            except Food.DoesNotExist:
                raise serializers.ValidationError(f"Food with id {food_id} does not exist")
        
        return meal


class FoodLogSerializer(serializers.ModelSerializer):
    """Serializer for food log entries"""
    food_name = serializers.CharField(source='food.food_name', read_only=True)
    meal_name = serializers.CharField(source='meal.meal_name', read_only=True, allow_null=True)
    food_details = FoodSerializer(source='food', read_only=True)
    
    class Meta:
        model = FoodLog
        fields = (
            'macro_log_id', 'user', 'food', 'food_name', 'food_details',
            'meal', 'meal_name', 'servings', 'measurement', 'date_time',
            'voice_input', 'ai_response', 'tokens_used'
        )
        read_only_fields = ('macro_log_id', 'user')
    
    def to_representation(self, instance):
        """Add computed macros for this log entry"""
        data = super().to_representation(instance)
        
        # Calculate macros based on servings
        food = instance.food
        servings = instance.servings
        
        data['consumed_macros'] = {
            'calories': float((food.calories or 0) * servings),
            'protein': float((food.protein or 0) * servings),
            'carbohydrates': float((food.carbohydrates or 0) * servings),
            'fat': float((food.fat or 0) * servings),
        }
        
        return data


class FoodLogCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating food log entries"""
    
    class Meta:
        model = FoodLog
        fields = ('food', 'meal', 'servings', 'measurement', 'date_time')
    
    def create(self, validated_data):
        """Create food log entry with user from context"""
        user = self.context.get('user')
        validated_data['user'] = user
        return super().create(validated_data)

