import { useRef, useCallback } from 'react';

interface UseLongPressOptions {
    threshold?: number;
    onLongPress: () => void;
}

export function useLongPress({ onLongPress, threshold = 350 }: UseLongPressOptions) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const start = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            onLongPress();
        }, threshold);
    }, [onLongPress, threshold]);

    const clear = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    return {
        onMouseDown: start,
        onMouseUp: clear,
        onMouseLeave: clear,
        onTouchStart: start,
        onTouchEnd: clear,
    };
}