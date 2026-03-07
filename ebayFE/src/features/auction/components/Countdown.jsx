import { useEffect, useState } from 'react';

export default function Countdown({ endTime, onEnd, variant = 'simple' }) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
    const [isEndingSoon, setIsEndingSoon] = useState(false);

    useEffect(() => {
        const updateTime = () => {
            const diff = new Date(endTime) - new Date();
            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0, ended: true });
                if (onEnd) onEnd();
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({ days, hours, mins, secs });
            setIsEndingSoon(days === 0 && hours < 1);
        };

        updateTime();
        const interval = setInterval(updateTime, 1000); // Update every second for accuracy
        return () => clearInterval(interval);
    }, [endTime, onEnd]);

    if (timeLeft.ended) {
        return <span className="text-red-600 font-bold">Ended</span>;
    }

    if (variant === 'detailed') {
        const pad = (num) => String(num).padStart(2, '0');
        return (
            <div className="flex gap-2 md:gap-4 justify-center">
                <div className="flex flex-col items-center">
                    <span className="text-xl md:text-2xl font-mono font-bold text-red-600">{pad(timeLeft.days)}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Days</span>
                </div>
                <span className="text-xl md:text-2xl font-mono font-bold text-red-600">:</span>
                <div className="flex flex-col items-center">
                    <span className="text-xl md:text-2xl font-mono font-bold text-red-600">{pad(timeLeft.hours)}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Hrs</span>
                </div>
                <span className="text-xl md:text-2xl font-mono font-bold text-red-600">:</span>
                <div className="flex flex-col items-center">
                    <span className="text-xl md:text-2xl font-mono font-bold text-red-600">{pad(timeLeft.mins)}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Mins</span>
                </div>
                <span className="text-xl md:text-2xl font-mono font-bold text-red-600">:</span>
                <div className="flex flex-col items-center">
                    <span className="text-xl md:text-2xl font-mono font-bold text-red-600">{pad(timeLeft.secs)}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Secs</span>
                </div>
            </div>
        );
    }

    return (
        <span className={`font-mono font-medium ${isEndingSoon ? 'text-red-600 animate-pulse' : 'text-gray-600'}`}>
            ⏱ {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}{timeLeft.hours}h {timeLeft.mins}m
        </span>
    );
}
