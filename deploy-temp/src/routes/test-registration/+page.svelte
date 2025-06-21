<script lang="ts">
  import RegistrationForm from '$lib/components/RegistrationForm.svelte';

  /**
   * Test page for the Registration Form with simple validation
   *
   * This page demonstrates:
   * - Complete registration form with validation
   * - Simple HTML5 validation
   * - Basic error handling
   */

  let showValidationDemo = false;

  // Test data for quick form filling
  const testData = {
    valid: {
      email: 'test@geargrab.co',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe123',
      phoneNumber: '(555) 123-4567',
      age: 25,
      gender: 'male',
      agreeToTerms: true,
      agreeToPrivacy: true
    },
    invalid: {
      email: 'invalid-email',
      password: '123',
      confirmPassword: '456',
      firstName: '',
      lastName: 'D',
      username: 'a',
      phoneNumber: '123',
      age: 5
    }
  };

  function fillFormWithTestData(type: 'valid' | 'invalid') {
    const data = testData[type];
    
    // This would typically be done through form binding
    // For demo purposes, we'll show the data structure
    console.log(`${type} test data:`, data);
    
    if (type === 'valid') {
      alert('Valid test data logged to console. In a real implementation, this would fill the form.');
    } else {
      alert('Invalid test data logged to console. This would trigger validation errors.');
    }
  }
</script>

<svelte:head>
  <title>Registration Form Test - GearGrab</title>
  <meta name="description" content="Test page for registration form with simple validation" />
</svelte:head>

<div class="test-page">
  <header class="page-header">
    <h1>🔐 Registration Form with Simple Validation</h1>
    <p>Clean registration form with HTML5 validation and basic error handling</p>
  </header>

  <!-- Validation Demo Section -->
  <section class="demo-section">
    <h2>🧪 Validation Demo</h2>
    <button 
      class="toggle-button"
      on:click={() => showValidationDemo = !showValidationDemo}
    >
      {showValidationDemo ? 'Hide' : 'Show'} Validation Features
    </button>

    {#if showValidationDemo}
      <div class="validation-demo">

        <h3>Validation Features</h3>
        <div class="features-grid">
          <div class="feature-card">
            <h4>📧 Email Validation</h4>
            <ul>
              <li>Valid email format</li>
              <li>HTML5 email validation</li>
              <li>Required field checking</li>
            </ul>
          </div>

          <div class="feature-card">
            <h4>🔒 Password Security</h4>
            <ul>
              <li>Minimum 8 characters</li>
              <li>Password confirmation</li>
              <li>Simple strength checking</li>
            </ul>
          </div>

          <div class="feature-card">
            <h4>👤 Profile Validation</h4>
            <ul>
              <li>Required name fields</li>
              <li>Optional username</li>
              <li>Basic phone validation</li>
            </ul>
          </div>

          <div class="feature-card">
            <h4>🎯 Simple Features</h4>
            <ul>
              <li>HTML5 validation</li>
              <li>Password confirmation</li>
              <li>Terms agreement required</li>
            </ul>
          </div>
        </div>

        <h3>Test Data</h3>
        <div class="test-buttons">
          <button 
            class="test-button valid"
            on:click={() => fillFormWithTestData('valid')}
          >
            📋 Show Valid Test Data
          </button>
          <button 
            class="test-button invalid"
            on:click={() => fillFormWithTestData('invalid')}
          >
            ❌ Show Invalid Test Data
          </button>
        </div>
      </div>
    {/if}
  </section>

  <!-- Registration Form -->
  <section class="form-section">
    <RegistrationForm />
  </section>

  <!-- API Testing Section -->
  <section class="api-section">
    <h2>🔌 API Testing</h2>
    <div class="api-info">
      <h3>Available Endpoints:</h3>
      <ul>
        <li><code>POST /api/auth/register</code> - Full registration with validation</li>
        <li><code>PATCH /api/auth/register</code> - Individual field validation</li>
      </ul>
      
      <h3>Test with cURL:</h3>
      <pre><code>curl -X POST "http://localhost:5173/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '&#123;
    "email": "test@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "agreeToTerms": true,
    "agreeToPrivacy": true
  &#125;'</code></pre>
    </div>
  </section>
</div>

<style>
  .test-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .page-header h1 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
  }

  .page-header p {
    color: #7f8c8d;
    font-size: 1.1rem;
  }

  .demo-section {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 3rem;
  }

  .toggle-button {
    background: #3498db;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s ease;
  }

  .toggle-button:hover {
    background: #2980b9;
  }

  .validation-demo {
    margin-top: 2rem;
  }

  .password-tester {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    border: 1px solid #e1e8ed;
  }

  .password-tester label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .password-tester input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .strength-display {
    margin-top: 1rem;
  }

  .strength-bar {
    width: 100%;
    height: 6px;
    background-color: #eee;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .strength-fill {
    height: 100%;
    transition: width 0.3s ease;
  }

  .strength-fill.strength-0,
  .strength-fill.strength-1,
  .strength-fill.strength-2 { background-color: #e74c3c; }
  .strength-fill.strength-3,
  .strength-fill.strength-4 { background-color: #f39c12; }
  .strength-fill.strength-5,
  .strength-fill.strength-6 { background-color: #27ae60; }

  .strength-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .strength-status.strong {
    color: #27ae60;
    font-weight: 500;
  }

  .strength-status.weak {
    color: #e74c3c;
    font-weight: 500;
  }

  .feedback-list {
    font-size: 0.875rem;
    color: #666;
    margin: 0;
    padding-left: 1rem;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .feature-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #e1e8ed;
  }

  .feature-card h4 {
    margin-bottom: 1rem;
    color: #2c3e50;
  }

  .feature-card ul {
    margin: 0;
    padding-left: 1.2rem;
  }

  .feature-card li {
    margin-bottom: 0.5rem;
    color: #555;
  }

  .test-buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .test-button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.3s ease;
  }

  .test-button.valid {
    background: #27ae60;
    color: white;
  }

  .test-button.valid:hover {
    background: #229954;
  }

  .test-button.invalid {
    background: #e74c3c;
    color: white;
  }

  .test-button.invalid:hover {
    background: #c0392b;
  }

  .form-section {
    margin-bottom: 3rem;
  }

  .api-section {
    background: #2c3e50;
    color: white;
    padding: 2rem;
    border-radius: 12px;
  }

  .api-section h2 {
    margin-bottom: 1.5rem;
  }

  .api-info ul {
    margin-bottom: 1.5rem;
  }

  .api-info code {
    background: #34495e;
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
  }

  .api-info pre {
    background: #34495e;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 0.875rem;
    line-height: 1.4;
  }

  .api-info pre code {
    background: none;
    padding: 0;
  }
</style>
