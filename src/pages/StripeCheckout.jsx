import React, { useState, useEffect } from "react";
import { CartItem } from "@/api/entities";
import { Rental } from "@/api/entities";
import { User } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { TransactionService } from "@/services/transactionService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CreditCard, Lock, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function StripeCheckout() {
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      setIsLoading(true);
      const currentUser = await User.me();
      const items = await CartItem.filter({ user_email: currentUser.email });
      
      if (items.length === 0) {
        navigate(createPageUrl("Cart"));
        return;
      }
      
      setUser(currentUser);
      setCartItems(items);
    } catch (error) {
      console.error("Error loading checkout data:", error);
      User.login();
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const serviceFee = subtotal * 0.1;
    const total = subtotal + serviceFee;
    return { subtotal, serviceFee, total };
  };

  const processPayment = async () => {
    setError("");
    setIsProcessing(true);

    try {
      // Create rentals and transaction records for each cart item
      const rentalAndTransactionPromises = cartItems.map(async (item) => {
        // Create rental record
        const rental = await Rental.create({
          gear_item_id: item.gear_item_id,
          renter_email: user.email,
          owner_email: item.owner_email,
          start_date: item.start_date,
          end_date: item.end_date,
          total_amount: item.subtotal + (item.subtotal * 0.1),
          status: "confirmed"
        });

        // Prepare transaction data
        const feeBreakdown = {
          base_amount: item.subtotal,
          platform_fee: item.subtotal * 0.1,
          processing_fee: (item.subtotal + (item.subtotal * 0.1)) * 0.029, // ~2.9% processing fee
          tax_amount: 0,
          total_amount: item.subtotal + (item.subtotal * 0.1)
        };

        const paymentData = {
          processor: 'stripe',
          transaction_id: `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Mock Stripe transaction ID
          method_type: 'card',
          status: 'completed'
        };

        const rentalData = {
          rental_id: rental.id,
          renter_email: user.email,
          owner_email: item.owner_email
        };

        // Create comprehensive transaction record
        const transactionRecord = await TransactionService.createTransactionRecord(
          rentalData,
          paymentData,
          feeBreakdown
        );

        return { rental, transactionRecord };
      });

      const results = await Promise.all(rentalAndTransactionPromises);
      const createdRentals = results.map(result => result.rental);

      // Send confirmation emails
      await sendBookingConfirmationEmails(createdRentals);

      // Clear cart
      const deletePromises = cartItems.map(item => CartItem.delete(item.id));
      await Promise.all(deletePromises);

      // Update cart icon
      if (window.cartIconRef?.current) {
        window.cartIconRef.current.refreshCartCount();
      }

      navigate(createPageUrl("PaymentSuccess"));

    } catch (error) {
      console.error("Payment processing error:", error);
      setError("Payment failed. Please try again or contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  const sendBookingConfirmationEmails = async (rentals) => {
    try {
      const allUsers = await User.list();
      const userMap = new Map(allUsers.map(u => [u.email, u.full_name]));

      for (const rental of rentals) {
        const item = cartItems.find(item => item.gear_item_id === rental.gear_item_id);
        const ownerName = userMap.get(rental.owner_email) || "the owner";
        const renterName = userMap.get(rental.renter_email) || "the renter";
        
        // Email to renter
        await SendEmail({
          from_name: "GearGrab",
          to: rental.renter_email,
          subject: `Booking Confirmed: ${item.gear_title}`,
          body: `
Hi ${renterName},

Your gear rental has been confirmed!

🎒 Gear: ${item.gear_title}
📅 Dates: ${rental.start_date} to ${rental.end_date}
💰 Total: $${rental.total_amount.toFixed(2)}

Next steps:
1. The gear owner, ${ownerName}, will contact you to arrange pickup.
2. Take photos during pickup for protection using the My Rentals page.
3. Enjoy your adventure!

Questions? You can message ${ownerName} directly from the Messages page on GearGrab.

Best regards,
The GearGrab Team
          `
        });

        // Email to owner
        await SendEmail({
          from_name: "GearGrab",
          to: rental.owner_email,
          subject: `New Booking: ${item.gear_title}`,
          body: `
Hello ${ownerName},

You have a new gear rental booking!

🎒 Your Gear: ${item.gear_title}
👤 Renter: ${renterName} (${rental.renter_email})
📅 Dates: ${rental.start_date} to ${rental.end_date}
💰 You'll earn: $${(rental.total_amount * 0.9).toFixed(2)} (90% of total)

Next steps:
1. Contact ${renterName} to arrange pickup details via the Messages page.
2. Ensure you both take photos during pickup/return for protection.
3. Earnings will be processed after the rental is successfully completed.

Manage this booking at geargrab.co

Best regards,
The GearGrab Team
          `
        });
      }
    } catch (error) {
      console.error("Error sending confirmation emails:", error);
      // Don't block the user flow if emails fail
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-32"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const { subtotal, serviceFee, total } = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to={createPageUrl("Cart")}>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Cart
            </Button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-8"
        >
          {/* Simplified Payment Form */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-emerald-600" />
                Complete Your Booking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert className="bg-emerald-50 border-emerald-200">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <AlertDescription className="text-emerald-700">
                  Click below to complete your booking. This will simulate a real payment and create your rental records.
                </AlertDescription>
              </Alert>

              <Button
                onClick={processPayment}
                disabled={isProcessing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
              >
                <Lock className="w-5 h-5 mr-2" />
                {isProcessing ? "Processing..." : `Complete Booking - $${total.toFixed(2)}`}
              </Button>

              <div className="text-xs text-gray-500 text-center">
                Protected by GearGrab Guarantee • Secure booking system
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.gear_title}</p>
                      <p className="text-sm text-gray-500">{item.total_days} days</p>
                    </div>
                    <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service fee (10%)</span>
                  <span>${serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-emerald-600">${total.toFixed(2)}</span>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-700 text-sm">
                  <strong>GearGrab Guarantee:</strong> Your rental is protected against damage, theft, and non-return.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}