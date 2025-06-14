<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let title: string = 'Contact Us';
  export let subtitle: string = 'Send your message';
  export let description: string = 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.';
  export let showContactInfo: boolean = true;
  export let contactInfo = {
    address: {
      line1: 'Your Street Address',
      line2: 'City, State ZIP'
    },
    phone: {
      primary: '(555) 123-4567',
      secondary: '(555) 987-6543'
    },
    email: {
      primary: 'hello@geargrab.com',
      secondary: 'support@geargrab.com'
    }
  };
  
  const dispatch = createEventDispatcher();
  
  let formData = {
    name: '',
    phone: '',
    email: '',
    message: ''
  };
  
  let isSubmitting = false;
  let errors: Record<string, string> = {};
  
  function validateForm() {
    errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    }
    
    return Object.keys(errors).length === 0;
  }
  
  async function handleSubmit() {
    if (!validateForm()) return;
    
    isSubmitting = true;
    
    try {
      dispatch('submit', formData);
      // Reset form on successful submission
      formData = { name: '', phone: '', email: '', message: '' };
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<section class="contact-section">
  <div class="container">
    <div class="contact-grid">
      {#if showContactInfo}
        <div class="contact-info">
          <h2 class="info-title">{title}</h2>
          
          <div class="info-item">
            <div class="info-icon">
              <i class="fas fa-map-marker-alt"></i>
            </div>
            <div class="info-content">
              <span class="info-text">{contactInfo.address.line1}</span>
              <span class="info-text">{contactInfo.address.line2}</span>
            </div>
          </div>
          
          <div class="info-item">
            <div class="info-icon">
              <i class="fas fa-phone-alt"></i>
            </div>
            <div class="info-content">
              <span class="info-text">{contactInfo.phone.primary}</span>
              <span class="info-text">{contactInfo.phone.secondary}</span>
            </div>
          </div>
          
          <div class="info-item">
            <div class="info-icon">
              <i class="fas fa-envelope"></i>
            </div>
            <div class="info-content">
              <span class="info-text">{contactInfo.email.primary}</span>
              <span class="info-text">{contactInfo.email.secondary}</span>
            </div>
          </div>
        </div>
      {/if}
      
      <div class="contact-form-container">
        <h2 class="form-title">{subtitle}</h2>
        <div class="title-divider"></div>
        <p class="form-description">{description}</p>
        
        <form on:submit|preventDefault={handleSubmit} class="contact-form">
          <div class="form-row">
            <div class="form-group">
              <label for="name" class="form-label">Name *</label>
              <input
                type="text"
                id="name"
                bind:value={formData.name}
                class="form-input"
                class:error={errors.name}
                placeholder="Your name"
                required
              />
              {#if errors.name}
                <span class="error-message">{errors.name}</span>
              {/if}
            </div>
            
            <div class="form-group">
              <label for="phone" class="form-label">Phone</label>
              <input
                type="tel"
                id="phone"
                bind:value={formData.phone}
                class="form-input"
                placeholder="Your phone number"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="email" class="form-label">Email *</label>
            <input
              type="email"
              id="email"
              bind:value={formData.email}
              class="form-input"
              class:error={errors.email}
              placeholder="your.email@example.com"
              required
            />
            {#if errors.email}
              <span class="error-message">{errors.email}</span>
            {/if}
          </div>
          
          <div class="form-group">
            <label for="message" class="form-label">Message *</label>
            <textarea
              id="message"
              bind:value={formData.message}
              class="form-textarea"
              class:error={errors.message}
              placeholder="Tell us how we can help you..."
              rows="5"
              required
            ></textarea>
            {#if errors.message}
              <span class="error-message">{errors.message}</span>
            {/if}
          </div>
          
          <button
            type="submit"
            class="submit-button"
            disabled={isSubmitting}
          >
            {#if isSubmitting}
              <i class="fas fa-spinner fa-spin"></i>
              Sending...
            {:else}
              Submit Message
            {/if}
          </button>
        </form>
      </div>
    </div>
  </div>
</section>

<style>
  .contact-section {
    padding: 4rem 0;
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    color: white;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  .contact-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 4rem;
    align-items: start;
  }
  
  /* Contact Info Styles */
  .contact-info {
    padding: 2rem 0;
  }
  
  .info-title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 2rem;
    color: #FBDF7E;
  }
  
  .info-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 2.5rem;
  }
  
  .info-icon {
    width: 50px;
    height: 50px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    flex-shrink: 0;
  }
  
  .info-icon i {
    font-size: 1.25rem;
    color: #FBDF7E;
  }
  
  .info-content {
    display: flex;
    flex-direction: column;
  }
  
  .info-text {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.5;
  }
  
  /* Form Styles */
  .contact-form-container {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .form-title {
    font-size: 1.75rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  .title-divider {
    width: 60px;
    height: 3px;
    background: #FBDF7E;
    margin-bottom: 1rem;
  }
  
  .form-description {
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 2rem;
    line-height: 1.6;
  }
  
  .contact-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
  }
  
  .form-label {
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .form-input,
  .form-textarea {
    padding: 0.75rem 1rem;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.875rem;
    transition: all 0.3s ease;
  }
  
  .form-input:focus,
  .form-textarea:focus {
    outline: none;
    border-color: #FBDF7E;
    background: rgba(255, 255, 255, 0.15);
  }
  
  .form-input::placeholder,
  .form-textarea::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  .form-input.error,
  .form-textarea.error {
    border-color: #ef4444;
  }
  
  .error-message {
    font-size: 0.75rem;
    color: #ef4444;
    margin-top: 0.25rem;
  }
  
  .submit-button {
    background: #FBDF7E;
    color: #1f2937;
    border: none;
    padding: 0.875rem 2rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s ease;
    align-self: flex-start;
  }
  
  .submit-button:hover:not(:disabled) {
    background: #f59e0b;
    transform: translateY(-2px);
  }
  
  .submit-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .contact-grid {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .contact-form-container {
      padding: 1.5rem;
    }
    
    .info-title {
      font-size: 1.5rem;
    }
    
    .form-title {
      font-size: 1.5rem;
    }
  }
</style>
