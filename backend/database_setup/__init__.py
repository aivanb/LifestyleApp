"""
Database Setup Package

This package provides utilities for initializing and managing the database:
- required_data: Functions to populate required reference tables
- dummy_data: Functions to generate realistic test data
- reset_database: Functions to reset and manage database state
"""

from .required_data import populate_required_data
from .dummy_data import populate_dummy_data, DUMMY_USER_CREDENTIALS
from .reset_database import reset_database, clear_dummy_data

__all__ = [
    'populate_required_data',
    'populate_dummy_data',
    'reset_database',
    'clear_dummy_data',
    'DUMMY_USER_CREDENTIALS',
]

