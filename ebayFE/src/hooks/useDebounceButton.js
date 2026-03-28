import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Anti-spam hook for buttons.
 * If the user clicks `threshold` or more times within `windowMs` milliseconds,
 * the action is blocked and a toast warning is shown. The block lasts `blockDurationMs`.
 *
 * @param {Function} action - The async or sync function to execute on click
 * @param {object} options
 * @param {number} options.threshold      - Number of clicks within windowMs to trigger spam block (default: 2)
 * @param {number} options.windowMs       - Rolling window in ms to count clicks (default: 500)
 * @param {number} options.blockDurationMs - How long to block after spam is detected (default: 2000)
 * @param {string} options.warningMsg     - Custom toast message (optional)
 * @returns {{ trigger: Function, isBlocked: boolean }}
 */
export function useDebounceButton(action, {
    threshold = 2,
    windowMs = 500,
    blockDurationMs = 2000,
    warningMsg = 'Please do not click too fast!'
} = {}) {
    const clickTimestamps = useRef([]);
    const [isBlocked, setIsBlocked] = useState(false);
    const blockTimer = useRef(null);

    const trigger = async (...args) => {
        if (isBlocked) return;

        const now = Date.now();

        // Purge timestamps older than windowMs
        clickTimestamps.current = clickTimestamps.current.filter(
            (t) => now - t < windowMs
        );
        clickTimestamps.current.push(now);

        if (clickTimestamps.current.length >= threshold) {
            // Spam detected
            clickTimestamps.current = [];
            setIsBlocked(true);
            toast.error(warningMsg, { id: 'spam-warning', duration: blockDurationMs });

            if (blockTimer.current) clearTimeout(blockTimer.current);
            blockTimer.current = setTimeout(() => setIsBlocked(false), blockDurationMs);
            return;
        }

        await action(...args);
    };

    return { trigger, isBlocked };
}
