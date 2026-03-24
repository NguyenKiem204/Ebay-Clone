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
        <div className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-green-600' : 'text-gray-400'}`}>
            {met ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {text}
        </div>
    );

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Account Security</h2>
                <p className="text-sm text-gray-500 mt-1">Keep your account safe by updating your password regularly.</p>
            </div>

            <div className="p-8">
                <div className="max-w-md">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 mb-8">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-[#3665F3]">
                            <Shield size={20} />
                        </div>
                        <p className="text-sm text-blue-800 font-medium">Use a strong password that you don't use elsewhere.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <AlertCircle size={18} className="text-red-600 mt-0.5" />
                            <p className="text-sm text-red-800 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showPw.current ? 'text' : 'password'}
                                    name="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full pl-4 pr-12 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3665F3]/20 focus:border-[#3665F3] outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw({ ...showPw, current: !showPw.current })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                >
                                    {showPw.current ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <label className="text-sm font-medium text-gray-700">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPw.new ? 'text' : 'password'}
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full pl-4 pr-12 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3665F3]/20 focus:border-[#3665F3] outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw({ ...showPw, new: !showPw.new })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                >
                                    {showPw.new ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showPw.confirm ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full pl-4 pr-12 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3665F3]/20 focus:border-[#3665F3] outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                >
                                    {showPw.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl space-y-2 mt-6">
                            <PasswordReq met={formData.newPassword.length >= 8} text="At least 8 characters long" />
                            <PasswordReq met={formData.newPassword !== '' && formData.newPassword === formData.confirmPassword} text="Passwords match" />
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3.5 px-6 rounded-full font-bold text-white transition-all shadow-md ${
                                    loading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-[#3665F3] hover:bg-[#382aef] active:scale-[0.98]'
                                }`}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Updating...
                                    </div>
                                ) : (
                                    'Update Password'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
