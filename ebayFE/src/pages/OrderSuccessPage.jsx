import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function OrderSuccessPage() {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('id');
    const orderNumber = orderId ? `EB${orderId.padStart(8, '0')}` : 'EB00123456';

    return (
        <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank you for your purchase!</h1>
            <p className="text-lg text-gray-600 mb-8">Your order has been placed and is being processed.</p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-left max-w-lg mx-auto">
                <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
                    <div>
                        <span className="block text-sm text-gray-500 mb-1">Order number</span>
                        <span className="font-bold text-gray-900">{orderNumber}</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-sm text-gray-500 mb-1">Estimated delivery</span>
                        <span className="font-medium text-gray-900">3-5 business days</span>
                    </div>
                </div>

                <p className="text-sm text-gray-600">
                    We've sent a confirmation email to your registered email address with your order details and tracking information.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/orders">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto font-bold px-8">
                        View Order
                    </Button>
                </Link>
                <Link to="/">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto font-bold shadow-lg shadow-blue-500/20 px-8">
                        Continue Shopping
                    </Button>
                </Link>
            </div>
        </div>
    );
}
