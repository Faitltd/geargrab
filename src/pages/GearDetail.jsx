
import React, { useState, useEffect } from "react";
import { GearItem } from "@/api/entities";
import { Rental } from "@/api/entities";
import { User } from "@/api/entities";
import { CartItem } from "@/api/entities"; // Added CartItem import
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, Star, Calendar as CalendarIcon, Camera, Shield, User as UserIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, differenceInDays, addDays } from "date-fns";
import { motion } from "framer-motion";

export default function GearDetail() {
  const [gearItem, setGearItem] = useState(null);
  const [owner, setOwner] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedDates, setSelectedDates] = useState({ from: null, to: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false); // Changed from isBooking
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const gearId = urlParams.get("id");

  useEffect(() => {
    if (gearId) {
      loadGearDetail();
    }
  }, [gearId]);

  const loadGearDetail = async () => {
    try {
      setIsLoading(true);
      const items = await GearItem.list();
      const item = items.find(g => g.id === gearId);
      
      if (!item) {
        navigate(createPageUrl("Browse"));
        return;
      }

      const [currentUser, users] = await Promise.all([
        User.me().catch(() => null),
        User.list()
      ]);

      const itemOwner = users.find(u => u.email === item.created_by);
      
      setGearItem(item);
      setOwner(itemOwner);
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading gear detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // New function for adding to cart
  const addToCart = async () => {
    if (!selectedDates.from || !selectedDates.to || !user) {
      return;
    }

    setIsAddingToCart(true);
    try {
      const days = differenceInDays(selectedDates.to, selectedDates.from) + 1;
      const subtotal = days * gearItem.daily_rate;

      await CartItem.create({
        user_email: user.email,
        gear_item_id: gearItem.id,
        start_date: format(selectedDates.from, "yyyy-MM-dd"),
        end_date: format(selectedDates.to, "yyyy-MM-dd"),
        daily_rate: gearItem.daily_rate,
        total_days: days,
        subtotal: subtotal,
        gear_title: gearItem.title,
        gear_photo: gearItem.photos?.[0] || "",
        owner_email: gearItem.created_by
      });

      // Update cart icon if ref is available
      if (window.cartIconRef?.current) {
        window.cartIconRef.current.refreshCartCount();
      }

      navigate(createPageUrl("Cart"));
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedDates.from || !selectedDates.to) return 0;
    const days = differenceInDays(selectedDates.to, selectedDates.from) + 1;
    return days * gearItem.daily_rate;
  };

  const getDays = () => {
    if (!selectedDates.from || !selectedDates.to) return 0;
    return differenceInDays(selectedDates.to, selectedDates.from) + 1;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-32"></div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded-xl"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gearItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Gear not found</h2>
          <Link to={createPageUrl("Browse")}>
            <Button>Browse All Gear</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link to={createPageUrl("Browse")}>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Browse
            </Button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-2 gap-8 mb-8"
        >
          {/* Photos Section */}
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-gray-100 to-gray-200">
              {gearItem.photos && gearItem.photos.length > 0 ? (
                <img
                  src={gearItem.photos[0]}
                  alt={gearItem.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-24 h-24 text-gray-400" />
                </div>
              )}
            </div>
            {gearItem.photos && gearItem.photos.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {gearItem.photos.slice(1, 5).map((photo, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={photo}
                      alt={`${gearItem.title} ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{gearItem.title}</h1>
                  {gearItem.brand && (
                    <p className="text-lg text-gray-600 mb-2">{gearItem.brand} {gearItem.model}</p>
                  )}
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  {gearItem.category}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{gearItem.location}</span>
                </div>
                <Badge variant="outline" className={
                  gearItem.condition === 'excellent' ? 'border-green-500 text-green-700' :
                  gearItem.condition === 'very_good' ? 'border-blue-500 text-blue-700' :
                  gearItem.condition === 'good' ? 'border-yellow-500 text-yellow-700' :
                  'border-orange-500 text-orange-700'
                }>
                  <Star className="w-3 h-3 mr-1" />
                  {gearItem.condition.replace('_', ' ')}
                </Badge>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-emerald-600">${gearItem.daily_rate}</span>
                <span className="text-gray-500 text-lg">/day</span>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{gearItem.description}</p>
              </div>

              {gearItem.owner_instructions && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Owner Instructions
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{gearItem.owner_instructions}</p>
                </div>
              )}
            </div>

            {/* Owner Info */}
            {owner && (
              <Card className="bg-white/80 backdrop-blur-sm border-gray-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{owner.full_name}</p>
                      <p className="text-sm text-gray-500">Gear Owner</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>

        {/* Booking Section */}
        {user && user.email !== gearItem.created_by && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Book This Gear
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Select Rental Dates</h3>
                  <Calendar
                    mode="range"
                    selected={selectedDates}
                    onSelect={setSelectedDates}
                    disabled={(date) => date < new Date()}
                    className="rounded-xl border border-gray-200 bg-white p-4"
                  />
                </div>

                {selectedDates.from && selectedDates.to && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span>Rental Period:</span>
                      <span className="font-semibold">
                        {format(selectedDates.from, "MMM d")} - {format(selectedDates.to, "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Days:</span>
                      <span className="font-semibold">{getDays()}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold text-emerald-700">
                      <span>Total:</span>
                      <span>${calculateTotal()}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-12"
                    disabled={!selectedDates.from || !selectedDates.to || isAddingToCart}
                    onClick={addToCart}
                  >
                    {isAddingToCart ? "Adding..." : "Add to Cart"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!user && (
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600 mb-4">Sign in to rent this gear</p>
              <Button 
                onClick={() => User.login()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
