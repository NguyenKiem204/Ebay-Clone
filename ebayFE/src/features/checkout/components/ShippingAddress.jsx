import { Button } from '../../../components/ui/Button';

export default function ShippingAddress({ address, isEditing, onEdit, onContinue }) {
    if (!isEditing) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-gray-900">1. Shipping address</h2>
                    <button onClick={onEdit} className="text-secondary hover:underline text-sm font-medium">Edit</button>
                </div>
                <div className="text-sm text-gray-700">
                    <p className="font-bold">{address.name}</p>
                    <p>{address.street}</p>
                    <p>{address.city}, {address.zip}, {address.country}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">1. Shipping address</h2>
            <div className="space-y-4">
                <label className="relative block cursor-pointer group">
                    <input type="radio" name="address" className="peer sr-only" defaultChecked />
                    <div className="p-4 border-2 rounded-lg transition-all border-secondary bg-blue-50/30">
                        <div className="flex justify-between">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900">{address.name}</span>
                                    {address.isDefault && (
                                        <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider">DEFAULT</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-800 mt-1">{address.phone}</p>
                                <p className="text-sm text-gray-600">{address.street}</p>
                                <p className="text-sm text-gray-600">{address.city}, {address.zip}, {address.country}</p>
                            </div>
                            <div className="flex flex-col items-end justify-between">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-secondary">
                                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </label>

                <Button
                    onClick={onContinue}
                    variant="secondary"
                    className="w-full sm:w-auto mt-4"
                >
                    Deliver to this address
                </Button>
            </div>
        </div>
    );
}
