import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

const Checkbox = forwardRef(({ label, className, ...props }, ref) => {
    return (
        <label className={twMerge("flex items-center gap-2 cursor-pointer group", className)}>
            <div className="relative flex items-center">
                <input
                    type="checkbox"
                    ref={ref}
                    className="peer sr-only"
                    {...props}
                />
                <div className="w-5 h-5 border-2 border-gray-300 rounded bg-white transition-all peer-checked:bg-[#3665f3] peer-checked:border-[#3665f3] group-hover:border-[#3665f3] peer-focus:ring-2 peer-focus:ring-[#3665f3]/30" />
                <svg
                    className="absolute inset-0 w-3.5 h-3.5 m-auto text-white opacity-0 transition-opacity peer-checked:opacity-100 pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={4}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            {label && (
                <span className="text-sm font-medium text-gray-700 select-none">{label}</span>
            )}
        </label>
    );
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
