// Admin Panel End-to-End Tests
// Tests admin functionality, user management, and dispute resolution

describe('Admin Panel', () => {
  beforeEach(() => {
    cy.clearTestData();
    cy.seedTestData();
  });

  describe('Admin Authentication', () => {
    it('should allow admin login', () => {
      cy.loginAsAdmin();
      cy.visitAdmin();
      
      cy.get('[data-cy="admin-dashboard"]').should('be.visible');
      cy.get('[data-cy="admin-header"]').should('contain.text', 'Admin Panel');
    });

    it('should prevent non-admin access', () => {
      cy.login(); // Regular user login
      cy.visit('/admin');
      
      cy.get('[data-cy="access-denied"]').should('be.visible');
      cy.url().should('include', '/dashboard');
    });

    it('should redirect unauthenticated users', () => {
      cy.visit('/admin');
      
      cy.url().should('include', '/auth/signin');
      cy.get('[data-cy="admin-access-required"]').should('be.visible');
    });
  });

  describe('Admin Dashboard Overview', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.visitAdmin();
    });

    it('should display key metrics', () => {
      cy.get('[data-cy="metrics-overview"]').should('be.visible');
      
      cy.get('[data-cy="total-users-metric"]').should('be.visible');
      cy.get('[data-cy="total-listings-metric"]').should('be.visible');
      cy.get('[data-cy="total-bookings-metric"]').should('be.visible');
      cy.get('[data-cy="pending-disputes-metric"]').should('be.visible');
      
      // Verify metrics have values
      cy.get('[data-cy="total-users-count"]').should('not.contain.text', '0');
      cy.get('[data-cy="total-listings-count"]').should('not.contain.text', '0');
    });

    it('should show recent activity', () => {
      cy.get('[data-cy="recent-activity"]').should('be.visible');
      cy.get('[data-cy="activity-item"]').should('have.length.at.least', 1);
      
      cy.get('[data-cy="activity-item"]').first().within(() => {
        cy.get('[data-cy="activity-type"]').should('be.visible');
        cy.get('[data-cy="activity-timestamp"]').should('be.visible');
        cy.get('[data-cy="activity-description"]').should('be.visible');
      });
    });

    it('should display pending items requiring attention', () => {
      cy.get('[data-cy="pending-items"]').should('be.visible');
      
      cy.get('[data-cy="pending-disputes"]').should('be.visible');
      cy.get('[data-cy="pending-reviews"]').should('be.visible');
      cy.get('[data-cy="flagged-content"]').should('be.visible');
    });

    it('should allow navigation between admin sections', () => {
      cy.get('[data-cy="admin-nav-users"]').click();
      cy.url().should('include', '/admin/users');
      
      cy.get('[data-cy="admin-nav-disputes"]').click();
      cy.url().should('include', '/admin/disputes');
      
      cy.get('[data-cy="admin-nav-listings"]').click();
      cy.url().should('include', '/admin/listings');
    });
  });

  describe('User Management', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.visit('/admin/users');
    });

    it('should display user list', () => {
      cy.get('[data-cy="users-table"]').should('be.visible');
      cy.get('[data-cy="user-row"]').should('have.length.at.least', 1);
      
      cy.get('[data-cy="user-row"]').first().within(() => {
        cy.get('[data-cy="user-name"]').should('be.visible');
        cy.get('[data-cy="user-email"]').should('be.visible');
        cy.get('[data-cy="user-status"]').should('be.visible');
        cy.get('[data-cy="user-actions"]').should('be.visible');
      });
    });

    it('should allow searching users', () => {
      cy.get('[data-cy="user-search"]').type('test@example.com');
      cy.get('[data-cy="search-button"]').click();
      
      cy.get('[data-cy="user-row"]').should('have.length', 1);
      cy.get('[data-cy="user-email"]').should('contain.text', 'test@example.com');
    });

    it('should filter users by status', () => {
      cy.get('[data-cy="status-filter"]').select('active');
      
      cy.get('[data-cy="user-row"]').each(($row) => {
        cy.wrap($row).find('[data-cy="user-status"]').should('contain.text', 'Active');
      });
    });

    it('should view user details', () => {
      cy.get('[data-cy="view-user-button"]').first().click();
      
      cy.get('[data-cy="user-details-modal"]').should('be.visible');
      cy.get('[data-cy="user-profile-info"]').should('be.visible');
      cy.get('[data-cy="user-activity-history"]').should('be.visible');
      cy.get('[data-cy="user-listings-count"]').should('be.visible');
      cy.get('[data-cy="user-bookings-count"]').should('be.visible');
    });

    it('should suspend user account', () => {
      cy.get('[data-cy="user-actions-menu"]').first().click();
      cy.get('[data-cy="suspend-user-button"]').click();
      
      cy.get('[data-cy="suspend-confirmation-modal"]').should('be.visible');
      cy.get('[data-cy="suspension-reason"]').type('Violation of terms of service');
      cy.get('[data-cy="confirm-suspend-button"]').click();
      
      cy.shouldShowSuccess('User suspended successfully');
      cy.get('[data-cy="user-status"]').first().should('contain.text', 'Suspended');
    });

    it('should ban user account', () => {
      cy.get('[data-cy="user-actions-menu"]').first().click();
      cy.get('[data-cy="ban-user-button"]').click();
      
      cy.get('[data-cy="ban-confirmation-modal"]').should('be.visible');
      cy.get('[data-cy="ban-reason"]').type('Fraudulent activity');
      cy.get('[data-cy="ban-duration"]').select('permanent');
      cy.get('[data-cy="confirm-ban-button"]').click();
      
      cy.shouldShowSuccess('User banned successfully');
      cy.get('[data-cy="user-status"]').first().should('contain.text', 'Banned');
    });

    it('should reactivate suspended user', () => {
      // First suspend a user
      cy.get('[data-cy="user-actions-menu"]').first().click();
      cy.get('[data-cy="suspend-user-button"]').click();
      cy.get('[data-cy="suspension-reason"]').type('Test suspension');
      cy.get('[data-cy="confirm-suspend-button"]').click();
      
      // Then reactivate
      cy.get('[data-cy="user-actions-menu"]').first().click();
      cy.get('[data-cy="reactivate-user-button"]').click();
      
      cy.get('[data-cy="reactivate-confirmation-modal"]').should('be.visible');
      cy.get('[data-cy="confirm-reactivate-button"]').click();
      
      cy.shouldShowSuccess('User reactivated successfully');
      cy.get('[data-cy="user-status"]').first().should('contain.text', 'Active');
    });
  });

  describe('Dispute Management', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.visit('/admin/disputes');
    });

    it('should display dispute list', () => {
      cy.get('[data-cy="disputes-table"]').should('be.visible');
      cy.get('[data-cy="dispute-row"]').should('have.length.at.least', 1);
      
      cy.get('[data-cy="dispute-row"]').first().within(() => {
        cy.get('[data-cy="dispute-id"]').should('be.visible');
        cy.get('[data-cy="dispute-type"]').should('be.visible');
        cy.get('[data-cy="dispute-status"]').should('be.visible');
        cy.get('[data-cy="dispute-priority"]').should('be.visible');
        cy.get('[data-cy="dispute-created"]').should('be.visible');
      });
    });

    it('should filter disputes by status', () => {
      cy.get('[data-cy="dispute-status-filter"]').select('pending');
      
      cy.get('[data-cy="dispute-row"]').each(($row) => {
        cy.wrap($row).find('[data-cy="dispute-status"]').should('contain.text', 'Pending');
      });
    });

    it('should filter disputes by priority', () => {
      cy.get('[data-cy="dispute-priority-filter"]').select('high');
      
      cy.get('[data-cy="dispute-row"]').each(($row) => {
        cy.wrap($row).find('[data-cy="dispute-priority"]').should('contain.text', 'High');
      });
    });

    it('should view dispute details', () => {
      cy.get('[data-cy="view-dispute-button"]').first().click();
      
      cy.get('[data-cy="dispute-details-modal"]').should('be.visible');
      cy.get('[data-cy="dispute-description"]').should('be.visible');
      cy.get('[data-cy="dispute-evidence"]').should('be.visible');
      cy.get('[data-cy="dispute-timeline"]').should('be.visible');
      cy.get('[data-cy="dispute-participants"]').should('be.visible');
    });

    it('should resolve dispute with refund', () => {
      cy.get('[data-cy="resolve-dispute-button"]').first().click();
      
      cy.get('[data-cy="resolution-modal"]').should('be.visible');
      cy.get('[data-cy="resolution-type"]').select('full-refund');
      cy.get('[data-cy="resolution-notes"]').type('Item was damaged as described by renter');
      cy.get('[data-cy="confirm-resolution-button"]').click();
      
      cy.shouldShowSuccess('Dispute resolved successfully');
      cy.get('[data-cy="dispute-status"]').first().should('contain.text', 'Resolved');
    });

    it('should resolve dispute with partial refund', () => {
      cy.get('[data-cy="resolve-dispute-button"]').first().click();
      
      cy.get('[data-cy="resolution-type"]').select('partial-refund');
      cy.get('[data-cy="refund-amount"]').type('50');
      cy.get('[data-cy="resolution-notes"]').type('Partial damage, 50% refund appropriate');
      cy.get('[data-cy="confirm-resolution-button"]').click();
      
      cy.shouldShowSuccess('Dispute resolved successfully');
    });

    it('should escalate dispute', () => {
      cy.get('[data-cy="escalate-dispute-button"]').first().click();
      
      cy.get('[data-cy="escalation-modal"]').should('be.visible');
      cy.get('[data-cy="escalation-reason"]').type('Requires senior admin review');
      cy.get('[data-cy="confirm-escalation-button"]').click();
      
      cy.shouldShowSuccess('Dispute escalated successfully');
      cy.get('[data-cy="dispute-status"]').first().should('contain.text', 'Escalated');
    });

    it('should add notes to dispute', () => {
      cy.get('[data-cy="view-dispute-button"]').first().click();
      
      cy.get('[data-cy="add-note-button"]').click();
      cy.get('[data-cy="note-textarea"]').type('Contacted both parties for additional information');
      cy.get('[data-cy="save-note-button"]').click();
      
      cy.shouldShowSuccess('Note added successfully');
      cy.get('[data-cy="dispute-notes"]').should('contain.text', 'Contacted both parties');
    });
  });

  describe('Content Moderation', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.visit('/admin/content');
    });

    it('should display flagged content', () => {
      cy.get('[data-cy="flagged-content-table"]').should('be.visible');
      cy.get('[data-cy="flagged-item"]').should('have.length.at.least', 1);
      
      cy.get('[data-cy="flagged-item"]').first().within(() => {
        cy.get('[data-cy="content-type"]').should('be.visible');
        cy.get('[data-cy="flag-reason"]').should('be.visible');
        cy.get('[data-cy="flag-count"]').should('be.visible');
        cy.get('[data-cy="content-status"]').should('be.visible');
      });
    });

    it('should approve flagged content', () => {
      cy.get('[data-cy="approve-content-button"]').first().click();
      
      cy.get('[data-cy="approval-modal"]').should('be.visible');
      cy.get('[data-cy="approval-notes"]').type('Content reviewed and found appropriate');
      cy.get('[data-cy="confirm-approval-button"]').click();
      
      cy.shouldShowSuccess('Content approved successfully');
      cy.get('[data-cy="content-status"]').first().should('contain.text', 'Approved');
    });

    it('should remove inappropriate content', () => {
      cy.get('[data-cy="remove-content-button"]').first().click();
      
      cy.get('[data-cy="removal-modal"]').should('be.visible');
      cy.get('[data-cy="removal-reason"]').select('inappropriate-content');
      cy.get('[data-cy="removal-notes"]').type('Contains inappropriate language');
      cy.get('[data-cy="confirm-removal-button"]').click();
      
      cy.shouldShowSuccess('Content removed successfully');
      cy.get('[data-cy="content-status"]').first().should('contain.text', 'Removed');
    });

    it('should warn content owner', () => {
      cy.get('[data-cy="warn-user-button"]').first().click();
      
      cy.get('[data-cy="warning-modal"]').should('be.visible');
      cy.get('[data-cy="warning-message"]').type('Please ensure your content follows community guidelines');
      cy.get('[data-cy="send-warning-button"]').click();
      
      cy.shouldShowSuccess('Warning sent to user');
    });
  });

  describe('Analytics and Reporting', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.visit('/admin/analytics');
    });

    it('should display platform statistics', () => {
      cy.get('[data-cy="analytics-dashboard"]').should('be.visible');
      
      cy.get('[data-cy="user-growth-chart"]').should('be.visible');
      cy.get('[data-cy="booking-trends-chart"]').should('be.visible');
      cy.get('[data-cy="revenue-chart"]').should('be.visible');
      cy.get('[data-cy="category-distribution-chart"]').should('be.visible');
    });

    it('should filter analytics by date range', () => {
      cy.get('[data-cy="date-range-picker"]').click();
      cy.get('[data-cy="last-30-days"]').click();
      
      cy.get('[data-cy="analytics-loading"]').should('be.visible');
      cy.get('[data-cy="analytics-loading"]').should('not.exist');
      
      // Charts should update with new data
      cy.get('[data-cy="user-growth-chart"]').should('be.visible');
    });

    it('should export analytics report', () => {
      cy.get('[data-cy="export-report-button"]').click();
      
      cy.get('[data-cy="export-modal"]').should('be.visible');
      cy.get('[data-cy="report-format"]').select('pdf');
      cy.get('[data-cy="report-sections"]').check(['users', 'bookings', 'revenue']);
      cy.get('[data-cy="generate-report-button"]').click();
      
      cy.shouldShowSuccess('Report generated successfully');
      cy.get('[data-cy="download-report-link"]').should('be.visible');
    });
  });

  describe('System Settings', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.visit('/admin/settings');
    });

    it('should display system configuration', () => {
      cy.get('[data-cy="system-settings"]').should('be.visible');
      
      cy.get('[data-cy="platform-settings"]').should('be.visible');
      cy.get('[data-cy="payment-settings"]').should('be.visible');
      cy.get('[data-cy="notification-settings"]').should('be.visible');
      cy.get('[data-cy="security-settings"]').should('be.visible');
    });

    it('should update platform settings', () => {
      cy.get('[data-cy="platform-name"]').clear().type('GearGrab Updated');
      cy.get('[data-cy="maintenance-mode"]').check();
      cy.get('[data-cy="save-platform-settings"]').click();
      
      cy.shouldShowSuccess('Platform settings updated successfully');
    });

    it('should configure payment settings', () => {
      cy.get('[data-cy="service-fee-percentage"]').clear().type('8');
      cy.get('[data-cy="minimum-booking-amount"]').clear().type('25');
      cy.get('[data-cy="save-payment-settings"]').click();
      
      cy.shouldShowSuccess('Payment settings updated successfully');
    });

    it('should manage admin users', () => {
      cy.get('[data-cy="admin-users-tab"]').click();
      
      cy.get('[data-cy="add-admin-button"]').click();
      cy.get('[data-cy="admin-email"]').type('newadmin@example.com');
      cy.get('[data-cy="admin-role"]').select('moderator');
      cy.get('[data-cy="create-admin-button"]').click();
      
      cy.shouldShowSuccess('Admin user created successfully');
      cy.get('[data-cy="admin-user-row"]').should('contain.text', 'newadmin@example.com');
    });
  });
});
