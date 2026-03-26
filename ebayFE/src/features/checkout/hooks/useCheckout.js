import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { checkoutService } from '../services/checkoutService';
import { useCart } from '../../cart/hooks/useCart';
import api from '../../../lib/axios';
import useAuthStore from '../../../store/useAuthStore';

const splitFullName = (fullName) => {
    const normalized = (fullName || '').trim().replace(/\s+/g, ' ');
    if (!normalized) {
        return { firstName: '', lastName: '' };
    }

    const parts = normalized.split(' ');
    if (parts.length === 1) {
        return { firstName: parts[0], lastName: '' };
    }

    return {
        firstName: parts.slice(0, -1).join(' '),
        lastName: parts[parts.length - 1]
    };
};

const mapAddressToShippingForm = (address) => {
    const name = splitFullName(address?.fullName);

    return {
        firstName: name.firstName,
        lastName: name.lastName,
        street: address?.street || '',
        street2: '',
        city: address?.city || '',
        state: address?.state || '',
        zip: address?.postalCode || '',
        country: address?.country || 'Vietnam',
        phone: address?.phone || '',
        email: ''
    };
};

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
    const [isSavingMemberAddress, setIsSavingMemberAddress] = useState(false);
    const [guestQuote, setGuestQuote] = useState(null);
    const [memberReviewQuote, setMemberReviewQuote] = useState(null);
    const [isReviewLoading, setIsReviewLoading] = useState(false);
    const guestOrderAttemptRef = useRef(null);
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);

    const items = isBuyItNow ? (buyItNowItem ? [buyItNowItem] : []) : cartItems;
    const subtotal = isBuyItNow ? (buyItNowItem ? buyItNowItem.price * buyItNowItem.quantity : 0) : cartSubtotal;
    const checkoutItemsSignature = items
        .map(item => `${item.id}:${item.quantity}`)
        .sort()
        .join('|');

    useEffect(() => {
        if (!isAuthenticated && paymentMethod !== 'COD') {
            setPaymentMethod('COD');
        }
    }, [isAuthenticated, paymentMethod]);

    useEffect(() => {
        if (isAuthenticated) {
            guestOrderAttemptRef.current = null;
        }
    }, [isAuthenticated]);

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
                            shippingPrice: product.shippingFee ?? 0,
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
                    const nextAddresses = response.data || [];
                    setAddresses(nextAddresses);
                    setSavedAddresses(nextAddresses.map(mapAddressToShippingForm));

                    const defaultAddr = nextAddresses.find(a => a.isDefault) || nextAddresses[0];
                    if (defaultAddr) {
                        setSelectedAddressId(defaultAddr.id);
                        const selectedIdx = nextAddresses.findIndex(a => a.id === defaultAddr.id);
                        setSelectedSavedIdx(selectedIdx >= 0 ? selectedIdx : 0);
                    } else {
                        setSelectedAddressId(null);
                        setSelectedSavedIdx(0);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch addresses', err);
            }
        };
        fetchAddresses();
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated || checkoutItemsSignature.length === 0) {
            setGuestQuote(null);
            return;
        }

        let isMounted = true;

        const fetchGuestQuote = async () => {
            try {
                const response = await checkoutService.evaluateGuestEligibility({
                    items: items.map(item => ({
                        productId: item.id,
                        quantity: item.quantity
                    }))
                });

                if (!isMounted) return;

                if (response.success && response.data) {
                    setGuestQuote(response.data);
                } else {
                    setGuestQuote(null);
                }
            } catch {
                if (isMounted) {
                    setGuestQuote(null);
                }
            }
        };

        fetchGuestQuote();

        return () => {
            isMounted = false;
        };
    // Represent `items` by a stable signature so guest quote fetch does not loop on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, checkoutItemsSignature]);

    const buildMemberOrderPayload = (includeNote = true) => {
        const orderData = {
            addressId: selectedAddressId,
            paymentMethod
        };

        if (includeNote) {
            orderData.note = note;
        }

        if (isBuyItNow && buyItNowItem) {
            orderData.buyItNowProductId = buyItNowItem.id;
            orderData.buyItNowQuantity = buyItNowItem.quantity;
        }

        return orderData;
    };

    useEffect(() => {
        if (!isAuthenticated || checkoutItemsSignature.length === 0 || !selectedAddressId) {
            setMemberReviewQuote(null);
            setIsReviewLoading(false);
            return;
        }

        let isMounted = true;

        const fetchMemberReviewQuote = async () => {
            setIsReviewLoading(true);
            setError(null);

            try {
                const response = await checkoutService.reviewMemberCheckout(buildMemberOrderPayload(false));

                if (!isMounted) return;

                if (response.success && response.data) {
                    setMemberReviewQuote(response.data);
                } else {
                    setMemberReviewQuote(null);
                    setError(response.message || 'Unable to review checkout.');
                }
            } catch (err) {
                if (!isMounted) return;
                setMemberReviewQuote(null);
                setError(err.response?.data?.message || err.message || 'Unable to review checkout.');
            } finally {
                if (isMounted) {
                    setIsReviewLoading(false);
                }
            }
        };

        fetchMemberReviewQuote();

        return () => {
            isMounted = false;
        };
    // Represent cart/buy-it-now lines by signature to avoid effect loops from array reference churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, selectedAddressId, paymentMethod, isBuyItNow, checkoutItemsSignature]);

    const selectedAddress = addresses.find(a => a.id === selectedAddressId);

    const handleSelectSavedAddress = (idx) => {
        setSelectedSavedIdx(idx);
        const selected = addresses[idx];
        if (selected?.id) {
            setSelectedAddressId(selected.id);
        }
    };

    const saveMemberAddress = async (formData) => {
        setIsSavingMemberAddress(true);

        try {
            const firstName = formData.firstName?.trim() || '';
            const lastName = formData.lastName?.trim() || '';
            const fullName = `${firstName} ${lastName}`.trim();
            const street = [formData.street?.trim(), formData.street2?.trim()]
                .filter(Boolean)
                .join(', ');

            const payload = {
                fullName,
                phone: formData.phone?.trim() || '',
                street,
                city: formData.city?.trim() || '',
                state: formData.state?.trim() || null,
                postalCode: formData.zip?.trim() || null,
                country: formData.country?.trim() || 'Vietnam',
                isDefault: addresses.length === 0
            };

            const response = await checkoutService.createShippingAddress(payload);
            if (!response.success || !response.data) {
                setError(response.message || 'Unable to save shipping address.');
                return false;
            }

            const createdAddress = response.data;
            const nextAddresses = [...addresses, createdAddress];
            const nextSavedAddresses = [...savedAddresses, mapAddressToShippingForm(createdAddress)];
            const nextSelectedIdx = nextSavedAddresses.length - 1;

            setAddresses(nextAddresses);
            setSavedAddresses(nextSavedAddresses);
            setSelectedSavedIdx(nextSelectedIdx);
            setSelectedAddressId(createdAddress.id);
            setError(null);

            return true;
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Unable to save shipping address.');
            return false;
        } finally {
            setIsSavingMemberAddress(false);
        }
    };

    const buildGuestOrderPayload = () => {
        const firstName = guestShipping.firstName?.trim() || '';
        const lastName = guestShipping.lastName?.trim() || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const street = [guestShipping.street?.trim(), guestShipping.street2?.trim()].filter(Boolean).join(', ');

        return {
            guestFullName: fullName,
            guestEmail: guestShipping.email?.trim() || '',
            guestPhone: guestShipping.phone?.trim() || '',
            shippingAddress: {
                fullName,
                phone: guestShipping.phone?.trim() || '',
                street,
                city: guestShipping.city?.trim() || '',
                state: guestShipping.state?.trim() || '',
                postalCode: guestShipping.zip?.trim() || '',
                country: guestShipping.country?.trim() || ''
            },
            items: items.map(item => ({
                productId: item.id,
                quantity: item.quantity
            })),
            paymentMethod
        };
    };

    const getGuestAttemptSignature = (payload) => {
        return JSON.stringify({
            guestFullName: payload.guestFullName,
            guestEmail: payload.guestEmail,
            guestPhone: payload.guestPhone,
            shippingAddress: payload.shippingAddress,
            items: payload.items
                .map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                }))
                .sort((a, b) => a.productId - b.productId),
            paymentMethod: payload.paymentMethod
        });
    };

    const generateGuestIdempotencyKey = () => {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }

        return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    };

    const getGuestIdempotencyKey = (payload) => {
        const signature = getGuestAttemptSignature(payload);
        const existingAttempt = guestOrderAttemptRef.current;

        if (existingAttempt?.signature === signature && existingAttempt.key) {
            return existingAttempt.key;
        }

        const nextKey = generateGuestIdempotencyKey();
        guestOrderAttemptRef.current = {
            signature,
            key: nextKey
        };

        return nextKey;
    };

    const handlePlaceOrder = async () => {
        if (isAuthenticated && !selectedAddressId) {
            setError('Please select a shipping address');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            if (!isAuthenticated) {
                const guestOrderPayload = buildGuestOrderPayload();
                guestOrderPayload.idempotencyKey = getGuestIdempotencyKey(guestOrderPayload);

                const response = await checkoutService.placeGuestOrder(guestOrderPayload);

                if (response.success) {
                    const guestOrder = response.data;

                    if (!isBuyItNow) {
                        clearCart();
                    }

                    navigate('/order-success', {
                        state: {
                            order: guestOrder
                        }
                    });
                    return;
                }

                setError(response.message || 'Failed to place guest order');
                return;
            }

            const orderData = buildMemberOrderPayload();

            const response = await checkoutService.placeOrder(orderData);

            if (response.success) {
                const order = response.data;

                if (paymentMethod === 'PayPal') {
                    if (!isBuyItNow) {
                        clearCart();
                    }

                    const paypalResponse = await checkoutService.createPaypalOrder(order.id);

                    if (paypalResponse.success) {
                        const paypalOrderId = paypalResponse.data;

                        navigate(
                            `/payment/simulate?orderId=${order.id}&paymentRef=${encodeURIComponent(paypalOrderId)}`
                        );
                        return;
                    } else {
                        throw new Error(paypalResponse.message || 'Failed to initiate simulated PayPal payment');
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
        guestQuote,
        memberReviewQuote,
        isReviewLoading,
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
        setSelectedSavedIdx: handleSelectSavedAddress,
        saveMemberAddress,
        isSavingMemberAddress
    };
};
