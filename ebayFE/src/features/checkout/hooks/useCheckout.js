import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkoutService } from '../services/checkoutService';
import { useCart } from '../../cart/hooks/useCart';

export const useCheckout = () => {
    const navigate = useNavigate();
    const { items, subtotal, clearCart } = useCart();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [note, setNote] = useState('');

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const response = await checkoutService.getShippingAddresses();
                if (response.success) {
                    setAddresses(response.data);
                    const defaultAddr = response.data.find(a => a.isDefault) || response.data[0];
                    if (defaultAddr) setSelectedAddressId(defaultAddr.id);
                }
            } catch (err) {
                console.error('Failed to fetch addresses', err);
            }
        };
        fetchAddresses();
    }, []);

    const selectedAddress = addresses.find(a => a.id === selectedAddressId);

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            setError('Please select a shipping address');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const orderData = {
                addressId: selectedAddressId,
                paymentMethod: paymentMethod,
                note: note
            };

            const response = await checkoutService.placeOrder(orderData);

            if (response.success) {
                const order = response.data;

                if (paymentMethod === 'PayPal') {
                    // Simulate PayPal Flow
                    console.log('Starting PayPal simulation for order:', order.id);
                    const paypalResponse = await checkoutService.createPaypalOrder(order.id);

                    if (paypalResponse.success) {
                        const paypalOrderId = paypalResponse.data; // This is a mock string from BE

                        // Fake a small delay for "payment gateway"
                        await new Promise(resolve => setTimeout(resolve, 2000));

                        const captureResponse = await checkoutService.capturePaypalOrder(paypalOrderId);
                        if (!captureResponse.success) {
                            throw new Error('PayPal payment failed simulation');
                        }
                    } else {
                        throw new Error('Failed to initiate PayPal payment');
                    }
                }

                // Success
                clearCart();
                navigate(`/order-success?id=${order.id}`);
            } else {
                setError(response.message || 'Failed to place order');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'An error occurred during checkout.');
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
        addresses,
        selectedAddressId,
        setSelectedAddressId,
        selectedAddress,
        paymentMethod,
        setPaymentMethod,
        note,
        setNote,
        handlePlaceOrder
    };
};
