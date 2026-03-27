import { resolveMediaUrl } from '../../../lib/media';

export function getReviewMediaType(item) {
    if (!item) {
        return 'image';
    }

    if (typeof item === 'object' && item.mediaType) {
        return item.mediaType;
    }

    const value = typeof item === 'string' ? item : item.url || item.mediaUrl || '';
    const lowerValue = value.toLowerCase();
    if (lowerValue.endsWith('.mp4') || lowerValue.endsWith('.mov') || lowerValue.endsWith('.webm') || lowerValue.endsWith('.ogg')) {
        return 'video';
    }

    return 'image';
}

export function getReviewMediaUrl(item) {
    if (!item) {
        return '';
    }

    const value = typeof item === 'string' ? item : item.url || item.mediaUrl || '';
    return resolveMediaUrl(value);
}
