import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../../store/useAuthStore';
import toast from 'react-hot-toast';

export default function OtpVerification({ email, onVerified, onCancel }) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(60);
    const [isResending, setIsResending] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef([]);
    const { verifyOtp, resendOtp, login } = useAuthStore();

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (index, value) => {
        if (!/^[0-9]?$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input if value is entered
        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Move to previous input on backspace if current is empty
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(data)) return;

        const newOtp = [...otp];
        data.split('').forEach((char, i) => {
            if (i < 6) newOtp[i] = char;
        });
        setOtp(newOtp);
        
        // Focus the last filled input or the first empty one
        const nextIndex = Math.min(data.length, 5);
        inputRefs.current[nextIndex].focus();
    };

    const handleVerify = async (e) => {
        if (e) e.preventDefault();
        const fullOtp = otp.join('');
        if (fullOtp.length < 6) {
            toast.error('Please enter all 6 digits');
            return;
        }

        setIsLoading(true);
        const result = await verifyOtp(email, fullOtp);
        if (result.success) {
            toast.success('Verification successful!');
            onVerified();
        } else {
            toast.error(result.error || 'Invalid OTP code');
        }
        setIsLoading(false);
    };

    const handleResend = async () => {
        if (timer > 0) return;
        
        setIsResending(true);
        const result = await resendOtp(email);
        if (result.success) {
            toast.success('New OTP code sent');
            setTimer(60);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0].focus();
        } else {
            toast.error(result.error || 'Failed to resend code');
        }
        setIsResending(false);
    };

    return (
        <div className="flex flex-col items-center py-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h2>
            <p className="text-sm text-gray-600 text-center mb-8 px-4">
                We've sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>. 
                Enter the code below to confirm your account.
            </p>

            <form onSubmit={handleVerify} className="w-full max-w-sm">
                <div className="flex justify-between gap-2 mb-8">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#3665F3] focus:ring-1 focus:ring-[#3665F3] outline-none transition-all selection:bg-blue-100"
                        />
                    ))}
                </div>

                <button
                    type="submit"
                    disabled={isLoading || otp.join('').length < 6}
                    className="w-full py-3.5 bg-[#3665F3] text-white font-medium text-base rounded-full hover:bg-[#382aef] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mb-6 shadow-md"
                >
                    {isLoading ? 'Verifying...' : 'Verify Email'}
                </button>

                <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">
                        Didn't get the code?
                    </p>
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={timer > 0 || isResending}
                        className={`text-sm font-medium ${timer > 0 ? 'text-gray-400' : 'text-[#3665F3] hover:underline'}`}
                    >
                        {timer > 0 ? `Resend code in ${timer}s` : 'Resend code'}
                    </button>
                </div>
            </form>

            <button 
                onClick={onCancel}
                className="mt-8 text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
                Back to registration
            </button>
        </div>
    );
}
