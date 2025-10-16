// End-to-End tests for Additional Trackers system
// These tests simulate real user interactions across the entire application

describe('Additional Trackers E2E Tests', () => {
  beforeEach(() => {
    // Visit the login page and authenticate
    cy.visit('/login');
    
    // Fill in login credentials
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('testpass123');
    cy.get('button[type="submit"]').click();
    
    // Wait for successful login and redirect
    cy.url().should('include', '/profile');
    
    // Navigate to Additional Trackers
    cy.get('a[href="/additional-trackers"]').click();
    cy.url().should('include', '/additional-trackers');
  });

  describe('Additional Trackers Menu', () => {
    it('displays all tracker buttons with correct information', () => {
      // Check that all tracker buttons are present
      cy.contains('Weight Log').should('be.visible');
      cy.contains('Water Log').should('be.visible');
      cy.contains('Body Measurements').should('be.visible');
      cy.contains('Steps Log').should('be.visible');
      cy.contains('Cardio Log').should('be.visible');
      cy.contains('Sleep Log').should('be.visible');
      cy.contains('Health Metrics').should('be.visible');

      // Check for streak information
      cy.contains('day streak').should('be.visible');
      
      // Check for icons (should have gradient backgrounds)
      cy.get('[class*="bg-gradient-to-br"]').should('have.length', 7);
    });

    it('navigates to individual tracker pages', () => {
      // Test navigation to Weight Tracker
      cy.contains('Weight Log').click();
      cy.url().should('include', '/additional-trackers/weight');
      cy.contains('Weight Tracker').should('be.visible');
      
      // Go back and test Water Tracker
      cy.get('button').contains('←').click();
      cy.contains('Water Log').click();
      cy.url().should('include', '/additional-trackers/water');
      cy.contains('Water Tracker').should('be.visible');
    });

    it('shows loading state initially', () => {
      // The loading spinner should be visible briefly
      cy.get('.animate-spin').should('exist');
    });
  });

  describe('Weight Tracker', () => {
    beforeEach(() => {
      cy.visit('/additional-trackers/weight');
    });

    it('allows adding a new weight entry', () => {
      // Click Add Weight button
      cy.contains('Add Weight').click();
      
      // Fill in the form
      cy.get('input[name="weight"]').type('150.5');
      cy.get('select[name="weight_unit"]').select('lbs');
      cy.get('input[type="date"]').clear().type('2024-01-15');
      
      // Submit the form
      cy.contains('Save').click();
      
      // Verify the entry was added
      cy.contains('150.5').should('be.visible');
      cy.contains('lbs').should('be.visible');
    });

    it('validates required fields', () => {
      cy.contains('Add Weight').click();
      
      // Try to submit without filling required fields
      cy.contains('Save').click();
      
      // Form should show validation errors
      cy.get('input[name="weight"]').should('have.attr', 'required');
    });

    it('allows editing existing weight entries', () => {
      // First add an entry
      cy.contains('Add Weight').click();
      cy.get('input[name="weight"]').type('150.0');
      cy.contains('Save').click();
      
      // Wait for the entry to appear
      cy.contains('150.0').should('be.visible');
      
      // Click edit button
      cy.get('button').contains('✏️').first().click();
      
      // Modify the weight
      cy.get('input[name="weight"]').clear().type('151.0');
      cy.contains('Update').click();
      
      // Verify the change
      cy.contains('151.0').should('be.visible');
      cy.contains('150.0').should('not.exist');
    });

    it('allows deleting weight entries', () => {
      // Add an entry
      cy.contains('Add Weight').click();
      cy.get('input[name="weight"]').type('150.0');
      cy.contains('Save').click();
      
      // Wait for the entry to appear
      cy.contains('150.0').should('be.visible');
      
      // Click delete button and confirm
      cy.get('button').contains('🗑️').first().click();
      cy.on('window:confirm', () => true);
      
      // Verify the entry was deleted
      cy.contains('150.0').should('not.exist');
    });

    it('shows empty state when no entries exist', () => {
      cy.contains('No weight entries yet').should('be.visible');
      cy.contains('Start tracking your weight to see your progress').should('be.visible');
    });
  });

  describe('Water Tracker', () => {
    beforeEach(() => {
      cy.visit('/additional-trackers/water');
    });

    it('displays daily total correctly', () => {
      // Add multiple water entries
      cy.contains('Add Water').click();
      cy.get('input[name="amount"]').type('16');
      cy.get('select[name="unit"]').select('oz');
      cy.contains('Save').click();
      
      cy.contains('Add Water').click();
      cy.get('input[name="amount"]').type('8');
      cy.contains('Save').click();
      
      // Check daily total (16 + 8 = 24)
      cy.contains('24.0').should('be.visible');
      cy.contains("Today's Total").should('be.visible');
    });

    it('supports different water units', () => {
      cy.contains('Add Water').click();
      cy.get('input[name="amount"]').type('500');
      cy.get('select[name="unit"]').select('ml');
      cy.contains('Save').click();
      
      cy.contains('500.0').should('be.visible');
      cy.contains('ml').should('be.visible');
    });
  });

  describe('Body Measurement Tracker', () => {
    beforeEach(() => {
      cy.visit('/additional-trackers/body-measurement');
    });

    it('allows partial measurement entry', () => {
      cy.contains('Add Measurements').click();
      
      // Only fill some measurements
      cy.get('input[name="waist"]').type('32.0');
      cy.get('input[name="shoulder"]').type('44.0');
      
      cy.contains('Save').click();
      
      // Verify the entry was created
      cy.contains('Waist:').should('be.visible');
      cy.contains('Shoulder:').should('be.visible');
      cy.contains('32.0"').should('be.visible');
      cy.contains('44.0"').should('be.visible');
    });

    it('requires at least one measurement', () => {
      cy.contains('Add Measurements').click();
      
      // Try to submit without any measurements
      cy.contains('Save').click();
      
      // Should show validation error
      cy.contains('At least one measurement must be provided').should('be.visible');
    });
  });

  describe('Steps Tracker', () => {
    beforeEach(() => {
      cy.visit('/additional-trackers/steps');
    });

    it('displays steps with proper formatting', () => {
      cy.contains('Add Steps').click();
      cy.get('input[name="steps"]').type('10000');
      cy.contains('Save').click();
      
      // Steps should be formatted with commas
      cy.contains('10,000').should('be.visible');
    });

    it('shows daily steps total', () => {
      cy.contains("Today's Steps").should('be.visible');
      
      // Add steps
      cy.contains('Add Steps').click();
      cy.get('input[name="steps"]').type('5000');
      cy.contains('Save').click();
      
      // Check daily total
      cy.contains('5,000').should('be.visible');
    });
  });

  describe('Cardio Tracker', () => {
    beforeEach(() => {
      cy.visit('/additional-trackers/cardio');
    });

    it('allows comprehensive cardio logging', () => {
      cy.contains('Add Cardio').click();
      
      // Fill all fields
      cy.get('input[name="cardio_type"]').type('Running');
      cy.get('input[name="duration"]').type('30');
      cy.get('input[name="distance"]').type('3.5');
      cy.get('select[name="distance_unit"]').select('miles');
      cy.get('input[name="calories_burned"]').type('350');
      cy.get('input[name="heart_rate"]').type('150');
      
      cy.contains('Save').click();
      
      // Verify all data is displayed
      cy.contains('Running').should('be.visible');
      cy.contains('30m').should('be.visible');
      cy.contains('3.5 miles').should('be.visible');
      cy.contains('350').should('be.visible');
      cy.contains('150 BPM').should('be.visible');
    });

    it('calculates daily cardio duration', () => {
      cy.contains("Today's Cardio").should('be.visible');
      
      // Add cardio sessions
      cy.contains('Add Cardio').click();
      cy.get('input[name="cardio_type"]').type('Running');
      cy.get('input[name="duration"]').type('20');
      cy.contains('Save').click();
      
      cy.contains('Add Cardio').click();
      cy.get('input[name="cardio_type"]').type('Cycling');
      cy.get('input[name="duration"]').type('15');
      cy.contains('Save').click();
      
      // Check total duration (20 + 15 = 35 minutes)
      cy.contains('35m').should('be.visible');
    });
  });

  describe('Sleep Tracker', () => {
    beforeEach(() => {
      cy.visit('/additional-trackers/sleep');
    });

    it('calculates sleep duration correctly', () => {
      cy.contains('Add Sleep').click();
      
      cy.get('input[type="date"]').clear().type('2024-01-15');
      cy.get('input[name="time_went_to_bed"]').type('23:00');
      cy.get('input[name="time_got_out_of_bed"]').type('07:00');
      
      cy.contains('Save').click();
      
      // Should calculate 8 hours of sleep
      cy.contains('8h 0m').should('be.visible');
    });

    it('allows detailed sleep tracking', () => {
      cy.contains('Add Sleep').click();
      
      cy.get('input[type="date"]').clear().type('2024-01-15');
      cy.get('input[name="time_went_to_bed"]').type('23:00');
      cy.get('input[name="time_got_out_of_bed"]').type('07:00');
      cy.get('input[name="time_fell_asleep"]').type('23:30');
      cy.get('input[name="time_in_light_sleep"]').type('180');
      cy.get('input[name="time_in_deep_sleep"]').type('120');
      cy.get('input[name="time_in_rem_sleep"]').type('90');
      cy.get('input[name="number_of_times_woke_up"]').type('2');
      cy.get('input[name="resting_heart_rate"]').type('60');
      
      cy.contains('Save').click();
      
      // Verify all data is displayed
      cy.contains('11:30 PM').should('be.visible');
      cy.contains('7:00 AM').should('be.visible');
      cy.contains('2 times').should('be.visible');
    });
  });

  describe('Health Metrics Tracker', () => {
    beforeEach(() => {
      cy.visit('/additional-trackers/health-metrics');
    });

    it('displays average ratings', () => {
      // Add multiple health metric entries
      cy.contains('Add Metrics').click();
      cy.get('input[type="date"]').clear().type('2024-01-15');
      cy.get('input[name="morning_energy"]').invoke('val', '8').trigger('change');
      cy.get('input[name="mood"]').invoke('val', '9').trigger('change');
      cy.contains('Save').click();
      
      cy.contains('Add Metrics').click();
      cy.get('input[type="date"]').clear().type('2024-01-16');
      cy.get('input[name="morning_energy"]').invoke('val', '6').trigger('change');
      cy.get('input[name="mood"]').invoke('val', '7').trigger('change');
      cy.contains('Save').click();
      
      // Check average calculations (8+6)/2 = 7, (9+7)/2 = 8
      cy.contains('7.0/10').should('be.visible');
      cy.contains('8.0/10').should('be.visible');
    });

    it('supports slider inputs for ratings', () => {
      cy.contains('Add Metrics').click();
      
      // Test slider inputs
      cy.get('input[name="morning_energy"]').should('have.attr', 'type', 'range');
      cy.get('input[name="morning_energy"]').should('have.attr', 'min', '1');
      cy.get('input[name="morning_energy"]').should('have.attr', 'max', '10');
    });

    it('validates blood pressure relationship', () => {
      cy.contains('Add Metrics').click();
      
      // Test invalid blood pressure (systolic <= diastolic)
      cy.get('input[name="blood_pressure_systolic"]').type('80');
      cy.get('input[name="blood_pressure_diastolic"]').type('120');
      cy.contains('Save').click();
      
      // Should show validation error
      cy.contains('Systolic blood pressure must be greater than diastolic').should('be.visible');
    });
  });

  describe('Cross-Tracker Functionality', () => {
    it('maintains user session across trackers', () => {
      // Start with Weight Tracker
      cy.visit('/additional-trackers/weight');
      cy.contains('Weight Tracker').should('be.visible');
      
      // Navigate to Water Tracker
      cy.get('button').contains('←').click();
      cy.contains('Water Log').click();
      cy.contains('Water Tracker').should('be.visible');
      
      // Navigate back to Weight Tracker
      cy.get('button').contains('←').click();
      cy.contains('Weight Log').click();
      cy.contains('Weight Tracker').should('be.visible');
    });

    it('preserves data across page refreshes', () => {
      // Add a weight entry
      cy.visit('/additional-trackers/weight');
      cy.contains('Add Weight').click();
      cy.get('input[name="weight"]').type('150.0');
      cy.contains('Save').click();
      
      // Refresh the page
      cy.reload();
      
      // Data should still be there
      cy.contains('150.0').should('be.visible');
    });

    it('handles concurrent tracker usage', () => {
      // Open multiple trackers in different tabs
      cy.window().then((win) => {
        win.open('/additional-trackers/water', '_blank');
      });
      
      // Data should be consistent across tabs
      cy.visit('/additional-trackers/water');
      cy.contains('Water Tracker').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', () => {
      // Intercept API calls and return errors
      cy.intercept('GET', '/api/logging/weight/', { statusCode: 500 }).as('weightError');
      
      cy.visit('/additional-trackers/weight');
      
      // Should still render the component
      cy.contains('Weight Tracker').should('be.visible');
    });

    it('handles form submission errors', () => {
      cy.intercept('POST', '/api/logging/weight/', { statusCode: 400, body: { error: 'Invalid data' } }).as('submitError');
      
      cy.visit('/additional-trackers/weight');
      cy.contains('Add Weight').click();
      cy.get('input[name="weight"]').type('150');
      cy.contains('Save').click();
      
      // Should handle error gracefully
      cy.wait('@submitError');
    });
  });

  describe('Responsive Design', () => {
    it('works on mobile devices', () => {
      cy.viewport(375, 667); // iPhone SE size
      
      cy.visit('/additional-trackers');
      cy.contains('Weight Log').should('be.visible');
      
      // Test mobile navigation
      cy.contains('Weight Log').click();
      cy.contains('Weight Tracker').should('be.visible');
    });

    it('works on tablet devices', () => {
      cy.viewport(768, 1024); // iPad size
      
      cy.visit('/additional-trackers');
      cy.contains('Weight Log').should('be.visible');
      
      // Should have proper layout
      cy.get('[class*="grid-cols-"]').should('be.visible');
    });
  });
});
