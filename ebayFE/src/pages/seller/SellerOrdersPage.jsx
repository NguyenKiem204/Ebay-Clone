export default function SellerOrdersPage() {
    const orders = [
        { id: '#22-12345-67890', buyer: 'sneaker_head99', rating: 1450, total: 125.00, status: 'Awaiting shipment', item: 'Nike Air Max 270 - Blue/White', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=100&h=100&fit=crop' },
        { id: '#18-54321-09876', buyer: 'watch_collector_uk', rating: 892, total: 345.50, status: 'Shipped', item: 'Vintage Seiko Automatic Watch', img: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=100&h=100&fit=crop' },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Manage orders</h2>

            <div className="flex gap-4 border-b border-gray-200">
                {['All', 'Awaiting payment', 'Awaiting shipment', 'Paid and shipped', 'Cancelled'].map((tab, idx) => (
                    <button
                        key={tab}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${idx === 0 ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <button className="px-4 py-1.5 border border-gray-300 rounded-full text-sm font-bold hover:bg-gray-50">Print</button>
                    <button className="px-4 py-1.5 border border-gray-300 rounded-full text-sm font-bold hover:bg-gray-50">Edit</button>
                    <div className="flex-grow text-right text-xs text-gray-500 self-center">Showing 1-2 of 2</div>
                </div>

                <table className="w-full text-sm">
                    <thead className="bg-gray-50/50 text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-3 text-left w-10"><input type="checkbox" className="rounded" /></th>
                            <th className="px-6 py-3 text-left">Buyer / Item</th>
                            <th className="px-6 py-3 text-left">Total Price</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4"><input type="checkbox" className="rounded" /></td>
                                <td className="px-6 py-4 flex gap-4">
                                    <img src={order.img} className="w-12 h-12 object-cover rounded border border-gray-100" alt="" />
                                    <div>
                                        <p className="font-bold text-secondary hover:underline cursor-pointer">{order.item}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Buyer: <span className="text-gray-700">{order.buyer}</span> ({order.rating} ⭐)
                                        </p>
                                        <p className="text-xs text-gray-400">Order {order.id}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-900">${order.total.toFixed(2)}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${order.status === 'Shipped' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                                        }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-2">
                                        <button className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors ${order.status === 'Shipped' ? 'border border-gray-300 hover:bg-gray-50' : 'bg-secondary text-white hover:bg-blue-700'
                                            }`}>
                                            {order.status === 'Shipped' ? 'Add tracking' : 'Print shipping label'}
                                        </button>
                                        <button className="text-secondary text-[12px] font-bold hover:underline">More actions</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
