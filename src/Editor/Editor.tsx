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
    const { overlay, onImageDrag, onImageDragStart, onImageDragEnd, zoom } = useContext(Context);
    const [isDragging, setIsDragging] = useState(false);
    const [startDraggingPosition, setStartDraggingPosition] = useState<Position>({
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

    const [originalImage, setOriginalImage] = useState<Dimensions>({ width: null, height: null });

    const [scale, setScale] = useState(1);

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
            setStartDraggingPosition({ x: event.clientX, y: event.clientY });

            onMouseDown?.(event);
            onImageDragStart?.(event);

            event.preventDefault();
        },
        [onImageDragStart, onMouseDown]
    );

    const endDragging = useCallback(
        (event: globalThis.MouseEvent) => {
            setIsDragging(false);
            setStartDraggingPosition({ x: null, y: null });

            onImageDragEnd?.(event);
        },
        [onImageDragEnd]
    );

    const getOriginalImageDimensions = useCallback(async () => {
        if (!src) return { width: null, height: null };

        const image = new Image();
        image.onload = () => {
            setOriginalImage({ width: image.width, height: image.height });
        };
        image.src = src;
    }, [src]);

    const calculateImageScaleBasedOnZoom = useCallback(() => {
        if (
            originalImage.width === null ||
            originalImage.height === null ||
            renderedWidth === null ||
            renderedHeight === null ||
            overlay.width === null ||
            overlay.height === null ||
            zoom === undefined
        )
            return null;

        const isWidthTouchingContainerEdges =
            originalImage.width / renderedWidth > originalImage.height / renderedHeight;

        /**
         * Scale between the rendered image when it's contained inside the container and the
         * image when it fills the overlay
         */
        let ratio = 0;
        if (isWidthTouchingContainerEdges) {
            ratio = renderedHeight / overlay.height;
        } else {
            ratio = renderedWidth / overlay.width;
        }

        setScale(zoom / ratio);
    }, [
        originalImage.height,
        originalImage.width,
        overlay.height,
        overlay.width,
        renderedHeight,
        renderedWidth,
        zoom,
    ]);

    const handleMouseMove = useCallback(
        (event: globalThis.MouseEvent) => {
            if (
                !isDragging ||
                startDraggingPosition.x === null ||
                startDraggingPosition.y === null ||
                !src ||
                renderedWidth === null ||
                renderedHeight === null ||
                originalImage.width === null ||
                originalImage.height === null
            )
                return;

            let actualWidth = renderedWidth;
            let actualHeight = renderedHeight;

            const isHeightTouchingContainerEdges =
                originalImage.height / renderedHeight > originalImage.width / renderedWidth;

            if (isHeightTouchingContainerEdges) {
                const ratio = renderedHeight / originalImage.height;
                actualWidth = originalImage.width * ratio;
            } else {
                const ratio = renderedWidth / originalImage.width;
                actualHeight = originalImage.height * ratio;
            }
            console.log({ actualWidth, actualHeight });

            if (overlay.width === null || overlay.height === null) return;

            // @ts-ignore
            const nextX = -startDraggingPosition.x + event.clientX;
            // @ts-ignore
            const nextY = -startDraggingPosition.y + event.clientY;

            // Prevent the image from being dragged past the overlay's edges
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
                            originalWidth: originalImage.width,
                            originalHeight: originalImage.height,
                        },
                        overlay,
                    },
                    event
                );

                return position;
            });
        },
        [
            isDragging,
            startDraggingPosition,
            src,
            renderedWidth,
            renderedHeight,
            originalImage.width,
            originalImage.height,
            overlay,
            onImageDrag,
        ]
    );

    // It's important that the user starts dragging inside the image's bounds
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

    useEffect(() => {
        setStartDraggingPosition({ x: null, y: null });
        setPosition({ x: null, y: null });
        getOriginalImageDimensions();
    }, [getOriginalImageDimensions, src]);

    useEffect(() => {
        calculateImageScaleBasedOnZoom();
    }, [calculateImageScaleBasedOnZoom]);

    return (
        <img
            // TODO forward and combine refs
            {...rest}
            ref={ref}
            draggable={false}
            style={{
                ...style,
                objectFit: 'contain',
                maxWidth: '100%',
                maxHeight: '100%',
                minWidth: overlay.width ?? 0,
                minHeight: overlay.height ?? 0,
                transform: `translateX(${position.x ?? 0}px) translateY(${
                    position.y ? -position.y : 0
                }px) scale(${scale})`,
            }}
            onMouseDown={startDragging}
        />
    );
}

interface Info {
    position: Position;
    startDraggingPosition: Position;
    image: Dimensions & {
        originalWidth: Dimensions['width'];
        originalHeight: Dimensions['height'];
    };
    overlay: Dimensions;
}

interface SharedProps {
    /**
     * Fires continuously while the image is being dragged.
     */
    onImageDrag?: (
        info: Info & {
            previousPosition: Position;
        },
        event: globalThis.MouseEvent
    ) => void;
    /**
     * Fires when the user starts dragging the image.
     */
    onImageDragStart?: (event: MouseEvent<HTMLImageElement, globalThis.MouseEvent>) => void;
    /**
     * Fires when the user stops dragging the image.
     */
    onImageDragEnd?: (event: globalThis.MouseEvent) => void;
    /**
     * Fires when the user scales the image.
     */
    onImageZoom?: (event: globalThis.MouseEvent) => void;
    /**
     * A number that controls the zoom level of the image.
     *
     * @min 1
     */
    zoom?: number;
}

const Context = createContext<
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

export function Editor({
    children,
    style,
    onImageDrag,
    onImageDragStart,
    onImageDragEnd,
    onImageZoom,
    zoom,
    ...rest
}: EditorProps) {
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
