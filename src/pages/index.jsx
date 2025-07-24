import Layout from "./Layout.jsx";

import Browse from "./Browse";

import GearDetail from "./GearDetail";

import ListGear from "./ListGear";

import MyRentals from "./MyRentals";

import Messages from "./Messages";

import Profile from "./Profile";

import AdminConsole from "./AdminConsole";

import Checkout from "./Checkout";

import FileClaim from "./FileClaim";

import Cart from "./Cart";

import StripeCheckout from "./StripeCheckout";

import PaymentSuccess from "./PaymentSuccess";

import PrivacyPolicy from "./PrivacyPolicy";

import TermsOfService from "./TermsOfService";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Browse: Browse,
    
    GearDetail: GearDetail,
    
    ListGear: ListGear,
    
    MyRentals: MyRentals,
    
    Messages: Messages,
    
    Profile: Profile,
    
    AdminConsole: AdminConsole,
    
    Checkout: Checkout,
    
    FileClaim: FileClaim,
    
    Cart: Cart,
    
    StripeCheckout: StripeCheckout,
    
    PaymentSuccess: PaymentSuccess,
    
    PrivacyPolicy: PrivacyPolicy,
    
    TermsOfService: TermsOfService,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Browse />} />
                
                
                <Route path="/Browse" element={<Browse />} />
                
                <Route path="/GearDetail" element={<GearDetail />} />
                
                <Route path="/ListGear" element={<ListGear />} />
                
                <Route path="/MyRentals" element={<MyRentals />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/AdminConsole" element={<AdminConsole />} />
                
                <Route path="/Checkout" element={<Checkout />} />
                
                <Route path="/FileClaim" element={<FileClaim />} />
                
                <Route path="/Cart" element={<Cart />} />
                
                <Route path="/StripeCheckout" element={<StripeCheckout />} />
                
                <Route path="/PaymentSuccess" element={<PaymentSuccess />} />
                
                <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
                
                <Route path="/TermsOfService" element={<TermsOfService />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}