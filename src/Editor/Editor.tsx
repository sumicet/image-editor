import {
    createContext,
    DetailedHTMLProps,
    forwardRef,
    HTMLAttributes,
    MouseEvent,
    useMemo,
    useState,
} from 'react';
import { Dimensions, State } from './types';

interface SharedProps {
    /**
     * Fires continuously while the image is being dragged.
     */
    onImageDrag?: (state: State, event: globalThis.MouseEvent) => void;
    /**
     * Fires when the user starts dragging the image.
     */
    onImageDragStart?: (
        state: State,
        event: MouseEvent<HTMLImageElement, globalThis.MouseEvent>
    ) => void;
    /**
     * Fires when the user stops dragging the image.
     */
    onImageDragEnd?: (state: State, event: globalThis.MouseEvent) => void;
    /**
     * Fires when the user scales the image.
     */
    onImageZoom?: (state: State, event: globalThis.MouseEvent) => void;
    /**
     * A number that controls the zoom level of the image.
     *
     * @min 1 Fill the overlay.
     */
    zoom?: number;
}

export const Context = createContext<
    { overlay: Dimensions; setOverlay: (value: Dimensions) => void } & SharedProps
>({
    overlay: { width: null, height: null },
    setOverlay: () => null,
    onImageDrag: () => null,
    onImageDragStart: () => null,
    onImageDragEnd: () => null,
    onImageZoom: () => null,
    zoom: 0,
});

export type EditorProps = DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> &
    SharedProps;

export const Editor = forwardRef<HTMLDivElement, EditorProps>(
    (
        {
            children,
            style,
            onImageDrag,
            onImageDragStart,
            onImageDragEnd,
            onImageZoom,
            zoom,
            ...rest
        },
        ref
    ) => {
        const [overlay, setOverlay] = useState<Dimensions>({ width: null, height: null });

        const memoValue = useMemo(
            () => ({
                overlay,
                setOverlay,
                onImageDrag,
                onImageDragStart,
                onImageDragEnd,
                zoom,
                onImageZoom,
            }),
            [onImageDrag, onImageDragEnd, onImageDragStart, onImageZoom, overlay, zoom]
        );

        if (zoom && zoom < 1) throw new Error('"zoom" must be greater than 1.');

        return (
            <Context.Provider value={memoValue}>
                <div
                    {...rest}
                    ref={ref}
                    style={{
                        cursor: 'grab',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...style,
                    }}
                >
                    {children}
                </div>
            </Context.Provider>
        );
    }
);

Editor.displayName = 'Editor';
