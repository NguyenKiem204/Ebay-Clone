import { useEffect, useCallback } from 'react';
import useCartStore from './useCartStore';
import useAuthStore from '../../../store/useAuthStore';
import { cartService } from '../services/cartService';

export const useCart = () => {
    const { items, addItem, removeItem, updateQuantity, clearCart, setCart } = useCartStore();
    const { isAuthenticated, loading: authLoading } = useAuthStore();

    const fetchCart = useCallback(async () => {
        if (isAuthenticated) {
            try {
                const response = await cartService.getCart();
                if (response.success) {
                    // Map backend CartItemResponseDto to frontend item structure
                    const mappedItems = response.data.items.map(item => ({
                        id: item.productId,
                        title: item.productName,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.productThumbnail,
                        seller: item.sellerName,
                        condition: 'New', // Default or map if available
                        shippingPrice: 0 // Default or map if available
                    }));
                    setCart(mappedItems);
                }
            } catch (error) {
                console.error('Failed to fetch cart:', error);
            }
        }
    }, [isAuthenticated, setCart]);

    // Sync guest cart with server on login
    useEffect(() => {
        const syncOnLogin = async () => {
            if (!authLoading && isAuthenticated && items.length > 0) {
                try {
                    // Send minimal data for merging: List<AddToCartRequestDto>
                    const guestItems = items.map(item => ({
                        productId: item.id,
                        quantity: item.quantity
                    }));
                    const response = await cartService.mergeCart(guestItems);
                    if (response.success) {
                        fetchCart(); // Fetch fresh cart from server after merge
                    }
                } catch (error) {
                    console.error('Failed to merge cart:', error);
                }
            } else if (!authLoading && isAuthenticated) {
                fetchCart();
            }
        };

        syncOnLogin();
    }, [isAuthenticated, authLoading]);

    const handleAddItem = async (product, quantity = 1) => {
        // Essential fields for cart display
        const cartItem = {
            id: product.id,
            title: product.title || product.name,
            price: product.price || 0,
            image: product.thumbnail || product.imageUrl || product.image,
            seller: product.sellerName || 'ebay_seller',
            condition: product.condition || 'New',
            shippingPrice: product.shippingFee || 0,
            quantity
        };

        addItem(cartItem, quantity);

        if (isAuthenticated) {
            try {
                await cartService.addToCart(product.id, quantity);
            } catch (error) {
                console.error('Failed to add item to API cart:', error);
            }
        }
    };

    const handleRemoveItem = async (productId) => {
        removeItem(productId);
        if (isAuthenticated) {
            try {
                await cartService.removeFromCart(productId);
            } catch (error) {
                console.error('Failed to remove item from API cart:', error);
            }
        }
    };

    const handleUpdateQuantity = async (productId, quantity) => {
        updateQuantity(productId, quantity);
        if (isAuthenticated) {
            try {
                await cartService.updateCartItem(productId, quantity);
            } catch (error) {
                console.error('Failed to update quantity in API cart:', error);
            }
        }
    };

    return {
        items,
        totalItems: items.reduce((acc, item) => acc + item.quantity, 0),
        subtotal: items.reduce((acc, item) => acc + item.price * item.quantity, 0),
        addItem: handleAddItem,
        removeItem: handleRemoveItem,
        updateQuantity: handleUpdateQuantity,
        clearCart,
        fetchCart
    };
};
