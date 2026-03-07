import { useEffect, useCallback } from 'react';
import useCartStore from './useCartStore';
import useAuthStore from '../../../store/useAuthStore';
import { cartService } from '../services/cartService';

export const useCart = () => {
    const { items, addItem, removeItem, updateQuantity, clearCart, setCart } = useCartStore();
    const { isAuthenticated } = useAuthStore();

    const fetchCart = useCallback(async () => {
        if (isAuthenticated) {
            try {
                const remoteCart = await cartService.getCart();
                setCart(remoteCart.items);
            } catch (error) {
                console.error('Failed to fetch cart:', error);
            }
        }
    }, [isAuthenticated, setCart]);

    // Sync guest cart with server on login
    useEffect(() => {
        const syncOnLogin = async () => {
            if (isAuthenticated && items.length > 0) {
                try {
                    const syncedCart = await cartService.syncCart(items);
                    setCart(syncedCart.items);
                } catch (error) {
                    console.error('Failed to sync cart:', error);
                }
            } else if (isAuthenticated) {
                fetchCart();
            }
        };

        syncOnLogin();
    }, [isAuthenticated]); // Only run when auth state changes

    const handleAddItem = async (product, quantity = 1) => {
        addItem(product, quantity);
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
