import { useState } from 'react';
import { Plus, Camera, Search, ChevronRight } from 'lucide-react';

export default function SellerCreateListingPage() {
    const [priceType, setPriceType] = useState('Auction');

    return (
        <div className="max-w-[1000px] mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <h2 className="text-[28px] font-bold text-gray-900">Create a listing</h2>
                <button className="text-secondary text-sm font-medium hover:underline">Switch to the classic tool</button>
            </div>

            {/* Photos Section */}
            <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Photos</h3>
                    <span className="text-xs text-gray-500">0 / 24 photos</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">Add up to 24 photos. We recommend photos that are at least 1600 pixels on the longest side.</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    <button className="aspect-square border-2 border-dashed border-secondary/30 rounded-lg flex flex-col items-center justify-center gap-2 group hover:border-secondary transition-colors bg-blue-50/10">
                        <Plus className="text-secondary" />
                        <span className="text-[10px] font-bold text-secondary">Add photos</span>
                    </button>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="aspect-square border border-gray-200 border-dashed rounded-lg bg-gray-50/30 flex items-center justify-center">
                            <Plus className="text-gray-300" size={16} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Title & Category Section */}
            <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm space-y-8">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Title</h3>
                        <span className="text-xs text-gray-500 font-medium">0 / 80</span>
                    </div>
                    <input
                        type="text"
                        placeholder="Brand, model, color, size, etc."
                        className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Category</h3>
                        <button className="text-secondary text-sm font-bold hover:underline">Edit</button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between group cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded flex items-center justify-center border border-gray-200">
                                <Search size={18} className="text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">Select a category</p>
                                <p className="text-xs text-gray-500">Suggested categories will appear here after you enter a title.</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                </div>
            </div>

            {/* Item Specifics */}
            <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Item specifics</h3>
                <p className="text-sm text-gray-500 mb-8">Buyers use these to find your item. Provide as many as possible.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Condition <span className="text-red-500 ml-1 font-bold">*</span></label>
                        <select className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:border-secondary appearance-none bg-[url('https://cdn0.iconfinder.com/data/icons/ui-elements-flat-linear/64/chevron-down-512.png')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat">
                            <option>Select condition</option>
                            <option>New</option>
                            <option>Used - Like New</option>
                            <option>Used - Good</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Brand</label>
                        <input type="text" placeholder="e.g. Nike" className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:border-secondary" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Model</label>
                        <input type="text" placeholder="e.g. Air Max 90" className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:border-secondary" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Color</label>
                        <input type="text" placeholder="e.g. Black" className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:border-secondary" />
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">Description</h3>
                </div>
                <div className="bg-gray-50/50 p-2 flex gap-4 border-b border-gray-100 px-8">
                    {['B', 'I', 'U'].map(btn => (
                        <button key={btn} className="w-8 h-8 rounded hover:bg-white hover:shadow-sm font-bold text-gray-700 transition-all">{btn}</button>
                    ))}
                    <div className="w-[1px] h-6 bg-gray-200 self-center mx-1"></div>
                    <button className="px-2 h-8 rounded hover:bg-white hover:shadow-sm font-bold text-gray-700 text-sm">List</button>
                </div>
                <textarea
                    className="w-full min-h-[250px] p-8 outline-none text-gray-800 placeholder-gray-300"
                    placeholder="Tell buyers about your item..."
                ></textarea>
            </div>

            {/* Pricing Section */}
            <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-8">Pricing</h3>
                <div className="flex gap-8 mb-10">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                            type="radio"
                            name="pricing"
                            checked={priceType === 'Auction'}
                            onChange={() => setPriceType('Auction')}
                            className="w-5 h-5 text-secondary border-gray-300 focus:ring-secondary/20 transition-all cursor-pointer"
                        />
                        <span className={`font-bold transition-colors ${priceType === 'Auction' ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>Auction</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                            type="radio"
                            name="pricing"
                            checked={priceType === 'Fixed price'}
                            onChange={() => setPriceType('Fixed price')}
                            className="w-5 h-5 text-secondary border-gray-300 focus:ring-secondary/20 transition-all cursor-pointer"
                        />
                        <span className={`font-bold transition-colors ${priceType === 'Fixed price' ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>Fixed price</span>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                    <div className="md:col-span-4 space-y-2">
                        <label className="text-sm font-medium text-gray-700">Starting price</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                            <input type="text" defaultValue="0.00" className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-md outline-none focus:border-secondary font-bold text-gray-900" />
                        </div>
                    </div>
                    <div className="md:col-span-4 space-y-2">
                        <label className="text-sm font-medium text-gray-700">Duration</label>
                        <select className="w-full border border-gray-300 rounded-md px-4 py-3 outline-none focus:border-secondary appearance-none bg-[url('https://cdn0.iconfinder.com/data/icons/ui-elements-flat-linear/64/chevron-down-512.png')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat">
                            <option>7 days</option>
                            <option>10 days</option>
                            <option>30 days</option>
                        </select>
                    </div>
                    <div className="md:col-span-4 pb-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-secondary focus:ring-secondary/20 transition-all cursor-pointer" />
                            <span className="text-sm font-medium text-gray-700">Allow offers</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 py-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40">
                <div className="max-w-[1000px] mx-auto px-4 flex justify-end items-center gap-6">
                    <button className="text-secondary font-bold hover:underline text-sm">Save for later</button>
                    <div className="flex gap-4">
                        <button className="px-10 py-2.5 border border-secondary text-secondary font-bold rounded-full hover:bg-blue-50 transition-colors">Preview</button>
                        <button className="px-10 py-2.5 bg-secondary text-white font-bold rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-secondary/10">List it now</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
