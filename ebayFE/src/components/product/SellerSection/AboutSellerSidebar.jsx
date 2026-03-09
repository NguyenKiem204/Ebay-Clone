import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../ui/Button';

export default function AboutSellerSidebar({ product }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Mock data based on image
    const sellerInfo = {
        name: product.sellerName || 'Supplytronics',
        feedbackScore: '99.5%',
        itemsSold: '940K',
        joined: 'Dec 2010',
        mission: 'Our mission is to supply quality mobile devices at competitive prices. We\'re happy when our customers are! Every device is comprehensively tested with industry-leading Phonecheck software to prepare ...',
        ratings: [
            { label: 'Accurate description', score: 4.8 },
            { label: 'Reasonable shipping cost', score: 5.0 },
            { label: 'Shipping speed', score: 5.0 },
            { label: 'Communication', score: 5.0 },
        ],
        categories: [
            'Apple iPhone', 'Apple MacBook', 'Google Pixel', 'Samsung Galaxy',
            'Mint Condition Devices', 'Excellent Condition Devices',
            'Very Good Condition Devices', 'Good Condition Devices', 'Fair Condition Devices'
        ]
    };

    return (
        <div className="w-full space-y-8">
            <section>
                <h2 className="text-[20px] font-bold text-gray-900 mb-6">About this seller</h2>
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden p-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase text-center leading-tight">
                            {sellerInfo.name}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-[18px] font-bold text-gray-900 leading-tight">
                            {sellerInfo.name}
                        </h3>
                        <p className="text-[14px] text-gray-600 mt-1">
                            <span className="font-bold">{sellerInfo.feedbackScore}</span> positive feedback • <span className="font-bold">{sellerInfo.itemsSold}</span> items sold
                        </p>
                    </div>
                </div>

                <div className="space-y-4 text-[14px]">
                    <div className="flex items-center gap-2 text-gray-700">
                        <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="none" stroke="currentColor" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span>Joined {sellerInfo.joined}</span>
                    </div>
                    <div className="text-gray-700 leading-relaxed">
                        {isExpanded ? sellerInfo.mission : `${sellerInfo.mission.substring(0, 150)}...`}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-gray-900 font-bold ml-1 hover:underline flex items-center gap-1 mt-1"
                        >
                            See {isExpanded ? 'less' : 'more'}
                            <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                    </div>
                </div>

                <div className="mt-8 space-y-3">
                    <Button className="w-full bg-[#3665f3] hover:bg-blue-700 h-[50px] rounded-full font-bold text-[16px]">
                        Visit store
                    </Button>
                    <button className="w-full h-[50px] border border-[#3665f3] text-[#3665f3] hover:bg-blue-50 rounded-full font-bold text-[16px] transition-colors">
                        Contact
                    </button>
                    <button className="w-full h-[50px] border border-[#3665f3] text-[#3665f3] hover:bg-blue-50 rounded-full font-bold text-[16px] flex items-center justify-center gap-2 transition-colors">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        <span>Save seller</span>
                    </button>
                </div>
            </section>

            <section className="pt-8 border-t border-gray-100">
                <h3 className="text-[17px] font-bold text-gray-900 mb-6">Detailed seller ratings</h3>
                <div className="space-y-2">
                    {sellerInfo.ratings.map((rating, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1">
                            <span className="text-[14px] text-gray-700">{rating.label}</span>
                            <div className="flex items-center gap-8">
                                <div className="w-[120px] h-[3px] bg-gray-100 relative">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-gray-900"
                                        style={{ width: `${(rating.score / 5) * 100}%` }}
                                    />
                                </div>
                                <span className="text-[13px] text-gray-900 min-w-[20px] text-right">{rating.score.toFixed(1)}</span>
                            </div>
                        </div>
                    ))}
                    <p className="text-[11px] text-gray-500 mt-2">Average for the last 12 months</p>
                </div>
            </section>

            <section className="pt-8 border-t border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[17px] font-bold text-gray-900">Popular categories from this store</h3>
                    <Link to="#" className="text-blue-600 font-bold text-[13px] hover:underline">See all</Link>
                </div>
                <div className="flex flex-wrap gap-2">
                    {sellerInfo.categories.map((cat, idx) => (
                        <Link
                            key={idx}
                            to="#"
                            className="px-4 py-1.5 bg-gray-100 text-gray-900 text-[13px] rounded-full hover:bg-gray-200 transition-colors"
                        >
                            {cat}
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
