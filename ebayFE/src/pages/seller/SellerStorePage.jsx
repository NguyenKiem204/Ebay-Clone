import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Upload, X, Plus, Info, Loader2, Check, ArrowRight } from 'lucide-react';
import useStoreStore from '../../store/useStoreStore';
import useAuthStore from '../../store/useAuthStore';
import { BASE_URL } from '../../lib/axios';

const STORE_TIERS = [
    {
        name: 'Starter',
        price: 'Free*',
        listings: '250',
        features: ['Perfect for beginning sellers', 'Auction or Fixed Price', 'Basic tools included'],
        color: 'bg-blue-50'
    },
    {
        name: 'Basic',
        price: '$21.95',
        listings: '1,000',
        features: ['Discounted listing fees', 'Branded shop info', 'Ebay shipping supplies discount'],
        color: 'bg-green-50'
    },
    {
        name: 'Premium',
        price: '$59.95',
        listings: '10,000',
        features: ['Best for high volume', 'Lower final value fees', 'Dedicated customer support'],
        color: 'bg-purple-50',
        popular: true
    }
];

export default function SellerStorePage() {
    const { store, loading, updateStore, createStore } = useStoreStore();
    const { user, upgradeToSeller } = useAuthStore();
    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        return `${BASE_URL}${cleanUrl}`;
    };

    const [formData, setFormData] = useState({
        storeName: '',
        description: '',
        slug: ''
    });

    const [logoPreview, setLogoPreview] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const logoInputRef = useRef(null);
    const bannerInputRef = useRef(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (store) {
            setFormData({
                storeName: store.storeName || '',
                description: store.description || '',
                slug: store.slug || ''
            });
            if (store.logoUrl) setLogoPreview(getImageUrl(store.logoUrl));
            if (store.bannerImageUrl) setBannerPreview(getImageUrl(store.bannerImageUrl));
        }
    }, [store]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'logo') setLogoPreview(reader.result);
                else setBannerPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpgrade = async () => {
        setNotification(null);
        const result = await upgradeToSeller();
        if (result.success) {
            setNotification({ type: 'success', message: 'Account upgraded successfully! You can now create your store.' });
        } else {
            setNotification({ type: 'error', message: result.error || 'Upgrade failed' });
        }
    };

    const handlePublish = async () => {
        setNotification(null);
        const data = new FormData();
        data.append('StoreName', formData.storeName);
        data.append('Description', formData.description);

        if (logoInputRef.current?.files[0]) {
            data.append('LogoFile', logoInputRef.current.files[0]);
        }
        if (bannerInputRef.current?.files[0]) {
            data.append('BannerFile', bannerInputRef.current.files[0]);
        }

        let result;
        if (store) {
            result = await updateStore(data);
        } else {
            data.append('Slug', formData.storeName.toLowerCase().replace(/ /g, '-'));
            result = await createStore(data);
        }

        if (result.success) {
            setNotification({ type: 'success', message: result.message || 'Updated successfully!' });
            setTimeout(() => setNotification(null), 5000);
        } else {
            setNotification({
                type: 'error',
                message: result.error || 'An error occurred',
                details: result.errors
            });
        }
    };

    // --- BUYER VIEW: SHOW PRICING ---
    if (user?.role?.toLowerCase() === 'buyer') {
        return (
            <div className="space-y-12 pb-20 max-w-6xl mx-auto">
                {notification && (
                    <div className={`p-4 rounded-lg flex items-start gap-3 shadow-md border animate-in fade-in slide-in-from-top-4 duration-300 ${notification.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                        {notification.type === 'success' ? <Check className="mt-0.5" /> : <X className="mt-0.5 cursor-pointer" onClick={() => setNotification(null)} />}
                        <div className="flex-grow">
                            <p className="font-bold">{notification.message}</p>
                        </div>
                    </div>
                )}
                <div className="text-center space-y-4">

                    <h2 className="text-4xl font-bold text-gray-900">Open an eBay Store</h2>
                    <p className="text-lg text-gray-600">Give your business a home on eBay and save more on listing fees.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {STORE_TIERS.map((tier) => (
                        <div key={tier.name} className={`relative p-8 rounded-2xl border-2 transition-all hover:shadow-xl ${tier.popular ? 'border-secondary' : 'border-gray-100 bg-white'}`}>
                            {tier.popular && (
                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Most Popular</span>
                            )}
                            <div className={`${tier.color} w-fit px-4 py-1 rounded-lg mb-6`}>
                                <span className="font-bold text-gray-800">{tier.name}</span>
                            </div>
                            <div className="mb-6">
                                <span className="text-4xl font-black">{tier.price}</span>
                                <span className="text-gray-500 ml-1 text-sm">/mo</span>
                            </div>
                            <div className="space-y-4 mb-10">
                                <div className="flex items-center gap-2 font-bold text-gray-800">
                                    <Check size={18} className="text-green-500" />
                                    <span>{tier.listings} zero-insertion fee listings</span>
                                </div>
                                {tier.features.map(f => (
                                    <div key={f} className="flex items-center gap-2 text-gray-600 text-sm">
                                        <Check size={16} className="text-gray-300" />
                                        <span>{f}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleUpgrade}
                                className={`w-full py-3 rounded-full font-bold transition-all flex items-center justify-center gap-2 ${tier.popular ? 'bg-secondary text-white hover:bg-blue-700' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                            >
                                Select Plan <ArrowRight size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100 flex items-center justify-between">
                    <div>
                        <h4 className="text-xl font-bold text-blue-900">Wait, I already have a plan!</h4>
                        <p className="text-blue-700 mt-1">If you were looking for your store settings, make sure your account is upgraded.</p>
                    </div>
                    <Link to="/profile" className="text-secondary font-bold hover:underline">Check account status →</Link>
                </div>
            </div>
        );
    }

    // --- SELLER VIEW: SHOW MANAGEMENT FORM ---
    return (
        <div className="space-y-10 pb-20">
            {notification && (
                <div className={`p-4 rounded-lg flex items-start gap-3 shadow-md border animate-in fade-in slide-in-from-top-4 duration-300 ${notification.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    {notification.type === 'success' ? <Info className="mt-0.5" /> : <X className="mt-0.5 cursor-pointer" onClick={() => setNotification(null)} />}
                    <div className="flex-grow">
                        <p className="font-bold">{notification.message}</p>
                        {notification.details && notification.details.length > 0 && (
                            <ul className="mt-2 list-disc list-inside text-sm opacity-90">
                                {notification.details.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {store ? 'Edit Storefront' : 'Create your Store'}
                </h2>
                <div className="flex gap-4">
                    <button
                        className="px-8 py-2 border border-gray-300 rounded-full font-bold text-sm hover:bg-gray-50 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={loading}
                        className="bg-secondary text-white px-8 py-2 rounded-full font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {store ? 'Save Changes' : 'Publish Store'}
                    </button>
                </div>
            </div>

            {/* Store Billboard */}
            <div className="bg-white p-10 rounded-xl border border-gray-200 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">Store Billboard</h3>
                </div>

                <div
                    onClick={() => bannerInputRef.current?.click()}
                    className="aspect-[12/2.7] w-full border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 flex flex-col items-center justify-center gap-4 group hover:border-secondary/40 transition-all cursor-pointer overflow-hidden relative"
                >
                    {bannerPreview ? (
                        <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center group-hover:-translate-y-1 transition-transform">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-2">
                                <Upload className="text-secondary" />
                            </div>
                            <span className="text-sm font-bold text-secondary">Add image</span>
                        </div>
                    )}
                    <span className="absolute bottom-4 right-4 text-[11px] text-gray-400 bg-white/80 px-2 py-1 rounded font-medium">1200 x 270 px recommended</span>
                    <input
                        type="file"
                        ref={bannerInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'banner')}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Store Name</label>
                        <input
                            type="text"
                            name="storeName"
                            value={formData.storeName}
                            onChange={handleInputChange}
                            placeholder="e.g. Awesome Collectibles Store"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-secondary transition-all font-medium text-gray-800"
                        />
                    </div>
                    <div className="space-y-2 row-span-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Store Logo</label>
                        <div
                            onClick={() => logoInputRef.current?.click()}
                            className="w-[180px] aspect-square border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 flex flex-col items-center justify-center gap-3 hover:border-secondary/40 transition-all cursor-pointer overflow-hidden relative"
                        >
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <Plus className="text-gray-300" />
                                    <span className="text-[10px] font-bold text-gray-400">Add Logo</span>
                                </>
                            )}
                            <input
                                type="file"
                                ref={logoInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'logo')}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 italic font-medium">300 x 300 px recommended</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Store Description</label>
                        <textarea
                            rows={6}
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Tell buyers about your store..."
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-secondary transition-all text-gray-800 text-sm"
                        ></textarea>
                    </div>
                </div>
            </div>

            <div className="bg-white p-10 rounded-xl border border-gray-200 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">Featured Categories</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-4">
                            <div className="aspect-square w-full border-2 border-dashed border-gray-100 rounded-full bg-gray-50/50 flex items-center justify-center hover:border-secondary/30 transition-all cursor-pointer group">
                                <Plus className="text-gray-300 group-hover:text-secondary group-hover:scale-110 transition-all" size={20} />
                            </div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Add Category</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-center border-t border-gray-100 pt-10 gap-6">
                <button
                    className="px-12 py-3 border border-gray-300 rounded-full font-bold text-sm hover:bg-gray-50 transition-colors"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    onClick={handlePublish}
                    disabled={loading}
                    className="bg-secondary text-white px-12 py-3 rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
                >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {store ? 'Save Changes' : 'Publish Store'}
                </button>
            </div>
        </div>
    );
}
