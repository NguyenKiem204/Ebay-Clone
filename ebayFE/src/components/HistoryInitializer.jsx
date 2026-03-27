import { useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import useHistoryStore from '../features/history/useHistoryStore';

let hasSyncedGuestHistoryAfterAuth = false;

/**
 * Invisible component mounted in MainLayout.
 * - On login:  clear old data → sync guest cookie history → fetch from DB
 * - On logout / Guest: clear old data → fetch history (backend reads cookie)
 */
export default function HistoryInitializer() {
    const { isAuthenticated } = useAuthStore();
    const clear            = useHistoryStore(s => s.clear);
    const syncGuestHistory = useHistoryStore(s => s.syncGuestHistory);
    const fetchHistory     = useHistoryStore(s => s.fetchHistory);

    useEffect(() => {
        // Always clear first to prevent cross-user data leaking
        clear();

        if (isAuthenticated) {
            if (hasSyncedGuestHistoryAfterAuth) {
                fetchHistory();
                return;
            }

            hasSyncedGuestHistoryAfterAuth = true;
            (async () => {
                await syncGuestHistory();
                await fetchHistory(); // bắt buộc await
            })();
        } else {
            hasSyncedGuestHistoryAfterAuth = false;
            fetchHistory();
        }
    }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

    return null;
}
