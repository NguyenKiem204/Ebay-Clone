import { Button } from '../../../components/ui/Button';

export default function PaymentMethod({ method, isEditing, onEdit, onSelect, onContinue, isActive }) {
    if (!isActive && !isEditing) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 opacity-100">
                <h2 className="text-xl font-bold text-gray-400">2. Payment method</h2>
            </div>
        );
    }

    if (!isEditing) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">2. Payment method</h2>
                    <button onClick={onEdit} className="text-secondary hover:underline font-medium text-sm">Edit</button>
                </div>
                <div className="text-sm text-gray-700 flex items-center gap-2">
                    {method === 'paypal' ? (
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4 object-contain" />
                    ) : (
                        <span className="font-medium capitalize">{method.replace('-', ' ')}</span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">2. Payment method</h2>
            <div className="space-y-4">
                <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition ${method === 'paypal' ? 'border-secondary bg-blue-50/10' : 'border-gray-200 hover:border-secondary'}`}>
                    <input
                        type="radio"
                        name="payment"
                        className="w-5 h-5 text-secondary focus:ring-secondary"
                        checked={method === 'paypal'}
                        onChange={() => onSelect('paypal')}
                    />
                    <div className="flex items-center gap-2">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-6 object-contain" />
                    </div>
                </label>

                <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition ${method === 'card' ? 'border-secondary bg-blue-50/10' : 'border-gray-200 hover:border-secondary'}`}>
                    <input
                        type="radio"
                        name="payment"
                        className="w-5 h-5 text-secondary focus:ring-secondary"
                        checked={method === 'card'}
                        onChange={() => onSelect('card')}
                    />
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                        </svg>
                        <span className="font-medium text-gray-800">Credit or debit card</span>
                    </div>
                </label>

                <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition ${method === 'cod' ? 'border-secondary bg-blue-50/10' : 'border-gray-200 hover:border-secondary'}`}>
                    <input
                        type="radio"
                        name="payment"
                        className="w-5 h-5 text-secondary focus:ring-secondary"
                        checked={method === 'cod'}
                        onChange={() => onSelect('cod')}
                    />
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">Cash on Delivery (COD)</span>
                    </div>
                </label>

                <Button
                    onClick={onContinue}
                    variant="secondary"
                    className="w-full sm:w-auto mt-6"
                >
                    Continue
                </Button>
            </div>
        </div>
    );
}
