import { useState, useEffect, useRef } from 'react';
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
    const lastRequestKeyRef = useRef('');
    const lastRequestAtRef = useRef(0);
    const excludeSignature = excludeIds.join(',');

    useEffect(() => {
        if (!productId) return;

        let cancelled = false;
        const controller = new AbortController();
        setLoading(true);

        const excludeParam = excludeSignature;
        const requestKey = `${productId}|${excludeParam}`;
        const now = Date.now();

        // Avoid rapid duplicate requests from StrictMode/dev remounts.
        if (lastRequestKeyRef.current === requestKey && now - lastRequestAtRef.current < 800) {
            setLoading(false);
            return;
        }

        lastRequestKeyRef.current = requestKey;
        lastRequestAtRef.current = now;

        api.get(`/api/Product/${productId}/recommendations`, {
            params: { excludeIds: excludeParam, limit: 6 },
            signal: controller.signal
        })
            .then(res => {
                if (!cancelled && res.data.success) {
                    setRecommendations(res.data.data ?? []);
                }
            })
            .catch((err) => {
                if (err?.code !== 'ERR_CANCELED') {
                    console.error('[Recommendations] Error:', err?.response?.status, err?.message);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [productId, excludeSignature]);

    return { recommendations, loading };
}
