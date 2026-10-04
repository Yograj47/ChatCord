import { useState, useEffect, type RefObject } from 'react';

interface ElementSize {
    width: number;
    height: number;
}

export function useElementSize<T extends HTMLElement>(ref: RefObject<T | null>): ElementSize {
    const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

    useEffect(() => {
        if (!ref.current) return;

        const observer = new ResizeObserver(([entry]) => {
            if (entry) {
                setSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });

        observer.observe(ref.current);

        return () => observer.disconnect();
    }, [ref]);

    return size;
}