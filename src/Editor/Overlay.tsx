import { DetailedHTMLProps, forwardRef, HTMLAttributes, useContext } from 'react';
import { useDimensions, useMergeRefs } from './hooks';
import { Context } from './Editor';

export const Overlay = forwardRef<
    HTMLDivElement,
    DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
>(({ style, ...rest }, ref) => {
    const { setOverlay } = useContext(Context);

    const { ref: dimensionsRef } = useDimensions({ onResize: setOverlay });
    const mergedRef = useMergeRefs(ref, dimensionsRef);

    return (
        <div
            ref={mergedRef}
            {...rest}
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translateX(-50%) translateY(-50%)',
                ...style,
                // Should find a better solution for this
                pointerEvents: 'none',
            }}
        />
    );
});

Overlay.displayName = 'Overlay';
