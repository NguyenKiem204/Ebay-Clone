import { useState } from 'react';
import CouponDashboard from '../../features/seller/components/CouponDashboard';
import CouponList from '../../features/seller/components/CouponList';
import CreateCouponForm from '../../features/seller/components/CreateCouponForm';
import { Tag, TrendingUp, Share2, HelpCircle, ChevronRight, Plus, X, CheckCircle2, Store } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

// ── Upgrade modal shown to buyers ────────────────────────────────────────────
function SellerUpgradeModal({ onClose }) {
    const navigate = useNavigate();

    const features = [
        'Target buyers with emails and coupons',
        'Access more volume pricing options',
        'Run sale events to help boost sales',
        'Get sourcing insights and list more items for free',
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors z-10"
                >
                    <X size={18} />
                </button>

                {/* Illustration area */}
                <div className="bg-gradient-to-br from-violet-50 to-blue-50 px-8 pt-10 pb-6 flex items-center justify-center">
                    <div className="relative">
                        {/* Two person illustration (CSS art) */}
                        <div className="flex items-end gap-4">
                            {/* Person 1 */}
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-10 h-10 rounded-full bg-rose-300 border-4 border-white shadow-md" />
                                <div className="w-8 h-16 bg-emerald-400 rounded-t-full" />
                                <div className="flex gap-1">
                                    <div className="w-3 h-8 bg-emerald-600 rounded-b-md" />
                                    <div className="w-3 h-8 bg-emerald-600 rounded-b-md" />
                                </div>
                            </div>

                            {/* Floating tag icon between them */}
                            <div className="mb-12">
                                <div className="bg-white rounded-xl shadow-lg p-3 border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <Tag size={18} className="text-[#3665f3]" />
                                        <span className="text-xs font-bold text-gray-700">Promo</span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <div className="flex">
                                            {[...Array(4)].map((_, i) => (
                                                <span key={i} className="text-yellow-400 text-xs">★</span>
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-bold text-green-600">+14%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Person 2 */}
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-10 h-10 rounded-full bg-amber-300 border-4 border-white shadow-md" />
                                <div className="w-8 h-16 bg-green-500 rounded-t-full" />
                                <div className="flex gap-1">
                                    <div className="w-3 h-8 bg-green-700 rounded-b-md" />
                                    <div className="w-3 h-8 bg-green-700 rounded-b-md" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                        Become a Seller to access marketing tools and much more
                    </h2>

                    <p className="text-sm font-semibold text-gray-700 mb-4 mt-3">
                        With a seller account you can:
                    </p>

                    <ul className="space-y-2.5 mb-7">
                        {features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                                <CheckCircle2 size={16} className="text-[#3665f3] shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-600">{f}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                onClose();
                                navigate('/seller/store');
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-[#3665f3] text-white font-bold py-2.5 px-5 rounded-full hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Store size={16} />
                            Open your Store
                        </button>
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Maybe later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function SellerMarketingPage() {
    const [view, setView] = useState('dashboard'); // 'dashboard' | 'create' | 'edit'
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [coupons, setCoupons] = useState([]);
    const [showUpgrade, setShowUpgrade] = useState(false);

    const { user } = useAuthStore();
    const isBuyer = user?.role?.toLowerCase() === 'buyer';

    const handleCreateClick = () => {
        if (isBuyer) {
            setShowUpgrade(true);
        } else {
            setView('create');
        }
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setView('edit');
    };

    const handleCancel = () => {
        setEditingCoupon(null);
        setView('dashboard');
    };

    return (
        <>
            {showUpgrade && <SellerUpgradeModal onClose={() => setShowUpgrade(false)} />}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1400px] mx-auto pb-20">
                {/* Sidebar Controls */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 text-lg">Marketing Hub</h3>
                            <HelpCircle size={18} className="text-gray-400" />
                        </div>
                        <div className="p-4 space-y-1">
                            {[
                                { id: 'promotions', label: 'Promotions', icon: Tag, active: true },
                                { id: 'advertising', label: 'Advertising', icon: TrendingUp },
                                { id: 'social', label: 'Social Share', icon: Share2 },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-all ${item.active ? 'bg-blue-50 text-secondary' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon size={18} className={item.active ? 'text-secondary' : 'text-gray-400 group-hover:text-gray-600'} />
                                        <span className="text-sm font-bold">{item.label}</span>
                                    </div>
                                    <ChevronRight size={14} className={item.active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-secondary to-blue-700 p-6 rounded-xl shadow-lg shadow-blue-100 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <h4 className="font-bold text-lg leading-tight mb-2">Grow your sales with promotions</h4>
                            <p className="text-blue-100 text-xs mb-6 leading-relaxed">
                                Boost visibility and attract buyers with custom discount codes and sales events.
                            </p>
                            <button
                                onClick={handleCreateClick}
                                className="bg-white text-secondary font-bold text-sm px-6 py-2.5 rounded-full hover:bg-blue-50 transition-colors"
                            >
                                Get Started
                            </button>
                        </div>
                        <Tag className="absolute -bottom-8 -right-8 w-32 h-32 text-white/10 -rotate-12 group-hover:scale-110 transition-transform" />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-9 space-y-8">
                    {view === 'dashboard' ? (
                        <>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manage your discounts</h1>
                                    <p className="text-sm text-gray-500 mt-1">Review and manage your active promotions in one place.</p>
                                </div>
                                <button
                                    onClick={handleCreateClick}
                                    className="bg-primary text-white font-bold py-3 px-8 rounded-full hover:opacity-90 shadow-lg shadow-red-200 transition-all flex items-center gap-2"
                                >
                                    <Plus size={20} />
                                    Create promotion
                                </button>
                            </div>

                            <CouponDashboard coupons={coupons} />

                            <div className="pt-8 border-t border-gray-100">
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Your discounts</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Manage existing coupons and monitor their status.</p>
                                </div>
                                <CouponList onEdit={handleEdit} onCreateClick={handleCreateClick} onCouponsLoaded={setCoupons} />
                            </div>
                        </>
                    ) : (
                        <CreateCouponForm
                            editCoupon={editingCoupon}
                            onCancel={handleCancel}
                            onSuccess={handleCancel}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
