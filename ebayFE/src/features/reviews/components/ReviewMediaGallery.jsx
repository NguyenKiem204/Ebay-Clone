import { getReviewMediaType, getReviewMediaUrl } from '../utils/reviewMedia';

export default function ReviewMediaGallery({ mediaItems = [], onRemove }) {
    if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
        return null;
    }

    return (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {mediaItems.map((item, index) => {
                const mediaType = getReviewMediaType(item);
                const url = getReviewMediaUrl(item);
                const rawUrl = typeof item === 'string' ? item : item.url || item.mediaUrl || '';
                const key = `${rawUrl || 'review-media'}-${index}`;

                return (
                    <div key={key} className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                        {mediaType === 'video' ? (
                            <video
                                src={url}
                                controls
                                className="h-36 w-full object-cover"
                            />
                        ) : (
                            <img
                                src={url}
                                alt="Review media"
                                className="h-36 w-full object-cover"
                            />
                        )}

                        {onRemove && (
                            <button
                                type="button"
                                onClick={() => onRemove(typeof item === 'string' ? item : item.url)}
                                className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
