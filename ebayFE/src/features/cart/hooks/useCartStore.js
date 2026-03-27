import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            totalItems: 0,
            subtotal: 0,
            cartOwner: 'guest',

            recalculateCart: (items, owner = get().cartOwner) => ({
                items,
                cartOwner: owner,
                totalItems: items.reduce((acc, item) => acc + item.quantity, 0),
                subtotal: items.reduce((acc, item) => acc + item.price * item.quantity, 0),
            }),

            addItem: (product, quantity = 1) => {
                const items = get().items;
                const existingItem = items.find((item) => item.id === product.id);
                const stockLimit = Math.max(0, Number(product.stock ?? existingItem?.stock ?? quantity));

                let newItems;
                if (existingItem) {
                    const nextQuantity = Math.min(existingItem.quantity + quantity, stockLimit || existingItem.quantity + quantity);
                    newItems = items.map((item) =>
                        item.id === product.id
                            ? { ...item, stock: stockLimit || item.stock, quantity: nextQuantity }
                            : item
                    );
                } else {
                    const normalizedQuantity = stockLimit > 0 ? Math.min(quantity, stockLimit) : quantity;
                    newItems = [...items, { ...product, stock: stockLimit || product.stock, quantity: normalizedQuantity }];
                }

                set(get().recalculateCart(newItems));
            },

            removeItem: (productId) => {
                const newItems = get().items.filter((item) => item.id !== productId);
                set(get().recalculateCart(newItems));
            },

            updateQuantity: (productId, quantity) => {
                const newItems = get().items.map((item) => {
                    if (item.id !== productId) {
                        return item;
                    }

                    const stockLimit = Math.max(0, Number(item.stock ?? quantity));
                    const nextQuantity = stockLimit > 0 ? Math.min(quantity, stockLimit) : quantity;
                    return { ...item, quantity: nextQuantity };
                });
                set(get().recalculateCart(newItems));
            },

            clearCart: () => {
                set({ items: [], totalItems: 0, subtotal: 0, cartOwner: 'guest' });
            },

            setCart: (items, owner = 'user') => {
                const normalizedItems = items.map((item) => {
                    const stockLimit = Number(item.stock ?? item.quantity ?? 0);
                    const nextQuantity = stockLimit > 0 ? Math.min(item.quantity, stockLimit) : item.quantity;
                    return { ...item, quantity: nextQuantity };
                });
                set(get().recalculateCart(normalizedItems, owner));
            },
        }),
        {
            name: 'ebay-cart-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useCartStore;
