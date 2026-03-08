export default function CheckoutReview({ items, isActive }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className={`text-xl font-bold mb-6 ${!isActive ? 'text-gray-400' : 'text-gray-900'}`}>
                3. Review items and shipping
            </h2>

            {isActive && (
                <div className="space-y-6">
                    {items.map(item => (
                        <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                            <img src={item.image} alt={item.title} className="w-20 h-20 object-contain border border-gray-200 rounded" />
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">{item.title}</h3>
                                <p className="text-xs text-gray-500 mt-1">Qty {item.quantity}</p>
                                <p className="text-xs text-green-600 mt-1">Standard Shipping - Free</p>
                            </div>
                            <div className="text-right font-bold text-gray-900">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
