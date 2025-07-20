// Basic smoke test to verify the application loads
describe('Basic Smoke Test', () => {
  it('should load the homepage', () => {
    cy.visit('/');
    cy.get('body').should('be.visible');
    cy.title().should('not.be.empty');
    cy.contains('GearGrab').should('be.visible');
  });

  it('should navigate to sign in page from header', () => {
    cy.visit('/');
    cy.contains('Sign In').click();
    cy.url().should('include', '/auth/signin');
  });

  it('should navigate to auth page directly', () => {
    cy.visit('/auth/signin');
    cy.get('body').should('be.visible');
    cy.get('[data-cy="signin-page"]').should('be.visible');
  });

  it('should navigate to signup page directly', () => {
    cy.visit('/auth/signup');
    cy.get('body').should('be.visible');
    cy.get('[data-cy="signup-page"]').should('be.visible');
  });

  it('should display gear page', () => {
    cy.visit('/gear');
    cy.get('body').should('be.visible');
    cy.contains('All Categories').should('be.visible');
  });

  it('should have working navigation links', () => {
    cy.visit('/');
    cy.contains('GearGrab').should('be.visible');
    cy.get('nav').should('be.visible');
  });
});
