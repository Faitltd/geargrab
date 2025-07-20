<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
  <title>Privacy Policy - GearGrab</title>
  <meta name="description" content="Privacy Policy for GearGrab - how we collect, use, and protect your personal information" />
</svelte:head>

<Header />

<main class="min-h-screen bg-gray-50 py-12">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p class="text-gray-600">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <!-- Content -->
      <div class="prose prose-gray max-w-none">
        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            We collect information you provide directly to us, such as when you create an account, list items, make bookings, or contact us for support.
          </p>
          
          <h3 class="text-xl font-semibold text-gray-900 mb-3">Personal Information</h3>
          <ul class="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>Name and contact information</li>
            <li>Email address and phone number</li>
            <li>Profile photos and verification documents</li>
            <li>Payment information (processed securely by our payment partners)</li>
            <li>Location data for gear listings and rentals</li>
          </ul>

          <h3 class="text-xl font-semibold text-gray-900 mb-3">Usage Information</h3>
          <ul class="list-disc list-inside text-gray-700 space-y-2">
            <li>How you interact with our platform</li>
            <li>Search queries and browsing history</li>
            <li>Device information and IP address</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            We use the information we collect to:
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2">
            <li>Provide and improve our services</li>
            <li>Process transactions and send confirmations</li>
            <li>Verify user identity and prevent fraud</li>
            <li>Send important updates and notifications</li>
            <li>Provide customer support</li>
            <li>Analyze usage patterns to improve user experience</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            We do not sell your personal information. We may share your information in the following circumstances:
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>With other users:</strong> Profile information, reviews, and listing details</li>
            <li><strong>Service providers:</strong> Payment processors, verification services, and analytics</li>
            <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business transfers:</strong> In connection with mergers or acquisitions</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            We implement appropriate technical and organizational measures to protect your personal information:
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments and updates</li>
            <li>Access controls and authentication</li>
            <li>Secure payment processing through certified partners</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">5. Your Rights and Choices</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            You have the following rights regarding your personal information:
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Access:</strong> Request a copy of your personal information</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your account and data</li>
            <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
            <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">6. Cookies and Tracking</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            We use cookies and similar technologies to enhance your experience:
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2">
            <li>Essential cookies for platform functionality</li>
            <li>Analytics cookies to understand usage patterns</li>
            <li>Preference cookies to remember your settings</li>
          </ul>
          <p class="text-gray-700 leading-relaxed mt-4">
            You can control cookie settings through your browser preferences.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            We retain your information for as long as necessary to provide our services and comply with legal obligations. When you delete your account, we will delete or anonymize your personal information within 30 days.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">8. International Transfers</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information during such transfers.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            Our service is not intended for children under 18. We do not knowingly collect personal information from children under 18. If we become aware of such collection, we will delete the information immediately.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any material changes by email or through our platform. Your continued use of our services after such changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-gray-700">
              <strong>Email:</strong> privacy@geargrab.com<br>
              <strong>Address:</strong> GearGrab Inc., 123 Main Street, San Francisco, CA 94105<br>
              <strong>Data Protection Officer:</strong> dpo@geargrab.com
            </p>
          </div>
        </section>
      </div>

      <!-- Footer Navigation -->
      <div class="mt-12 pt-8 border-t border-gray-200">
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/terms" class="text-primary-600 hover:text-primary-700 font-medium transition-colors">
            Terms of Service
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
