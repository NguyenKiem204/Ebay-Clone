import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { toast } from 'react-hot-toast';
import { User, Package, MapPin, Shield, ChevronRight, Pencil, Mail, Phone, Calendar, Info } from 'lucide-react';
import AddressTab from '../features/auth/components/AddressTab';
import SecurityTab from '../features/auth/components/SecurityTab';
import MyAuctionsPanel from '../features/auction/components/MyAuctionsPanel';

export default function ProfilePage() {
    const { user, updateProfile } = useAuthStore();
    const [activeTab, setActiveTab] = useState('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        phone: ''
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        const res = await updateProfile({
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            phone: profileData.phone
        });

        if (res.success) {
            toast.success('Information updated');
            setIsEditing(false);
        } else {
            toast.error(res.error);
        }
    };

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3665F3] border-t-transparent shadow-sm"></div>
            </div>
        );
    }

    const initials = (profileData.firstName?.[0] || user.username?.[0] || 'U').toUpperCase();

    const sidebarItems = [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'address', label: 'Shipping Addresses', icon: MapPin },
        { id: 'security', label: 'Account Security', icon: Shield },
        { id: 'auctions', label: 'My Auctions', icon: Package },
    ];

    return (
        <div className="min-h-screen bg-[#F7F7F7] pb-20">
            {/* Minimal Sub-header */}
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-4 max-w-7xl flex items-center gap-2 text-sm text-gray-500">
                    <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
                    <ChevronRight size={14} className="text-gray-300" />
                    <span className="text-gray-900 font-medium">My Account</span>
                </div>
            </div>

            <div className="container mx-auto px-4 py-10 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Compact Sidebar */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 text-center">
                            <div className="relative mx-auto w-24 h-24 mb-4">
                                <div className="w-full h-full bg-[#3665F3] text-white rounded-full flex items-center justify-center text-4xl font-black shadow-lg shadow-blue-200">
                                    {initials}
                                </div>
                                <button
                                    className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full border border-gray-200 shadow-md text-gray-500 hover:text-[#3665F3] transition-colors"
                                    title="Edit avatar"
                                >
                                    <Pencil size={14} />
                                </button>
                            </div>
                            <h2 className="text-xl font-black text-gray-900 leading-tight">
                                {profileData.firstName} {profileData.lastName}
                            </h2>
                            <p className="text-sm text-gray-500 font-medium mt-1">@{user.username}</p>

                            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-[#3665F3]">
                                <span>{user.role}</span>
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            </div>
                        </div>

                        <nav className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-2">
                            {sidebarItems.map(item => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id);
                                            setIsEditing(false);
                                        }}
                                        className={`w-full flex items-center gap-3.5 px-6 py-4 rounded-xl text-sm font-bold transition-all ${activeTab === item.id
                                                ? 'bg-[#3665F3] text-white shadow-md shadow-blue-200'
                                                : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                                        {item.label}
                                    </button>
                                );
                            })}
                            <div className="my-2 border-t border-gray-100"></div>
                            <Link
                                to="/orders"
                                className="w-full flex items-center justify-between px-6 py-4 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                            >
                                <div className="flex items-center gap-3.5">
                                    <Package size={20} />
                                    Purchases
                                </div>
                                <ChevronRight size={16} className="text-gray-300" />
                            </Link>
                            <Link
                                to="/watchlist"
                                className="w-full flex items-center justify-between px-6 py-4 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                            >
                                <div className="flex items-center gap-3.5">
                                    <MapPin size={20} />
                                    Watchlist
                                </div>
                                <ChevronRight size={16} className="text-gray-300" />
                            </Link>
                        </nav>

                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Account Stats</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500 font-medium">Feedback</span>
                                    <span className="text-sm font-bold text-gray-900">0%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500 font-medium">Bids</span>
                                    <span className="text-sm font-bold text-gray-900">0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Main Content */}
                    <div className="lg:col-span-9">
                        {activeTab === 'personal' && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-white">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900">Personal Info</h2>
                                        <p className="text-sm text-gray-500 mt-1 font-medium">Edit your name and contact details.</p>
                                    </div>
                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-8 py-2.5 bg-white border-2 border-[#3665F3] text-[#3665F3] text-sm font-black rounded-full hover:bg-blue-50 transition-all active:scale-[0.98]"
                                        >
                                            Edit profile
                                        </button>
                                    )}
                                </div>

                                <div className="p-10">
                                    {isEditing ? (
                                        <form onSubmit={handleSave} className="max-w-xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-gray-900 ml-1">First Name</label>
                                                    <input
                                                        type="text"
                                                        value={profileData.firstName}
                                                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#3665F3]/10 focus:border-[#3665F3] outline-none transition-all font-medium"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-gray-900 ml-1">Last Name</label>
                                                    <input
                                                        type="text"
                                                        value={profileData.lastName}
                                                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#3665F3]/10 focus:border-[#3665F3] outline-none transition-all font-medium"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-900 ml-1">Email (Non-editable)</label>
                                                <div className="relative group">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3665F3] transition-colors">
                                                        <Mail size={18} />
                                                    </div>
                                                    <input
                                                        type="email"
                                                        value={user.email}
                                                        disabled
                                                        className="w-full pl-12 pr-5 py-3.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed font-medium"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-900 ml-1">Phone Number</label>
                                                <div className="relative group text-gray-400 focus-within:text-[#3665F3]">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors">
                                                        <Phone size={18} />
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        value={profileData.phone}
                                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                                        placeholder="+84..."
                                                        className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#3665F3]/10 focus:border-[#3665F3] outline-none transition-all font-medium text-gray-900"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-4 pt-10 border-t border-gray-100 mt-10">
                                                <button
                                                    type="submit"
                                                    className="px-10 py-3.5 bg-[#3665F3] text-white font-black rounded-full hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all active:scale-[0.98] text-sm"
                                                >
                                                    Apply changes
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(false)}
                                                    className="px-10 py-3.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-full hover:bg-gray-50 transition-all active:scale-[0.98] text-sm"
                                                >
                                                    Discard
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="space-y-12 animate-in fade-in duration-500">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                <InfoCard
                                                    icon={User}
                                                    label="Account Name"
                                                    value={`${profileData.firstName} ${profileData.lastName}`}
                                                />
                                                <InfoCard
                                                    icon={Mail}
                                                    label="Email Address"
                                                    value={user.email}
                                                    verified={user.isEmailVerified}
                                                />
                                                <InfoCard
                                                    icon={Phone}
                                                    label="Contact Phone"
                                                    value={profileData.phone || 'Not linked'}
                                                />
                                                <InfoCard
                                                    icon={Calendar}
                                                    label="Registered On"
                                                    value={new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                />
                                            </div>

                                            <div className="bg-blue-50/50 rounded-2xl border-2 border-dashed border-blue-100 p-8 flex items-start gap-5">
                                                <div className="p-3 bg-white rounded-xl shadow-sm text-[#3665F3]">
                                                    <Info size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-gray-900 mb-1">Stay updated with eBay</h4>
                                                    <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                                        Keeping your profile information up to date helps us protect your account and ensure your items reach you on time. You can change your shipping addresses in the separate tab.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'address' && <AddressTab />}
                        {activeTab === 'security' && <SecurityTab />}
                        {activeTab === 'auctions' && <MyAuctionsPanel />}
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoCard({ icon: Icon, label, value, verified }) {
    return (
        <div className="flex gap-5 group">
            <div className="p-4 bg-[#F7F7F7] rounded-2xl group-hover:bg-blue-50 transition-colors duration-300">
                <Icon size={22} className="text-gray-400 group-hover:text-[#3665F3] transition-colors duration-300" />
            </div>
            <div className="flex flex-col justify-center">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-gray-900">{value}</p>
                    {verified && (
                        <span className="text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                            Verified
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
