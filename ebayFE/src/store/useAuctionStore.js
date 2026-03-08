import { create } from 'zustand';
import api from '../lib/axios';

const useAuctionStore = create((set, get) => ({
    bids: [],
    winningBid: null,
    isLoading: false,
    error: null,

    fetchBids: async (productId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`/api/Bid/${productId}`);
            set({ bids: response.data, isLoading: false });
        } catch (err) {
            set({ error: err.response?.data?.message || 'Failed to fetch bids', isLoading: false });
        }
    },

    fetchWinningBid: async (productId) => {
        try {
            const response = await api.get(`/api/Bid/${productId}/winning`);
            set({ winningBid: response.data });
        } catch (err) {
            // If 404, it might just mean no bids yet
            if (err.response?.status !== 404) {
                console.error('Error fetching winning bid:', err);
            }
            set({ winningBid: null });
        }
    },

    placeBid: async (productId, amount) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post(`/api/Bid/${productId}`, { amount });

            // Refresh bids and winning bid after successful placement
            await get().fetchBids(productId);
            await get().fetchWinningBid(productId);

            set({ isLoading: false });
            return { success: true, bid: response.data };
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to place bid';
            set({ error: message, isLoading: false });
            return { success: false, message };
        }
    }
}));

export default useAuctionStore;
