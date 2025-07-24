import React, { useState, useEffect } from "react";
import { CartItem } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CartIcon() {
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadCartCount();
  }, []);

  const loadCartCount = async () => {
    try {
      const currentUser = await User.me().catch(() => null);
      if (!currentUser) return;
      
      setUser(currentUser);
      const cartItems = await CartItem.filter({ user_email: currentUser.email });
      setCartCount(cartItems.length);
    } catch (error) {
      console.error("Error loading cart count:", error);
    }
  };

  // Expose method to update cart count from other components
  React.useImperativeHandle(window.cartIconRef, () => ({
    refreshCartCount: loadCartCount
  }));

  if (!user) return null;

  return (
    <Link to={createPageUrl("Cart")}>
      <Button variant="outline" size="icon" className="relative">
        <ShoppingCart className="w-5 h-5" />
        {cartCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-emerald-600 text-white text-xs">
            {cartCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}