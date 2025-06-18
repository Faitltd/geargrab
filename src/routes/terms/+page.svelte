<script lang="ts">
  export const prerender = true;
</script>

<svelte:head>
  <title>Terms of Service - GearGrab</title>
  <meta name="description" content="Terms of Service for GearGrab - peer-to-peer outdoor gear rental platform" />
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
      <h1 class="text-4xl font-bold text-white mb-4">Terms of Service</h1>
      <p class="text-gray-300 text-lg">Last updated: {new Date().toLocaleDateString()}</p>
      <p class="text-gray-300 mt-4">
        These Terms of Service govern your use of GearGrab's peer-to-peer outdoor gear rental platform.
        By using our service, you agree to these terms.
      </p>
    </div>

    <!-- Terms Content -->
    <div class="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8 space-y-8">

      <!-- 1. Acceptance of Terms -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
        <div class="text-gray-300 space-y-4">
          <p>
            By accessing or using GearGrab ("the Platform"), you agree to be bound by these Terms of Service
            and our Privacy Policy. If you do not agree to these terms, you may not use our service.
          </p>
          <p>
            We reserve the right to modify these terms at any time. Changes will be effective immediately
            upon posting. Your continued use of the Platform constitutes acceptance of any modifications.
          </p>
        </div>
      </section>

      <!-- 2. Platform Description -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">2. Platform Description</h2>
        <div class="text-gray-300 space-y-4">
          <p>
            GearGrab is a peer-to-peer marketplace that connects outdoor enthusiasts who want to rent
            gear ("Renters") with individuals who own outdoor equipment ("Owners"). We facilitate
            transactions but are not a party to the rental agreements between users.
          </p>
          <p>
            Our platform provides tools for listing gear, booking rentals, processing payments,
            and facilitating communication between users. We also provide insurance coverage and
            dispute resolution services.
          </p>
        </div>
      </section>

      <!-- 3. User Accounts -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
        <div class="text-gray-300 space-y-4">
          <p>
            To use GearGrab, you must create an account and provide accurate, complete information.
            You are responsible for maintaining the security of your account and all activities
            that occur under your account.
          </p>
          <p>
            You must be at least 18 years old to use our service. By creating an account, you
            represent that you meet this age requirement and have the legal capacity to enter
            into binding agreements.
          </p>
          <p>
            You agree to notify us immediately of any unauthorized use of your account or any
            other breach of security. We are not liable for any loss or damage arising from
            your failure to protect your account information.
          </p>
        </div>
      </section>

      <!-- 4. User Responsibilities -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">4. User Responsibilities</h2>
        <div class="text-gray-300 space-y-4">
          <h3 class="text-xl font-semibold text-white">For All Users:</h3>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Provide accurate and truthful information in all communications</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Respect other users and maintain professional conduct</li>
            <li>Not use the platform for illegal or unauthorized purposes</li>
            <li>Complete identity verification when required</li>
          </ul>

          <h3 class="text-xl font-semibold text-white mt-6">For Gear Owners:</h3>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Accurately describe gear condition, specifications, and availability</li>
            <li>Provide high-quality photos that represent the actual gear</li>
            <li>Maintain gear in safe, functional condition</li>
            <li>Respond promptly to booking requests and messages</li>
            <li>Honor confirmed bookings and availability commitments</li>
            <li>Provide proper instructions for gear use and safety</li>
          </ul>

          <h3 class="text-xl font-semibold text-white mt-6">For Renters:</h3>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Use gear only for its intended purpose and within your skill level</li>
            <li>Return gear in the same condition as received (normal wear excepted)</li>
            <li>Follow all safety instructions and use proper safety equipment</li>
            <li>Report any damage or issues immediately</li>
            <li>Complete rentals on time and communicate any delays</li>
            <li>Treat gear with care and respect</li>
          </ul>
        </div>
      </section>

      <!-- 5. Payments and Fees -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">5. Payments and Fees</h2>
        <div class="text-gray-300 space-y-4">
          <p>
            All payments are processed through our secure payment system. Renters are charged
            when bookings are confirmed by gear owners. We collect service fees from both
            renters and owners as outlined in our fee schedule.
          </p>
          <p>
            Security deposits may be held (not charged) during rental periods and are released
            upon successful completion of rentals. Refunds are processed according to our
            cancellation policy.
          </p>
          <p>
            You are responsible for all taxes related to your use of the platform. Owners
            are responsible for reporting rental income to appropriate tax authorities.
          </p>
        </div>
      </section>

      <!-- 6. Insurance and Liability -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">6. Insurance and Liability</h2>
        <div class="text-gray-300 space-y-4">
          <p>
            GearGrab provides insurance coverage for eligible rentals, including damage
            protection and liability coverage. Coverage details and limitations are
            outlined in our insurance policy documents.
          </p>
          <p>
            Users participate in outdoor activities at their own risk. GearGrab is not
            liable for injuries, accidents, or damages that occur during gear use.
            Users should maintain appropriate personal insurance coverage.
          </p>
          <p>
            Our liability is limited to the maximum extent permitted by law. We are not
            responsible for the condition, safety, or suitability of gear listed on
            our platform.
          </p>
        </div>
      </section>

      <!-- 7. Prohibited Uses -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">7. Prohibited Uses</h2>
        <div class="text-gray-300 space-y-4">
          <p>You may not use GearGrab to:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Harass, threaten, or harm other users</li>
            <li>Post false, misleading, or fraudulent content</li>
            <li>Attempt to circumvent our payment system</li>
            <li>Use automated systems to access our platform</li>
            <li>Rent gear for commercial purposes without authorization</li>
            <li>List stolen, counterfeit, or recalled gear</li>
          </ul>
        </div>
      </section>

      <!-- 8. Termination -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">8. Termination</h2>
        <div class="text-gray-300 space-y-4">
          <p>
            We may suspend or terminate your account at any time for violation of these
            terms or for any other reason. You may also terminate your account at any
            time by contacting us.
          </p>
          <p>
            Upon termination, you remain liable for any outstanding obligations.
            Provisions that should survive termination will continue to apply.
          </p>
        </div>
      </section>

      <!-- 9. Contact Information -->
      <section>
        <h2 class="text-2xl font-bold text-white mb-4">9. Contact Information</h2>
        <div class="text-gray-300 space-y-4">
          <p>
            If you have questions about these Terms of Service, please contact us at:
          </p>
          <div class="bg-white/5 rounded-lg p-4 border border-white/10">
            <p><strong>Email:</strong> legal@geargrab.co</p>
            <p><strong>Address:</strong> GearGrab Legal Department</p>
            <p>123 Outdoor Way, Adventure City, AC 12345</p>
          </div>
        </div>
      </section>

    </div>
  </div>
</div>
