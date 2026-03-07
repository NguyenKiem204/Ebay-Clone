import { Outlet, Link, useLocation } from 'react-router-dom';
import SellerHeader from '../../features/seller/components/SellerHeader';
import Footer from './Footer';

export default function SellerLayout() {
    return (
        <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
            {/* Top Minimal Nav (Like eBay Seller Hub) */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-[1400px] mx-auto px-4 h-10 flex justify-between items-center text-[12px] text-[#333]">
                    <div className="flex items-center gap-4">
                        <span>Hi <span className="font-bold">Seller!</span></span>
                        <Link to="/" className="text-secondary hover:underline">Daily Deals</Link>
                        <Link to="/" className="text-secondary hover:underline">Help & Contact</Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="hover:underline">Ship to</Link>
                        <Link to="/" className="hover:underline">Sell</Link>
                        <Link to="/" className="hover:underline">Watchlist</Link>
                        <Link to="/" className="hover:underline font-bold">My eBay</Link>
                    </div>
                </div>
            </div>

            {/* Seller Hub Header & Tabs */}
            <SellerHeader />

            {/* Main Content Area */}
            <main className="flex-grow max-w-[1400px] mx-auto px-4 py-8 w-full">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
}
