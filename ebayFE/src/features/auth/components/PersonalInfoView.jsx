import { useState } from 'react';
import { CheckCircle, Edit2 } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import { toast } from 'react-hot-toast';

export default function PersonalInfoView({ setActiveTab }) {
    const { user, updateProfile } = useAuthStore();
    const [editingSection, setEditingSection] = useState(null); // 'username' | 'contact' | 'personal'
    const [formData, setFormData] = useState({
        username: user?.username || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || ''
    });

    const handleSave = async (section) => {
        try {
            await updateProfile(formData);
            toast.success('Update successful');
            setEditingSection(null);
        } catch (error) {
            toast.error('Update failed');
        }
    };

    const maskEmail = (email) => {
        if (!email) return '';
        const [name, domain] = email.split('@');
        return `${name[0]}${'*'.repeat(Math.max(0, name.length - 2))}${name[name.length - 1]}@${domain}`;
    };

    const maskPhone = (phone) => {
        if (!phone) return 'Not set';
        return `${phone.slice(0, 3)} xxxxxxxx${phone.slice(-2)}`;
    };

    return (
        <div className="max-w-[800px]">
            <h1 className="text-[28px] font-medium text-[#333] mb-8">Personal info</h1>

            {/* Username Section */}
            <div className="py-6 border-b border-gray-100 flex gap-24">
                <div className="w-32 flex-shrink-0">
                    <span className="text-[14px] font-bold text-[#333]">Username</span>
                </div>
                <div className="flex-grow">
                    {editingSection === 'username' ? (
                        <div className="max-w-md">
                            <p className="text-[14px] text-[#333] mb-4">
                                If you change your username, you won't be able to modify it again for 30 days.
                            </p>
                            <div className="relative border border-gray-400 p-2 pt-5 rounded-md focus-within:border-blue-600 transition-colors">
                                <label className="absolute top-1 left-2 text-[11px] text-gray-500 font-medium">Username</label>
                                <input 
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    className="w-full outline-none text-[16px] text-[#333]"
                                />
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button 
                                    onClick={() => setEditingSection(null)}
                                    className="flex-1 py-2 border border-blue-600 text-blue-600 rounded-full font-bold text-sm hover:bg-blue-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleSave('username')}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-between items-start">
                            <span className="text-[14px] text-[#333]">{user?.username}</span>
                            <button onClick={() => setEditingSection('username')} className="text-blue-600 hover:underline text-sm">Edit</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Account Type Section */}
            <div className="py-6 border-b border-gray-100 flex gap-24">
                <div className="w-32 flex-shrink-0">
                    <span className="text-[14px] font-bold text-[#333]">Account type</span>
                </div>
                <div className="flex-grow">
                    <span className="text-[14px] text-[#333]">{user?.role === 'Admin' ? 'Administrator' : 'Individual'}</span>
                </div>
            </div>

            {/* Contact Info Section */}
            <div className="py-6 border-b border-gray-100 flex gap-24 font-inter">
                <div className="w-32 flex-shrink-0">
                    <span className="text-[14px] font-bold text-[#333]">Contact info</span>
                </div>
                <div className="flex-grow space-y-8">
                    {/* Email */}
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[12px] text-gray-500 mb-1">Email address</p>
                            <p className="text-[14px] text-[#333] mb-1">{maskEmail(user?.email)}</p>
                            {user?.isEmailVerified && (
                                <p className="text-[12px] text-gray-400 flex items-center gap-1">Verified</p>
                            )}
                        </div>
                        <button className="text-gray-300 cursor-not-allowed text-sm">Edit</button>
                    </div>

                    {/* Phone */}
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[12px] text-gray-500 mb-1">Phone number</p>
                            {editingSection === 'phone' ? (
                                <input 
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="border-b border-gray-300 outline-none focus:border-blue-600 text-[14px] w-full"
                                    autoFocus
                                    onBlur={() => handleSave('phone')}
                                />
                            ) : (
                                <>
                                    <p className="text-[14px] text-[#333] mb-1">{maskPhone(user?.phone)}</p>
                                    <p className="text-[12px] text-gray-400 flex items-center gap-1">Verified</p>
                                </>
                            )}
                        </div>
                        <button 
                            onClick={() => setEditingSection(editingSection === 'phone' ? null : 'phone')}
                            className="text-blue-600 hover:underline text-sm"
                        >
                            {editingSection === 'phone' ? 'Done' : 'Edit'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Name Section */}
            <div className="py-6 border-b border-gray-100 flex gap-24">
                <div className="w-32 flex-shrink-0">
                    <span className="text-[14px] font-bold text-[#333]">Name</span>
                </div>
                <div className="flex-grow">
                    {editingSection === 'personal' ? (
                        <div className="max-w-md space-y-4">
                            <div className="relative border border-gray-400 p-2 pt-5 rounded-md focus-within:border-blue-600 transition-colors">
                                <label className="absolute top-1 left-2 text-[11px] text-gray-500 font-medium">First name</label>
                                <input 
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                    className="w-full outline-none text-[16px] text-[#333]"
                                />
                            </div>
                            <div className="relative border border-gray-400 p-2 pt-5 rounded-md focus-within:border-blue-600 transition-colors">
                                <label className="absolute top-1 left-2 text-[11px] text-gray-500 font-medium">Last name</label>
                                <input 
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                    className="w-full outline-none text-[16px] text-[#333]"
                                />
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button 
                                    onClick={() => setEditingSection(null)}
                                    className="flex-1 py-2 border border-blue-600 text-blue-600 rounded-full font-bold text-sm hover:bg-blue-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleSave('personal')}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-between items-start">
                            <span className="text-[14px] text-[#333]">{user?.firstName} {user?.lastName}</span>
                            <button onClick={() => setEditingSection('personal')} className="text-blue-600 hover:underline text-sm">Edit</button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Default Address Section */}
            <div className="py-6 border-b border-gray-100 flex gap-24">
                <div className="w-32 flex-shrink-0">
                    <span className="text-[14px] font-bold text-[#333]">Personal info</span>
                </div>
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[12px] text-gray-500 mb-1">Owner name, address</p>
                            <p className="text-[14px] text-[#333] font-medium leading-relaxed uppercase">
                                {user?.firstName} {user?.lastName}<br />
                                {user?.addresses?.[0] ? (
                                    <>
                                        {user.addresses[0].street}<br />
                                        {user.addresses[0].city}, {user.addresses[0].country}
                                    </>
                                ) : (
                                    <span className="text-gray-400 normal-case italic">No default address updated</span>
                                )}
                            </p>
                        </div>
                        <button 
                            onClick={() => setActiveTab('addresses')}
                            className="text-blue-600 hover:underline text-sm"
                        >
                            Edit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
