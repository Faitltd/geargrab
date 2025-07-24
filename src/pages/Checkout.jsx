import React, { useState, useEffect } from "react";
import { GearItem } from "@/api/entities";
import { Rental } from "@/api/entities";
import { User } from "@/api/entities";
import { TransactionService } from "@/services/transactionService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, CreditCard, Calendar, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, differenceInDays } from "date-fns";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function Checkout() {
  const [gearItem, setGearItem] = useState(null);
  const [user, setUser] = useState(null);
  const [dates, setDates] = useState({ from: null, to: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const gearId = urlParams.get("id");
  const fromDate = urlParams.get("from");
  const toDate = urlParams.get("to");

  useEffect(() => {
    if (gearId && fromDate && toDate) {
      loadCheckoutData();
    } else {
      navigate(createPageUrl("Browse"));
    }
  }, [gearId, fromDate, toDate]);

  const loadCheckoutData = async () => {
    try {
      setIsLoading(true);
      const [item, currentUser] = await Promise.all([
        GearItem.list().then(items => items.find(g => g.id === gearId)),
        User.me().catch(() => null)
      ]);

      if (!item || !currentUser) {
        navigate(createPageUrl("Browse"));
        return;
      }
      
      setGearItem(item);
      setUser(currentUser);
      setDates({ from: new Date(fromDate), to: new Date(toDate) });
    } catch (error) {
      console.error("Error loading checkout data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateTotal = () => {
    if (!dates.from || !dates.to) return { days: 0, subtotal: 0, serviceFee: 0, total: 0 };
    const days = differenceInDays(dates.to, dates.from) + 1;
    const subtotal = days * gearItem.daily_rate;
    const serviceFee = subtotal * 0.1; // 10% service fee
    const total = subtotal + serviceFee;
    return { days, subtotal, serviceFee, total };
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      const { subtotal, serviceFee, total } = calculateTotal();

      // Create rental record
      const rental = await Rental.create({
        gear_item_id: gearItem.id,
        renter_email: user.email,
        owner_email: gearItem.created_by,
        start_date: format(dates.from, "yyyy-MM-dd"),
        end_date: format(dates.to, "yyyy-MM-dd"),
        total_amount: total,
        status: "confirmed"
      });

      // Prepare transaction data for comprehensive record keeping
      const feeBreakdown = {
        base_amount: subtotal,
        platform_fee: serviceFee,
        processing_fee: total * 0.029, // ~2.9% processing fee
        tax_amount: 0,
        total_amount: total
      };

      const paymentData = {
        processor: 'mock', // In real app, this would be actual payment processor
        transaction_id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        method_type: 'card',
        status: 'completed'
      };

      const rentalData = {
        rental_id: rental.id,
        renter_email: user.email,
        owner_email: gearItem.created_by
      };

      // Create comprehensive transaction record for tax purposes
      await TransactionService.createTransactionRecord(
        rentalData,
        paymentData,
        feeBreakdown
      );

      // In a real app, this is where you'd redirect to a payment processor.
      // We'll simulate a successful payment and redirect.
      navigate(createPageUrl("MyRentals"));
    } catch (error) {
      console.error("Error confirming rental:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || !gearItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8 animate-pulse">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const { days, subtotal, serviceFee, total } = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-6">
          <Link to={createPageUrl(`GearDetail?id=${gearId}`)}>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Gear
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column: Summary & Payment */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-emerald-600" />
                  Confirm and Pay
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-emerald-50 border-emerald-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <AlertTitle className="text-emerald-800">GearGrab Guarantee</AlertTitle>
                  <AlertDescription className="text-emerald-700">
                    Your rental is protected. We've got your back in case of issues.
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="font-semibold mb-2">Price Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">${gearItem.daily_rate} x {days} days</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service fee</span>
                      <span>${serviceFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t mt-2">
                      <span>Total (USD)</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Pay with (Simulated)</h3>
                  {/* In a real app, this would be a Stripe Elements form */}
                  <div className="p-4 border rounded-lg bg-gray-50 text-center text-gray-500">
                    Payment Gateway Placeholder
                  </div>
                </div>

                <Button
                  className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700"
                  disabled={isProcessing}
                  onClick={handleConfirmPayment}
                >
                  {isProcessing ? "Processing..." : "Confirm & Pay"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Order Details */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {gearItem.photos && gearItem.photos[0] ? (
                      <img src={gearItem.photos[0]} alt={gearItem.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CreditCard className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{gearItem.title}</h3>
                    <p className="text-sm text-gray-600">{gearItem.brand}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Your trip</span>
                    <Link to={createPageUrl(`GearDetail?id=${gearId}`)}>
                      <Button variant="link" size="sm" className="p-0 h-auto">Edit</Button>
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{format(dates.from, "MMM d, yyyy")} - {format(dates.to, "MMM d, yyyy")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}