<script lang="ts">
  import { onMount } from 'svelte';
  import UniverseCard from '$lib/components/cards/UniverseCard.svelte';
  import { createListing, addNewListing, testListingCreation } from '$lib/utils/listingHelpers';

  let testListings: any[] = [];
  let validationResults: any[] = [];

  onMount(() => {
    // Run the test function
    testListingCreation();

    // Create various test listings to demonstrate robustness
    const testCases = [
      // Perfect listing
      {
        title: 'Perfect Test Bike',
        category: 'biking',
        dailyPrice: 45,
        description: 'A perfectly structured listing',
        images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
        location: { city: 'Test City', state: 'CO' }
      },
      
      // Listing with bad images (should auto-fix)
      {
        title: 'Camping Gear with Bad Images',
        category: 'camping',
        dailyPrice: 30,
        description: 'This listing has broken image URLs',
        images: ['invalid-url', '', 'not-a-url', 'https://broken-link.com/image.jpg'],
        location: { city: 'Test City', state: 'CO' }
      },
      
      // Minimal listing (should get defaults)
      {
        title: 'Minimal Outdoor Gear',
        category: 'outdoor-gear',
        dailyPrice: 25
      },
      
      // Listing with no images (should get category default)
      {
        title: 'Electric Scooter No Images',
        category: 'electric-mobility',
        dailyPrice: 40,
        description: 'This listing has no images array',
        location: { city: 'Test City', state: 'CO' }
      },
      
      // Listing with unknown category (should get fallback)
      {
        title: 'Unknown Category Item',
        category: 'unknown-category',
        dailyPrice: 35,
        description: 'This has an unknown category',
        location: { city: 'Test City', state: 'CO' }
      }
    ];

    // Process each test case
    testCases.forEach((testCase, index) => {
      try {
        const result = addNewListing(testCase);
        validationResults.push({
          index: index + 1,
          original: testCase,
          result: result,
          success: result.success
        });
        
        if (result.success) {
          testListings.push(result.listing);
        }
      } catch (error) {
        validationResults.push({
          index: index + 1,
          original: testCase,
          result: { success: false, errors: [error.message] },
          success: false
        });
      }
    });

    testListings = testListings; // Trigger reactivity
  });

  function handleCardClick(listing: any) {
    alert(`Clicked on: ${listing.title}`);
  }
</script>

<svelte:head>
  <title>Test Listings - GearGrab</title>
</svelte:head>

<div class="test-page">
  <div class="container">
    <h1>🧪 New Listing Validation Test</h1>
    <p class="description">
      This page demonstrates how new listings automatically display properly with the enhanced validation system.
      All cards below were created with various data quality issues, but the system automatically fixes them.
    </p>

    <!-- Validation Results Summary -->
    <div class="validation-summary">
      <h2>📊 Validation Results</h2>
      {#each validationResults as result}
        <div class="validation-result" class:success={result.success} class:error={!result.success}>
          <h3>Test Case {result.index}: {result.original.title}</h3>
          <div class="result-details">
            <div class="status">
              Status: {result.success ? '✅ Success' : '❌ Failed'}
            </div>
            {#if result.result.errors && result.result.errors.length > 0}
              <div class="errors">
                <strong>Errors:</strong>
                <ul>
                  {#each result.result.errors as error}
                    <li>{error}</li>
                  {/each}
                </ul>
              </div>
            {/if}
            {#if result.result.warnings && result.result.warnings.length > 0}
              <div class="warnings">
                <strong>Warnings:</strong>
                <ul>
                  {#each result.result.warnings as warning}
                    <li>{warning}</li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Test Listings Display -->
    <div class="test-listings">
      <h2>🎯 Generated Listings</h2>
      <p>All listings below display properly with background images and glass effects, regardless of input data quality:</p>
      
      <div class="listings-grid">
        {#each testListings as listing}
          <UniverseCard {listing} onClick={() => handleCardClick(listing)} width="250px" height="300px" />
        {/each}
      </div>
    </div>

    <!-- Usage Instructions -->
    <div class="usage-instructions">
      <h2>📝 How to Use for New Listings</h2>
      <div class="code-example">
        <h3>1. Import the utilities:</h3>
        <pre><code>import &#123; createListing, addNewListing &#125; from '$lib/utils/listingHelpers';</code></pre>
        
        <h3>2. Create a new listing:</h3>
        <pre><code>const newListing = createListing(&#123;
  title: 'My Awesome Gear',
  category: 'biking',
  dailyPrice: 45,
  description: 'Great gear for outdoor adventures',
  images: ['https://example.com/image.jpg'], // Optional
  location: &#123; city: 'Denver', state: 'CO' &#125; // Optional
&#125;);</code></pre>

        <h3>3. Validate before adding:</h3>
        <pre><code>const result = addNewListing(listingData);
if (result.success) &#123;
  // Add to database
  console.log('Listing created:', result.listing);
&#125; else &#123;
  console.error('Validation failed:', result.errors);
&#125;</code></pre>
      </div>
    </div>
  </div>
</div>

<style>
  .test-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    color: white;
    padding: 2rem 0;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  h1 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #00ffd6, #08e260);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .description {
    text-align: center;
    font-size: 1.1rem;
    margin-bottom: 3rem;
    opacity: 0.9;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }

  .validation-summary {
    margin-bottom: 3rem;
  }

  .validation-result {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    border-left: 4px solid #00ffd6;
  }

  .validation-result.error {
    border-left-color: #ff4444;
  }

  .validation-result h3 {
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
  }

  .result-details {
    font-size: 0.9rem;
  }

  .status {
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .errors, .warnings {
    margin-top: 0.5rem;
  }

  .errors ul, .warnings ul {
    margin: 0.5rem 0 0 1rem;
    padding: 0;
  }

  .errors {
    color: #ff8888;
  }

  .warnings {
    color: #ffaa44;
  }

  .test-listings {
    margin-bottom: 3rem;
  }

  .listings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
  }

  .usage-instructions {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 2rem;
  }

  .code-example h3 {
    color: #00ffd6;
    margin: 1.5rem 0 0.5rem 0;
  }

  .code-example h3:first-child {
    margin-top: 0;
  }

  pre {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
    margin: 0.5rem 0 1rem 0;
  }

  code {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9rem;
    color: #e0e0e0;
  }

  h2 {
    color: #00ffd6;
    margin-bottom: 1rem;
  }
</style>
