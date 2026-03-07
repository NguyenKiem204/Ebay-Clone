import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            totalItems: 0,
            subtotal: 0,

            addItem: (product, quantity = 1) => {
                const items = get().items;
                const existingItem = items.find((item) => item.id === product.id);

                let newItems;
                if (existingItem) {
                    newItems = items.map((item) =>
                        item.id === product.id
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    );
                } else {
                    newItems = [...items, { ...product, quantity }];
                }

                set({
                    items: newItems,
                    totalItems: newItems.reduce((acc, item) => acc + item.quantity, 0),
                    subtotal: newItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
                });
            },

            removeItem: (productId) => {
                const newItems = get().items.filter((item) => item.id !== productId);
                set({
                    items: newItems,
                    totalItems: newItems.reduce((acc, item) => acc + item.quantity, 0),
                    subtotal: newItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
                });
            },

            updateQuantity: (productId, quantity) => {
                const newItems = get().items.map((item) =>
                    item.id === productId ? { ...item, quantity } : item
                );
                set({
                    items: newItems,
                    totalItems: newItems.reduce((acc, item) => acc + item.quantity, 0),
                    subtotal: newItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
                });
            },

            clearCart: () => {
                set({ items: [], totalItems: 0, subtotal: 0 });
            },

            setCart: (items) => {
                set({
                    items,
                    totalItems: items.reduce((acc, item) => acc + item.quantity, 0),
                    subtotal: items.reduce((acc, item) => acc + item.price * item.quantity, 0),
                });
            },
        }),
        {
            name: 'ebay-cart-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useCartStore;
