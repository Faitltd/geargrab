import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Rental } from "@/api/entities";
import { GuaranteeClaim } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Shield, Plus, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function FileClaim() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [formData, setFormData] = useState({
    rental_id: "",
    claim_type: "",
    description: "",
    claim_amount: ""
  });
  const [photos, setPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      const userRentals = await Rental.filter({
        $or: [
          { renter_email: currentUser.email },
          { owner_email: currentUser.email }
        ],
        status: { $in: ["active", "completed", "disputed"] }
      });
      setRentals(userRentals);
    } catch (error) {
      console.error("Error loading data for claim form:", error);
      User.login();
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => UploadFile({ file }));
      const results = await Promise.all(uploadPromises);
      const newPhotoUrls = results.map(result => result.file_url);
      setPhotos(prev => [...prev, ...newPhotoUrls]);
    } catch (error) {
      console.error("Error uploading photos:", error);
    }
    setIsUploading(false);
  };
  
  const removePhoto = (indexToRemove) => {
    setPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.rental_id || !formData.claim_type || !formData.description) {
      return;
    }

    setIsSubmitting(true);
    try {
      await GuaranteeClaim.create({
        ...formData,
        claim_amount: parseFloat(formData.claim_amount) || 0,
        claimant_email: user.email,
        evidence_photos: photos,
        status: "submitted"
      });
      
      await Rental.update(formData.rental_id, { status: "disputed" });

      navigate(createPageUrl("MyRentals"));
    } catch (error) {
      console.error("Error filing claim:", error);
    }
    setIsSubmitting(false);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link to={createPageUrl("MyRentals")}>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Rentals
            </Button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-gray-100">
            <CardHeader className="text-center pb-6">
              <Shield className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <CardTitle className="text-3xl font-bold text-gray-900">File a GearGrab Guarantee Claim</CardTitle>
              <p className="text-gray-600">We're here to help. Please provide as much detail as possible.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="rental_id">Select Rental *</Label>
                  <Select value={formData.rental_id} onValueChange={(value) => handleInputChange('rental_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose the rental this claim is for" />
                    </SelectTrigger>
                    <SelectContent>
                      {rentals.map(rental => (
                        <SelectItem key={rental.id} value={rental.id}>
                           Rental on {format(new Date(rental.start_date), "MMM d, yyyy")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="claim_type">Claim Type *</Label>
                    <Select value={formData.claim_type} onValueChange={(value) => handleInputChange('claim_type', value)}>
                      <SelectTrigger><SelectValue placeholder="Select claim type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="damage">Damage to Gear</SelectItem>
                        <SelectItem value="theft">Theft of Gear</SelectItem>
                        <SelectItem value="not_returned">Gear Not Returned</SelectItem>
                        <SelectItem value="condition_mismatch">Condition Mismatch</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="claim_amount">Claim Amount ($)</Label>
                    <Input
                      id="claim_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.claim_amount}
                      onChange={(e) => handleInputChange('claim_amount', e.target.value)}
                      placeholder="e.g., 150.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Detailed Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what happened in detail. The more information you provide, the faster we can resolve your claim."
                    className="h-32"
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>Photo Evidence</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                        <img src={photo} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(index)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400">
                      {isUploading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600" /> : <Plus className="w-8 h-8 text-gray-400" />}
                      <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.rental_id || !formData.claim_type}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
                >
                  {isSubmitting ? "Submitting..." : "Submit Claim"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}