import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import Countdown from './Countdown';
import { useState } from 'react';

export default function AuctionCard({ auction }) {
    const [isEndingSoon, setIsEndingSoon] = useState(false);

    return (
        <div className={`group relative bg-white border ${isEndingSoon ? 'border-red-300' : 'border-gray-200'} rounded-lg overflow-hidden flex flex-col hover:shadow-md transition-shadow`}>
            <Link to={`/products/${auction.id}`} className="block relative pt-[100%] overflow-hidden bg-gray-50">
                <img
                    src={auction.image}
                    alt={auction.title}
                    className="absolute inset-0 w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                />
            </Link>

            <div className={`p-4 flex flex-col flex-grow ${isEndingSoon ? 'bg-red-50/30' : ''}`}>
                <Link to={`/products/${auction.id}`} className="text-sm font-medium text-gray-800 line-clamp-2 hover:underline mb-2 flex-grow">
                    {auction.title}
                </Link>

                <div className="mt-auto">
                    <div className="text-xl font-bold text-gray-900 mb-1">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(auction.currentBid * 25000)}
                    </div>

                    <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-gray-500">{auction.bids} lượt thầu</span>
                        <Countdown
                            endTime={auction.endTime}
                            onEnd={() => {/* Handle auction end if needed */ }}
                        />
                    </div>

                    <Button className="w-full text-sm font-bold" variant="outline">
                        Đặt giá ngay
                    </Button>
                </div>
            </div>
        </div>
    );
}
