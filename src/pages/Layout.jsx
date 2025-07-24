

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mountain, Search, Plus, User, MessageSquare, Calendar, ShoppingBag } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Updated imports to use actual entity definitions
import { User as UserEntity } from "@/api/entities";
import { CartItem } from "@/api/entities";

// CartIcon Component Definition
const CartIcon = React.forwardRef((props, ref) => {
  const [itemCount, setItemCount] = React.useState(0);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    loadCartCount();
  }, []);

  const loadCartCount = async () => {
    try {
      // Use UserEntity.me() instead of the mock User.me()
      const currentUser = await UserEntity.me().catch(() => null);
      if (!currentUser) {
        setUser(null);
        setItemCount(0); // Clear cart count if not logged in
        return;
      }
      
      setUser(currentUser);
      const cartItems = await CartItem.filter({ user_email: currentUser.email });
      setItemCount(cartItems.length);
    } catch (error) {
      console.error("Error loading cart count:", error);
      setItemCount(0); // Set to 0 on error
    }
  };

  React.useImperativeHandle(ref, () => ({
    refreshCartCount: loadCartCount,
    updateItemCount: (count) => setItemCount(count),
    getCartItemCount: () => itemCount,
  }));

  // Render null while user is loading or if no user is logged in
  if (user === null) return null; 

  return (
    <Link to={createPageUrl("Cart")}>
      <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-gray-100">
        <ShoppingBag className="w-6 h-6 text-gray-700" />
        {itemCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full text-xs font-bold p-0"
          >
            {itemCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
});

CartIcon.displayName = "CartIcon"; // For better debugging in React DevTools

const navigationItems = [
  {
    title: "Browse Gear",
    url: createPageUrl("Browse"),
    icon: Search,
  },
  {
    title: "My Rentals",
    url: createPageUrl("MyRentals"),
    icon: Calendar,
  },
  {
    title: "List Gear",
    url: createPageUrl("ListGear"),
    icon: Plus,
  },
  {
    title: "Messages",
    url: createPageUrl("Messages"),
    icon: MessageSquare,
  },
  {
    title: "Profile",
    url: createPageUrl("Profile"),
    icon: User,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  // Set up cart icon ref
  React.useEffect(() => {
    if (!window.cartIconRef) {
      window.cartIconRef = React.createRef();
    }
  }, []);

  return (
    <SidebarProvider>
      <style>
        {`
          :root {
            --primary: #16423C;
            --primary-foreground: #ffffff;
            --secondary: #C4A484;
            --accent: #6A9C89;
            --muted: #f8f9f7;
            --muted-foreground: #6b7280;
            --background: #ffffff;
            --foreground: #1f2937;
            --card: #ffffff;
            --card-foreground: #1f2937;
            --border: #e5e7eb;
          }
        `}
      </style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-white to-green-50">
        <Sidebar className="border-r border-gray-100 shadow-sm">
          <SidebarHeader className="border-b border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Mountain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-xl text-gray-900">GearGrab</h2>
                  <p className="text-xs text-gray-500 font-medium">Outdoor Gear Rental</p>
                </div>
              </div>
              <CartIcon ref={window.cartIconRef} />
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 rounded-xl px-4 py-3 font-medium ${
                          location.pathname === item.url 
                            ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' 
                            : 'text-gray-700'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-gray-100 space-y-2">
            <Link to={createPageUrl("FileClaim")}>
              <Button variant="outline" className="w-full">
                File a Claim
              </Button>
            </Link>
            <div className="flex gap-2 text-xs text-gray-500 justify-center">
              <Link to={createPageUrl("TermsOfService")} className="hover:text-emerald-600">
                Terms
              </Link>
              <span>•</span>
              <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-emerald-600">
                Privacy
              </Link>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-6 py-4 md:hidden sticky top-0 z-40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-xl transition-colors duration-200" />
                <div className="flex items-center gap-2">
                  <Mountain className="w-6 h-6 text-emerald-600" />
                  <h1 className="text-xl font-bold text-gray-900">GearGrab</h1>
                </div>
              </div>
              <CartIcon ref={window.cartIconRef} />
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

