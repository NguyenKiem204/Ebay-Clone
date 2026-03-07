import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function FloatingControls() {
    const [showScroll, setShowScroll] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScroll(true);
            } else {
                setShowScroll(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-[100]">
            {showScroll && (
                <button
                    className="w-12 h-12 rounded-full bg-white border border-[#ddd] flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.1)] cursor-pointer transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:bg-[#f8f8f8] text-[#191919]"
                    onClick={scrollToTop}
                    aria-label="Scroll to top"
                >
                    <ChevronUp size={24} />
                </button>
            )}
            <button
                className="w-12 h-12 rounded-full bg-white border border-[#ddd] flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.1)] cursor-pointer transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:bg-[#f8f8f8] text-[#191919]"
                aria-label="Help"
            >
                <span className="text-xl">?</span>
            </button>
        </div>
    );
}
