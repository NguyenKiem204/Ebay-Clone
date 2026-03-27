import { useEffect, useState } from 'react';
import useAuctionStore from '../../../store/useAuctionStore';

/**
 * Phase 3 realtime-lite hook.
 * We keep the existing API surface but use interval polling until
 * a dedicated socket transport is added later.
 */
export default function useAuctionSocket(auctionId, options = {}) {
    const {
        enabled = true,
        intervalMs = 15000
    } = options;

    const fetchAuctionState = useAuctionStore((state) => state.fetchAuctionState);
    const auctionState = useAuctionStore((state) => state.auctionStatesByProduct?.[auctionId] || null);
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        if (!auctionId || !enabled) {
            return undefined;
        }

        let cancelled = false;

        const refresh = async () => {
            await fetchAuctionState(auctionId);
            if (!cancelled) {
                setLastUpdated(Date.now());
            }
        };

        refresh();
        const timer = window.setInterval(refresh, intervalMs);

        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [auctionId, enabled, fetchAuctionState, intervalMs]);

    return {
        auctionState,
        currentBid: auctionState?.currentPrice ?? null,
        bidsCount: auctionState?.bidCount ?? 0,
        lastUpdated
    };
}
