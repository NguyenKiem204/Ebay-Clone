import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

import useProductStore from '../../../store/useProductStore';

export function HeroBanner() {
    const { banners } = useProductStore();

    // Map API data to component structure
    const slides = banners.length > 0 ? banners.map(b => ({
        id: b.id,
        title: b.title,
        description: b.description,
        cta: b.ctaText || "Shop now",
        image: b.imageUrl,
        link: b.linkUrl,
        bgColor: b.bgColor || "#0064D2",
        textColor: b.textColor || "#FFFFFF",
        type: b.type,
        items: b.items ? b.items.map(item => ({
            name: item.title,
            image: item.image,
            link: item.link
        })) : []
    })) : [];

    const [currentIndex, setCurrentIndex] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef(null);

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            handleNext();
        }, 5000);
    };

    useEffect(() => {
        if (!isPaused && slides.length > 0) {
            startTimer();
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPaused, currentIndex, slides.length]);

    const handleNext = () => {
        if (slides.length === 0) return;
        const totalSlides = slides.length + 2; // extendedSlides length
        if (currentIndex >= totalSlides - 1) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev + 1);
    };

    const handlePrev = () => {
        if (slides.length === 0) return;
        if (currentIndex <= 0) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev - 1);
    };

    const handleTransitionEnd = () => {
        if (slides.length === 0) return;
        const totalSlides = slides.length + 2;
        if (currentIndex === totalSlides - 1) {
            setIsTransitioning(false);
            setCurrentIndex(1);
        } else if (currentIndex === 0) {
            setIsTransitioning(false);
            setCurrentIndex(slides.length);
        }
    };

    const goToSlide = (slideIndex) => {
        setIsTransitioning(true);
        setCurrentIndex(slideIndex + 1);
    };

    // Fallback if no banners (or loading)
    if (slides.length === 0) return <div className="mb-8 h-[360px] rounded-[24px] bg-gray-100 animate-pulse"></div>;

    const extendedSlides = [slides[slides.length - 1], ...slides, slides[0]];

    return (
        <div className="relative group mb-8 overflow-hidden rounded-[24px]">
            {/* Slides Container */}
            <div
                className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                onTransitionEnd={handleTransitionEnd}
            >
                {extendedSlides.map((slide, idx) => (
                    <div
                        key={`${slide.id}-${idx}`}
                        className="min-w-full h-[436px] md:h-[360px] flex overflow-hidden relative"
                        style={{ backgroundColor: slide.bgColor }}
                    >
                        {slide.type === "multi" ? (
                            <div className="flex w-full h-full p-8 md:p-16">
                                <div className="flex-1 flex flex-col justify-center text-white z-10">
                                    <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">{slide.title}</h2>
                                    <p className="text-lg md:text-xl mb-8 opacity-90">{slide.description}</p>
                                    <div>
                                        <Link
                                            to="/products"
                                            className="inline-block bg-white text-[#0064D2] font-bold px-10 py-4 rounded-full hover:bg-opacity-90 transition-all text-lg"
                                        >
                                            {slide.cta}
                                        </Link>
                                    </div>
                                </div>
                                <div className="hidden md:grid grid-cols-3 gap-8 items-end flex-[1.5] z-10">
                                    {slide.items.map((item, i) => (
                                        <Link key={i} to={item.link} className="flex flex-col items-center group/item text-white no-underline">
                                            <div className="w-full aspect-square mb-6 overflow-hidden flex items-center justify-center">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain mix-blend-multiply group-hover/item:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                            <span className="text-xl font-bold group-hover/item:underline">
                                                {item.name} <ChevronRight size={20} className="inline mb-1" />
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex w-full h-full">
                                <div className="flex-1 p-8 md:p-16 flex flex-col justify-center z-10" style={{ color: slide.textColor }}>
                                    <h2 className="text-4xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">{slide.title}</h2>
                                    <p className="text-lg md:text-xl mb-8 max-w-md opacity-90">{slide.description}</p>
                                    <div>
                                        <Link
                                            to={slide.link}
                                            className="inline-block bg-[#191919] text-white font-bold px-10 py-4 rounded-full hover:bg-black transition-all text-lg"
                                        >
                                            {slide.cta}
                                        </Link>
                                    </div>
                                    {slide.terms && (
                                        <div className="mt-8 md:mt-auto opacity-80 underline text-xs">{slide.terms}</div>
                                    )}
                                </div>
                                <div className="flex-1 relative h-full overflow-hidden">
                                    <img
                                        src={slide.image}
                                        alt={slide.title}
                                        className="w-full h-full object-cover object-left"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/5 md:hidden"></div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Bottom Controls Area */}
            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center px-8 z-20">
                {/* Dots */}
                <div className="flex gap-2">
                    {slides.map((_, idx) => {
                        const activeIdx = currentIndex === 0 ? slides.length - 1 : currentIndex === extendedSlides.length - 1 ? 0 : currentIndex - 1;
                        return (
                            <button
                                key={idx}
                                onClick={() => goToSlide(idx)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${activeIdx === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'
                                    }`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        );
                    })}
                </div>

                {/* Controls (Bottom Right) */}
                <div className="absolute bottom-0 right-8 flex items-center gap-3">
                    <button
                        onClick={handlePrev}
                        className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm cursor-pointer"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft size={24} className="text-gray-900" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm cursor-pointer"
                        aria-label="Next slide"
                    >
                        <ChevronRight size={24} className="text-gray-900" />
                    </button>
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm cursor-pointer"
                    >
                        {isPaused ? <Play size={20} className="text-gray-900" /> : <Pause size={20} className="text-gray-900" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
