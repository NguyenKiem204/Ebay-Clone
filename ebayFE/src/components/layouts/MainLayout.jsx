import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import FloatingControls from '../ui/FloatingControls';
import CartInitializer from '../CartInitializer';
import SavedInitializer from '../SavedInitializer';
import HistoryInitializer from '../HistoryInitializer';

export default function MainLayout() {
    return (
        <div className="min-h-screen flex flex-col w-full">
            {/* Invisible: activates cart/saved/watchlist/history sync globally on login */}
            <CartInitializer />
            <SavedInitializer />
            <HistoryInitializer />
            <Header />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
            <FloatingControls />
        </div>
    );
}

