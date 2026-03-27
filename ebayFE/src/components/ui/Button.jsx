import { cn } from '../../lib/utils';
import { forwardRef } from 'react';

const Button = forwardRef(({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95";
    const Component = props.as || 'button';
    const { as: _as, ...componentProps } = props;

    const variants = {
        primary: "bg-primary text-white hover:bg-red-700 shadow-md shadow-red-500/10",
        secondary: "bg-secondary text-white hover:bg-blue-700 shadow-md shadow-blue-500/10",
        outline: "border-2 border-primary text-primary hover:bg-red-50",
        ghost: "hover:bg-gray-100 hover:text-gray-900 border-none",
    };

    const sizes = {
        sm: "h-8 px-4 text-xs",
        md: "h-11 px-6 py-2 text-[15px]",
        lg: "h-14 px-10 text-lg",
        icon: "h-10 w-10 p-0",
    };

    return (
        <Component
            ref={ref}
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={Component === 'button' ? (isLoading || componentProps.disabled) : undefined}
            {...componentProps}
        >
            {isLoading ? (
                <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{children}</span>
                </div>
            ) : children}
        </Component>
    );
});

Button.displayName = "Button";

export { Button };
export default Button;
