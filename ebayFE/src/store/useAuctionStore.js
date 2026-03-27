import { create } from 'zustand';
import api from '../lib/axios';

const useAuctionStore = create((set, get) => ({
    bids: [],
    winningBid: null,
    auctionState: null,
    auctionStatesByProduct: {},
    lastBidResult: null,
    isLoading: false,
    error: null,

    fetchBids: async (productId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`/api/Bid/${productId}`);
            set({ bids: response.data?.data || [], isLoading: false });
        } catch (err) {
            set({ error: err.response?.data?.message || err.message || 'Failed to fetch bids', isLoading: false });
        }
    },

    fetchWinningBid: async (productId) => {
        try {
            const response = await api.get(`/api/Bid/${productId}/winning`);
            set({ winningBid: response.data?.data || null });
        } catch (err) {
            set({ winningBid: null, error: err.response?.data?.message || err.message || 'Failed to fetch winning bid' });
        }
    },

    fetchAuctionState: async (productId) => {
        try {
            const response = await api.get(`/api/Bid/${productId}/state`);
            const nextAuctionState = response.data?.data || null;
            set((state) => ({
                auctionState: nextAuctionState,
                auctionStatesByProduct: {
                    ...state.auctionStatesByProduct,
                    [productId]: nextAuctionState
                }
            }));
        } catch (err) {
            set((state) => ({
                auctionState: null,
                auctionStatesByProduct: {
                    ...state.auctionStatesByProduct,
                    [productId]: null
                },
                error: err.response?.data?.message || err.message || 'Failed to fetch auction state'
            }));
        }
    },

    placeBid: async (productId, amount) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post(`/api/Bid/${productId}`, { amount });
            const payload = response.data?.data;

            // Refresh bids and winning bid after successful placement
            await get().fetchBids(productId);
            await get().fetchWinningBid(productId);
            const nextAuctionState = payload?.auctionState || get().auctionState;
            set((state) => ({
                auctionState: nextAuctionState,
                auctionStatesByProduct: {
                    ...state.auctionStatesByProduct,
                    [productId]: nextAuctionState
                },
                lastBidResult: payload || null
            }));

            set({ isLoading: false });
            return { success: true, ...payload, bid: payload?.bid, auctionState: payload?.auctionState };
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Failed to place bid';
            set({ error: message, isLoading: false });
            return { success: false, message };
        }
    },

    clearBidResult: () => set({ lastBidResult: null })
}));

export default useAuctionStore;
