import React, { useState, useEffect } from "react";
import { Rental } from "@/api/entities";
import { GearItem } from "@/api/entities";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Calendar, MapPin, DollarSign, CheckCircle, AlertTriangle, Star } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

function StarRating({ rating, setRating }) {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`cursor-pointer w-6 h-6 ${
            rating >= star ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
          onClick={() => setRating(star)}
        />
      ))}
    </div>
  );
}

export default function MyRentals() {
  const [rentals, setRentals] = useState([]);
  const [gearItems, setGearItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [photoDialog, setPhotoDialog] = useState({ open: false, rental: null, type: null });
  const [reviewDialog, setReviewDialog] = useState({ open: false, rental: null });
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [tempPhotos, setTempPhotos] = useState([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [currentUser, allRentals, allGear, allUsers] = await Promise.all([
        User.me(),
        Rental.list("-created_date"),
        GearItem.list(),
        User.list()
      ]);

      const userRentals = allRentals.filter(rental => 
        rental.renter_email === currentUser.email || rental.owner_email === currentUser.email
      );

      setUser(currentUser);
      setRentals(userRentals);
      setGearItems(allGear);
      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading rentals:", error);
      User.login();
    } finally {
      setIsLoading(false);
    }
  };

  const getGearForRental = (rental) => {
    return gearItems.find(item => item.id === rental.gear_item_id);
  };

  const getUserByEmail = (email) => {
    return users.find(user => user.email === email);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhotos(true);
    try {
      const uploadPromises = files.map(file => UploadFile({ file }));
      const results = await Promise.all(uploadPromises);
      const newPhotoUrls = results.map(result => result.file_url);
      
      setTempPhotos(prev => [...prev, ...newPhotoUrls]);
    } catch (error) {
      console.error("Error uploading photos:", error);
    }
    setUploadingPhotos(false);
  };

  const submitPhotos = async () => {
    if (!photoDialog.rental || tempPhotos.length === 0) return;

    try {
      const updates = {
        [photoDialog.type === 'pickup' ? 'pickup_photos' : 'return_photos']: tempPhotos,
        [photoDialog.type === 'pickup' ? 'pickup_notes' : 'return_notes']: notes
      };

      if (photoDialog.type === 'pickup') {
        updates.status = 'active';
      } else {
        updates.status = 'completed';
      }

      await Rental.update(photoDialog.rental.id, updates);
      
      setPhotoDialog({ open: false, rental: null, type: null });
      setTempPhotos([]);
      setNotes("");
      loadData();
    } catch (error) {
      console.error("Error submitting photos:", error);
    }
  };
  
  const submitReview = async () => {
    if (!reviewDialog.rental || rating === 0) return;
    
    try {
      const isRenter = reviewDialog.rental.renter_email === user?.email;
      const updates = isRenter
        ? { owner_rating: rating, owner_review: reviewText }
        : { renter_rating: rating, renter_review: reviewText };
      
      await Rental.update(reviewDialog.rental.id, updates);
      
      setReviewDialog({ open: false, rental: null });
      setRating(0);
      setReviewText("");
      loadData();
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const updateRentalStatus = async (rentalId, newStatus) => {
    try {
      await Rental.update(rentalId, { status: newStatus });
      loadData();
    } catch (error) {
      console.error("Error updating rental status:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'disputed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterRentals = (type) => {
    if (!user) return [];
    return rentals.filter(rental => {
      if (type === 'borrowing') return rental.renter_email === user.email;
      if (type === 'lending') return rental.owner_email === user.email;
      return true;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-48"></div>
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Rentals</h1>
          <p className="text-gray-600">Manage your gear rentals and exchanges</p>
        </motion.div>

        <Tabs defaultValue="borrowing" className="space-y-6">
          <TabsList className="bg-white shadow-sm border border-gray-100">
            <TabsTrigger value="borrowing" className="px-6">Borrowing</TabsTrigger>
            <TabsTrigger value="lending" className="px-6">Lending</TabsTrigger>
          </TabsList>

          <TabsContent value="borrowing">
            <AnimatePresence>
              <div className="space-y-4">
                {filterRentals('borrowing').length > 0 ? filterRentals('borrowing').map((rental) => {
                  const gear = getGearForRental(rental);
                  const owner = getUserByEmail(rental.owner_email);
                  
                  return (
                    <motion.div
                      key={rental.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-xl mb-2">{gear?.title}</CardTitle>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {format(new Date(rental.start_date), "MMM d")} - {format(new Date(rental.end_date), "MMM d, yyyy")}
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  ${rental.total_amount}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {gear?.location}
                                </div>
                              </div>
                            </div>
                            <Badge className={getStatusColor(rental.status)}>
                              {rental.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div className="text-sm">
                              <p className="text-gray-600">Owner: <span className="font-medium text-gray-900">{owner?.full_name}</span></p>
                            </div>
                            <div className="flex gap-2">
                              {rental.status === 'confirmed' && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700"
                                      onClick={() => setPhotoDialog({ open: true, rental, type: 'pickup' })}
                                    >
                                      <Camera className="w-4 h-4 mr-1" />
                                      Pickup Photos
                                    </Button>
                                  </DialogTrigger>
                                </Dialog>
                              )}
                              
                              {rental.status === 'active' && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setPhotoDialog({ open: true, rental, type: 'return' })}
                                    >
                                      <Camera className="w-4 h-4 mr-1" />
                                      Return Photos
                                    </Button>
                                  </DialogTrigger>
                                </Dialog>
                              )}
                              
                              {rental.status === 'completed' && !rental.owner_rating &&
                              (
                                <Dialog open={reviewDialog.open && reviewDialog.rental?.id === rental.id} onOpenChange={(open) => !open && setReviewDialog({open: false, rental: null})}>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setReviewDialog({ open: true, rental })}
                                    >
                                      <Star className="w-4 h-4 mr-1" />
                                      Leave a Review
                                    </Button>
                                  </DialogTrigger>
                                </Dialog>
                              )}
                              
                              {rental.status === 'completed' && rental.owner_rating && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Reviewed
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                }) : (
                  <div className="text-center py-12">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No gear borrowed yet</h3>
                      <p className="text-gray-500">Find some awesome gear to rent!</p>
                  </div>
                )}
              </div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="lending">
            <AnimatePresence>
              <div className="space-y-4">
                {filterRentals('lending').length > 0 ? filterRentals('lending').map((rental) => {
                  const gear = getGearForRental(rental);
                  const renter = getUserByEmail(rental.renter_email);
                  
                  return (
                    <motion.div
                      key={rental.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-xl mb-2">{gear?.title}</CardTitle>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {format(new Date(rental.start_date), "MMM d")} - {format(new Date(rental.end_date), "MMM d, yyyy")}
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  ${rental.total_amount}
                                </div>
                              </div>
                            </div>
                            <Badge className={getStatusColor(rental.status)}>
                              {rental.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div className="text-sm">
                              <p className="text-gray-600">Renter: <span className="font-medium text-gray-900">{renter?.full_name}</span></p>
                            </div>
                            <div className="flex gap-2">
                              {rental.status === 'requested' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => updateRentalStatus(rental.id, 'confirmed')}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateRentalStatus(rental.id, 'cancelled')}
                                  >
                                    Decline
                                  </Button>
                                </>
                              )}
                              {rental.status === 'completed' && !rental.renter_rating && (
                                <Dialog open={reviewDialog.open && reviewDialog.rental?.id === rental.id} onOpenChange={(open) => !open && setReviewDialog({open: false, rental: null})}>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setReviewDialog({ open: true, rental })}
                                    >
                                      <Star className="w-4 h-4 mr-1" />
                                      Review Renter
                                    </Button>
                                  </DialogTrigger>
                                </Dialog>
                              )}
                              {rental.status === 'completed' && rental.renter_rating && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Reviewed
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                }) : (
                  <div className="text-center py-12">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No gear lent out yet</h3>
                      <p className="text-gray-500">List your gear to start earning!</p>
                  </div>
                )}
              </div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>

        {/* Photo Upload Dialog */}
        <Dialog open={photoDialog.open} onOpenChange={(open) => setPhotoDialog(prev => ({ ...prev, open }))}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                {photoDialog.type === 'pickup' ? 'Pickup' : 'Return'} Condition Photos
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Take clear photos of the gear's condition to protect both parties. 
                  Document any existing damage or wear.
                </p>
              </div>

              <div className="space-y-3">
                <Label>Upload Photos</Label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                
                {tempPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {tempPhotos.map((photo, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img src={photo} alt={`Condition ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any observations about the gear's condition..."
                  className="h-24"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPhotoDialog({ open: false, rental: null, type: null });
                    setTempPhotos([]);
                    setNotes("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitPhotos}
                  disabled={tempPhotos.length === 0 || uploadingPhotos}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {uploadingPhotos ? "Uploading..." : "Submit Photos"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Review Dialog */}
        <Dialog open={reviewDialog.open} onOpenChange={(open) => {
          if (!open) {
            setReviewDialog({ open: false, rental: null });
            setRating(0);
            setReviewText("");
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave a Review</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Rating</Label>
                <StarRating rating={rating} setRating={setRating} />
              </div>
              <div>
                <Label htmlFor="reviewText">Review</Label>
                <Textarea
                  id="reviewText"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => {
                  setReviewDialog({ open: false, rental: null });
                  setRating(0);
                  setReviewText("");
                }}>Cancel</Button>
                <Button onClick={submitReview}>Submit Review</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}