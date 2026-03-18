import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = forwardRef(({ label, error, className, ...props }, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                className={twMerge(
                    "w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#3665f3] focus:border-[#3665f3] disabled:opacity-50 disabled:bg-gray-50",
                    error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "hover:border-gray-400",
                    className
                )}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export { Input };
export default Input;
