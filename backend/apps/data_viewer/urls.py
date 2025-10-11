from django.urls import path
from . import views

urlpatterns = [
    # Get list of available tables
    path('tables/', views.get_available_tables, name='get_available_tables'),
    
    # Get schema for specific table
    path('tables/<str:table_name>/schema/', views.get_table_schema, name='get_table_schema'),
    
    # Get data from specific table
    path('tables/<str:table_name>/data/', views.get_table_data, name='get_table_data'),
    
    # Get row count for specific table
    path('tables/<str:table_name>/count/', views.get_table_row_count, name='get_table_row_count'),
]

