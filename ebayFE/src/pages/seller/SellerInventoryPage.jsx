export default function SellerInventoryPage() {
    const items = [
        { sku: 'EB-55291-BL', name: 'Bluetooth Wireless Headphones - Midnight Blue', category: 'Electronics', qty: 45, status: 'In Stock', img: 'https://images.unsplash.com/photo-1546435770-a3e426da473b?q=80&w=100&h=100&fit=crop' },
        { sku: 'EB-11022-X', name: 'Ergonomic Office Chair - Mesh Black', category: 'Home & Office', qty: 3, status: 'Low Stock', img: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?q=80&w=100&h=100&fit=crop' },
        { sku: 'EB-99384-SM', name: 'Stainless Steel Water Bottle 500ml', category: 'Sporting Goods', qty: 0, status: 'Out of Stock', img: 'https://images.unsplash.com/photo-1602143307524-788099712760?q=80&w=100&h=100&fit=crop' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
                <div className="flex gap-4">
                    <button className="px-6 py-2 border border-gray-300 rounded-full font-bold text-sm hover:bg-gray-50 flex items-center gap-2">
                        <span className="text-lg">⚓</span> Export CSV
                    </button>
                    <button className="bg-secondary text-white px-8 py-2 rounded-full font-bold text-sm hover:bg-blue-700 transition-colors">+ Add New Item</button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">SEARCH</label>
                    <input type="text" placeholder="Search by SKU or Title..." className="w-full border border-gray-300 rounded px-4 py-2 text-sm focus:border-secondary outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">CATEGORY</label>
                    <select className="w-full border border-gray-300 rounded px-4 py-2 text-sm focus:border-secondary outline-none">
                        <option>All Categories</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">STATUS</label>
                    <select className="w-full border border-gray-300 rounded px-4 py-2 text-sm focus:border-secondary outline-none">
                        <option>All Statuses</option>
                    </select>
                </div>
                <div className="flex gap-4">
                    <button className="flex-grow bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded font-bold text-sm transition-colors">Apply Filters</button>
                    <button className="text-secondary hover:underline py-2 px-2 text-sm font-medium">Clear</button>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50/50 text-[11px] text-gray-500 font-bold uppercase tracking-wider text-left border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 w-10"><input type="checkbox" className="rounded" /></th>
                            <th className="px-6 py-4">SKU</th>
                            <th className="px-6 py-4">PRODUCT NAME</th>
                            <th className="px-6 py-4">CATEGORY</th>
                            <th className="px-6 py-4">AVAILABLE QTY</th>
                            <th className="px-6 py-4">STATUS</th>
                            <th className="px-6 py-4">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map((item) => (
                            <tr key={item.sku} className="hover:bg-gray-50/20 transition-colors">
                                <td className="px-6 py-6"><input type="checkbox" className="rounded" /></td>
                                <td className="px-6 py-6 font-medium text-gray-500">{item.sku}</td>
                                <td className="px-6 py-6 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-50 rounded border border-gray-100 flex items-center justify-center overflow-hidden">
                                        <img src={item.img} className="object-cover w-full h-full" alt="" />
                                    </div>
                                    <span className="font-bold text-secondary hover:underline cursor-pointer">{item.name}</span>
                                </td>
                                <td className="px-6 py-6 text-gray-600">{item.category}</td>
                                <td className="px-6 py-6">
                                    <input
                                        type="number"
                                        value={item.qty}
                                        className={`w-16 border rounded px-2 py-1 outline-none text-center font-bold ${item.qty === 0 ? 'bg-red-50 border-red-200 text-red-700' :
                                                item.qty < 5 ? 'bg-orange-50 border-orange-200 text-orange-700' : 'border-gray-300'
                                            }`}
                                    />
                                </td>
                                <td className="px-6 py-6">
                                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${item.status === 'In Stock' ? 'bg-green-100 text-green-700' :
                                            item.status === 'Low Stock' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-6 py-6">
                                    <button className="text-secondary font-bold hover:underline">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex justify-between items-center text-gray-500 text-xs">
                    <span>Showing 1 to 3 of 42 items</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors" disabled>Previous</button>
                        <button className="px-3 py-1 border border-secondary bg-white text-secondary font-bold rounded">1</button>
                        <button className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors">2</button>
                        <button className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
