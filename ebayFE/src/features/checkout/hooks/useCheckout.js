import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkoutService } from '../services/checkoutService';
import { useCart } from '../../cart/hooks/useCart';

export const useCheckout = () => {
    const navigate = useNavigate();
    const { items, subtotal, clearCart } = useCart();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [shippingAddress, setShippingAddress] = useState({
        name: 'Johnathan Doe',
        phone: '+84 987 654 321',
        street: '123 Nguyen Hue Street, District 1',
        city: 'Ho Chi Minh City',
        zip: '700000',
        country: 'Vietnam',
        isDefault: true
    });

    const [paymentMethod, setPaymentMethod] = useState('paypal');

    const handlePlaceOrder = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const orderData = {
                items: items.map(item => ({ productId: item.id, quantity: item.quantity })),
                shippingAddress,
                paymentMethod,
                total: subtotal * 1.08 // Subtotal + Tax
            };
            await checkoutService.placeOrder(orderData);
            clearCart();
            navigate('/order-success');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to place order. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        step,
        setStep,
        items,
        subtotal,
        isLoading,
        error,
        shippingAddress,
        setShippingAddress,
        paymentMethod,
        setPaymentMethod,
        handlePlaceOrder
    };
};
