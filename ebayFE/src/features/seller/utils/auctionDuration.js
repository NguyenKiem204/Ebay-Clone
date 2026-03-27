export const AUCTION_DURATION_PRESETS = [
    { label: '1 hour', minutes: 60 },
    { label: '6 hours', minutes: 360 },
    { label: '12 hours', minutes: 720 },
    { label: '1 day', minutes: 1440 },
    { label: '3 days', minutes: 4320 },
    { label: '7 days', minutes: 10080 },
];

export const getAuctionDurationParts = (totalMinutes) => {
    const safeMinutes = Math.max(0, Number(totalMinutes) || 0);
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;

    return {
        hours: String(hours),
        minutes: String(minutes)
    };
};

export const getAuctionDurationTotalMinutes = (hoursValue, minutesValue) => {
    const hours = Math.max(0, parseInt(hoursValue || '0', 10) || 0);
    const minutes = Math.max(0, parseInt(minutesValue || '0', 10) || 0);

    return (hours * 60) + minutes;
};

export const formatAuctionDuration = (totalMinutes) => {
    const safeMinutes = Math.max(0, Number(totalMinutes) || 0);
    const days = Math.floor(safeMinutes / 1440);
    const hours = Math.floor((safeMinutes % 1440) / 60);
    const minutes = safeMinutes % 60;
    const parts = [];

    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

    return parts.join(' ');
};

export const findAuctionDurationPreset = (totalMinutes) => (
    AUCTION_DURATION_PRESETS.find((preset) => preset.minutes === totalMinutes)?.minutes?.toString() || 'custom'
);

export const extractApiErrorMessages = (errors) => {
    if (!errors) return [];
    if (Array.isArray(errors)) return errors;

    return Object.values(errors)
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .filter(Boolean);
};
