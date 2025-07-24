describe('Tax Information Management', () => {
  beforeEach(() => {
    // Mock user with some earnings
    cy.mockApiResponse('GET', '**/api/users/me', {
      id: 'user-123',
      email: 'user@example.com',
      full_name: 'John Doe',
      annual_earnings: { 2023: 800 },
      tax_id_type: '',
      tax_id_number: '',
      entity_type: 'individual'
    });
    
    cy.login('user@example.com');
  });

  it('should display tax information form in profile', () => {
    cy.visit('/profile');
    
    // Should show tax information tab
    cy.contains('Tax Information').should('be.visible');
    
    // Click on tax information tab
    cy.contains('Tax Information').click();
    
    // Should show earnings threshold alert
    cy.contains('Your earnings may require tax reporting').should('be.visible');
    
    // Should show form fields
    cy.contains('Entity Type').should('be.visible');
    cy.contains('Tax ID Type').should('be.visible');
    cy.contains('Tax ID Number').should('be.visible');
    cy.contains('Tax Address').should('be.visible');
  });

  it('should validate required tax information fields', () => {
    cy.visit('/profile');
    cy.contains('Tax Information').click();
    
    // Try to save without required fields
    cy.contains('Save Tax Information').click();
    
    // Should show validation error
    cy.contains('Tax ID type and number are required').should('be.visible');
  });

  it('should validate tax ID format', () => {
    cy.visit('/profile');
    cy.contains('Tax Information').click();
    
    // Select SSN type
    cy.get('select').first().select('ssn');
    
    // Enter invalid SSN format
    cy.get('input[type="password"]').type('123-45-678');
    
    // Try to save
    cy.contains('Save Tax Information').click();
    
    // Should show format validation error
    cy.contains('Invalid tax ID format').should('be.visible');
  });

  it('should save valid tax information', () => {
    // Mock successful save
    cy.mockApiResponse('PUT', '**/api/users/user-123', {
      id: 'user-123',
      tax_id_type: 'ssn',
      tax_id_number: '123-45-6789'
    });
    
    cy.visit('/profile');
    cy.contains('Tax Information').click();
    
    // Fill out form
    cy.get('select').first().select('individual'); // Entity type
    cy.get('select').eq(1).select('ssn'); // Tax ID type
    cy.get('input[type="password"]').type('123-45-6789'); // Tax ID
    
    // Fill address
    cy.get('input[placeholder="Enter street address"]').type('123 Main St');
    cy.get('input[placeholder="Enter city"]').type('Anytown');
    cy.get('input[placeholder="Enter state"]').type('CA');
    cy.get('input[placeholder="Enter ZIP code"]').type('12345');
    
    // Save form
    cy.contains('Save Tax Information').click();
    
    // Should show success message
    cy.contains('Tax information saved successfully').should('be.visible');
  });

  it('should show business name field for business entities', () => {
    cy.visit('/profile');
    cy.contains('Tax Information').click();
    
    // Select business entity type
    cy.get('select').first().select('business');
    
    // Should show business name field
    cy.contains('Business Name').should('be.visible');
    cy.get('input[placeholder="Enter business name"]').should('be.visible');
  });

  it('should require business name for business entities', () => {
    cy.visit('/profile');
    cy.contains('Tax Information').click();
    
    // Select business entity type
    cy.get('select').first().select('business');
    
    // Fill required fields but leave business name empty
    cy.get('select').eq(1).select('ein');
    cy.get('input[type="password"]').type('12-3456789');
    
    // Try to save
    cy.contains('Save Tax Information').click();
    
    // Should show business name validation error
    cy.contains('Business name is required for business entities').should('be.visible');
  });

  it('should handle different tax ID types correctly', () => {
    cy.visit('/profile');
    cy.contains('Tax Information').click();
    
    // Test SSN placeholder
    cy.get('select').eq(1).select('ssn');
    cy.get('input[type="password"]').should('have.attr', 'placeholder', 'XXX-XX-XXXX');
    
    // Test EIN placeholder
    cy.get('select').eq(1).select('ein');
    cy.get('input[type="password"]').should('have.attr', 'placeholder', 'XX-XXXXXXX');
    
    // Test ITIN placeholder
    cy.get('select').eq(1).select('itin');
    cy.get('input[type="password"]').should('have.attr', 'placeholder', '9XX-XX-XXXX');
  });
});

describe('Transaction Processing with Tax Data', () => {
  beforeEach(() => {
    cy.login('renter@example.com');
    
    // Mock gear item
    cy.mockApiResponse('GET', '**/api/gear-items/test-gear-1', {
      id: 'test-gear-1',
      name: 'Test Camping Tent',
      daily_rate: 50,
      created_by: 'owner@example.com',
      images: ['tent.jpg']
    });
    
    // Mock cart items
    cy.mockApiResponse('GET', '**/api/cart-items', [{
      id: 'cart-1',
      gear_item_id: 'test-gear-1',
      owner_email: 'owner@example.com',
      start_date: '2024-01-01',
      end_date: '2024-01-03',
      subtotal: 100,
      total_days: 2
    }]);
  });

  it('should create transaction record during checkout', () => {
    // Mock successful rental creation
    cy.mockApiResponse('POST', '**/api/rentals', {
      id: 'rental-123',
      status: 'confirmed'
    });
    
    // Mock transaction record creation
    cy.mockApiResponse('POST', '**/api/transaction-records', {
      id: 'txn-123',
      transaction_number: 'TXN-2024-000001'
    });
    
    cy.visit('/stripe-checkout');
    
    // Should show checkout summary
    cy.contains('Test Camping Tent').should('be.visible');
    cy.contains('$100.00').should('be.visible'); // Subtotal
    cy.contains('$10.00').should('be.visible');  // Service fee
    cy.contains('$110.00').should('be.visible'); // Total
    
    // Process payment
    cy.contains('Confirm Payment').click();
    
    // Should redirect to success page
    cy.url().should('include', '/payment-success');
  });
});

describe('Admin Tax Management', () => {
  beforeEach(() => {
    // Mock admin user
    cy.mockApiResponse('GET', '**/api/users/me', {
      id: 'admin-123',
      email: 'admin@example.com',
      full_name: 'Admin User',
      is_admin: true
    });
    
    cy.login('admin@example.com');
  });

  it('should display tax documents tab in admin console', () => {
    // Mock admin data
    cy.mockApiResponse('GET', '**/api/users', []);
    cy.mockApiResponse('GET', '**/api/rentals', []);
    cy.mockApiResponse('GET', '**/api/messages', []);
    cy.mockApiResponse('GET', '**/api/guarantee-claims', []);
    cy.mockApiResponse('GET', '**/api/gear-items', []);
    cy.mockApiResponse('GET', '**/api/transaction-records', []);
    cy.mockApiResponse('GET', '**/api/tax-documents', []);
    
    cy.visit('/admin-console');
    
    // Should show tax documents tab
    cy.contains('Tax Documents').should('be.visible');
    
    // Click on tax documents tab
    cy.contains('Tax Documents').click();
    
    // Should show tax management interface
    cy.contains('Tax Document Generation').should('be.visible');
    cy.contains('Generate 1099 Forms').should('be.visible');
    cy.contains('Export Transactions').should('be.visible');
  });

  it('should generate 1099 forms for tax year', () => {
    // Mock tax documents generation
    cy.mockApiResponse('POST', '**/api/tax-documents/generate-1099', [
      { id: 'doc-1', document_type: '1099-MISC', recipient_user_id: 'user1@example.com' },
      { id: 'doc-2', document_type: '1099-MISC', recipient_user_id: 'user2@example.com' }
    ]);
    
    cy.mockApiResponse('GET', '**/api/users', []);
    cy.mockApiResponse('GET', '**/api/rentals', []);
    cy.mockApiResponse('GET', '**/api/messages', []);
    cy.mockApiResponse('GET', '**/api/guarantee-claims', []);
    cy.mockApiResponse('GET', '**/api/gear-items', []);
    cy.mockApiResponse('GET', '**/api/transaction-records', []);
    cy.mockApiResponse('GET', '**/api/tax-documents', []);
    
    cy.visit('/admin-console');
    cy.contains('Tax Documents').click();
    
    // Select tax year
    cy.get('select').first().select('2023');
    
    // Generate 1099 forms
    cy.contains('Generate 1099 Forms').click();
    
    // Should show generating state
    cy.contains('Generating...').should('be.visible');
  });

  it('should export transaction data', () => {
    cy.mockApiResponse('GET', '**/api/users', []);
    cy.mockApiResponse('GET', '**/api/rentals', []);
    cy.mockApiResponse('GET', '**/api/messages', []);
    cy.mockApiResponse('GET', '**/api/guarantee-claims', []);
    cy.mockApiResponse('GET', '**/api/gear-items', []);
    cy.mockApiResponse('GET', '**/api/transaction-records', []);
    cy.mockApiResponse('GET', '**/api/tax-documents', []);
    
    cy.visit('/admin-console');
    cy.contains('Tax Documents').click();
    
    // Select export format
    cy.get('select').eq(1).select('csv');
    
    // Export transactions
    cy.contains('Export Transactions').click();
    
    // Should show exporting state
    cy.contains('Exporting...').should('be.visible');
  });
});
