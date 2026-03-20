import { useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import useSavedStore from '../features/saved/useSavedStore';
import useWatchlistStore from '../features/watchlist/useWatchlistStore';

/**
 * Invisible component that fetches Saved & Watchlist data from the server
 * immediately when the user logs in. Mounted in MainLayout so it runs globally.
 */
export default function SavedInitializer() {
    const { isAuthenticated } = useAuthStore();
    const fetchSaved = useSavedStore(s => s.fetchSaved);
    const clearSaved = useSavedStore(s => s.clear);
    const fetchWatchlist = useWatchlistStore(s => s.fetchWatchlist);
    const clearWatchlist = useWatchlistStore(s => s.clear);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSaved();
            fetchWatchlist();
        } else {
            clearSaved();
            clearWatchlist();
        }
    }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

    return null;
}
