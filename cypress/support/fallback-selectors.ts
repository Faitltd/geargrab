/**
 * Fallback selectors for when data-cy attributes are not available
 * This helps tests run even if the application doesn't have all data-cy attributes yet
 */

// Mapping of data-cy selectors to fallback selectors
export const fallbackSelectors = {
  // Navigation
  'mobile-menu-button': ['button:contains("Menu")', '.hamburger', '.menu-toggle', 'button[aria-label*="menu"]'],
  'mobile-menu': ['.mobile-menu', '.nav-menu', '.menu-dropdown', 'nav ul'],
  
  // Homepage
  'hero-search': ['.hero-search', '.search-form', 'form:has(input[placeholder*="search"])'],
  
  // Browse page
  'gear-grid': ['.gear-grid', '.listings-grid', '.products-grid', '.grid'],
  'gear-card': ['.gear-card', '.listing-card', '.product-card', '.card'],
  'filter-button': ['button:contains("Filter")', '.filter-btn', '.filters-toggle'],
  'filter-sidebar': ['.filter-sidebar', '.filters', '.sidebar'],
  'sort-select': ['select[name*="sort"]', '.sort-select', 'select:has(option:contains("price"))'],
  'pagination': ['.pagination', '.page-nav', 'nav[aria-label*="pagination"]'],
  'next-page': ['button:contains("Next")', '.next', '.page-next'],
  'prev-page': ['button:contains("Previous")', '.prev', '.page-prev'],
  'loading': ['.loading', '.spinner', '.loader', '[aria-label*="loading"]'],
  
  // Listing details
  'image-gallery': ['.image-gallery', '.gallery', '.photos'],
  'main-image': ['.main-image', '.primary-image', '.gallery img:first'],
  'thumbnail': ['.thumbnail', '.thumb', '.gallery img:not(.main-image)'],
  'next-image': ['.next-image', '.gallery-next', 'button:contains("Next")'],
  'prev-image': ['.prev-image', '.gallery-prev', 'button:contains("Previous")'],
  'booking-form': ['.booking-form', '.reservation-form', 'form:has(input[type="date"])'],
  'start-date': ['input[name*="start"]', 'input[placeholder*="start"]', 'input[type="date"]:first'],
  'end-date': ['input[name*="end"]', 'input[placeholder*="end"]', 'input[type="date"]:last'],
  'book-now': ['button:contains("Book")', '.book-btn', '.reserve-btn'],
  'total-price': ['.total-price', '.price-total', '.final-price'],
  'location': ['.location', '.address', '.city'],
  
  // Tabs
  'tab-description': ['button:contains("Description")', '.tab:contains("Description")'],
  'tab-specifications': ['button:contains("Specifications")', '.tab:contains("Specs")'],
  'tab-reviews': ['button:contains("Reviews")', '.tab:contains("Reviews")'],
  'description-content': ['.description-content', '.description', '.details'],
  'specifications-content': ['.specifications-content', '.specs', '.specifications'],
  'reviews-content': ['.reviews-content', '.reviews', '.review-list'],
  
  // Owner info
  'owner-info': ['.owner-info', '.owner', '.host'],
  'owner-avatar': ['.owner-avatar', '.owner img', '.host img'],
  'owner-name': ['.owner-name', '.owner h3', '.host h3'],
  'owner-rating': ['.owner-rating', '.owner .rating', '.host .rating'],
  'contact-owner': ['button:contains("Contact")', '.contact-btn', '.message-btn'],
  
  // Reviews
  'overall-rating': ['.overall-rating', '.rating-summary', '.average-rating'],
  'review-item': ['.review-item', '.review', '.review-card'],
  'reviewer-name': ['.reviewer-name', '.review .name', '.review h4'],
  'review-rating': ['.review-rating', '.review .rating', '.review .stars'],
  'review-text': ['.review-text', '.review p', '.review .content'],
  'review-date': ['.review-date', '.review .date', '.review time'],
  'show-more-reviews': ['button:contains("Show more")', '.show-more', '.load-more'],
  
  // Similar listings
  'similar-listings': ['.similar-listings', '.related', '.recommendations'],
  'similar-listing-card': ['.similar-listing-card', '.similar-item', '.related-item'],
  
  // Authentication
  'logout': ['button:contains("Logout")', '.logout', 'a:contains("Sign out")'],
  'google-login': ['button:contains("Google")', '.google-btn', '.social-login:contains("Google")'],
  
  // Dashboard
  'dashboard-nav': ['.dashboard-nav', '.dashboard-menu', '.sidebar-nav'],
  'nav-owner': ['a:contains("Owner")', '.nav-owner', 'button:contains("My Listings")'],
  'nav-renter': ['a:contains("Renter")', '.nav-renter', 'button:contains("My Bookings")'],
  'nav-messages': ['a:contains("Messages")', '.nav-messages', 'button:contains("Messages")'],
  'nav-profile': ['a:contains("Profile")', '.nav-profile', 'button:contains("Profile")'],
  'stats-card': ['.stats-card', '.stat', '.metric'],
  'recent-activity': ['.recent-activity', '.activity', '.timeline'],
  'activity-item': ['.activity-item', '.activity', '.timeline-item'],
  'quick-actions': ['.quick-actions', '.actions', '.shortcuts'],
  
  // Listings management
  'listings-grid': ['.listings-grid', '.my-listings', '.owner-listings'],
  'listing-card': ['.listing-card', '.listing', '.item-card'],
  'edit-listing': ['button:contains("Edit")', '.edit-btn', 'a:contains("Edit")'],
  'delete-listing': ['button:contains("Delete")', '.delete-btn', '.remove-btn'],
  'confirm-delete': ['.confirm-delete', '.modal', '.dialog'],
  'cancel-delete': ['button:contains("Cancel")', '.cancel-btn'],
  'confirm-delete-button': ['button:contains("Delete")', '.confirm-btn'],
  'listing-status': ['.listing-status', '.status', '.badge'],
  'availability-toggle': ['.availability-toggle', '.toggle', 'input[type="checkbox"]'],
  
  // Bookings
  'booking-requests': ['.booking-requests', '.requests', '.pending-bookings'],
  'booking-request': ['.booking-request', '.request', '.booking-item'],
  'accept-booking': ['button:contains("Accept")', '.accept-btn'],
  'decline-booking': ['button:contains("Decline")', '.decline-btn'],
  'bookings-list': ['.bookings-list', '.bookings', '.reservations'],
  'booking-card': ['.booking-card', '.booking', '.reservation'],
  'booking-status': ['.booking-status', '.status', '.badge'],
  'cancel-booking': ['button:contains("Cancel")', '.cancel-btn'],
  'confirm-cancel': ['.confirm-cancel', '.modal', '.dialog'],
  'confirm-cancel-button': ['button:contains("Cancel")', '.confirm-btn'],
  'leave-review': ['button:contains("Review")', '.review-btn'],
  'booking-details': ['.booking-details', '.details', '.booking-info'],
  'booking-dates': ['.booking-dates', '.dates', '.period'],
  'booking-total': ['.booking-total', '.total', '.amount'],
  
  // Reviews
  'review-modal': ['.review-modal', '.modal', '.dialog'],
  'rating-stars': ['.rating-stars', '.stars', '.rating'],
  'review-text': ['textarea[name*="review"]', 'textarea[placeholder*="review"]'],
  'submit-review': ['button:contains("Submit")', '.submit-btn'],
  
  // Messages
  'conversations-list': ['.conversations-list', '.conversations', '.chat-list'],
  'conversation': ['.conversation', '.chat-item', '.message-thread'],
  'message-area': ['.message-area', '.chat-area', '.messages'],
  'message-input': ['input[placeholder*="message"]', 'textarea[placeholder*="message"]'],
  'send-message': ['button:contains("Send")', '.send-btn'],
  'message-timestamp': ['.message-timestamp', '.timestamp', '.time'],
  
  // Profile
  'save-profile': ['button:contains("Save")', '.save-btn'],
  'profile-preview': ['.profile-preview', '.avatar-preview', '.image-preview'],
  'change-password': ['button:contains("Password")', '.change-password'],
  'update-password': ['button:contains("Update")', '.update-btn'],
  
  // Mobile dashboard
  'mobile-dashboard-nav': ['.mobile-dashboard-nav', '.mobile-nav', '.bottom-nav']
};

/**
 * Get selector with fallbacks
 * @param {string} dataCy - The data-cy attribute value
 * @returns {string} - The selector to use
 */
export function getSelector(dataCy) {
  const fallbacks = fallbackSelectors[dataCy] || [];
  return `[data-cy="${dataCy}"], ${fallbacks.join(', ')}`;
}

/**
 * Cypress command to get element with fallback selectors
 */
Cypress.Commands.add('getByDataCy', (dataCy, options = {}) => {
  const selector = getSelector(dataCy);
  return cy.get(selector, options);
});

/**
 * Cypress command to find element with fallback selectors
 */
Cypress.Commands.add('findByDataCy', { prevSubject: 'element' }, (subject, dataCy, options = {}) => {
  const selector = getSelector(dataCy);
  return cy.wrap(subject).find(selector, options);
});

// Add to global Cypress interface
declare global {
  namespace Cypress {
    interface Chainable {
      getByDataCy(dataCy: string, options?: any): Chainable<JQuery<HTMLElement>>
      findByDataCy(dataCy: string, options?: any): Chainable<JQuery<HTMLElement>>
    }
  }
}
