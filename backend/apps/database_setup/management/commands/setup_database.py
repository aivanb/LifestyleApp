"""
Django Management Command: setup_database

Provides convenient command-line interface for database initialization and management.

Usage:
    python manage.py setup_database --required      # Populate required reference data
    python manage.py setup_database --dummy         # Populate dummy test data
    python manage.py setup_database --full          # Both required and dummy data
    python manage.py setup_database --clear         # Clear dummy data only
    python manage.py setup_database --reset         # Reset to initial state
    python manage.py setup_database --reset-full    # Full reset and repopulate
"""

from django.core.management.base import BaseCommand
import sys
import os

# Add database_setup to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), 'database_setup'))

from database_setup.required_data import populate_required_data
from database_setup.dummy_data import populate_dummy_data, DUMMY_USER_CREDENTIALS
from database_setup.reset_database import clear_dummy_data, reset_database, full_reset_and_populate


class Command(BaseCommand):
    help = 'Setup and manage database initialization'

    def add_arguments(self, parser):
        parser.add_argument(
            '--required',
            action='store_true',
            help='Populate required reference data (access_levels, activity_levels, muscles, units)',
        )
        parser.add_argument(
            '--dummy',
            action='store_true',
            help='Populate dummy test data (2 users with 6 months of data)',
        )
        parser.add_argument(
            '--full',
            action='store_true',
            help='Populate both required and dummy data',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all dummy data (preserves required reference data)',
        )
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset database to initial state (removes all user data)',
        )
        parser.add_argument(
            '--reset-full',
            action='store_true',
            help='Full reset and repopulate with required and dummy data',
        )

    def handle(self, *args, **options):
        """Execute the appropriate database setup operation."""
        
        # Check that at least one option is specified
        if not any([options['required'], options['dummy'], options['full'], 
                   options['clear'], options['reset'], options['reset_full']]):
            self.stdout.write(self.style.WARNING(
                'Please specify an option. Use --help for available options.'
            ))
            return
        
        # Handle clear operation
        if options['clear']:
            self.stdout.write(self.style.WARNING(
                '\nThis will clear all dummy/user data from the database.'
            ))
            self.stdout.write('Required reference data will be preserved.\n')
            
            confirm = input('Are you sure? Type "yes" to continue: ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.WARNING('Operation cancelled.'))
                return
            
            if clear_dummy_data():
                self.stdout.write(self.style.SUCCESS('\n✓ Dummy data cleared successfully'))
            else:
                self.stdout.write(self.style.ERROR('\n✗ Failed to clear dummy data'))
            return
        
        # Handle reset operation
        if options['reset']:
            self.stdout.write(self.style.WARNING(
                '\nWARNING: This will reset the database to initial state.'
            ))
            self.stdout.write(self.style.WARNING(
                'ALL user data will be deleted!\n'
            ))
            
            confirm = input('Are you sure? Type "yes" to continue: ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.WARNING('Operation cancelled.'))
                return
            
            if reset_database():
                self.stdout.write(self.style.SUCCESS('\n✓ Database reset successfully'))
            else:
                self.stdout.write(self.style.ERROR('\n✗ Failed to reset database'))
            return
        
        # Handle full reset and populate
        if options['reset_full']:
            self.stdout.write(self.style.WARNING(
                '\nWARNING: This will reset the database and repopulate with test data.'
            ))
            self.stdout.write(self.style.WARNING(
                'ALL existing user data will be deleted!\n'
            ))
            
            confirm = input('Are you sure? Type "yes" to continue: ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.WARNING('Operation cancelled.'))
                return
            
            if full_reset_and_populate():
                self.stdout.write(self.style.SUCCESS('\n✓ Full reset and populate completed'))
                self._print_credentials()
            else:
                self.stdout.write(self.style.ERROR('\n✗ Failed to reset and populate'))
            return
        
        # Handle populate operations
        success = True
        
        if options['full'] or options['required']:
            self.stdout.write('\nPopulating required reference data...')
            if not populate_required_data():
                success = False
                self.stdout.write(self.style.ERROR('✗ Failed to populate required data'))
        
        if options['full'] or options['dummy']:
            self.stdout.write('\nPopulating dummy test data...')
            if not populate_dummy_data():
                success = False
                self.stdout.write(self.style.ERROR('✗ Failed to populate dummy data'))
            else:
                self._print_credentials()
        
        if success:
            self.stdout.write(self.style.SUCCESS('\n✓ Database setup completed successfully'))
        else:
            self.stdout.write(self.style.ERROR('\n✗ Database setup completed with errors'))
    
    def _print_credentials(self):
        """Print dummy user credentials."""
        self.stdout.write(self.style.SUCCESS('\nDummy User Credentials:'))
        self.stdout.write('-' * 40)
        for cred in DUMMY_USER_CREDENTIALS:
            self.stdout.write(f"  Username: {cred['username']}")
            self.stdout.write(f"  Password: {cred['password']}")
            self.stdout.write(f"  Email:    {cred['email']}")
            self.stdout.write('')

