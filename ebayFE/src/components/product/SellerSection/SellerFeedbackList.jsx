import { ChevronDown, PlusCircle } from 'lucide-react';

export default function SellerFeedbackList() {
    const feedbackData = [
        {
            id: 1,
            user: 'a***7',
            ratingCount: 5,
            time: 'Past month',
            comment: 'The device is in perfect condition, looks, works and feels brand new. Seeing 87% battery health on a three year old watch was absolutely insane and awesome too see. The watch did not come in original packaging but did come with original charger and was extremely protected during shipping. Worth every penny!',
            image: 'https://i.ebayimg.com/images/g/2i4AAOSwAWZngDgE/s-l64.jpg',
            isVerified: true
        },
        {
            id: 2,
            user: 'z***h',
            ratingCount: 184,
            time: 'Past 6 months',
            comment: 'Barely any perceptible signs of use...glass and case are virtually spotless. Truly in excellent condition as described. I\'m very happy with the watch. My unit also had 99% battery health! Shipping was also very fast. Really great value for the price. I would definitely buy from this seller again. Thanks!',
            isVerified: true
        },
        {
            id: 3,
            user: '7***7',
            ratingCount: 2,
            time: 'Past month',
            comment: 'Came with 88% battery health and works very well! Can tell it was used by micro scratches but nothing you can feel with you finger nail or anything. Screen is perfect. Did need a little cleaning.',
            isVerified: true
        }
    ];

    const chips = ['Condition', 'Quality', 'Satisfaction', 'Appearance', 'Value', 'Extras', 'Usage'];

    return (
        <div className="space-y-6">
            <h2 className="text-[24px] font-bold text-gray-900">Seller feedback <span className="text-gray-500 font-normal">(6,526)</span></h2>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-200">
                <button className="pb-3 text-[14px] font-bold text-gray-900 border-b-2 border-gray-900">
                    This item (516)
                </button>
                <button className="pb-3 text-[14px] text-gray-500 hover:text-gray-900">
                    All items (6,526)
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 py-2 overflow-x-auto scbar-none">
                <button className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 border border-gray-300 rounded-full text-[13px] text-gray-900 hover:bg-gray-50">
                    Filter: <span className="font-bold">All ratings</span> <ChevronDown size={14} />
                </button>
                {chips.map(chip => (
                    <button key={chip} className="flex-shrink-0 px-4 py-1.5 text-[13px] text-gray-600 hover:text-gray-900">
                        {chip}
                    </button>
                ))}
            </div>

            {/* Feedback List */}
            <div className="space-y-10 pt-4">
                {feedbackData.map((fb) => (
                    <div key={fb.id} className="flex gap-4">
                        <div className="flex-shrink-0 pt-1">
                            <PlusCircle size={20} className="text-[#31a645]" fill="white" />
                        </div>
                        <div className="flex-1 flex justify-between items-start gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5 text-[13px]">
                                    <span className="font-medium text-gray-900">{fb.user} ({fb.ratingCount})</span>
                                    <span className="text-gray-400">·</span>
                                    <span className="text-gray-500">{fb.time}</span>
                                </div>
                                <p className="text-[14px] text-gray-800 leading-[1.4] max-w-[600px]">
                                    {fb.comment}
                                </p>
                            </div>

                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                {fb.isVerified && (
                                    <span className="text-[11px] text-gray-500">Verified purchase</span>
                                )}
                                {fb.image && (
                                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 mt-1">
                                        <img src={fb.image} alt="Feedback" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-6">
                <button className="px-8 py-2 border border-[#3665f3] text-[#3665f3] font-bold rounded-full text-[14px] hover:bg-blue-50">
                    See all feedback
                </button>
            </div>
        </div>
    );
}
