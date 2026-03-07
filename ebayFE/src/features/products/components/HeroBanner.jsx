import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

const SLIDES = [
    {
        id: 1,
        title: "Good taste is timeless",
        description: "Create iconic looks with up to $140* off luxury items.",
        cta: "Set your own trends",
        image: "https://i.ebayimg.com/images/g/tloAAeSwT7RpoCm5/s-l960.webp",
        bgColor: "#D5C5F5",
        textColor: "#351C75",
        link: "/products?category=luxury",
        terms: "Discounts in USD. *See terms."
    },
    {
        id: 2,
        title: "It's up to you",
        description: "Customize your ride, your way, with a selection of parts on eBay.",
        cta: "Explore offers",
        image: "https://i.ebayimg.com/images/g/fl4AAeSwV0hpndZs/s-l960.webp",
        bgColor: "#0064D2",
        textColor: "#FFFFFF",
        link: "/products?category=motors",
        terms: "Discounts in USD. *See terms."
    },
    {
        id: 3,
        type: "multi",
        title: "Snap. Work. Play.",
        description: "Find the electronics that fit your lifestyle.",
        cta: "Shop now",
        bgColor: "#0064D2",
        textColor: "#FFFFFF",
        items: [
            { name: "Computers", image: "https://i.ebayimg.com/images/g/164AAeSwMmNo0~fL/s-l500.webp", link: "/products?category=computers" },
            { name: "Cameras", image: "https://i.ebayimg.com/images/g/llkAAeSwkSxo0~fR/s-l500.webp", link: "/products?category=cameras" },
            { name: "Entertainment", image: "https://i.ebayimg.com/images/g/MKsAAeSwT45o0~fW/s-l500.webp", link: "/products?category=electronics" }
        ]
    },
    {
        id: 4,
        title: "Free shipping. Global shopping.",
        description: "Shop internationally and enjoy free shipping on many items.",
        cta: "Shop now",
        image: "https://i.ebayimg.com/images/g/OzMAAeSwlPBpEfM2/s-l960.webp",
        bgColor: "#7E57C2",
        textColor: "#EDE7F6",
        link: "/products"
    }
];

// Extend slides for infinite loop: [Last, Slide 1, Slide 2, Slide 3, Slide 4, First]
const EXTENDED_SLIDES = [SLIDES[SLIDES.length - 1], ...SLIDES, SLIDES[0]];

export function HeroBanner() {
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
        if (!isPaused) {
            startTimer();
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPaused, currentIndex]);

    const handleNext = () => {
        if (currentIndex >= EXTENDED_SLIDES.length - 1) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev + 1);
    };

    const handlePrev = () => {
        if (currentIndex <= 0) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev - 1);
    };

    const handleTransitionEnd = () => {
        if (currentIndex === EXTENDED_SLIDES.length - 1) {
            // Jump from cloned First to real First
            setIsTransitioning(false);
            setCurrentIndex(1);
        } else if (currentIndex === 0) {
            // Jump from cloned Last to real Last
            setIsTransitioning(false);
            setCurrentIndex(SLIDES.length);
        }
    };

    const goToSlide = (slideIndex) => {
        setIsTransitioning(true);
        setCurrentIndex(slideIndex + 1);
    };

    return (
        <div className="relative group mb-8 overflow-hidden rounded-[24px]">
            {/* Slides Container */}
            <div
                className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                onTransitionEnd={handleTransitionEnd}
            >
                {EXTENDED_SLIDES.map((slide, idx) => (
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
                    {SLIDES.map((_, idx) => {
                        const activeIdx = currentIndex === 0 ? SLIDES.length - 1 : currentIndex === EXTENDED_SLIDES.length - 1 ? 0 : currentIndex - 1;
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
