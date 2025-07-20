<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
  <title>Terms of Service - GearGrab</title>
  <meta name="description" content="Terms of Service for GearGrab - peer-to-peer gear rental marketplace" />
</svelte:head>

<Header />

<main class="min-h-screen bg-gray-50 py-12">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p class="text-gray-600">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <!-- Content -->
      <div class="prose prose-gray max-w-none">
        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            By accessing and using GearGrab ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            GearGrab is a peer-to-peer marketplace that connects gear owners with renters. We provide a platform for users to list, discover, and rent outdoor equipment, tools, and other items.
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2">
            <li>Listing and renting gear</li>
            <li>Secure payment processing</li>
            <li>User verification and reviews</li>
            <li>Customer support</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            As a user of GearGrab, you agree to:
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2">
            <li>Provide accurate and truthful information</li>
            <li>Maintain the security of your account</li>
            <li>Treat all gear with care and respect</li>
            <li>Return items in the same condition as received</li>
            <li>Communicate respectfully with other users</li>
            <li>Comply with all applicable laws and regulations</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">4. Prohibited Activities</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            You may not use GearGrab to:
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2">
            <li>List illegal, stolen, or counterfeit items</li>
            <li>Engage in fraudulent activities</li>
            <li>Harass or threaten other users</li>
            <li>Violate intellectual property rights</li>
            <li>Attempt to circumvent our payment system</li>
            <li>Use the platform for commercial purposes without authorization</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">5. Payment and Fees</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            GearGrab charges service fees for successful transactions. Payment processing is handled securely through our payment partners. All fees are clearly disclosed before completing a transaction.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">6. Liability and Insurance</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            While we strive to provide a safe platform, GearGrab is not responsible for:
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2">
            <li>Damage to or loss of rented items</li>
            <li>Injuries resulting from use of rented equipment</li>
            <li>Disputes between users</li>
            <li>Quality or condition of listed items</li>
          </ul>
          <p class="text-gray-700 leading-relaxed mt-4">
            Users are encouraged to obtain appropriate insurance coverage for their activities and equipment.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">7. Privacy Policy</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">8. Termination</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            We reserve the right to terminate or suspend your account at any time for violations of these terms or for any other reason at our sole discretion.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">9. Changes to Terms</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            We reserve the right to modify these terms at any time. Users will be notified of significant changes, and continued use of the service constitutes acceptance of the modified terms.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <strong>Email:</strong> legal@geargrab.com<br>
              <strong>Address:</strong> GearGrab Inc., 123 Main Street, San Francisco, CA 94105
            </p>
          </div>
        </section>
      </div>

      <!-- Footer Navigation -->
      <div class="mt-12 pt-8 border-t border-gray-200">
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/privacy" class="text-primary-600 hover:text-primary-700 font-medium transition-colors">
            Privacy Policy
          </a>
          <a href="/contact" class="text-primary-600 hover:text-primary-700 font-medium transition-colors">
            Contact Us
          </a>
          <a href="/help" class="text-primary-600 hover:text-primary-700 font-medium transition-colors">
            Help Center
          </a>
        </div>
      </div>
    </div>
  </div>
</main>

<Footer />
