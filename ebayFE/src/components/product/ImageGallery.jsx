import { useState } from 'react';
import { Heart, Share2 } from 'lucide-react';

export default function ImageGallery({ images, title }) {
    const [activeImage, setActiveImage] = useState(0);

    return (
        <div className="flex gap-4">
            {/* Left Thumbnails */}
            <div className="w-[104px] flex-shrink-0">
                <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto scbar-none">
                    {images.map((img, idx) => (
                        <div
                            key={idx}
                            onMouseEnter={() => setActiveImage(idx)}
                            className={`aspect-square rounded-lg overflow-hidden p-1 cursor-pointer border-2 transition-colors ${activeImage === idx ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400'}`}
                        >
                            <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-contain" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Image Container */}
            <div className="flex-1">
                <div className="relative aspect-square bg-[#f5f5f5] rounded-[16px] overflow-hidden border border-gray-200 flex items-center justify-center group">
                    <img
                        src={images[activeImage]}
                        alt={title}
                        className="w-[90%] h-[90%] object-contain"
                    />

                    {/* Overlay: "In 27 carts" (Top Left) */}
                    <div className="absolute top-4 left-4">
                        <div className="bg-[#e53238] text-white text-[11px] font-bold px-3 py-1.5 rounded-sm uppercase">
                            IN 27 CARTS
                        </div>
                    </div>

                    {/* Overlay: Expand & Watcher Count (Top Right) */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center text-gray-700 hover:text-black border border-gray-100">
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2"><path d="M3 3h6m-6 0v6m0-6l7 7M21 3h-6m6 0v6m0-6l-7 7M3 21h6m-6 0v-6m0 6l7-7M21 21h-6m6 0v-6m0 6l-7-7" /></svg>
                        </button>
                        <div className="bg-white px-3 h-10 rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
                            <span className="text-[14px] font-bold text-gray-900">105</span>
                            <Heart size={18} className="text-gray-700" />
                        </div>
                    </div>

                    {/* Navigation Arrows */}
                    <div className="absolute inset-y-0 left-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => setActiveImage(prev => (prev > 0 ? prev - 1 : images.length - 1))}
                            className="w-10 h-10 bg-white/90 shadow-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white"
                        >
                            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-2"><path d="M15 19l-7-7 7-7" /></svg>
                        </button>
                    </div>
                    <div className="absolute inset-y-0 right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => setActiveImage(prev => (prev < images.length - 1 ? prev + 1 : 0))}
                            className="w-10 h-10 bg-white/90 shadow-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white"
                        >
                            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current stroke-2"><path d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>

                <div className="mt-4">
                    <button className="flex items-center gap-2 text-[14px] text-gray-900 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50">
                        <Share2 size={16} />
                        <span>Share</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
