import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import useAuthStore from '../store/useAuthStore';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
    const { user, updateProfile, checkAuth } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address ? `${user.address.street}, ${user.address.city}, ${user.address.country}` : 'No default address'
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const res = await updateProfile({
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            phone: profileData.phone
        });

        if (res.success) {
            toast.success('Profile updated successfully');
            setIsEditing(false);
        } else {
            toast.error(res.error);
        }
    };

    if (!user) return <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">Loading Profile...</div>;

    const initials = (profileData.firstName?.[0] || user.username?.[0] || 'U').toUpperCase();

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                {/* Sidebar */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col items-center">
                        <div className="w-24 h-24 bg-secondary text-white rounded-full flex items-center justify-center text-4xl font-bold mb-4 relative group cursor-pointer shadow-lg">
                            {initials}
                            <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white mb-1">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                </svg>
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Edit</span>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-1">
                            {profileData.firstName} {profileData.lastName}
                        </h2>
                        <p className="text-sm text-gray-500 mb-6 italic">@{user.username}</p>

                        <nav className="w-full space-y-2 border-t border-gray-100 pt-6">
                            <Link to="/profile" className="flex items-center gap-3 px-4 py-3 bg-secondary/10 text-secondary rounded-lg font-bold transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                                </svg>
                                Personal Info
                            </Link>
                            <Link to="/orders" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400">
                                    <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
                                    <path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                                </svg>
                                My Orders
                            </Link>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="md:col-span-3">
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                            <h1 className="text-2xl font-bold text-gray-900">Personal Information</h1>
                            {!isEditing && (
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                    Edit Profile
                                </Button>
                            )}
                        </div>

                        <div className="p-8">
                            {isEditing ? (
                                <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={profileData.firstName}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-shadow"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={profileData.lastName}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-shadow"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={profileData.email}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                                            readOnly
                                        />
                                        <p className="text-xs text-gray-500 mt-2 font-medium">Email address is managed by account settings.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={profileData.phone}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-shadow"
                                            placeholder="+84 ..."
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                                        <Button type="submit" variant="primary" size="lg" className="px-8 font-bold shadow-md shadow-red-500/20">
                                            Save Changes
                                        </Button>
                                        <Button type="button" variant="ghost" size="lg" onClick={() => setIsEditing(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-8 max-w-2xl">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {profileData.firstName || '---'} {profileData.lastName || ''}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</p>
                                            <p className="text-lg font-medium text-gray-900">{profileData.email}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</p>
                                            <p className="text-lg font-medium text-gray-900">{profileData.phone || 'Not provided'}</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 pt-8 mt-8">
                                        <div className="flex justify-between items-start mb-4">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Default Shipping Address</p>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex justify-between items-center shadow-inner">
                                            {user.address ? (
                                                <div>
                                                    <p className="font-bold text-gray-900 mb-1">{user.address.fullName}</p>
                                                    <p className="text-gray-600 leading-relaxed max-w-sm">
                                                        {user.address.street}, {user.address.city}, {user.address.country}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-2 font-medium">{user.address.phone}</p>
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 italic">No default address set.</p>
                                            )}
                                            {user.address && (
                                                <span className="bg-white border border-gray-300 text-gray-600 px-3 py-1 rounded text-[10px] font-bold uppercase shadow-sm">Default</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
