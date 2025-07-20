// Listing Management End-to-End Tests
// Tests creating, editing, viewing, and deleting gear listings

describe('Listing Management', () => {
  beforeEach(() => {
    cy.clearTestData();
    cy.login();
  });

  describe('Create Listing', () => {
    it('should create a new listing successfully', () => {
      const listingData = {
        title: 'Professional DSLR Camera',
        description: 'High-quality camera perfect for photography enthusiasts. Includes lens and accessories.',
        category: 'photography',
        price: 75,
        location: 'San Francisco, CA',
        condition: 'excellent',
        brand: 'Canon',
        model: 'EOS 5D Mark IV'
      };

      cy.visit('/dashboard/listings/new');
      cy.fillListingForm(listingData);
      
      // Upload images
      cy.uploadImages(['camera1.jpg', 'camera2.jpg']);
      
      cy.get('[data-cy="create-listing-button"]').click();
      
      cy.shouldShowSuccess('Listing created successfully');
      cy.url().should('match', /\/listings\/[a-zA-Z0-9]+$/);
      
      // Verify listing details
      cy.get('[data-cy="listing-title"]').should('contain.text', listingData.title);
      cy.get('[data-cy="listing-price"]').should('contain.text', `$${listingData.price}`);
      cy.get('[data-cy="listing-description"]').should('contain.text', listingData.description);
      cy.get('[data-cy="listing-location"]').should('contain.text', listingData.location);
    });

    it('should validate required fields', () => {
      cy.visit('/dashboard/listings/new');
      
      // Try to submit empty form
      cy.get('[data-cy="create-listing-button"]').click();
      
      cy.get('[data-cy="title-error"]').should('contain.text', 'Title is required');
      cy.get('[data-cy="description-error"]').should('contain.text', 'Description is required');
      cy.get('[data-cy="category-error"]').should('contain.text', 'Category is required');
      cy.get('[data-cy="price-error"]').should('contain.text', 'Price is required');
      cy.get('[data-cy="location-error"]').should('contain.text', 'Location is required');
    });

    it('should validate price format', () => {
      cy.visit('/dashboard/listings/new');
      
      // Test invalid price formats
      cy.get('[data-cy="price-input"]').type('invalid');
      cy.get('[data-cy="create-listing-button"]').click();
      cy.get('[data-cy="price-error"]').should('contain.text', 'Please enter a valid price');
      
      // Test negative price
      cy.get('[data-cy="price-input"]').clear().type('-10');
      cy.get('[data-cy="create-listing-button"]').click();
      cy.get('[data-cy="price-error"]').should('contain.text', 'Price must be greater than 0');
      
      // Test zero price
      cy.get('[data-cy="price-input"]').clear().type('0');
      cy.get('[data-cy="create-listing-button"]').click();
      cy.get('[data-cy="price-error"]').should('contain.text', 'Price must be greater than 0');
    });

    it('should require at least one image', () => {
      const listingData = {
        title: 'Test Item',
        description: 'Test description',
        category: 'camping',
        price: 25,
        location: 'Test Location',
        condition: 'good'
      };

      cy.visit('/dashboard/listings/new');
      cy.fillListingForm(listingData);
      cy.get('[data-cy="create-listing-button"]').click();
      
      cy.get('[data-cy="images-error"]').should('contain.text', 'At least one image is required');
    });

    it('should validate image file types and sizes', () => {
      cy.visit('/dashboard/listings/new');
      
      // Test invalid file type
      cy.uploadFile('document.pdf', '[data-cy="image-upload"]');
      cy.get('[data-cy="file-error"]').should('contain.text', 'Only image files are allowed');
      
      // Test oversized file (would need a large test file)
      // cy.uploadFile('large-image.jpg');
      // cy.get('[data-cy="file-error"]').should('contain.text', 'File size must be less than 5MB');
    });

    it('should save draft automatically', () => {
      const listingData = {
        title: 'Draft Listing',
        description: 'This is a draft listing'
      };

      cy.visit('/dashboard/listings/new');
      cy.get('[data-cy="title-input"]').type(listingData.title);
      cy.get('[data-cy="description-textarea"]').type(listingData.description);
      
      // Wait for auto-save
      cy.wait(3000);
      cy.get('[data-cy="draft-saved-indicator"]').should('be.visible');
      
      // Refresh page and check if draft is restored
      cy.reload();
      cy.get('[data-cy="title-input"]').should('have.value', listingData.title);
      cy.get('[data-cy="description-textarea"]').should('have.value', listingData.description);
    });
  });

  describe('View Listings', () => {
    beforeEach(() => {
      // Create test listings
      cy.createTestListing({
        title: 'Mountain Bike',
        category: 'sports',
        price: 100
      });
      cy.createTestListing({
        title: 'Camping Tent',
        category: 'camping',
        price: 50
      });
    });

    it('should display listings grid', () => {
      cy.visitListings();
      
      cy.get('[data-cy="listings-grid"]').should('be.visible');
      cy.get('[data-cy="listing-card"]').should('have.length.at.least', 2);
      
      // Check listing card content
      cy.get('[data-cy="listing-card"]').first().within(() => {
        cy.get('[data-cy="listing-image"]').should('be.visible');
        cy.get('[data-cy="listing-title"]').should('be.visible');
        cy.get('[data-cy="listing-price"]').should('be.visible');
        cy.get('[data-cy="listing-location"]').should('be.visible');
      });
    });

    it('should filter listings by category', () => {
      cy.visitListings();
      
      cy.get('[data-cy="category-filter"]').select('camping');
      cy.get('[data-cy="listing-card"]').should('have.length', 1);
      cy.get('[data-cy="listing-title"]').should('contain.text', 'Camping Tent');
    });

    it('should filter listings by price range', () => {
      cy.visitListings();
      
      cy.get('[data-cy="min-price-input"]').type('60');
      cy.get('[data-cy="max-price-input"]').type('120');
      cy.get('[data-cy="apply-filters-button"]').click();
      
      cy.get('[data-cy="listing-card"]').should('have.length', 1);
      cy.get('[data-cy="listing-title"]').should('contain.text', 'Mountain Bike');
    });

    it('should search listings by keyword', () => {
      cy.visitListings();
      
      cy.get('[data-cy="search-input"]').type('bike');
      cy.get('[data-cy="search-button"]').click();
      
      cy.get('[data-cy="listing-card"]').should('have.length', 1);
      cy.get('[data-cy="listing-title"]').should('contain.text', 'Mountain Bike');
    });

    it('should sort listings', () => {
      cy.visitListings();
      
      // Sort by price (low to high)
      cy.get('[data-cy="sort-select"]').select('price-asc');
      
      cy.get('[data-cy="listing-card"]').first()
        .find('[data-cy="listing-title"]')
        .should('contain.text', 'Camping Tent');
      
      // Sort by price (high to low)
      cy.get('[data-cy="sort-select"]').select('price-desc');
      
      cy.get('[data-cy="listing-card"]').first()
        .find('[data-cy="listing-title"]')
        .should('contain.text', 'Mountain Bike');
    });
  });

  describe('Edit Listing', () => {
    let testListing: any;

    beforeEach(() => {
      cy.createTestListing().then((listing) => {
        testListing = listing;
      });
    });

    it('should edit listing successfully', () => {
      cy.visit(`/dashboard/listings/${testListing.id}/edit`);
      
      const updatedData = {
        title: 'Updated Camping Tent',
        price: 60
      };
      
      cy.get('[data-cy="title-input"]').clear().type(updatedData.title);
      cy.get('[data-cy="price-input"]').clear().type(updatedData.price.toString());
      
      cy.get('[data-cy="update-listing-button"]').click();
      
      cy.shouldShowSuccess('Listing updated successfully');
      cy.get('[data-cy="listing-title"]').should('contain.text', updatedData.title);
      cy.get('[data-cy="listing-price"]').should('contain.text', `$${updatedData.price}`);
    });

    it('should prevent editing other users listings', () => {
      // Create listing as different user
      cy.logout();
      cy.createTestUser({ email: 'other@example.com', password: 'password123' });
      cy.login('other@example.com', 'password123');
      
      cy.visit(`/dashboard/listings/${testListing.id}/edit`);
      
      cy.get('[data-cy="access-denied-message"]').should('be.visible');
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Delete Listing', () => {
    let testListing: any;

    beforeEach(() => {
      cy.createTestListing().then((listing) => {
        testListing = listing;
      });
    });

    it('should delete listing successfully', () => {
      cy.visit(`/dashboard/listings/${testListing.id}`);
      
      cy.get('[data-cy="listing-actions-menu"]').click();
      cy.get('[data-cy="delete-listing-button"]').click();
      
      // Confirm deletion
      cy.get('[data-cy="confirm-delete-button"]').click();
      
      cy.shouldShowSuccess('Listing deleted successfully');
      cy.url().should('include', '/dashboard/listings');
      
      // Verify listing is no longer visible
      cy.visit(`/listings/${testListing.id}`);
      cy.get('[data-cy="listing-not-found"]').should('be.visible');
    });

    it('should show confirmation dialog before deletion', () => {
      cy.visit(`/dashboard/listings/${testListing.id}`);
      
      cy.get('[data-cy="listing-actions-menu"]').click();
      cy.get('[data-cy="delete-listing-button"]').click();
      
      cy.get('[data-cy="delete-confirmation-dialog"]').should('be.visible');
      cy.get('[data-cy="confirm-delete-button"]').should('be.visible');
      cy.get('[data-cy="cancel-delete-button"]').should('be.visible');
      
      // Cancel deletion
      cy.get('[data-cy="cancel-delete-button"]').click();
      cy.get('[data-cy="delete-confirmation-dialog"]').should('not.exist');
    });
  });

  describe('Listing Availability', () => {
    let testListing: any;

    beforeEach(() => {
      cy.createTestListing().then((listing) => {
        testListing = listing;
      });
    });

    it('should toggle listing availability', () => {
      cy.visit(`/dashboard/listings/${testListing.id}`);
      
      // Check current status
      cy.get('[data-cy="availability-status"]').should('contain.text', 'Available');
      
      // Toggle availability
      cy.get('[data-cy="toggle-availability-button"]').click();
      
      cy.shouldShowSuccess('Listing availability updated');
      cy.get('[data-cy="availability-status"]').should('contain.text', 'Unavailable');
      
      // Toggle back
      cy.get('[data-cy="toggle-availability-button"]').click();
      cy.get('[data-cy="availability-status"]').should('contain.text', 'Available');
    });

    it('should prevent booking unavailable listings', () => {
      // Make listing unavailable
      cy.visit(`/dashboard/listings/${testListing.id}`);
      cy.get('[data-cy="toggle-availability-button"]').click();
      
      // Logout and try to book as different user
      cy.logout();
      cy.login('other@example.com', 'password123');
      
      cy.visit(`/listings/${testListing.id}`);
      cy.get('[data-cy="book-now-button"]').should('be.disabled');
      cy.get('[data-cy="unavailable-message"]').should('be.visible');
    });
  });
});
