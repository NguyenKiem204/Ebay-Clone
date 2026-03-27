export function normalizeAuctionLifecycle({
    auctionStatus,
    auctionStartTime,
    auctionEndTime,
    winningBidderId
}) {
    const now = Date.now();
    const normalizedStatus = String(auctionStatus || 'live').trim().toLowerCase();
    const startTime = auctionStartTime ? new Date(auctionStartTime).getTime() : null;
    const endTime = auctionEndTime ? new Date(auctionEndTime).getTime() : null;

    if (normalizedStatus === 'cancelled') {
        return 'cancelled';
    }

    if (startTime && startTime > now) {
        return 'scheduled';
    }

    const closedStatuses = ['sold', 'ended', 'reserve_not_met', 'cancelled'];
    const isClosed = closedStatuses.includes(normalizedStatus) || (endTime && endTime <= now);
    if (!isClosed) {
        return 'live';
    }

    if (normalizedStatus === 'sold' || winningBidderId) {
        return 'sold';
    }

    return 'ended';
}

export function getAuctionStatusMeta(status) {
    switch (status) {
        case 'scheduled':
            return {
                label: 'Not started',
                description: 'This auction has not started yet.',
                badgeClassName: 'border-sky-200 bg-sky-50 text-sky-700'
            };
        case 'live':
            return {
                label: 'Live',
                description: 'Bidding is open right now.',
                badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700'
            };
        case 'sold':
            return {
                label: 'Winner chosen',
                description: 'This auction already has a winner.',
                badgeClassName: 'border-violet-200 bg-violet-50 text-violet-700'
            };
        case 'cancelled':
            return {
                label: 'Cancelled',
                description: 'This auction was cancelled.',
                badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700'
            };
        default:
            return {
                label: 'Ended',
                description: 'This auction is no longer active.',
                badgeClassName: 'border-gray-200 bg-gray-100 text-gray-700'
            };
    }
}

export function formatAuctionTimestamp(value) {
    if (!value) {
        return 'N/A';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    }).format(new Date(value));
}

export function formatAuctionRelativeTime(targetTime, prefix, nowMs = Date.now()) {
    if (!targetTime) {
        return 'N/A';
    }

    const diff = new Date(targetTime).getTime() - nowMs;
    if (diff <= 0) {
        return prefix === 'Starts in' ? 'Starting now' : 'Ended';
    }

    const totalSeconds = Math.floor(diff / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    const seconds = totalSeconds % 60;

    if (days > 0) {
        return `${prefix} ${days}d ${hours}h ${minutes}m`;
    }

    if (hours > 0) {
        return `${prefix} ${hours}h ${minutes}m ${seconds}s`;
    }

    return `${prefix} ${minutes}m ${seconds}s`;
}
