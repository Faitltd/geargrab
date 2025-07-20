// API Registration Endpoint Tests
describe('Registration API', () => {
  it('should register a new user successfully', () => {
    const userData = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User'
    };

    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: userData,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('user');
      expect(response.body.user).to.have.property('email', userData.email);
      expect(response.body.user).to.have.property('name', userData.name);
    });
  });

  it('should reject registration with missing fields', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        email: 'test@example.com'
        // missing password and name
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('message');
    });
  });

  it('should reject registration with invalid email', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        email: 'invalid-email',
        password: 'TestPassword123!',
        name: 'Test User'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('message');
    });
  });

  it('should reject registration with weak password', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        email: 'test@example.com',
        password: '123', // too short
        name: 'Test User'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('message');
    });
  });
});
