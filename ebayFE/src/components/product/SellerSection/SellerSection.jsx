import AboutSellerSidebar from './AboutSellerSidebar';
import SellerFeedbackList from './SellerFeedbackList';
import SellerOtherItems from './SellerOtherItems';

export default function SellerSection({ product }) {
    return (
        <div className="mt-16 pt-12 border-t border-gray-200">
            <div className="bg-[#f7f7f7] rounded-2xl p-4 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-20 mb-12">
                    {/* Left Sidebar: About this seller */}
                    <div className="md:col-span-4">
                        <AboutSellerSidebar product={product} />
                    </div>

                    {/* Right Main: Seller feedback */}
                    <div className="md:col-span-8">
                        <SellerFeedbackList />
                    </div>
                </div>

                {/* Seller's items from Pro Store */}
                <div className="border-t border-gray-200 pt-10">
                    <SellerOtherItems product={product} />
                </div>
            </div>
        </div>
    );
}
