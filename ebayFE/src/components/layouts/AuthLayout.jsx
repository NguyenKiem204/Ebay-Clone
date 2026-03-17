import { Outlet, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function AuthLayout() {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';
    const isRegisterPage = location.pathname === '/register';

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* eBay header */}
            <header className="py-4 px-6 border-b border-gray-200">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link to="/" className="text-3xl font-bold tracking-tighter inline-block" aria-label="eBay Home">
                        <span className="text-[#E53238]">e</span>
                        <span className="text-[#0064D2]">b</span>
                        <span className="text-[#F5AF02]">a</span>
                        <span className="text-[#86B817]">y</span>
                    </Link>

                    {/* Show context link on the right */}
                    {isRegisterPage && (
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-[#3665F3] hover:underline font-medium">Sign in</Link>
                        </p>
                    )}
                    {isLoginPage && (
                        <p className="text-sm text-gray-600">
                            New to eBay?{' '}
                            <Link to="/register" className="text-[#3665F3] hover:underline font-medium">Create account</Link>
                        </p>
                    )}
                </div>
            </header>

            <main className="flex-grow flex items-start justify-center">
                <Outlet />
            </main>

            <footer className="py-6 text-center text-[11px] text-gray-500 border-t border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 space-y-1">
                    <p>Copyright © 1995-2025 eBay Inc. All Rights Reserved.</p>
                    <p className="space-x-2">
                        <a href="#" className="hover:underline">Accessibility</a>
                        <span>·</span>
                        <a href="#" className="hover:underline">User Agreement</a>
                        <span>·</span>
                        <a href="#" className="hover:underline">Privacy</a>
                        <span>·</span>
                        <a href="#" className="hover:underline">Cookies</a>
                    </p>
                </div>
            </footer>
        </div>
    );
}
