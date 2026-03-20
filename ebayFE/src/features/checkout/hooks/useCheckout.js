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

    // PayPal flow states
    const [showPayPalConfirm, setShowPayPalConfirm] = useState(false);
    const [paypalOrderId, setPaypalOrderId] = useState(null);
    const [createdOrderId, setCreatedOrderId] = useState(null);
    const [paypalReady, setPaypalReady] = useState(false);

    // Snapshot: lưu bản sao items/subtotal trước khi clear cart
    const [snapshotItems, setSnapshotItems] = useState(null);
    const [snapshotSubtotal, setSnapshotSubtotal] = useState(null);

    // Coupon states
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, description, couponId }
    const [discount, setDiscount] = useState(0);
    const [couponMessage, setCouponMessage] = useState(null); // { type: 'success'|'error', text: '...' }
    const [couponLoading, setCouponLoading] = useState(false);

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

    // Dữ liệu hiển thị: ưu tiên snapshot nếu cart đã bị clear
    const displayItems = snapshotItems ?? items;
    const displaySubtotal = snapshotSubtotal ?? subtotal;

    // Fix 2: Auto-reset coupon nếu giỏ hàng thay đổi sau khi đã apply
    // Chỉ theo dõi subtotal gốc từ cart (không theo dõi snapshot)
    useEffect(() => {
        if (appliedCoupon && subtotal > 0 && snapshotSubtotal === null) {
            setAppliedCoupon(null);
            setDiscount(0);
            setCouponCode('');
            setCouponMessage({ type: 'error', text: 'Giỏ hàng đã thay đổi, vui lòng áp dụng lại mã giảm giá' });
        }
    }, [subtotal]);

    // === Coupon Logic ===
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponMessage({ type: 'error', text: 'Vui lòng nhập mã giảm giá' });
            return;
        }
        setCouponLoading(true);
        setCouponMessage(null);
        try {
            const response = await checkoutService.validateCoupon(couponCode.trim(), displaySubtotal);
            if (response.success && response.data.valid) {
                // Fix 1: Clamp discount — không để discount vượt quá subtotal (tránh total âm)
                const rawDiscount = response.data.discountAmount;
                const clampedDiscount = Math.min(rawDiscount, displaySubtotal);
                setAppliedCoupon({
                    code: response.data.code,
                    description: response.data.description,
                    couponId: response.data.couponId
                });
                setDiscount(clampedDiscount);
                setCouponMessage({ type: 'success', text: response.data.description });
            } else {
                // Coupon không hợp lệ
                setAppliedCoupon(null);
                setDiscount(0);
                setCouponMessage({ type: 'error', text: response.data?.message || 'Mã giảm giá không hợp lệ' });
            }
        } catch (err) {
            setAppliedCoupon(null);
            setDiscount(0);
            setCouponMessage({ type: 'error', text: err.response?.data?.message || 'Không thể kiểm tra mã giảm giá' });
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setDiscount(0);
        setCouponCode('');
        setCouponMessage(null);
    };

    // === COD Flow ===
    const handleCodOrder = async () => {
        if (!selectedAddressId) {
            setError('Please select a shipping address');
            return;
        }
        if (!items || items.length === 0) {
            setError('Giỏ hàng rỗng, yêu cầu thêm sản phẩm');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const orderData = {
                addressId: selectedAddressId,
                paymentMethod: 'COD',
                note: note,
                couponCode: appliedCoupon?.code || null
            };
            const response = await checkoutService.placeOrder(orderData);
            if (response.success) {
                clearCart();
                navigate(`/order-success?id=${response.data.id}`);
            } else {
                setError(response.message || 'Failed to place order');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'An error occurred during checkout.');
        } finally {
            setIsLoading(false);
        }
    };

    // === PayPal Flow ===

    const handlePayPalClick = () => {
        if (!selectedAddressId) {
            setError('Please select a shipping address');
            return;
        }
        if (!items || items.length === 0) {
            setError('Giỏ hàng rỗng, yêu cầu thêm sản phẩm');
            return;
        }
        setError(null);
        setShowPayPalConfirm(true);
    };

    const handlePayPalConfirm = async () => {
        setShowPayPalConfirm(false);
        setIsLoading(true);
        setError(null);
        try {
            setSnapshotItems([...items]);
            setSnapshotSubtotal(subtotal);

            const orderData = {
                addressId: selectedAddressId,
                paymentMethod: 'PayPal',
                note: note,
                couponCode: appliedCoupon?.code || null
            };
            const orderResponse = await checkoutService.placeOrder(orderData);
            if (!orderResponse.success) {
                setError(orderResponse.message || 'Failed to create order');
                setSnapshotItems(null);
                setSnapshotSubtotal(null);
                return;
            }

            const orderId = orderResponse.data.id;
            setCreatedOrderId(orderId);
            clearCart();

            const paypalResponse = await checkoutService.createPaypalOrder(orderId);
            if (!paypalResponse.success) {
                setError('Failed to create PayPal payment. Order was created but not paid.');
                return;
            }

            setPaypalOrderId(paypalResponse.data);
            setPaypalReady(true);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayPalCreateOrder = () => {
        return paypalOrderId;
    };

    const handlePayPalApprove = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const captureResponse = await checkoutService.capturePaypalOrder(paypalOrderId);
            if (captureResponse.success) {
                navigate(`/order-success?id=${createdOrderId}`);
            } else {
                setError('Payment capture failed. Please contact support.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Payment failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayPalCancel = () => {
        setError('Payment was cancelled. Your order has been created but not paid yet. You can retry payment using the PayPal button below or view it in your orders.');
    };

    const handlePayPalError = (err) => {
        console.error('PayPal error:', err);
        setError('An error occurred with PayPal. Your order has been created but not paid yet. Please try again.');
    };

    const handlePlaceOrder = () => {
        if (paymentMethod === 'PayPal') {
            handlePayPalClick();
        } else {
            handleCodOrder();
        }
    };

    return {
        step,
        setStep,
        items: displayItems,
        subtotal: displaySubtotal,
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
        handlePlaceOrder,
        // PayPal specific
        showPayPalConfirm,
        setShowPayPalConfirm,
        paypalReady,
        handlePayPalConfirm,
        handlePayPalCreateOrder,
        handlePayPalApprove,
        handlePayPalCancel,
        handlePayPalError,
        // Coupon specific
        couponCode,
        setCouponCode,
        appliedCoupon,
        discount,
        couponMessage,
        couponLoading,
        handleApplyCoupon,
        handleRemoveCoupon,
    };
};
