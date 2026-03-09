import { Link } from 'react-router-dom';

export default function AboutThisItem({ product }) {
    return (
        <div className="mt-16 bg-white">
            <div className="flex border-b border-gray-200 mb-6 items-end">
                <div className="py-2 px-6 text-[14px] font-bold border-x border-t rounded-t-lg bg-white border-gray-200 text-blue-600 transition-all relative -mb-[1px]">
                    About this item
                </div>
            </div>

            <div className="bg-white px-8 py-8 border border-gray-200 rounded-b-lg -mt-[1px]">
                <div className="space-y-6">
                    {/* Seller Responsibility & Item ID Header */}
                    <div className="flex justify-between items-start text-[14px]">
                        <div className="space-y-4">
                            <div className="text-gray-700">
                                Seller assumes all responsibility for this listing.
                            </div>
                            <div className="text-gray-600">
                                Last updated on Mar 09, 2026 11:19:23 PDT <Link to="#" className="text-gray-400 underline hover:no-underline ml-1">View all revisions</Link>
                            </div>
                        </div>
                        <div className="text-gray-500">
                            eBay item number: <span className="font-bold text-gray-700">297972009290</span>
                        </div>
                    </div>

                    {/* Item Specifics Section */}
                    <div className="pt-4">
                        <h2 className="text-[22px] font-bold mb-4 text-gray-900">Item specifics</h2>
                        <div className="grid grid-cols-4 gap-y-3 text-[14px]">
                            {/* Row 1 */}
                            <div className="text-gray-500">Condition</div>
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-gray-900">{product.condition || 'Excellent - Refurbished'}</span>
                                <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-[10px] text-gray-500 font-bold">i</div>
                            </div>
                            <div className="text-gray-500 pl-4">Seller Notes</div>
                            <div className="text-gray-900">
                                <div className="italic inline">"100% Fully Functional - Excellent Cosmetic Condition. Looks like new at first glance. See below for ... </div>
                                <Link to="#" className="font-bold text-gray-900 underline hover:no-underline ml-1">Read more</Link>
                            </div>

                            {/* Row 2 */}
                            <div className="text-gray-500">Brand</div>
                            <div className="text-gray-900">{product.brand || 'Apple'}</div>
                            <div className="text-gray-500 pl-4">Model</div>
                            <div className="text-gray-900">{product.title?.split(' ')[0] + ' ' + product.title?.split(' ')[1] || 'Apple iPhone 17 Pro'}</div>

                            {/* Row 3 */}
                            <div className="text-gray-500">Storage Capacity</div>
                            <div className="text-gray-900">512 GB</div>
                            <div className="text-gray-500 pl-4">Network</div>
                            <div className="text-gray-900 leading-[1.2]">
                                AT&T, AT&T, Verizon, T-Mobile, Sprint, Boost, Boost Mobile, C Spire, Consumer Cellular, Cricket, Cricket Wireless, Factory Unlocked, Google Fi, Gsm Unlocked, Metro, Mint Mobile, Spectrum, Straight Talk, Ting, T-Mobile, Total Wireless, TracFone, U.S. Cellular, Unlocked, Unlocked / T-Mobile / AT&T / Verizon, US Mobile, Verizon, Verizon Unlocked, Verizon Wireless, Virgin Mobile, Visible, Walmart Family Mobile, Xfinity
                            </div>

                            {/* Row 4 */}
                            <div className="text-gray-500">Screen Size</div>
                            <div className="text-gray-900">6.3 in</div>
                            <div className="text-gray-500 pl-4">Lock Status</div>
                            <div className="text-gray-900">Factory Unlocked</div>

                            {/* Row 5 */}
                            <div className="text-gray-500">Connectivity</div>
                            <div className="text-gray-900">5G, Bluetooth, NFC, USB Type-C, Wi-Fi</div>
                            <div className="text-gray-500 pl-4">Processor</div>
                            <div className="text-gray-900">Hexa Core</div>

                            {/* Row 6 */}
                            <div className="text-gray-500">RAM</div>
                            <div className="text-gray-900">12 GB</div>
                            <div className="text-gray-500 pl-4">SIM Card Slot</div>
                            <div className="text-gray-900">eSIM</div>

                            {/* Row 7 */}
                            <div className="text-gray-500">Operating System</div>
                            <div className="text-gray-900">iOS</div>
                            <div className="text-gray-500 pl-4">Contract</div>
                            <div className="text-gray-900">Without Contract</div>

                            {/* Row 8 */}
                            <div className="text-gray-500">Model Number</div>
                            <div className="text-gray-900">A3256</div>
                            <div className="text-gray-500 pl-4">Memory Card Type</div>
                            <div className="text-gray-900">Built-In Memory</div>

                            {/* Row 9 */}
                            <div className="text-gray-500">Camera Resolution</div>
                            <div className="text-gray-900">48.0 MP</div>
                            <div className="text-gray-500 pl-4">MPN</div>
                            <div className="text-gray-900">MG7N4LL/A, MG7P4LL/A, MG7Q4LL/A</div>

                            {/* Row 10 */}
                            <div className="text-gray-500">Manufacturer Color</div>
                            <div className="text-gray-900">Deep Blue, Cosmic Orange, Silver</div>
                            <div className="text-gray-500 pl-4">Style</div>
                            <div className="text-gray-900">Bar</div>

                            {/* Row 11 */}
                            <div className="text-gray-500">ChipsetModel</div>
                            <div className="text-gray-900">Apple A19 Pro (3 NM)</div>
                            <div className="text-gray-500 pl-4">Release Date</div>
                            <div className="text-gray-900">2025</div>

                            {/* Row 12 */}
                            <div className="text-gray-500">Battery Health/Capacity</div>
                            <div className="text-gray-900">85% or higher</div>
                            <div className="text-gray-500 pl-4">Country of Origin</div>
                            <div className="text-gray-900">United States</div>

                            {/* Row 13 - Category */}
                            <div className="text-gray-500">Category</div>
                            <div className="col-span-3">
                                <nav className="inline-flex items-center gap-2 text-[13px] font-medium text-gray-900">
                                    <Link to="#" className="underline hover:no-underline">Electronics</Link>
                                    <span className="text-gray-400">❯</span>
                                    <Link to="#" className="underline hover:no-underline">Cell Phones & Accessories</Link>
                                    <span className="text-gray-400">❯</span>
                                    <Link to="#" className="underline hover:no-underline">Cell Phones & Smartphones</Link>
                                </nav>
                            </div>
                        </div>
                    </div>

                    {/* Item Description Section */}
                    <div className="pt-12">
                        <h3 className="text-[22px] font-bold mb-6 text-gray-900">Item description from the seller</h3>
                        <div
                            className="leading-relaxed text-gray-800 prose max-w-none"
                            dangerouslySetInnerHTML={{ __html: product.description || 'No description provided.' }}
                        />
                        <div className="mt-8 flex justify-end text-[11px] text-gray-500">
                            Powered by <span className="text-blue-600 ml-1">Frooition</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
