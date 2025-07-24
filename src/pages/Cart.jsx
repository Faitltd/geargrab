import React, { useState, useEffect } from "react";
import { CartItem } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar, MapPin, ArrowLeft, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setIsLoading(true);
      const currentUser = await User.me();
      const items = await CartItem.filter({ user_email: currentUser.email }, "-created_date");
      
      setUser(currentUser);
      setCartItems(items);
    } catch (error) {
      console.error("Error loading cart:", error);
      User.login();
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    setIsRemoving(itemId);
    try {
      await CartItem.delete(itemId);
      setCartItems(prev => prev.filter(item => item.id !== itemId));
      // Update cart icon
      if (window.cartIconRef?.current) {
        window.cartIconRef.current.refreshCartCount();
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
    setIsRemoving(null);
  };

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const serviceFee = subtotal * 0.1; // 10% service fee
    const total = subtotal + serviceFee;
    return { subtotal, serviceFee, total };
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) return;
    navigate(createPageUrl("StripeCheckout"));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-32"></div>
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to={createPageUrl("Browse")}>
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Continue Shopping
              </Button>
            </Link>
          </div>

          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some gear to get started</p>
            <Link to={createPageUrl("Browse")}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Browse Gear
              </Button>
            </Link>
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
          <Link to={createPageUrl("Browse")}>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-3 gap-8"
        >
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" />
                  Your Cart ({cartItems.length} items)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatePresence>
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                          {item.gear_photo ? (
                            <img
                              src={item.gear_photo}
                              alt={item.gear_title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingCart className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">{item.gear_title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(item.start_date), "MMM d")} - {format(new Date(item.end_date), "MMM d")}
                            </div>
                            <span>{item.total_days} days</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-lg font-bold text-emerald-600">${item.subtotal}</span>
                              <span className="text-sm text-gray-500 ml-1">
                                (${item.daily_rate}/day)
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(item.id)}
                              disabled={isRemoving === item.id}
                            >
                              {isRemoving === item.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100 sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
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

                <Button
                  onClick={proceedToCheckout}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
                >
                  Proceed to Checkout
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  Secure checkout powered by Stripe
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}