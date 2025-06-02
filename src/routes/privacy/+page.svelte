<script lang="ts">
  export const prerender = true;
</script>

<svelte:head>
  <title>Privacy Policy - GearGrab</title>
  <meta name="description" content="Privacy Policy for GearGrab - how we collect, use, and protect your personal information" />
</svelte:head>

<!-- Full Page Background -->
<div class="fixed inset-0 z-0">
  <div class="absolute inset-0">
    <img
      src="/pexels-bianca-gasparoto-834990-1752951.jpg"
      alt="Mountain landscape"
      class="w-full h-full object-cover"
    >
  </div>
  <div class="absolute inset-0 bg-black opacity-50"></div>
</div>

<!-- Page Content -->
<div class="relative z-10 min-h-screen py-8 pt-24">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

    <!-- Header -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8 mb-8">
      <h1 class="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
      <p class="text-gray-300 text-lg">Last updated: {new Date().toLocaleDateString()}</p>
      <p class="text-gray-300 mt-4">
        This Privacy Policy explains how GearGrab collects, uses, and protects your personal information
        when you use our peer-to-peer outdoor gear rental platform.
      </p>
    </div>

    <!-- Privacy Content -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8 space-y-8">

      <!-- 1. Information We Collect -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
        <div class="text-gray-300 space-y-4">

          <h3 class="text-xl font-semibold text-white">Personal Information</h3>
          <p>When you create an account or use our services, we collect:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Name, email address, phone number, and date of birth</li>
            <li>Government-issued ID for identity verification</li>
            <li>Payment information (processed securely by our payment partners)</li>
            <li>Profile photos and gear listing photos</li>
            <li>Address and location information for deliveries and pickups</li>
            <li>Emergency contact information</li>
          </ul>

          <h3 class="text-xl font-semibold text-white mt-6">Usage Information</h3>
          <p>We automatically collect information about how you use our platform:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Device information (IP address, browser type, operating system)</li>
            <li>Usage patterns and preferences</li>
            <li>Search queries and booking history</li>
            <li>Communication records within our platform</li>
            <li>Location data when you use location-based features</li>
          </ul>

          <h3 class="text-xl font-semibold text-white mt-6">Third-Party Information</h3>
          <p>We may receive information from third parties such as:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Social media platforms when you connect your accounts</li>
            <li>Background check providers for safety verification</li>
            <li>Payment processors for transaction processing</li>
            <li>Insurance providers for claims processing</li>
          </ul>
        </div>
      </section>

      <!-- 2. How We Use Your Information -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
        <div class="text-gray-300 space-y-4">
          <p>We use your information to:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Provide and improve our rental platform services</li>
            <li>Verify your identity and maintain platform safety</li>
            <li>Process payments and manage transactions</li>
            <li>Facilitate communication between users</li>
            <li>Provide customer support and resolve disputes</li>
            <li>Send important updates about your bookings and account</li>
            <li>Personalize your experience and show relevant content</li>
            <li>Comply with legal obligations and prevent fraud</li>
            <li>Analyze usage patterns to improve our services</li>
            <li>Send marketing communications (with your consent)</li>
          </ul>
        </div>
      </section>

      <!-- 3. Information Sharing -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">3. Information Sharing</h2>
        <div class="text-gray-300 space-y-4">

          <h3 class="text-xl font-semibold text-white">With Other Users</h3>
          <p>We share limited information to facilitate rentals:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Profile information (name, photo, reviews, verification status)</li>
            <li>Contact information when bookings are confirmed</li>
            <li>Location information for pickup/delivery coordination</li>
          </ul>

          <h3 class="text-xl font-semibold text-white mt-6">With Service Providers</h3>
          <p>We work with trusted third parties who help us operate our platform:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Payment processors for secure transactions</li>
            <li>Identity verification and background check services</li>
            <li>Insurance providers for coverage and claims</li>
            <li>Cloud hosting and data storage providers</li>
            <li>Customer support and communication tools</li>
            <li>Analytics and marketing platforms</li>
          </ul>

          <h3 class="text-xl font-semibold text-white mt-6">Legal Requirements</h3>
          <p>We may disclose information when required by law or to:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Comply with legal processes and government requests</li>
            <li>Protect our rights, property, and safety</li>
            <li>Prevent fraud and ensure platform security</li>
            <li>Enforce our Terms of Service</li>
          </ul>
        </div>
      </section>

      <!-- 4. Data Security -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">4. Data Security</h2>
        <div class="text-gray-300 space-y-4">
          <p>
            We implement industry-standard security measures to protect your personal information:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Encryption of data in transit and at rest</li>
            <li>Secure payment processing through PCI-compliant providers</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Access controls and employee training on data protection</li>
            <li>Incident response procedures for potential breaches</li>
          </ul>
          <p>
            While we strive to protect your information, no method of transmission over the internet
            is 100% secure. We cannot guarantee absolute security but will notify you of any
            significant data breaches as required by law.
          </p>
        </div>
      </section>

      <!-- 5. Your Rights and Choices -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">5. Your Rights and Choices</h2>
        <div class="text-gray-300 space-y-4">
          <p>You have the following rights regarding your personal information:</p>

          <h3 class="text-xl font-semibold text-white">Access and Portability</h3>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Request a copy of your personal information</li>
            <li>Download your data in a portable format</li>
            <li>View your account information and activity history</li>
          </ul>

          <h3 class="text-xl font-semibold text-white mt-6">Correction and Updates</h3>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Update your profile and account information</li>
            <li>Correct inaccurate or incomplete data</li>
            <li>Modify your communication preferences</li>
          </ul>

          <h3 class="text-xl font-semibold text-white mt-6">Deletion and Restriction</h3>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Request deletion of your account and personal data</li>
            <li>Restrict processing of your information</li>
            <li>Object to certain uses of your data</li>
          </ul>

          <h3 class="text-xl font-semibold text-white mt-6">Marketing Communications</h3>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Opt out of marketing emails and notifications</li>
            <li>Manage your communication preferences</li>
            <li>Unsubscribe from promotional content</li>
          </ul>
        </div>
      </section>

      <!-- 6. Data Retention -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">6. Data Retention</h2>
        <div class="text-gray-300 space-y-4">
          <p>We retain your information for as long as necessary to:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Provide our services and maintain your account</li>
            <li>Comply with legal obligations and resolve disputes</li>
            <li>Maintain safety and security records</li>
            <li>Process insurance claims and warranty issues</li>
          </ul>
          <p>
            When you delete your account, we will remove your personal information within
            30 days, except for data we're required to retain for legal or safety purposes.
          </p>
        </div>
      </section>

      <!-- 7. Children's Privacy -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">7. Children's Privacy</h2>
        <div class="text-gray-300 space-y-4">
          <p>
            GearGrab is not intended for use by children under 18 years of age. We do not
            knowingly collect personal information from children under 18. If we become
            aware that we have collected such information, we will delete it promptly.
          </p>
        </div>
      </section>

      <!-- 8. International Users -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">8. International Users</h2>
        <div class="text-gray-300 space-y-4">
          <p>
            GearGrab operates primarily in the United States. If you access our services
            from outside the US, your information may be transferred to and processed in
            the United States, which may have different privacy laws than your country.
          </p>
        </div>
      </section>

      <!-- 9. Changes to This Policy -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">9. Changes to This Policy</h2>
        <div class="text-gray-300 space-y-4">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of
            significant changes by email or through our platform. Your continued use of
            GearGrab after changes are posted constitutes acceptance of the updated policy.
          </p>
        </div>
      </section>

      <!-- 10. Contact Us -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
        <div class="text-gray-300 space-y-4">
          <p>
            If you have questions about this Privacy Policy or want to exercise your rights,
            please contact us:
          </p>
          <div class="bg-white/5 rounded-lg p-4 border border-white/10">
            <p><strong>Email:</strong> privacy@geargrab.co</p>
            <p><strong>Address:</strong> GearGrab Privacy Team</p>
            <p>123 Outdoor Way, Adventure City, AC 12345</p>
            <p><strong>Phone:</strong> 1-800-GEARGRAB</p>
          </div>
        </div>
      </section>

    </div>
  </div>
</div>
