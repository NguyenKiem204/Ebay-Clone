import { useState, useEffect } from 'react';
import api from '../../lib/axios';

/**
 * Hook that fetches "Because you viewed this..." recommendations for a given productId.
 * Pass in the user's viewed product IDs to exclude already-seen items.
 *
 * @param {number} productId - The product currently being viewed
 * @param {number[]} excludeIds - Product IDs to exclude (recently viewed by the user)
 * @returns {{ recommendations: ProductResponseDto[], loading: boolean }}
 */
export function useRecommendations(productId, excludeIds = []) {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!productId) return;

        let cancelled = false;
        setLoading(true);

        const excludeParam = excludeIds.length ? excludeIds.join(',') : '';
        console.log('[Recommendations] Fetching for productId:', productId, 'excludeIds:', excludeParam);
        api.get(`/api/Product/${productId}/recommendations`, {
            params: { excludeIds: excludeParam, limit: 6 },
        })
            .then(res => {
                console.log('[Recommendations] Response:', res.data);
                if (!cancelled && res.data.success) {
                    setRecommendations(res.data.data ?? []);
                }
            })
            .catch((err) => {
                console.error('[Recommendations] Error:', err?.response?.status, err?.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

    return { recommendations, loading };
}
