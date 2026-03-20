import { create } from 'zustand';
import api from '../../lib/axios';

const useWatchlistStore = create((set, get) => ({
    watchIds: new Set(),    // Set of watched productIds
    watchItems: [],         // full item data for WatchlistPage
    loading: false,

    fetchWatchlist: async () => {
        set({ loading: true });
        try {
            const res = await api.get('/api/Watchlist');
            if (res.data.success) {
                const items = res.data.data;
                set({
                    watchItems: items,
                    watchIds: new Set(items.map(i => i.productId)),
                });
            }
        } catch {
            // silently ignore
        } finally {
            set({ loading: false });
        }
    },

    toggleWatch: async (productId) => {
        // Optimistic update
        const watchIds = new Set(get().watchIds);
        const wasWatched = watchIds.has(productId);
        if (wasWatched) watchIds.delete(productId);
        else watchIds.add(productId);
        set({ watchIds });

        try {
            const res = await api.post(`/api/Watchlist/${productId}`);
            if (res.data.success) {
                await get().fetchWatchlist();
            }
        } catch {
            const revert = new Set(get().watchIds);
            if (wasWatched) revert.add(productId);
            else revert.delete(productId);
            set({ watchIds: revert });
        }
    },

    isWatched: (productId) => get().watchIds.has(productId),

    clear: () => set({ watchIds: new Set(), watchItems: [] }),
}));

export default useWatchlistStore;
