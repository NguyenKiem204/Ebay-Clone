import { BASE_URL } from './axios';

export function resolveMediaUrl(value) {
    if (!value) {
        return '';
    }

    if (typeof value !== 'string') {
        return '';
    }

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
        return value;
    }

    const normalizedPath = value.replace(/\\/g, '/');
    const normalized = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    return `${BASE_URL}${normalized}`;
}

export function resolveMediaUrls(values) {
    if (!Array.isArray(values)) {
        return [];
    }

    return values.map(resolveMediaUrl).filter(Boolean);
}
