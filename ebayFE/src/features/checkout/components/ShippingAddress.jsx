import { Button } from '../../../components/ui/Button';

export default function ShippingAddress({ address, addresses, selectedAddressId, setSelectedAddressId, isEditing, onEdit, onContinue }) {
    if (!isEditing) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-gray-900">1. Shipping address</h2>
                    <button onClick={onEdit} className="text-secondary hover:underline text-sm font-medium">Edit</button>
                </div>
                {address ? (
                    <div className="text-sm text-gray-700">
                        <p className="font-bold">{address.receiverName}</p>
                        <p>{address.street}, {address.ward}, {address.district}</p>
                        <p>{address.city}, {address.country}</p>
                    </div>
                ) : (
                    <p className="text-sm text-red-500">No address selected</p>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">1. Shipping address</h2>
                <button className="text-secondary hover:underline text-sm font-medium">Add new address</button>
            </div>
            <div className="space-y-4">
                {addresses.length > 0 ? (
                    addresses.map((addr) => (
                        <label key={addr.id} className="relative block cursor-pointer group">
                            <input
                                type="radio"
                                name="address"
                                className="peer sr-only"
                                checked={selectedAddressId === addr.id}
                                onChange={() => setSelectedAddressId(addr.id)}
                            />
                            <div className={`p-4 border-2 rounded-lg transition-all ${selectedAddressId === addr.id ? 'border-secondary bg-blue-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
                                <div className="flex justify-between">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">{addr.receiverName}</span>
                                            {addr.isDefault && (
                                                <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider">DEFAULT</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-800 mt-1">{addr.phoneNumber}</p>
                                        <p className="text-sm text-gray-600">{addr.street}, {addr.ward}</p>
                                        <p className="text-sm text-gray-600">{addr.district}, {addr.city}, {addr.country}</p>
                                    </div>
                                    <div className="flex flex-col items-end justify-between">
                                        {selectedAddressId === addr.id && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-secondary">
                                                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </label>
                    ))
                ) : (
                    <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-gray-500 mb-4">No saved addresses found</p>
                        <Button variant="outline" size="sm">Add your first address</Button>
                    </div>
                )}

                <Button
                    onClick={onContinue}
                    variant="secondary"
                    className="w-full sm:w-auto mt-4"
                    disabled={!selectedAddressId}
                >
                    Deliver to this address
                </Button>
            </div>
        </div>
    );
}
