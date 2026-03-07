import { Upload, X, Plus, Info } from 'lucide-react';

export default function SellerStorePage() {
    return (
        <div className="space-y-10 pb-20">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Edit Storefront</h2>
                <div className="flex gap-4">
                    <button className="px-8 py-2 border border-gray-300 rounded-full font-bold text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                    <button className="bg-secondary text-white px-8 py-2 rounded-full font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">Publish</button>
                </div>
            </div>

            {/* Store Billboard */}
            <div className="bg-white p-10 rounded-xl border border-gray-200 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">Store Billboard</h3>
                </div>

                <div className="aspect-[12/2.7] w-full border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 flex flex-col items-center justify-center gap-4 group hover:border-secondary/40 transition-all cursor-pointer overflow-hidden relative">
                    <div className="flex flex-col items-center group-hover:-translate-y-1 transition-transform">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-2">
                            <Upload className="text-secondary" />
                        </div>
                        <span className="text-sm font-bold text-secondary">Add image</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">Recommended size: 1200 x 270 px</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Store Name</label>
                        <input type="text" placeholder="e.g. Awesome Collectibles Store" className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-secondary transition-all font-medium text-gray-800" />
                    </div>
                    <div className="space-y-2 row-span-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Store Logo</label>
                        <div className="w-[180px] aspect-square border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 flex flex-col items-center justify-center gap-3 hover:border-secondary/40 transition-all cursor-pointer">
                            <Plus className="text-gray-300" />
                            <span className="text-[10px] font-bold text-gray-400">Add Logo</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 italic font-medium">300 x 300 px recommended</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Store Description</label>
                        <textarea
                            rows={6}
                            placeholder="Tell buyers about your store..."
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-secondary transition-all text-gray-800 text-sm"
                        ></textarea>
                    </div>
                </div>
            </div>

            {/* Featured Categories Customization */}
            <div className="bg-white p-10 rounded-xl border border-gray-200 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">Featured Categories</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-4">
                            <div className="aspect-square w-full border-2 border-dashed border-gray-100 rounded-full bg-gray-50/50 flex items-center justify-center hover:border-secondary/30 transition-all cursor-pointer group">
                                <Plus className="text-gray-300 group-hover:text-secondary group-hover:scale-110 transition-all" size={20} />
                            </div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Add Category</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-center border-t border-gray-100 pt-10 gap-6">
                <button className="px-12 py-3 border border-gray-300 rounded-full font-bold text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                <button className="bg-secondary text-white px-12 py-3 rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Publish</button>
            </div>
        </div>
    );
}
