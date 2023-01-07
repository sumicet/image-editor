import { DetailedHTMLProps, HTMLAttributes, useContext } from 'react';
import { useDimensions } from './hooks';
import { Context } from './Editor';

export function Overlay({
    style,
    ...rest
}: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
    const { setOverlay } = useContext(Context);

    const { ref } = useDimensions({ onResize: setOverlay });

    return (
        <div
            ref={ref}
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
}
