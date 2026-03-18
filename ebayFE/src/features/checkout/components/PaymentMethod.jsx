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
                    {method === 'PayPal' ? (
                        <div className="flex items-center gap-2">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4 object-contain" />
                            <span className="font-bold text-primary">PayPal</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.1c.827.242 1.634-.44 1.634-1.3v-3.566a3 3 0 00-.811-2.003L17.5 12.5m-15.25 6.25a60.07 60.07 0 0015.797 2.1c.827.242 1.341-.758 1.13-1.55l-1.397-5.234a3 3 0 00-2.022-2.132L12.5 10.5m-10.25 8.25L3.397 13.516a3 3 0 012.022-2.132L10.5 10.5m2 0a2 2 0 114 0 2 2 0 01-4 0z" />
                            </svg>
                            <span className="font-bold text-gray-800">Cash on Delivery (COD)</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">2. Payment method</h2>
            <div className="space-y-4">
                <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition ${method === 'PayPal' ? 'border-secondary bg-blue-50/10' : 'border-gray-200 hover:border-secondary'}`}>
                    <input
                        type="radio"
                        name="payment"
                        className="w-5 h-5 text-secondary focus:ring-secondary"
                        checked={method === 'PayPal'}
                        onChange={() => onSelect('PayPal')}
                    />
                    <div className="flex items-center gap-2">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-6 object-contain" />
                        <span className="font-bold text-primary text-lg">PayPal</span>
                    </div>
                </label>

                <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition ${method === 'COD' ? 'border-secondary bg-blue-50/10' : 'border-gray-200 hover:border-secondary'}`}>
                    <input
                        type="radio"
                        name="payment"
                        className="w-5 h-5 text-secondary focus:ring-secondary"
                        checked={method === 'COD'}
                        onChange={() => onSelect('COD')}
                    />
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.1c.827.242 1.634-.44 1.634-1.3v-3.566a3 3 0 00-.811-2.003L17.5 12.5m-15.25 6.25a60.07 60.07 0 0015.797 2.1c.827.242 1.341-.758 1.13-1.55l-1.397-5.234a3 3 0 00-2.022-2.132L12.5 10.5m-10.25 8.25L3.397 13.516a3 3 0 012.022-2.132L10.5 10.5m2 0a2 2 0 114 0 2 2 0 01-4 0z" />
                            </svg>
                        </div>
                        <span className="font-bold text-gray-800">Cash on Delivery (COD)</span>
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
