import os
import django
from django.conf import settings

# Set up Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core.management import execute_from_command_line

if __name__ == '__main__':
    execute_from_command_line()
