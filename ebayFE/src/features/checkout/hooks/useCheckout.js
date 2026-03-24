import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { checkoutService } from '../services/checkoutService';
import { useCart } from '../../cart/hooks/useCart';
import api from '../../../lib/axios';
import useAuthStore from '../../../store/useAuthStore';

export const useCheckout = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isBuyItNow = searchParams.get('buyItNow') === '1';
    const buyItNowProductId = searchParams.get('productId');
    const initialQuantity = parseInt(searchParams.get('quantity') || '1');

    const { items: cartItems, subtotal: cartSubtotal, clearCart, updateQuantity: updateCartQuantity } = useCart();
    
    const [buyItNowItem, setBuyItNowItem] = useState(null);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [note, setNote] = useState('');
    const [guestShipping, setGuestShipping] = useState({ country: 'Vietnam' });
    const [isGuestDone, setIsGuestDone] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedSavedIdx, setSelectedSavedIdx] = useState(0);
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);

    // Fetch Buy It Now Item
    useEffect(() => {
        if (isBuyItNow && buyItNowProductId) {
            const fetchProduct = async () => {
                try {
                    const response = await api.get(`/api/Product/${buyItNowProductId}`);
                    if (response.data?.success) {
                        const product = response.data.data;
                        setBuyItNowItem({
                            id: product.id,
                            title: product.name || product.title,
                            price: product.price,
                            image: product.thumbnail || product.imageUrl || (product.images?.[0]),
                            sellerId: product.sellerId,
                            sellerName: product.sellerName,
                            seller: product.sellerName || 'ebay_seller',
                            soldCount: product.soldCount ?? 0,
                            quantity: initialQuantity
                        });
                    }
                } catch (err) {
                    console.error('Failed to fetch product for buy it now', err);
                }
            };
            fetchProduct();
        }
    }, [isBuyItNow, buyItNowProductId, initialQuantity]);

    useEffect(() => {
        if (!isAuthenticated) return; // skip for guests
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
    }, [isAuthenticated]);

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

            if (isBuyItNow && buyItNowItem) {
                orderData.buyItNowProductId = buyItNowItem.id;
                orderData.buyItNowQuantity = buyItNowItem.quantity;
            }

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
                if (!isBuyItNow) {
                    clearCart();
                }
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

    const items = isBuyItNow ? (buyItNowItem ? [buyItNowItem] : []) : cartItems;
    const subtotal = isBuyItNow ? (buyItNowItem ? buyItNowItem.price * buyItNowItem.quantity : 0) : cartSubtotal;

    const updateQuantity = (id, newQuantity) => {
        if (isBuyItNow && buyItNowItem && buyItNowItem.id === id) {
            setBuyItNowItem(prev => ({ ...prev, quantity: newQuantity }));
        } else {
            updateCartQuantity(id, newQuantity);
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
        updateQuantity,
        handlePlaceOrder,
        guestShipping,
        setGuestShipping,
        isGuestDone,
        setIsGuestDone,
        isAuthenticated,
        savedAddresses,
        setSavedAddresses,
        selectedSavedIdx,
        setSelectedSavedIdx
    };
};
