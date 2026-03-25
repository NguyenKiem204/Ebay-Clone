import { useState } from 'react';
import { Shield, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../../lib/axios';
import { toast } from 'react-hot-toast';

export default function SecurityTab() {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPw, setShowPw] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(null);
    };

    const validate = () => {
        if (formData.newPassword.length < 8) return 'Password must be at least 8 characters long';
        if (formData.newPassword !== formData.confirmPassword) return 'New passwords do not match';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (err) {
            setError(err);
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/Auth/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
                confirmNewPassword: formData.confirmPassword
            });
            toast.success('Password updated successfully');
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password');
            toast.error('Update failed');
        } finally {
            setLoading(false);
        }
    };

    const PasswordReq = ({ met, text }) => (
        <div className={`flex items-center gap-2 text-[12px] transition-colors ${met ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
            {met ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            {text}
        </div>
    );

    return (
        <div className="max-w-[800px]">
            <h1 className="text-[28px] font-medium text-[#333] mb-2">Sign in and security</h1>
            <p className="text-[14px] text-gray-500 mb-8 border-b border-gray-100 pb-6">Update your password to keep your account secure.</p>

            <div className="max-w-md">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle size={18} className="text-red-600 mt-0.5" />
                        <p className="text-sm text-red-800 font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Current Password */}
                    <div className="relative border border-gray-400 p-2 pt-5 rounded-md focus-within:border-blue-600 bg-white transition-colors">
                        <label className="absolute top-1 left-2 text-[11px] text-gray-500 font-medium uppercase tracking-wider">Current Password</label>
                        <input
                            type={showPw.current ? 'text' : 'password'}
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            required
                            className="w-full outline-none text-[16px] text-[#333]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw({ ...showPw, current: !showPw.current })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPw.current ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {/* New Password */}
                    <div className="relative border border-gray-400 p-2 pt-5 rounded-md focus-within:border-blue-600 bg-white transition-colors">
                        <label className="absolute top-1 left-2 text-[11px] text-gray-500 font-medium uppercase tracking-wider">New Password</label>
                        <input
                            type={showPw.new ? 'text' : 'password'}
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            required
                            className="w-full outline-none text-[16px] text-[#333]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw({ ...showPw, new: !showPw.new })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPw.new ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {/* Confirm Password */}
                    <div className="relative border border-gray-400 p-2 pt-5 rounded-md focus-within:border-blue-600 bg-white transition-colors">
                        <label className="absolute top-1 left-2 text-[11px] text-gray-500 font-medium uppercase tracking-wider">Confirm Password</label>
                        <input
                            type={showPw.confirm ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required
                            className="w-full outline-none text-[16px] text-[#333]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPw.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <PasswordReq met={formData.newPassword.length >= 8} text="At least 8 characters long" />
                        <PasswordReq met={formData.newPassword !== '' && formData.newPassword === formData.confirmPassword} text="Passwords match" />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                            className="flex-1 py-2 border border-blue-600 text-blue-600 rounded-full font-bold text-sm hover:bg-blue-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 py-2 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Saving...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
