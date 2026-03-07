import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import FloatingControls from '../ui/FloatingControls';

export default function MainLayout() {
    return (
        <div className="min-h-screen flex flex-col w-full">
            <Header />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
            <FloatingControls />
        </div>
    );
}
