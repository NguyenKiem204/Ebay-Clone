import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <main className="flex-grow">
                <Outlet />
            </main>

            <footer className="py-8 text-center text-xs text-gray-500 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4">
                    <p>Copyright © 1995-2025 eBay Clone Inc. All Rights Reserved. Accessibility, User Agreement, Privacy, Payments Terms of Use, Cookies, CA Privacy Notice, Your Privacy Choices and AdChoice</p>
                </div>
            </footer>
        </div>
    );
}
