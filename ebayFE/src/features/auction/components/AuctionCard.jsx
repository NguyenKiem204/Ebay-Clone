import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    formatAuctionRelativeTime,
    getAuctionStatusMeta,
    normalizeAuctionLifecycle
} from '../utils/auctionPresentation';
import { resolveMediaUrl } from '../../../lib/media';

export default function AuctionCard({ auction }) {
    const [nowTick, setNowTick] = useState(() => Date.now());
    const currentPrice = auction.currentBid ?? auction.price ?? 0;
    const bidCount = auction.bidCount ?? auction.bids ?? 0;
    const image = resolveMediaUrl(auction.thumbnail || auction.image);
    const auctionStatus = normalizeAuctionLifecycle({
        auctionStatus: auction.auctionStatus,
        auctionStartTime: auction.auctionStartTime,
        auctionEndTime: auction.auctionEndTime || auction.endTime,
        winningBidderId: auction.winningBidderId
    });
    const statusMeta = getAuctionStatusMeta(auctionStatus);
    const timeCopy = auctionStatus === 'scheduled'
        ? formatAuctionRelativeTime(auction.auctionStartTime, 'Starts in', nowTick)
        : formatAuctionRelativeTime(auction.auctionEndTime || auction.endTime, 'Ends in', nowTick);
    const buyItNowPrice = auction.buyItNowPrice;
    const detailPath = `/products/${auction.id}`;

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setNowTick(Date.now());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, []);

    return (
        <div className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <Link to={detailPath} className="block relative pt-[100%] overflow-hidden bg-gray-50">
                <img
                    src={image}
                    alt={auction.title}
                    className="absolute inset-0 w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                />
            </Link>

            <div className="p-4 flex flex-col flex-grow">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusMeta.badgeClassName}`}>
                        {statusMeta.label}
                    </span>
                    <span className="text-[11px] text-gray-500">{timeCopy}</span>
                </div>

                <Link to={detailPath} className="text-sm font-medium text-gray-800 line-clamp-2 hover:underline mb-2 flex-grow">
                    {auction.title}
                </Link>

                <div className="mt-auto">
                    <div className="text-xl font-bold text-gray-900 mb-1">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(currentPrice)}
                    </div>

                    <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-gray-500">{bidCount} {bidCount === 1 ? 'bid' : 'bids'}</span>
                        {buyItNowPrice ? (
                            <span className="font-medium text-[#3665f3]">
                                Buy It Now {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(buyItNowPrice)}
                            </span>
                        ) : (
                            <span className="text-gray-500">{statusMeta.description}</span>
                        )}
                    </div>

                    <Link
                        to={detailPath}
                        className="flex h-11 w-full items-center justify-center rounded-md border-2 border-primary text-sm font-bold text-primary transition-colors hover:bg-red-50"
                    >
                        {auctionStatus === 'live' ? 'View auction' : 'View details'}
                    </Link>
                </div>
            </div>
        </div>
    );
}
