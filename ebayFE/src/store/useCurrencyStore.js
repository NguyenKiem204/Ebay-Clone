import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/axios';

const useCurrencyStore = create(
    persist(
        (set, get) => ({
            exchangeRate: 25450, // Default fallback
            isVietnamese: false,
            lastFetched: null,
            isLoading: false,

            initialize: async () => {
                const { lastFetched, isLoading, isVietnamese } = get();
                const now = Date.now();

                // If we already detected Vietnam, we can cache for 24h.
                // If not, we might want to retry sooner (e.g., every hour) in case of transient detection issues.
                const cacheDuration = isVietnamese ? 24 * 60 * 60 * 1000 : 1 * 60 * 60 * 1000;

                if (isLoading || (lastFetched && now - lastFetched < cacheDuration)) {
                    return;
                }

                set({ isLoading: true });

                try {
                    // 1. Primary check: Browser language
                    const browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || '';
                    const isViLang = browserLang.toLowerCase().includes('vi');

                    // 2. Secondary check: Backend IP detection
                    let isVN = isViLang;
                    let detectedCountry = 'Unknown';
                    let detectedIp = 'unknown';

                    try {
                        const response = await api.get('/api/region/detect');
                        const regionData = response.data;
                        isVN = regionData.isVietnamese || isViLang;
                        detectedCountry = regionData.countryCode || 'Unknown';
                        detectedIp = regionData.ip || 'unknown';
                    } catch (e) {
                        console.warn('Backend region detection failed, relying on browser language:', e);
                    }
                    
                    console.log('Currency Detection (Backend):', { 
                        detectedCountry, 
                        detectedIp,
                        browserLang, 
                        isViLang,
                        finalDecision: isVN ? 'VN' : 'US' 
                    });

                    // 3. Fetch exchange rate (USD to VND)
                    const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
                    const rateData = await rateRes.json();
                    const vndRate = rateData.rates?.VND || 25450;

                    set({
                        isVietnamese: isVN,
                        exchangeRate: vndRate,
                        lastFetched: now,
                        isLoading: false
                    });
                } catch (error) {
                    console.error('Failed to initialize currency settings:', error);
                    set({ isLoading: false });
                }
            },

            // Manual toggle for testing
            toggleVietnamese: () => set((state) => ({ isVietnamese: !state.isVietnamese })),

            formatPrice: (usdAmount) => {
                const { isVietnamese, exchangeRate } = get();
                
                if (isVietnamese) {
                    const vndAmount = Math.round(usdAmount * exchangeRate);
                    return new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        maximumFractionDigits: 0
                    }).format(vndAmount);
                }

                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(usdAmount);
            },

            // For "Approximately" display if needed
            formatVnd: (usdAmount) => {
                const { exchangeRate } = get();
                const vndAmount = Math.round(usdAmount * exchangeRate);
                return new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    maximumFractionDigits: 0
                }).format(vndAmount);
            }
        }),
        {
            name: 'ebay-currency-settings',
            partialize: (state) => ({
                isVietnamese: state.isVietnamese,
                exchangeRate: state.exchangeRate,
                lastFetched: state.lastFetched
            })
        }
    )
);

export default useCurrencyStore;
