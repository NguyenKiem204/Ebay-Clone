import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '../../../lib/axios';

const tabs = [
    { id: 'participating', label: 'Participating' },
    { id: 'leading', label: 'Leading' },
    { id: 'won', label: 'Won' },
    { id: 'lost', label: 'Lost' }
];

function formatUsd(value) {
    return `US $${Number(value || 0).toLocaleString()}`;
}

function formatTimeLeft(endTime) {
    if (!endTime) {
        return 'N/A';
    }

    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) {
        return 'Ended';
    }

    const totalMinutes = Math.floor(diff / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
        return `${days}d ${hours}h`;
    }

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}

function getStatusTone(status) {
    switch ((status || '').toUpperCase()) {
        case 'LEADING':
            return 'bg-green-50 text-green-700 border-green-200';
        case 'OUTBID':
            return 'bg-red-50 text-red-700 border-red-200';
        case 'WINNING':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'LOST':
            return 'bg-gray-100 text-gray-700 border-gray-200';
        default:
            return 'bg-gray-50 text-gray-600 border-gray-200';
    }
}

export default function MyAuctionsPanel() {
    const [activeTab, setActiveTab] = useState('participating');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchMyAuctions = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/api/auctions/my?status=${activeTab}&page=1&pageSize=20`);
                setItems(response.data?.data?.items || []);
            } catch {
                setItems([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMyAuctions();
    }, [activeTab]);

    useEffect(() => {
        const timer = window.setInterval(async () => {
            try {
                const response = await api.get(`/api/auctions/my?status=${activeTab}&page=1&pageSize=20`);
                setItems(response.data?.data?.items || []);
            } catch {
                setItems([]);
            }
        }, 30000);

        return () => window.clearInterval(timer);
    }, [activeTab]);

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-10 py-8">
                <h2 className="text-2xl font-black text-gray-900">My Auctions</h2>
                <p className="mt-1 text-sm font-medium text-gray-500">Track the auctions you are bidding on, leading, or have already finished.</p>
                <p className="mt-2 text-xs text-gray-400">This list refreshes automatically every 30 seconds.</p>
            </div>

            <div className="border-b border-gray-100 px-10 py-4">
                <div className="flex flex-wrap gap-3">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                                activeTab === tab.id
                                    ? 'bg-[#3665F3] text-white'
                                    : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-10">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 size={36} className="animate-spin text-[#3665f3]" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-14 text-center">
                        <h3 className="text-lg font-bold text-gray-900">No auctions in this tab yet</h3>
                        <p className="mt-2 text-sm text-gray-500">Browse active auctions and your activity will show up here.</p>
                        <Link to="/products?filter=auctions" className="mt-6 inline-flex rounded-full bg-[#3665f3] px-6 py-3 text-sm font-bold text-white hover:bg-blue-700">
                            Browse auctions
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.productId} className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 md:flex-row">
                                <Link to={`/products/${item.productId}`} className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-gray-50 md:w-28">
                                    {item.thumbnail ? (
                                        <img src={item.thumbnail} alt={item.productTitle} className="h-full w-full object-contain p-2" />
                                    ) : null}
                                </Link>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div className="min-w-0">
                                            <Link to={`/products/${item.productId}`} className="line-clamp-2 text-[16px] font-bold text-gray-900 hover:underline">
                                                {item.productTitle}
                                            </Link>
                                            <p className="mt-1 text-sm text-gray-500">Seller: {item.sellerName || 'Unknown seller'}</p>
                                        </div>
                                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusTone(item.userBidStatus)}`}>
                                            {item.userBidStatus}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                                        <div>
                                            <p className="text-gray-500">Current price</p>
                                            <p className="font-bold text-gray-900">{formatUsd(item.currentPrice)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Your max bid</p>
                                            <p className="font-bold text-gray-900">{formatUsd(item.yourMaxBid)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Bids</p>
                                            <p className="font-bold text-gray-900">{item.bidCount}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Time left</p>
                                            <p className="font-bold text-gray-900">{formatTimeLeft(item.auctionEndTime)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex gap-3">
                                        <Link
                                            to={`/products/${item.productId}`}
                                            className="inline-flex rounded-full bg-[#3665f3] px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                                        >
                                            {item.userBidStatus === 'WINNING' ? 'View winning item' : 'View auction'}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
