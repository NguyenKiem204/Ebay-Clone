import { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import SellerHeader from '../../features/seller/components/SellerHeader';
import Footer from './Footer';
import useStoreStore from '../../store/useStoreStore';
import useAuthStore from '../../store/useAuthStore';

export default function SellerLayout() {
    const { fetchStoreByUserId } = useStoreStore();
    const { isAuthenticated, user, loading: authLoading } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated && user?.id) {
            fetchStoreByUserId(user.id);
        }
    }, [fetchStoreByUserId, isAuthenticated, user?.id]);

    if (authLoading) {
// ... (giữ nguyên loader)
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                {/* Minimal Header for logged out state */}
                <div className="border-b border-gray-200">
                    <div className="max-w-[1400px] mx-auto px-4 h-12 flex justify-between items-center text-[13px]">
                        <div className="flex items-center gap-4">
                            <span>Hi! <Link to="/login" className="text-secondary hover:underline font-medium"> (Sign in) </Link></span>
                            <Link to="/" className="hover:underline text-gray-600">Deals</Link>
                            <Link to="/" className="hover:underline text-gray-600">Brand Outlet</Link>
                            <Link to="/" className="hover:underline text-gray-600">Gift Cards</Link>
                            <Link to="/" className="hover:underline text-gray-600">Help & Contact</Link>
                        </div>
                    </div>
                </div>

                <div className="max-w-[1400px] mx-auto px-4 py-8 flex-grow w-full">
                    <div className="mb-8">
                        <Link to="/">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg" alt="eBay" className="h-12" />
                        </Link>
                    </div>

                    <div className="bg-[#e7f8e8] border border-green-100 rounded-lg p-8 flex flex-col items-start gap-4">
                        <h1 className="text-3xl font-medium text-gray-900">You've signed out.</h1>
                        <p className="text-gray-700">Return to your account to enjoy buying and selling.</p>
                        <Link 
                            to="/login" 
                            className="inline-flex items-center gap-2 border border-gray-800 rounded-md px-6 py-2 h-11 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Sign in again <span className="text-xl">→</span>
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Top Minimal Nav (Like eBay Seller Hub) */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-[1400px] mx-auto px-4 h-10 flex justify-between items-center text-[12px] text-[#333]">
                    <div className="flex items-center gap-4">
                        <span>Hi <span className="font-bold">{user?.username}!</span></span>
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
