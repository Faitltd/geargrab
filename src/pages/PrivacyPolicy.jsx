import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to={createPageUrl("Browse")}>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-900">Privacy Policy</CardTitle>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">1. Information We Collect</h2>
              <p className="text-gray-600 mb-4">
                GearGrab collects information you provide directly to us, such as when you create an account, list gear, make a rental, or contact us for support.
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Account information (name, email, profile photo)</li>
                <li>Profile information (bio, location, phone number)</li>
                <li>Gear listings (photos, descriptions, pricing)</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Messages between users</li>
                <li>Photos and documentation for rentals</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>To provide and maintain our rental marketplace service</li>
                <li>To process transactions and send confirmations</li>
                <li>To facilitate communication between renters and owners</li>
                <li>To verify user identity for safety and trust</li>
                <li>To resolve disputes and handle guarantee claims</li>
                <li>To send important updates about your rentals</li>
                <li>To improve our platform and user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">3. Information Sharing</h2>
              <p className="text-gray-600 mb-4">
                We do not sell your personal information. We may share your information in these situations:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>With other users as necessary to facilitate rentals (e.g., name, profile picture).</li>
                <li>With payment processors (Stripe) to handle transactions.</li>
                <li>With law enforcement when required by law.</li>
                <li>In case of a business transfer or merger.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">4. Data Security</h2>
              <p className="text-gray-600">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Payment information is processed securely through Stripe and is never stored on our servers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">5. Your Rights</h2>
              <p className="text-gray-600 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Access and update your account information via your Profile page.</li>
                <li>Delete your account and associated data by contacting support.</li>
                <li>Request a copy of your personal information.</li>
                <li>Opt out of non-essential communications.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">6. Contact Us</h2>
              <p className="text-gray-600">
                If you have questions about this Privacy Policy, please contact us at admin@geargrab.co.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}