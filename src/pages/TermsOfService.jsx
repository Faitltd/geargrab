import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
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
            <CardTitle className="text-3xl font-bold text-gray-900">Terms of Service</CardTitle>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">1. Introduction</h2>
              <p>Welcome to GearGrab! These Terms of Service ("Terms") govern your use of the GearGrab peer-to-peer outdoor gear rental marketplace. By using our platform, you agree to these Terms.</p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">2. User Responsibilities</h2>
              <p>As a Renter, you are responsible for the rented gear and must return it in the same condition. As an Owner, you are responsible for providing safe, well-maintained gear and accurately describing it in your listings.</p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">3. Payments and Fees</h2>
              <p>GearGrab charges a service fee to both Renters and Owners on each transaction. All payments are processed through our secure payment provider, Stripe. Owners will receive their payout after a rental is successfully completed.</p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">4. GearGrab Guarantee and Disputes</h2>
              <p>Our GearGrab Guarantee provides protection against damage and theft. Users must follow the required procedures, including taking photos at pickup and return, to be eligible. Disputes will be mediated by GearGrab, and our decision is final.</p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">5. Limitation of Liability</h2>
              <p>Outdoor activities carry inherent risks. GearGrab is not liable for any injury, death, or damages resulting from the use of rented gear. Users assume all risks associated with their activities.</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}