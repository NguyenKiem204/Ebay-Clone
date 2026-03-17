import { useState } from 'react';
import RegisterForm from '../../features/auth/components/RegisterForm';

export default function RegisterPage() {
    const [accountType, setAccountType] = useState('personal');

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-10">
            <div className="flex flex-col lg:flex-row items-stretch gap-10">
                {/* Left side - Hero image */}
                <div className="hidden lg:block lg:w-1/2">
                    <div className="w-full h-full min-h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#F5AF02] via-[#E53238] to-[#0064D2]">
                        <img
                            src={accountType === 'personal' ? '/images/register-personal.jpg' : '/images/register-business.jpg'}
                            alt={accountType === 'personal' ? 'eBay community' : 'eBay business'}
                            className="w-full h-full object-cover rounded-2xl transition-opacity duration-300"
                            key={accountType}
                        />
                    </div>
                </div>

                {/* Right side - Form */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center">
                    <h1 className="text-[28px] font-bold text-gray-900 mb-6">
                        Create an account
                    </h1>

                    <RegisterForm accountType={accountType} onAccountTypeChange={setAccountType} />
                </div>
            </div>
        </div>
    );
}
