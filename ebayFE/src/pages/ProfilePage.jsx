import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { toast } from 'react-hot-toast';
import { User, Package, MapPin, Shield, ChevronRight, Pencil, Eye, EyeOff } from 'lucide-react';
import api from '../lib/axios';

export default function ProfilePage() {
    const { user, updateProfile, checkAuth } = useAuthStore();
    const [activeTab, setActiveTab] = useState('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: ''
    });

    // Change password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState(null);

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

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
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

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPwError(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPwError('Passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPwError('Password must be at least 8 characters');
            return;
        }

        setPwLoading(true);
        try {
            await api.post('/api/Auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
                confirmNewPassword: passwordData.confirmPassword
            });
            toast.success('Password changed successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPwError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setPwLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#3665F3] border-t-transparent"></div>
            </div>
        );
    }

    const initials = (profileData.firstName?.[0] || user.username?.[0] || 'U').toUpperCase();

    const tabs = [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'security', label: 'Account Security', icon: Shield },
    ];

    const inputBase = (hasError) => `w-full px-4 py-3 border rounded-lg text-base outline-none transition-all ${
        hasError
            ? 'border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-gray-400 focus:border-[#3665F3] focus:ring-2 focus:ring-[#3665F3]/20 hover:border-gray-600'
    }`;

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your personal info and account settings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {/* Avatar section */}
                        <div className="p-6 border-b border-gray-100 flex flex-col items-center">
                            <div className="w-20 h-20 bg-[#3665F3] text-white rounded-full flex items-center justify-center text-3xl font-bold mb-3 relative group cursor-pointer">
                                {initials}
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Pencil size={18} className="text-white" />
                                </div>
                            </div>
                            <h2 className="text-base font-bold text-gray-900">
                                {profileData.firstName} {profileData.lastName}
                            </h2>
                            <p className="text-sm text-gray-500">@{user.username}</p>
                        </div>

                        {/* Navigation */}
                        <nav className="p-2">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
                                            activeTab === tab.id
                                                ? 'bg-[#3665F3]/10 text-[#3665F3]'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Icon size={18} />
                                        {tab.label}
                                    </button>
                                );
                            })}

                            <Link
                                to="/orders"
                                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Package size={18} />
                                    My Orders
                                </div>
                                <ChevronRight size={16} className="text-gray-400" />
                            </Link>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="md:col-span-3">
                    {activeTab === 'personal' && (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-8 py-5 border-b border-gray-200 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-5 py-2 border-2 border-[#3665F3] text-[#3665F3] text-sm font-bold rounded-full hover:bg-[#3665F3]/5 transition-colors"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>

                            <div className="p-8">
                                {isEditing ? (
                                    <form onSubmit={handleSave} className="space-y-5 max-w-lg">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    First Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    value={profileData.firstName}
                                                    onChange={handleChange}
                                                    className={inputBase(false)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    value={profileData.lastName}
                                                    onChange={handleChange}
                                                    className={inputBase(false)}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={profileData.email}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed outline-none text-base"
                                                readOnly
                                            />
                                            <p className="text-xs text-gray-500 mt-1.5">
                                                Email address cannot be changed.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={profileData.phone}
                                                onChange={handleChange}
                                                className={inputBase(false)}
                                                placeholder="+84..."
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                                            <button
                                                type="submit"
                                                className="px-8 py-3 bg-[#3665F3] text-white font-medium rounded-full hover:bg-[#382aef] transition-colors text-sm"
                                            >
                                                Save Changes
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    // Reset values
                                                    if (user) {
                                                        setProfileData({
                                                            firstName: user.firstName || '',
                                                            lastName: user.lastName || '',
                                                            email: user.email || '',
                                                            phone: user.phone || '',
                                                            address: user.address ? `${user.address.street}, ${user.address.city}, ${user.address.country}` : 'No default address'
                                                        });
                                                    }
                                                }}
                                                className="px-8 py-3 text-gray-700 font-medium rounded-full hover:bg-gray-100 transition-colors text-sm border border-gray-300"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-6 max-w-lg">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Full Name</p>
                                                <p className="text-base text-gray-900 font-medium">
                                                    {profileData.firstName || '—'} {profileData.lastName || ''}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email Address</p>
                                                <p className="text-base text-gray-900">{profileData.email}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Phone Number</p>
                                                <p className="text-base text-gray-900">{profileData.phone || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Member Since</p>
                                                <p className="text-base text-gray-900">
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Address section */}
                                        <div className="border-t border-gray-100 pt-6 mt-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                <MapPin size={16} className="text-gray-500" />
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Default Shipping Address</p>
                                            </div>
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 flex justify-between items-center">
                                                {user.address ? (
                                                    <div>
                                                        <p className="font-medium text-gray-900 mb-1">{user.address.fullName}</p>
                                                        <p className="text-gray-600 text-sm leading-relaxed">
                                                            {user.address.street}, {user.address.city}, {user.address.country}
                                                        </p>
                                                        <p className="text-gray-500 text-sm mt-1">{user.address.phone}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 text-sm italic">No default address set.</p>
                                                )}
                                                {user.address && (
                                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-8 py-5 border-b border-gray-200">
                                <h2 className="text-lg font-bold text-gray-900">Account Security</h2>
                                <p className="text-sm text-gray-500 mt-1">Manage your password and security settings</p>
                            </div>

                            <div className="p-8">
                                <div className="max-w-lg">
                                    <h3 className="text-base font-bold text-gray-900 mb-4">Change Password</h3>

                                    {pwError && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-start gap-2">
                                            <svg className="w-5 h-5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                            <span>{pwError}</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleChangePassword} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Current password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showCurrentPw ? 'text' : 'password'}
                                                    name="currentPassword"
                                                    value={passwordData.currentPassword}
                                                    onChange={handlePasswordChange}
                                                    className={`${inputBase(false)} pr-12`}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                                                    tabIndex={-1}
                                                >
                                                    {showCurrentPw ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                New password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPw ? 'text' : 'password'}
                                                    name="newPassword"
                                                    value={passwordData.newPassword}
                                                    onChange={handlePasswordChange}
                                                    className={`${inputBase(false)} pr-12`}
                                                    required
                                                    minLength={8}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPw(!showNewPw)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                                                    tabIndex={-1}
                                                >
                                                    {showNewPw ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Confirm new password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPw ? 'text' : 'password'}
                                                    name="confirmPassword"
                                                    value={passwordData.confirmPassword}
                                                    onChange={handlePasswordChange}
                                                    className={`${inputBase(false)} pr-12`}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                                                    tabIndex={-1}
                                                >
                                                    {showConfirmPw ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                disabled={pwLoading}
                                                className="px-8 py-3 bg-[#3665F3] text-white font-medium rounded-full hover:bg-[#382aef] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {pwLoading ? 'Changing...' : 'Change password'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
