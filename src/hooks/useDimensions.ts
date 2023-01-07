import { useEffect, useState, useCallback } from 'react';
import useResizeObserver from 'use-resize-observer';
import { Dimensions, Position } from '../types';

let isBorderBoxSupported = true;

const observer = new ResizeObserver(entries => {
    if (!entries[0].borderBoxSize) isBorderBoxSupported = false;
    observer.disconnect();
});

observer.observe(document.body, {
    box: 'border-box',
});

export function useDimensions(args: { onResize: (value: Dimensions) => void } | void) {
    const [node, setNode] = useState<HTMLElement | null>(null);
    const [position, setPosition] = useState<Position>({ x: null, y: null });
    const [size, setSize] = useState<Dimensions>({ width: null, height: null });

    const { ref: observerRef } = useResizeObserver({
        box: isBorderBoxSupported ? 'border-box' : undefined,
        onResize: val => {
            // If the element doesn't exist in the DOM, the observer returns
            // `null` as a value. To keep the behavior consistent with the
            // previous implementation, we ignore such values.
            if (!val.width || !val.height) return;
            const newSize = {
                width: val?.width || null,
                height: val?.height || null,
            };
            setSize(newSize);
            args?.onResize(newSize);
        },
    });

    const ref = useCallback((x: HTMLElement | null) => {
        if (x === null) return;

        setNode(x);
    }, []);

    useEffect(() => {
        if (!node) return undefined;

        const getPosition = () => {
            if (!node) return;

            const { x, y } = node.getBoundingClientRect();
            setPosition({ x, y });
        };

        getPosition();
        observerRef(node);

        window.addEventListener('resize', getPosition);
        return () => window.removeEventListener('resize', getPosition);
    }, [node, observerRef]);

    return { ref, width: size.width, height: size.height, x: position.x, y: position.y };
}
