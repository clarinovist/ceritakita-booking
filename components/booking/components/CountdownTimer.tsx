'use client';

import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

interface CountdownTimerProps {
    targetDate: string;
}

export const CountdownTimer = ({ targetDate }: CountdownTimerProps) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const difference = target - now;

            if (difference <= 0) {
                setTimeLeft('Berakhir');
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setIsUrgent(difference < 24 * 60 * 60 * 1000);

            if (days > 0) {
                setTimeLeft(`${days}h ${hours}j lagi`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}j ${minutes}m lagi`);
            } else {
                setTimeLeft(`${minutes}m ${seconds}d`);
            }
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    return (
        <span className={`text-[10px] font-bold ${isUrgent ? 'text-red-600 animate-pulse' : 'text-orange-600'}`}>
            {isUrgent && <Zap size={10} className="inline mr-0.5" />}
            {timeLeft}
        </span>
    );
};
