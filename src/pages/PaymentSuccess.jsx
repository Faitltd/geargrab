
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Calendar, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function PaymentSuccess() {
  useEffect(() => {
    // Clear any cart data and send additional confirmations if needed
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-gray-100 text-center">
          <CardContent className="p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-12 h-12 text-green-600" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Booking Confirmed! 🎉</h1>
              <p className="text-gray-600 mb-8">
                Your gear rentals are confirmed. Confirmation emails have been sent to you and the gear owners.
              </p>

              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h3 className="font-semibold text-emerald-800 mb-2">What's Next?</h3>
                  <div className="text-sm text-emerald-700 space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>Gear owners will contact you to arrange pickup</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Check your email for contact details</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Take condition photos at pickup/return</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link to={createPageUrl("MyRentals")} className="block">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      View My Rentals
                    </Button>
                  </Link>
                  
                  <Link to={createPageUrl("Messages")} className="block">
                    <Button variant="outline" className="w-full">
                      Go to Messages
                    </Button>
                  </Link>

                  <Link to={createPageUrl("Browse")} className="block">
                    <Button variant="ghost" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
