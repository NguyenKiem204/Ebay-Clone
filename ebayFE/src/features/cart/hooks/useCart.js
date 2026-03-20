import { useEffect, useCallback } from 'react';
import useCartStore from './useCartStore';
import useAuthStore from '../../../store/useAuthStore';
import { cartService } from '../services/cartService';

// Module-level flag: shared across all hook instances.
// Prevents CartPage remount from re-triggering merge/fetch and doubling quantities.
let hasSynced = false;

export const useCart = () => {
    const { items, addItem, removeItem, updateQuantity, clearCart, setCart, cartOwner } = useCartStore();
    const { isAuthenticated, loading: authLoading } = useAuthStore();

    const fetchCart = useCallback(async () => {
        try {
            const response = await cartService.getCart();
            if (response.success) {
                // Map backend CartItemResponseDto → frontend item shape
                const mappedItems = response.data.items.map(item => ({
                    id: item.productId,
                    title: item.productName,
                    price: item.unitPrice,           // fix: was item.price
                    image: item.productImage,        // fix: was item.productThumbnail
                    sellerId: item.sellerId,
                    sellerName: item.sellerName,
                    seller: item.sellerName || 'seller',
                    condition: 'New',
                    shippingPrice: item.shippingFee ?? 0,
                    quantity: item.quantity,
                    stock: item.stock
                }));
                setCart(mappedItems);
            }
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        }
    }, [setCart]);

    // Sync on login: merge local cart → server, then fetch fresh server cart
    useEffect(() => {
        // Only run after auth is resolved and when authenticated
        if (authLoading || !isAuthenticated) {
            hasSynced = false; // reset when logged out so next login syncs again
            return;
        }

        // Guard: only sync once per login session (module-level flag, not per-component)
        if (hasSynced) return;
        hasSynced = true;

        const syncOnLogin = async () => {
            if (items.length > 0 && cartOwner === 'guest') {
                // There are local (guest) items — merge them first
                try {
                    const guestItems = items.map(item => ({
                        productId: item.id,
                        quantity: item.quantity
                    }));
                    await cartService.mergeCart(guestItems);
                } catch (error) {
                    console.error('Failed to merge cart:', error);
                } finally {
                    // Always clear local cart after attempting merge to prevent
                    // cross-user contamination
                    clearCart();
                }
            }
            // Fetch the authoritative server cart (merged or existing)
            await fetchCart();
        };

        syncOnLogin();
    }, [isAuthenticated, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAddItem = async (product, quantity = 1) => {
        const cartItem = {
            id: product.id,
            title: product.title || product.name,
            price: product.price || 0,
            image: product.thumbnail || product.imageUrl || (product.images && product.images[0]) || product.image,
            sellerId: product.sellerId,
            sellerName: product.sellerName,
            seller: product.sellerName || 'seller',
            condition: product.condition || 'New',
            shippingPrice: product.shippingFee ?? 0,
            quantity
        };

        if (isAuthenticated) {
            // Authenticated: call API first, then fetch fresh cart
            try {
                await cartService.addToCart(product.id, quantity);
                await fetchCart();
            } catch (error) {
                console.error('Failed to add item to cart:', error);
            }
        } else {
            // Guest: only update localStorage
            addItem(cartItem, quantity);
        }
    };

    const handleRemoveItem = async (productId) => {
        removeItem(productId);
        if (isAuthenticated) {
            try {
                await cartService.removeFromCart(productId);
            } catch (error) {
                console.error('Failed to remove item from cart:', error);
            }
        }
    };

    const handleUpdateQuantity = async (productId, quantity) => {
        if (quantity <= 0) {
            await handleRemoveItem(productId);
            return;
        }
        updateQuantity(productId, quantity);
        if (isAuthenticated) {
            try {
                await cartService.updateCartItem(productId, quantity);
            } catch (error) {
                console.error('Failed to update cart quantity:', error);
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
