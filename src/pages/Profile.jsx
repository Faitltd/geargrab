import React, { useState, useEffect } from "react";
import { User } from "../api/entities";
import { GearItem } from "../api/entities";
import { Rental } from "../api/entities";
import { UploadFile } from "../api/integrations";
import TaxInformationForm from "../components/TaxInformationForm";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Label } from "../components/ui/label";
import { 
  User as UserIcon, 
  MapPin, 
  Phone, 
  Calendar, 
  Star, 
  Shield, 
  Camera,
  Edit,
  Save,
  Settings,
  Tent,
  Mountain,
  MessageCircle,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

function ReviewCard({ review }) {
  return (
    <div className="border border-gray-200 p-4 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">{review.reviewer_name}</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-600">{review.review}</p>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [myGear, setMyGear] = useState([]);
  const [myRentals, setMyRentals] = useState([]);
  const [reviews, setReviews] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profileData, setProfileData] = useState({
    bio: "",
    location: "",
    phone: "",
    profile_image: ""
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const [currentUser, allGear, allRentals, allUsers] = await Promise.all([ 
        User.me(),
        GearItem.list(),
        Rental.list(),
        User.list() 
      ]);

      const userMap = new Map(allUsers.map(u => [u.email, u.full_name])); 

      const userGear = allGear.filter(item => item.created_by === currentUser.email);
      const userRentals = allRentals.filter(rental => 
        rental.renter_email === currentUser.email || rental.owner_email === currentUser.email
      );

      const userReviews = allRentals
        .filter(r => (r.owner_email === currentUser.email && r.renter_review) || (r.renter_email === currentUser.email && r.owner_review))
        .map(r => {
          const isOwnerReview = r.owner_email === currentUser.email && r.renter_review;
          return {
            reviewer_name: userMap.get(isOwnerReview ? r.renter_email : r.owner_email) || 'A User',
            rating: isOwnerReview ? r.renter_rating : r.owner_rating,
            review: isOwnerReview ? r.renter_review : r.owner_review,
          };
        }).filter(Boolean);

      setUser(currentUser);
      setMyGear(userGear);
      setMyRentals(userRentals);
      setReviews(userReviews); 
      setProfileData({
        bio: currentUser.bio || "",
        location: currentUser.location || "",
        phone: currentUser.phone || "",
        profile_image: currentUser.profile_image || ""
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      User.login();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const { file_url } = await UploadFile({ file });
      setProfileData(prev => ({ ...prev, profile_image: file_url }));
    } catch (error) {
      console.error("Error uploading photo:", error);
    }
    setIsUploadingPhoto(false);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await User.updateMyUserData(profileData);
      setUser(prev => ({ ...prev, ...profileData }));
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
    setIsSaving(false);
  };

  const handleRequestVerification = async () => { 
    try {
      await User.updateMyUserData({ verification_status: 'pending' });
      loadProfileData(); // Reload data to show updated status
    } catch (error) {
      console.error("Error requesting verification:", error);
    }
  };

  const getVerificationBadge = () => {
    const status = user?.verification_status || "unverified";
    const colors = {
      verified: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      unverified: "bg-gray-100 text-gray-800 border-gray-200"
    };
    
    return (
      <Badge className={`${colors[status]} border`}>
        <Shield className="w-3 h-3 mr-1" />
        {status === "verified" ? "Verified" : status === "pending" ? "Pending" : "Unverified"}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-48"></div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded-xl"></div>
              <div className="h-32 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded-xl"></div>
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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            {user?.role === 'admin' && (
              <Link to={createPageUrl("AdminConsole")}>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Console
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
              <CardHeader className="text-center pb-6">
                <div className="relative mx-auto mb-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                    {profileData.profile_image ? (
                      <img
                        src={profileData.profile_image}
                        alt={user?.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-100">
                        <UserIcon className="w-16 h-16 text-emerald-600" />
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full cursor-pointer hover:bg-emerald-700 shadow-lg">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={isUploadingPhoto}
                      />
                    </label>
                  )}
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{user?.full_name}</h2>
                  <p className="text-gray-600 mb-3">{user?.email}</p>
                  {getVerificationBadge()}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                        className="h-24"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="City, State"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {user?.bio && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">About</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">{user.bio}</p>
                      </div>
                    )}
                    {user?.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{user.location}</span>
                      </div>
                    )}
                    {user?.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        Joined {user?.created_date ? format(new Date(user.created_date), "MMMM yyyy") : "Recently"}
                      </span>
                    </div>
                    {user?.verification_status === 'unverified' && ( 
                      <Button onClick={handleRequestVerification} variant="secondary" className="w-full">
                        <Shield className="w-4 h-4 mr-2" />
                        Request Verification
                      </Button>
                    )}
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="w-full"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Trust Score</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-semibold">{user?.trust_score || 5.0}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Rentals</span>
                  <span className="font-semibold">{myRentals.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Listed Gear</span>
                  <span className="font-semibold">{myGear.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="reviews" className="space-y-6"> 
              <TabsList className="bg-white shadow-sm border border-gray-100">
                <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
                <TabsTrigger value="gear" className="px-6">My Gear ({myGear.length})</TabsTrigger>
                <TabsTrigger value="rentals" className="px-6">Rental History ({myRentals.length})</TabsTrigger>
                <TabsTrigger value="tax-info" className="px-6">
                  <FileText className="w-4 h-4 mr-2" />
                  Tax Information
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reviews"> 
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
                  <CardHeader>
                    <CardTitle>Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map((review, index) => (
                          <ReviewCard key={index} review={review} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700">No reviews yet</h3>
                        <p className="text-gray-500">Complete rentals to get reviews.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gear">
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Tent className="w-5 h-5" />
                      My Listed Gear ({myGear.length})
                    </CardTitle>
                    <Link to={createPageUrl("ListGear")}>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">
                        List New Gear
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {myGear.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myGear.map((item) => (
                          <motion.div
                            key={item.id}
                            whileHover={{ scale: 1.02 }}
                            className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                                {item.photos && item.photos.length > 0 ? (
                                  <img
                                    src={item.photos[0]}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Mountain className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                                <div className="flex justify-between items-center">
                                  <span className="text-emerald-600 font-bold">${item.daily_rate}/day</span>
                                  <Badge variant={item.availability ? "default" : "secondary"}>
                                    {item.availability ? "Available" : "Unavailable"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Tent className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No gear listed yet</h3>
                        <p className="text-gray-500 mb-4">Start earning by listing your outdoor gear</p>
                        <Link to={createPageUrl("ListGear")}>
                          <Button className="bg-emerald-600 hover:bg-emerald-700">
                            List Your First Item
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rentals">
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-gray-100">
                  <CardHeader>
                    <CardTitle>Rental History ({myRentals.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {myRentals.length > 0 ? (
                      <div className="space-y-4">
                        {myRentals.slice(0, 10).map((rental) => (
                          <div key={rental.id} className="border border-gray-200 rounded-xl p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {rental.renter_email === user?.email ? "Rented" : "Lent"} Gear
                                </p>
                                <p className="text-sm text-gray-600">
                                  {rental.start_date && rental.end_date ?
                                    `${format(new Date(rental.start_date), "MMM d")} - ${format(new Date(rental.end_date), "MMM d, yyyy")}` :
                                    "Date TBD"
                                  }
                                </p>
                              </div>
                              <Badge className={
                                rental.status === 'completed' ? 'bg-green-100 text-green-800' :
                                rental.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                rental.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {rental.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">${rental.total_amount} total</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No rental history</h3>
                        <p className="text-gray-500">Start by renting or listing gear</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tax-info">
                <TaxInformationForm
                  user={user}
                  onUpdate={(updatedTaxInfo) => {
                    setUser(prev => ({ ...prev, ...updatedTaxInfo }));
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}