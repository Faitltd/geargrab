
describe('Ultra Simple Auth Test', () => {
  it('should load the website', () => {
    cy.visit('https://geargrab.co');
    cy.get('body').should('be.visible');
    cy.title().should('not.be.empty');
  });
  
  it('should have basic page structure', () => {
    cy.visit('https://geargrab.co');
    cy.get('html').should('exist');
    cy.get('head').should('exist');
    cy.get('body').should('exist');
  });
});