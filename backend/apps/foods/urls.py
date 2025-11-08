from django.urls import path
from . import views

urlpatterns = [
    # Food endpoints
    path('', views.food_list_create, name='food_list_create'),
    path('<int:food_id>/', views.food_detail, name='food_detail'),
    path('<int:food_id>/analytics/', views.food_analytics, name='food_analytics'),
    
    # Meal endpoints
    path('meals/', views.meal_list_create, name='meal_list_create'),
    path('meals/<int:meal_id>/', views.meal_detail, name='meal_detail'),
    
    # Food log endpoints
    path('logs/', views.food_log_list_create, name='food_log_list_create'),
    path('logs/<int:log_id>/', views.food_log_update_delete, name='food_log_update_delete'),
    path('logs/recent-foods/', views.recently_logged_foods, name='recently_logged_foods'),
]
