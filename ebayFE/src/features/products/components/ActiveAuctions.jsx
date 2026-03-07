import { Link } from 'react-router-dom';
import { mockAuctions } from '../../../lib/mockData';
import AuctionCard from '../../auction/components/AuctionCard';

export function ActiveAuctions() {
    return (
        <section className="mb-12">
            <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
                <h2 className="text-2xl font-bold text-gray-900">Đang đấu giá — Còn ít thời gian!</h2>
                <Link to="/products?filter=auctions" className="text-secondary hover:underline text-sm font-medium">
                    Xem tất cả →
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mockAuctions.map((auction) => (
                    <AuctionCard key={auction.id} auction={auction} />
                ))}
            </div>
        </section>
    );
}
