import { create } from 'zustand';
import api from '../../lib/axios';

const MAX_HISTORY = 10;

const useHistoryStore = create((set, get) => ({
    historyItems: [],   // array of HistoryItemResponseDto
    loading: false,

    /**
     * Called on every ProductDetailsPage load.
     * - Fire-and-forget POST /api/history/{productId} (backend handles cookie/user_id)
     * - Optimistically prepend to local list (deduplicated, max 10)
     */
    trackView: (product) => {
        if (!product?.id) return;

        // Optimistic local update
        set(state => {
            const filtered = state.historyItems.filter(i => i.productId !== product.id);
            const newItem = {
                productId:   product.id,
                productName: product.title || product.name,
                productImage: product.thumbnail || product.imageUrl
                    || (product.images?.[0]),
                price:       product.price,
                shippingFee: product.shippingFee ?? 0,
                sellerName:  product.sellerName ?? null,
                viewedAt:    new Date().toISOString(),
            };
            return { historyItems: [newItem, ...filtered].slice(0, MAX_HISTORY) };
        });

        // Fire-and-forget to backend (sets / refreshes the cookie)
        api.post(`/api/History/${product.id}`).catch(() => {});
    },

    /** Fetch history from backend for the current user or guest (backend uses cookie). */
    fetchHistory: async () => {
        set({ loading: true });
        try {
            const res = await api.get('/api/History');
            if (res.data.success) {
                set({ historyItems: res.data.data ?? [] });
            }
        } catch {
            // silently ignore — guest may have no history yet
        } finally {
            set({ loading: false });
        }
    },

    /**
     * Called after login. Backend reads the ebay_guest_id cookie directly
     * from the HTTP request and merges guest rows into the user's account.
     * No need to send the cookie value in the body.
     */
    syncGuestHistory: async () => {
        try {
            await api.post('/api/History/sync');
        } catch {
            // ignore — no guest cookie or nothing to sync
        }
    },

    clear: () => set({ historyItems: [] }),
}));

export default useHistoryStore;
