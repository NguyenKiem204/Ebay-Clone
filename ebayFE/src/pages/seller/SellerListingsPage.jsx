export default function SellerListingsPage() {
    const listings = [
        { id: '324591022341', title: 'Vintage Mechanical Watch - Swiss Made 17 Jewels', price: 124.99, shipping: 12.00, qty: 1, watchers: 12, timeLeft: '2d 04h', img: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=100&h=100&fit=crop' },
        { id: '110948273645', title: 'Professional DSLR Camera Body Only - Mint Condition', price: 899.00, shipping: 0, qty: 2, watchers: 45, timeLeft: '6d 18h', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=100&h=100&fit=crop' },
        { id: '293847561023', title: 'Organic Cotton T-Shirt - Blue - Size L', price: 19.99, shipping: 4.99, qty: 15, watchers: 3, timeLeft: '24d 10h', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=100&h=100&fit=crop' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex gap-4 border-b border-gray-200">
                    {['Active', 'Unsold', 'Scheduled', 'Drafts'].map((tab, idx) => (
                        <button key={tab} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${idx === 0 ? 'border-secondary text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
                <button className="bg-primary text-white px-8 py-2 rounded-full font-bold text-sm hover:opacity-90 transition-opacity">Create Listing</button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-4 items-center">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input type="checkbox" className="rounded" /> Select all
                    </label>
                    <button className="px-4 py-1.5 border border-gray-300 rounded text-[13px] font-bold hover:bg-gray-50">Edit</button>
                    <button className="px-4 py-1.5 border border-gray-300 rounded text-[13px] font-bold hover:bg-gray-50">Sell similar</button>
                    <button className="px-4 py-1.5 border border-red-200 text-red-600 rounded text-[13px] font-bold hover:bg-red-50">End</button>
                    <div className="flex-grow text-right text-xs text-gray-500">Total: <span className="font-bold">3 listings</span></div>
                </div>

                <table className="w-full text-[13px]">
                    <thead className="bg-gray-50/50 text-[10px] text-gray-500 font-bold uppercase tracking-wider text-left">
                        <tr>
                            <th className="px-6 py-3 w-10"></th>
                            <th className="px-6 py-3 w-28">IMAGE</th>
                            <th className="px-6 py-3">TITLE / ITEM ID</th>
                            <th className="px-6 py-3">PRICE</th>
                            <th className="px-6 py-3">QTY</th>
                            <th className="px-6 py-3">WATCHERS</th>
                            <th className="px-6 py-3">TIME LEFT</th>
                            <th className="px-6 py-3">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {listings.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4"><input type="checkbox" className="rounded" /></td>
                                <td className="px-6 py-4">
                                    <img src={item.img} className="w-16 h-16 object-cover rounded border border-gray-100" alt="" />
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-secondary hover:underline cursor-pointer line-clamp-2">{item.title}</p>
                                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-tight">ID: {item.id}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-gray-900">${item.price.toFixed(2)}</p>
                                    <p className="text-[11px] text-gray-500">
                                        {item.shipping === 0 ? <span className="text-green-600 font-bold">Free shipping</span> : `+ $${item.shipping.toFixed(2)} Shipping`}
                                    </p>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-700">{item.qty}</td>
                                <td className="px-6 py-4 font-medium text-gray-700">{item.watchers}</td>
                                <td className="px-6 py-4 font-medium text-gray-700">{item.timeLeft}</td>
                                <td className="px-6 py-4">
                                    <select className="border border-gray-300 rounded px-3 py-1 text-sm bg-white outline-none cursor-pointer hover:border-gray-400">
                                        <option>Edit</option>
                                        <option>Revise</option>
                                        <option>Sell Similar</option>
                                        <option>End Item</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
