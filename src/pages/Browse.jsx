import React, { useState, useEffect } from "react";
import { GearItem } from "@/api/entities";
import { User } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Star, Filter, Mountain, Camera, Tent } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

const categoryIcons = {
  camping: Tent,
  hiking: Mountain,
  climbing: Mountain,
  photography: Camera,
  skiing: Mountain,
  snowboarding: Mountain,
  cycling: Mountain,
  kayaking: Mountain,
  surfing: Mountain,
  fishing: Mountain,
  other: Mountain
};

const categoryColors = {
  camping: "bg-green-100 text-green-800",
  hiking: "bg-blue-100 text-blue-800",
  climbing: "bg-red-100 text-red-800",
  photography: "bg-purple-100 text-purple-800",
  skiing: "bg-cyan-100 text-cyan-800",
  snowboarding: "bg-indigo-100 text-indigo-800",
  cycling: "bg-yellow-100 text-yellow-800",
  kayaking: "bg-teal-100 text-teal-800",
  surfing: "bg-orange-100 text-orange-800",
  fishing: "bg-emerald-100 text-emerald-800",
  other: "bg-gray-100 text-gray-800"
};

export default function Browse() {
  const [gearItems, setGearItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [gearItems, searchTerm, selectedCategory, selectedLocation, priceRange]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [items, currentUser] = await Promise.all([
        GearItem.list("-created_date"),
        User.me().catch(() => null)
      ]);
      setGearItems(items.filter(item => item.availability));
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = gearItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.brand?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesLocation = selectedLocation === "all" || item.location?.toLowerCase().includes(selectedLocation.toLowerCase());
      
      let matchesPrice = true;
      if (priceRange !== "all") {
        const rate = item.daily_rate;
        switch (priceRange) {
          case "under25": matchesPrice = rate < 25; break;
          case "25to50": matchesPrice = rate >= 25 && rate <= 50; break;
          case "50to100": matchesPrice = rate >= 50 && rate <= 100; break;
          case "over100": matchesPrice = rate > 100; break;
        }
      }

      return matchesSearch && matchesCategory && matchesLocation && matchesPrice;
    });

    setFilteredItems(filtered);
  };

  const getUniqueLocations = () => {
    const locations = gearItems.map(item => item.location).filter(Boolean);
    return [...new Set(locations)];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Discover Outdoor Gear
              </h1>
              <p className="text-gray-600">Rent premium outdoor equipment from fellow adventurers</p>
            </div>
            {user && (
              <Link to={createPageUrl("ListGear")}>
                <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg">
                  List Your Gear
                </Button>
              </Link>
            )}
          </div>

          {/* Search and Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search gear..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-gray-200 focus:border-emerald-500"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="camping">Camping</SelectItem>
                  <SelectItem value="hiking">Hiking</SelectItem>
                  <SelectItem value="climbing">Climbing</SelectItem>
                  <SelectItem value="skiing">Skiing</SelectItem>
                  <SelectItem value="photography">Photography</SelectItem>
                  <SelectItem value="cycling">Cycling</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {getUniqueLocations().map(location => (
                    <SelectItem key={location} value={location.toLowerCase()}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="under25">Under $25/day</SelectItem>
                  <SelectItem value="25to50">$25 - $50/day</SelectItem>
                  <SelectItem value="50to100">$50 - $100/day</SelectItem>
                  <SelectItem value="over100">Over $100/day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredItems.length} gear item{filteredItems.length !== 1 ? 's' : ''} available
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={filteredItems.length}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredItems.map((item) => {
              const IconComponent = categoryIcons[item.category] || Mountain;
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  className="group"
                >
                  <Link to={createPageUrl(`GearDetail?id=${item.id}`)}>
                    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                      <CardHeader className="p-0">
                        <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                          {item.photos && item.photos.length > 0 ? (
                            <img
                              src={item.photos[0]}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <IconComponent className="w-16 h-16 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <Badge className={`${categoryColors[item.category]} border-0 shadow-sm`}>
                              {item.category}
                            </Badge>
                          </div>
                          {item.condition === 'excellent' && (
                            <div className="absolute top-3 right-3">
                              <Badge className="bg-emerald-100 text-emerald-800 border-0 shadow-sm">
                                <Star className="w-3 h-3 mr-1" />
                                Excellent
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-4">
                        <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">
                          {item.title}
                        </h3>
                        {item.brand && (
                          <p className="text-sm text-gray-500 mb-2">{item.brand}</p>
                        )}
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {item.description}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          {item.location}
                        </div>
                      </CardContent>
                      
                      <CardFooter className="p-4 pt-0">
                        <div className="w-full flex justify-between items-center">
                          <div>
                            <span className="text-2xl font-bold text-emerald-600">
                              ${item.daily_rate}
                            </span>
                            <span className="text-gray-500 text-sm">/day</span>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={(e) => e.preventDefault()}
                          >
                            Rent Now
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {filteredItems.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Mountain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No gear found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search filters</p>
            {user && (
              <Link to={createPageUrl("ListGear")}>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Be the first to list gear in this area
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}