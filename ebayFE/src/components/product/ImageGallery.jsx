import { useState } from 'react';
import { Heart, Share2, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageGallery({ images, title, savedCount = 0, inCartCount = 0 }) {
    const [activeImage, setActiveImage] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
                            IN {inCartCount} CARTS
                        </div>
                    </div>

                    {/* Overlay: Expand & Watcher Count (Top Right) */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center text-gray-700 hover:text-black hover:bg-gray-50 border border-gray-100 transition-colors"
                            title="Expand Gallery"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2"><path d="M3 3h6m-6 0v6m0-6l7 7M21 3h-6m6 0v6m0-6l-7 7M3 21h6m-6 0v-6m0 6l7-7M21 21h-6m6 0v-6m0 6l-7-7" /></svg>
                        </button>
                        <div className="bg-white px-3 h-10 rounded-full shadow-sm border border-gray-100 flex items-center gap-1.5" title={`${savedCount} saves`}>
                            <span className="text-[14px] font-bold text-gray-900">{savedCount}</span>
                            <Heart size={16} className="text-gray-700 mt-[-1px]" />
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

            {/* Full Screen Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <div className="w-10"></div> {/* Spacer for centering */}
                        <h2 className="text-[16px] font-bold text-gray-900">
                            Gallery ({activeImage + 1} of {images.length})
                        </h2>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 border border-gray-200 transition-colors"
                        >
                            <X size={20} className="text-gray-700" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 overflow-hidden p-6 gap-6 max-w-[1600px] mx-auto w-full">
                        {/* Huge Main Image Area */}
                        <div className="flex-[3] relative bg-[#f5f5f5] rounded-xl overflow-hidden flex items-center justify-center group/modal">
                            <button
                                onClick={() => setActiveImage(prev => (prev > 0 ? prev - 1 : images.length - 1))}
                                className="absolute left-6 z-10 w-12 h-12 bg-white shadow-md border border-gray-200 rounded-full flex items-center justify-center text-gray-700 hover:scale-105 transition-transform"
                            >
                                <ChevronLeft size={28} />
                            </button>
                            
                            <img
                                src={images[activeImage]}
                                alt={title}
                                className="max-w-full max-h-full object-contain p-8"
                            />

                            <button
                                onClick={() => setActiveImage(prev => (prev < images.length - 1 ? prev + 1 : 0))}
                                className="absolute right-6 z-10 w-12 h-12 bg-white shadow-md border border-gray-200 rounded-full flex items-center justify-center text-gray-700 hover:scale-105 transition-transform"
                            >
                                <ChevronRight size={28} />
                            </button>
                        </div>

                        {/* Right Vertical Thumbnails */}
                        <div className="w-[300px] overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setActiveImage(idx)}
                                    className={`relative rounded-xl overflow-hidden border cursor-pointer transition-colors ${activeImage === idx ? 'border-gray-900 border-2' : 'border-gray-300 hover:border-gray-400'}`}
                                >
                                    <div className="aspect-[4/3] bg-white flex items-center justify-center p-3">
                                        <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-contain" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
