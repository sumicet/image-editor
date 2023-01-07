import {
    createContext,
    DetailedHTMLProps,
    HTMLAttributes,
    ImgHTMLAttributes,
    MouseEvent,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useDimensions } from '../hooks';
import { Dimensions, Position } from '../types';

export function Content() {
    return <></>;
}

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

export function Img({
    style,
    onDragStart,
    onMouseDown,
    onMouseUp,
    onMouseMove,
    ...rest
}: DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>) {
    const { overlay, onImageDrag, onImageDragStart, onImageDragEnd } = useContext(Context);
    const [isDragging, setIsDragging] = useState(false);
    const [startDraggingPosition, setstartDraggingPosition] = useState<Position>({
        x: null,
        y: null,
    });
    /**
     * If the position is negative, the element is dragged to the left/top
     * If the position is positive, the element is dragged to the right/bottom
     */
    const [position, setPosition] = useState<{ x: number | null; y: number | null }>({
        x: null,
        y: null,
    });

    /**
     * One of the rendered dimensions will be invalid because the image has
     * width: '100%' and height: '100%'
     *
     * The actual dimensions are `actualWidth` and `actualHeight`
     */
    const { ref, width: renderedWidth, height: renderedHeight } = useDimensions();

    const { src } = rest;

    const startDragging = useCallback(
        (event: MouseEvent<HTMLImageElement, globalThis.MouseEvent>) => {
            setIsDragging(true);
            setstartDraggingPosition({ x: event.clientX, y: event.clientY });

            onMouseDown?.(event);
            onImageDragStart?.(event);

            event.preventDefault();
        },
        [onImageDragStart, onMouseDown]
    );

    const endDragging = useCallback(
        (event: globalThis.MouseEvent) => {
            setIsDragging(false);
            setstartDraggingPosition({ x: null, y: null });

            onImageDragEnd?.(event);
        },
        [onImageDragEnd]
    );

    const handleMouseMove = useCallback(
        (event: globalThis.MouseEvent) => {
            if (
                !isDragging ||
                startDraggingPosition.x === null ||
                startDraggingPosition.y === null ||
                !src ||
                renderedWidth === null ||
                renderedHeight === null
            )
                return;

            const image = new Image();
            image.onload = () => {
                /**
                 * The dimensions of the original image saved remotely (pc, server, etc.)
                 */
                const { width, height } = image;

                let actualWidth = renderedWidth;
                let actualHeight = renderedHeight;

                // const isOriginalImageSmallerThanRendered =
                //     width < renderedWidth && height < renderedHeight;

                // TODO handle when it's smaller

                if (height - renderedHeight > width - renderedWidth) {
                    const scale = renderedHeight / height;
                    actualWidth = width * scale;
                } else {
                    const scale = renderedWidth / width;
                    actualHeight = height * scale;
                }

                if (overlay.width === null || overlay.height === null) return;

                // @ts-ignore
                const nextX = -startDraggingPosition.x + event.clientX;
                // @ts-ignore
                const nextY = -startDraggingPosition.y + event.clientY;

                const canMoveX = !(Math.abs(nextX) > (actualWidth - overlay.width) / 2);
                const canMoveY = !(Math.abs(nextY) > (actualHeight - overlay.height) / 2);

                setPosition(previousPosition => {
                    const position = {
                        // @ts-ignore
                        x: canMoveX ? -startDraggingPosition.x + event.clientX : previousPosition.x,
                        // @ts-ignore
                        y: canMoveY ? startDraggingPosition.y - event.clientY : previousPosition.y,
                    };

                    onImageDrag?.(
                        {
                            position,
                            startDraggingPosition,
                            previousPosition,
                            image: {
                                width: actualWidth,
                                height: actualHeight,
                                originalWidth: width,
                                originalHeight: height,
                            },
                            overlay,
                        },
                        event
                    );

                    return position;
                });
            };
            image.src = src;
        },
        [
            isDragging,
            startDraggingPosition,
            src,
            renderedWidth,
            renderedHeight,
            overlay,
            onImageDrag,
        ]
    );

    // It's important that the user starts dragging inside the image
    // Other than that, the user should be able to stop dragging anywhere on the
    // page
    // Listen to onMouseDown & onMouseMove on the document
    useEffect(() => {
        window.addEventListener('pointerup', endDragging);
        window.addEventListener('pointermove', handleMouseMove);

        return () => {
            window.removeEventListener('pointerup', endDragging);
            window.removeEventListener('pointermove', handleMouseMove);
        };
    }, [endDragging, handleMouseMove]);

    return (
        <img
            // TODO forward and combine refs
            {...rest}
            ref={ref}
            draggable={false}
            style={{
                ...style,
                objectFit: 'contain',
                width: '100%',
                height: '100%',
                transform: `translateX(${position.x ?? 0}px) translateY(${
                    position.y ? -position.y : 0
                }px)`,
            }}
            onMouseDown={startDragging}
        />
    );
}

interface EditorEvents {
    /**
     * Fired when the user starts dragging the image
     */
    onImageDrag?: (
        info: {
            position: Position;
            startDraggingPosition: Position;
            previousPosition: Position;
            image: Dimensions & {
                originalWidth: Dimensions['width'];
                originalHeight: Dimensions['height'];
            };
            overlay: Dimensions;
        },
        event: globalThis.MouseEvent
    ) => void;
    onImageDragStart?: (event: MouseEvent<HTMLImageElement, globalThis.MouseEvent>) => void;
    onImageDragEnd?: (event: globalThis.MouseEvent) => void;
}

const Context = createContext<
    { overlay: Dimensions; setOverlay: (value: Dimensions) => void } & EditorEvents
>({
    overlay: { width: null, height: null },
    setOverlay: () => null,
    onImageDrag: () => null,
});

export type EditorProps = DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> &
    EditorEvents;

export function Editor({
    children,
    style,
    onImageDrag,
    onImageDragStart,
    onImageDragEnd,
    ...rest
}: EditorProps) {
    const [overlay, setOverlay] = useState<Dimensions>({ width: null, height: null });

    const memoValue = useMemo(
        () => ({ overlay, setOverlay, onImageDrag, onImageDragStart, onImageDragEnd }),
        [onImageDrag, onImageDragEnd, onImageDragStart, overlay]
    );

    return (
        <Context.Provider value={memoValue}>
            <div
                {...rest}
                style={{
                    cursor: 'grab',
                    ...style,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {children}
            </div>
        </Context.Provider>
    );
}
