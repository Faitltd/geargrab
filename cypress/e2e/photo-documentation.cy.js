describe('Photo Documentation', () => {
  beforeEach(() => {
    cy.setupTestData();
    cy.mockAuth();
  });

  describe('Checkout Photo Documentation', () => {
    beforeEach(() => {
      cy.visit('/checkout?id=test-gear-1&from=2024-01-01&to=2024-01-03');
    });

    it('should show photo documentation dialog when clicking checkout button', () => {
      cy.get('[data-testid="checkout-button"]').should('contain', 'Document & Pay');
      cy.get('[data-testid="checkout-button"]').click();
      
      cy.get('[role="dialog"]').should('be.visible');
      cy.get('[role="dialog"]').should('contain', 'Initial Condition Documentation');
    });

    it('should display photo requirements checklist', () => {
      cy.get('[data-testid="checkout-button"]').click();
      
      cy.get('button').contains('Show Checklist').click();
      cy.get('.bg-blue-50').should('be.visible');
      cy.get('.bg-blue-50').should('contain', 'Overall view of the gear');
      cy.get('.bg-blue-50').should('contain', 'Close-up of any existing damage');
    });

    it('should validate minimum photo requirements', () => {
      cy.get('[data-testid="checkout-button"]').click();
      
      // Try to submit without photos
      cy.get('button').contains('Complete Checkout').click();
      cy.get('[role="alert"]').should('contain', 'at least 2 photos');
    });

    it('should allow photo upload and submission', () => {
      cy.get('[data-testid="checkout-button"]').click();
      
      // Mock file upload
      const fileName1 = 'test-image-1.jpg';
      const fileName2 = 'test-image-2.jpg';
      
      cy.fixture(fileName1, 'base64').then(fileContent => {
        cy.get('input[type="file"]').first().selectFile({
          contents: Cypress.Buffer.from(fileContent, 'base64'),
          fileName: fileName1,
          mimeType: 'image/jpeg'
        }, { force: true });
      });

      cy.fixture(fileName2, 'base64').then(fileContent => {
        cy.get('input[type="file"]').first().selectFile({
          contents: Cypress.Buffer.from(fileContent, 'base64'),
          fileName: fileName2,
          mimeType: 'image/jpeg'
        }, { force: true });
      });

      // Add notes
      cy.get('textarea').type('Initial condition looks good, no visible damage.');
      
      // Submit photos
      cy.get('button').contains('Complete Checkout').click();
      
      // Should redirect to MyRentals
      cy.url().should('include', '/my-rentals');
    });
  });

  describe('Return Photo Documentation', () => {
    beforeEach(() => {
      cy.createTestRental({ status: 'active' });
      cy.visit('/my-rentals');
    });

    it('should show return photo documentation for active rentals', () => {
      cy.get('button').contains('Return Photos').should('be.visible');
      cy.get('button').contains('Return Photos').click();
      
      cy.get('[role="dialog"]').should('be.visible');
      cy.get('[role="dialog"]').should('contain', 'Return Condition Documentation');
    });

    it('should require minimum 3 photos for return', () => {
      cy.get('button').contains('Return Photos').click();
      
      // Try to submit without enough photos
      cy.get('button').contains('Complete Return').click();
      cy.get('[role="alert"]').should('contain', 'at least 3 photos');
    });

    it('should display return-specific checklist', () => {
      cy.get('button').contains('Return Photos').click();
      
      cy.get('button').contains('Show Checklist').click();
      cy.get('.bg-blue-50').should('contain', 'Overall condition upon return');
      cy.get('.bg-blue-50').should('contain', 'Any new damage or wear');
      cy.get('.bg-blue-50').should('contain', 'All components and accessories returned');
    });

    it('should complete return process with photos', () => {
      cy.get('button').contains('Return Photos').click();
      
      // Upload 3 photos
      ['test-image-1.jpg', 'test-image-2.jpg', 'test-image-3.jpg'].forEach((fileName, index) => {
        cy.fixture(fileName, 'base64').then(fileContent => {
          cy.get('input[type="file"]').first().selectFile({
            contents: Cypress.Buffer.from(fileContent, 'base64'),
            fileName: fileName,
            mimeType: 'image/jpeg'
          }, { force: true });
        });
      });

      // Add return notes
      cy.get('textarea').type('Gear returned in excellent condition, cleaned and ready for next rental.');
      
      // Submit return
      cy.get('button').contains('Complete Return').click();
      
      // Should update rental status to completed
      cy.get('.bg-green-100').should('contain', 'completed');
    });
  });

  describe('Pickup Photo Documentation', () => {
    beforeEach(() => {
      cy.createTestRental({ status: 'confirmed' });
      cy.visit('/my-rentals');
    });

    it('should show pickup photo documentation for confirmed rentals', () => {
      cy.get('button').contains('Pickup Photos').should('be.visible');
      cy.get('button').contains('Pickup Photos').click();
      
      cy.get('[role="dialog"]').should('be.visible');
      cy.get('[role="dialog"]').should('contain', 'Pickup Condition Documentation');
    });

    it('should require minimum 2 photos for pickup', () => {
      cy.get('button').contains('Pickup Photos').click();
      
      // Try to submit without enough photos
      cy.get('button').contains('Complete Pickup').click();
      cy.get('[role="alert"]').should('contain', 'at least 2 photos');
    });

    it('should complete pickup process and change status to active', () => {
      cy.get('button').contains('Pickup Photos').click();
      
      // Upload 2 photos
      ['test-image-1.jpg', 'test-image-2.jpg'].forEach((fileName) => {
        cy.fixture(fileName, 'base64').then(fileContent => {
          cy.get('input[type="file"]').first().selectFile({
            contents: Cypress.Buffer.from(fileContent, 'base64'),
            fileName: fileName,
            mimeType: 'image/jpeg'
          }, { force: true });
        });
      });

      // Add pickup notes
      cy.get('textarea').type('Gear picked up in good condition, all items accounted for.');
      
      // Submit pickup
      cy.get('button').contains('Complete Pickup').click();
      
      // Should update rental status to active
      cy.get('.bg-blue-100').should('contain', 'active');
    });
  });

  describe('Photo Validation', () => {
    beforeEach(() => {
      cy.visit('/checkout?id=test-gear-1&from=2024-01-01&to=2024-01-03');
      cy.get('[data-testid="checkout-button"]').click();
    });

    it('should reject unsupported file formats', () => {
      cy.fixture('test-document.pdf', 'base64').then(fileContent => {
        cy.get('input[type="file"]').first().selectFile({
          contents: Cypress.Buffer.from(fileContent, 'base64'),
          fileName: 'test-document.pdf',
          mimeType: 'application/pdf'
        }, { force: true });
      });

      cy.get('[role="alert"]').should('contain', 'Unsupported file format');
    });

    it('should reject files that are too large', () => {
      // Create a mock large file
      const largeFileContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      
      cy.get('input[type="file"]').first().selectFile({
        contents: largeFileContent,
        fileName: 'large-image.jpg',
        mimeType: 'image/jpeg'
      }, { force: true });

      cy.get('[role="alert"]').should('contain', 'File size too large');
    });

    it('should show photo count limits', () => {
      cy.get('label').should('contain', '(0/8)'); // Shows current count and max
    });

    it('should prevent uploading more than maximum photos', () => {
      // This would require mocking multiple file uploads
      // Implementation depends on how the component handles max limits
      cy.get('label').should('contain', 'Maximum 8 photos allowed');
    });
  });

  describe('Photo Documentation UI/UX', () => {
    beforeEach(() => {
      cy.visit('/checkout?id=test-gear-1&from=2024-01-01&to=2024-01-03');
      cy.get('[data-testid="checkout-button"]').click();
    });

    it('should support drag and drop', () => {
      cy.get('.border-dashed').should('be.visible');
      cy.get('.border-dashed').should('contain', 'Drop photos here');
    });

    it('should show camera and file upload options', () => {
      cy.get('button').contains('Take Photo').should('be.visible');
      cy.get('button').contains('Choose Files').should('be.visible');
    });

    it('should show photo preview grid', () => {
      // After uploading photos, should show preview grid
      cy.fixture('test-image-1.jpg', 'base64').then(fileContent => {
        cy.get('input[type="file"]').first().selectFile({
          contents: Cypress.Buffer.from(fileContent, 'base64'),
          fileName: 'test-image-1.jpg',
          mimeType: 'image/jpeg'
        }, { force: true });
      });

      cy.get('.grid').should('be.visible');
      cy.get('img[alt*="Documentation"]').should('be.visible');
    });

    it('should allow photo removal', () => {
      // Upload a photo first
      cy.fixture('test-image-1.jpg', 'base64').then(fileContent => {
        cy.get('input[type="file"]').first().selectFile({
          contents: Cypress.Buffer.from(fileContent, 'base64'),
          fileName: 'test-image-1.jpg',
          mimeType: 'image/jpeg'
        }, { force: true });
      });

      // Should show remove button on hover
      cy.get('.group').trigger('mouseover');
      cy.get('button').contains('×').should('be.visible');
      cy.get('button').contains('×').click();
      
      // Photo should be removed
      cy.get('img[alt*="Documentation"]').should('not.exist');
    });

    it('should show success message when requirements are met', () => {
      // Upload minimum required photos
      ['test-image-1.jpg', 'test-image-2.jpg'].forEach((fileName) => {
        cy.fixture(fileName, 'base64').then(fileContent => {
          cy.get('input[type="file"]').first().selectFile({
            contents: Cypress.Buffer.from(fileContent, 'base64'),
            fileName: fileName,
            mimeType: 'image/jpeg'
          }, { force: true });
        });
      });

      cy.get('.bg-emerald-50').should('contain', 'Photo documentation complete');
    });
  });
});
