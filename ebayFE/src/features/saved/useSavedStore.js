import { create } from 'zustand';
import api from '../../lib/axios';

const useSavedStore = create((set, get) => ({
    savedIds: new Set(),    // Set of saved productIds
    savedItems: [],         // full item data for SavedPage
    loading: false,

    fetchSaved: async () => {
        set({ loading: true });
        try {
            const res = await api.get('/api/Saved');
            if (res.data.success) {
                const items = res.data.data;
                set({
                    savedItems: items,
                    savedIds: new Set(items.map(i => i.productId)),
                });
            }
        } catch {
            set({
                savedItems: [],
                savedIds: new Set(),
            });
        } finally {
            set({ loading: false });
        }
    },

    toggleSaved: async (productId) => {
        // Optimistic update
        const savedIds = new Set(get().savedIds);
        const wasSaved = savedIds.has(productId);
        if (wasSaved) savedIds.delete(productId);
        else savedIds.add(productId);
        set({ savedIds });

        try {
            const res = await api.post(`/api/Saved/${productId}`);
            // Refresh full list from server
            if (res.data.success) {
                await get().fetchSaved();
            }
        } catch {
            // Revert on error
            const revert = new Set(get().savedIds);
            if (wasSaved) revert.add(productId);
            else revert.delete(productId);
            set({ savedIds: revert });
        }
    },

    isSaved: (productId) => get().savedIds.has(productId),

    clear: () => set({ savedIds: new Set(), savedItems: [] }),
}));

export default useSavedStore;
