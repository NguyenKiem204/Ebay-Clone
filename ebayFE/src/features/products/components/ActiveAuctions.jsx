import { Link } from 'react-router-dom';
import AuctionCard from '../../auction/components/AuctionCard';
import useProductStore from '../../../store/useProductStore';

export function ActiveAuctions() {
    const { activeAuctions, loading } = useProductStore();

    if (loading && activeAuctions.length === 0) {
        return <div className="animate-pulse h-64 bg-gray-100 rounded-2xl mb-12"></div>;
    }

    if (!activeAuctions.length) {
        return null;
    }

    return (
        <section className="mb-12">
            <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
                <h2 className="text-2xl font-bold text-gray-900">Active Auctions</h2>
                <Link to="/products?filter=auctions" className="text-secondary hover:underline text-sm font-medium">
                    See all
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {activeAuctions.map((auction) => (
                    <AuctionCard key={auction.id} auction={auction} />
                ))}
            </div>
        </section>
    );
}
