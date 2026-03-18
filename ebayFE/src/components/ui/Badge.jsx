import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Badge({ children, variant = "default", className, ...props }) {
    const variants = {
        default: "bg-gray-100 text-gray-800",
        primary: "bg-blue-50 text-[#3665f3] border-blue-100",
        success: "bg-green-50 text-green-700 border-green-100",
        warning: "bg-yellow-50 text-yellow-700 border-yellow-100",
        danger: "bg-red-50 text-red-700 border-red-100",
        secondary: "bg-gray-100 text-gray-700 border-gray-200"
    };

    return (
        <span
            className={twMerge(
                "inline-block px-3 py-0.5 rounded-full text-[11px] font-bold tracking-tight border",
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}

export default Badge;
