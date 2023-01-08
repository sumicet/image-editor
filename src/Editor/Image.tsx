/* eslint-disable no-const-assign */
import {
    DetailedHTMLProps,
    forwardRef,
    ImgHTMLAttributes,
    MouseEvent,
    useCallback,
    useContext,
    useEffect,
    useReducer,
} from 'react';
import { useDimensions, useMergeRefs } from './hooks';
import { Context } from './Editor';
import { initialState, reducer } from './reducer';

// eslint-disable-next-line react/display-name
export const Img = forwardRef<
    HTMLImageElement,
    DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>
>(({ style, onDragStart, onMouseDown, onMouseUp, onMouseMove, ...rest }, ref) => {
    const { overlay, onImageDrag, onImageDragStart, onImageDragEnd, zoom } = useContext(Context);
    const [state, dispatch] = useReducer(reducer, initialState);
    const { isDragging, position, dimensions, scale } = state;

    /**
     * One of the rendered dimensions will be invalid because the image has
     * width: '100%' and height: '100%'
     *
     * The actual dimensions are `actualWidth` and `actualHeight`
     */
    const { ref: dimensionsRef, width: renderedWidth, height: renderedHeight } = useDimensions();
    const mergedRef = useMergeRefs(ref, dimensionsRef);

    const { src } = rest;

    const startDragging = useCallback(
        (event: MouseEvent<HTMLImageElement, globalThis.MouseEvent>) => {
            dispatch({ type: 'startDragging', payload: { x: event.clientX, y: event.clientY } });

            onMouseDown?.(event);
            onImageDragStart?.(state, event);

            event.preventDefault();
        },
        [onImageDragStart, onMouseDown, state]
    );

    const endDragging = useCallback(
        (event: globalThis.MouseEvent) => {
            dispatch({ type: 'endDragging' });

            onImageDragEnd?.(state, event);
        },
        [onImageDragEnd, state]
    );

    const getOriginalImageDimensions = useCallback(async () => {
        if (!src) return { width: null, height: null };

        const img = new Image();
        img.onload = () =>
            dispatch({
                type: 'updateOriginalDimensions',
                payload: { width: img.width, height: img.height },
            });
        img.src = src;
    }, [src]);

    const handleMouseMove = useCallback(
        (event: globalThis.MouseEvent) => {
            if (
                !isDragging ||
                !src ||
                position.start.x === null ||
                position.start.y === null ||
                dimensions.beforeZoom.width === null ||
                dimensions.beforeZoom.height === null
            )
                return;

            const actualWidth = dimensions.beforeZoom.width * scale;
            const actualHeight = dimensions.beforeZoom.height * scale;

            if (overlay.width === null || overlay.height === null) return;

            const nextX = -position.start.x + event.clientX;
            const nextY = -position.start.y + event.clientY;

            // Prevent the image from being dragged past the overlay's edges
            const canMoveX = !(Math.abs(nextX) > (actualWidth - overlay.width) / 2);
            const canMoveY = !(Math.abs(nextY) > (actualHeight - overlay.height) / 2);

            const nextPosition = {
                x: canMoveX ? -position.start.x + event.clientX : position.previous.x,
                y: canMoveY ? position.start.y - event.clientY : position.previous.y,
            };

            if (nextPosition.x === position.previous.x && nextPosition.y === position.previous.y)
                return;

            dispatch({ type: 'updateDraggingPosition', payload: nextPosition });

            onImageDrag?.(state, event);
        },
        [
            dimensions.beforeZoom.height,
            dimensions.beforeZoom.width,
            isDragging,
            onImageDrag,
            overlay.height,
            overlay.width,
            position.previous.x,
            position.previous.y,
            position.start.x,
            position.start.y,
            scale,
            src,
            state,
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
        dispatch({ type: 'endDragging' });
        dispatch({ type: 'updateDraggingPosition', payload: { x: null, y: null } });
        getOriginalImageDimensions();
    }, [getOriginalImageDimensions, src]);

    // Calculate image scale based on zoom level.
    useEffect(() => {
        if (
            zoom === undefined ||
            dimensions.beforeZoom.width === null ||
            dimensions.beforeZoom.height === null ||
            overlay.width === null ||
            overlay.height === null
        )
            return;

        const isWidthTouchingOverlayEdges =
            dimensions.beforeZoom.width / overlay.width >
            dimensions.beforeZoom.height / overlay.height;

        /**
         * Scale between the rendered image's correct dimensions and when it's
         * contained inside the overlay
         */
        let ratio = 1;
        if (isWidthTouchingOverlayEdges) {
            ratio = dimensions.beforeZoom.height / overlay.height;
        } else {
            ratio = dimensions.beforeZoom.width / overlay.width;
        }

        dispatch({ type: 'updateScale', payload: zoom / ratio });
    }, [
        dimensions.beforeZoom.height,
        dimensions.beforeZoom.width,
        overlay.height,
        overlay.width,
        zoom,
    ]);

    // Calculate image dimensions before zooming in or out.
    useEffect(() => {
        if (
            dimensions.original.width === null ||
            dimensions.original.height === null ||
            renderedWidth === null ||
            renderedHeight === null
        )
            return;

        let actualWidth = renderedWidth;
        let actualHeight = renderedHeight;

        const isWidthTouchingContainerEdges =
            dimensions.original.width / renderedWidth < dimensions.original.height / renderedHeight;

        /**
         * Scale between the rendered image when it's contained inside the container and the
         * original image
         */
        let ratio = 0;
        if (isWidthTouchingContainerEdges) {
            ratio = renderedHeight / dimensions.original.height;
            actualHeight = dimensions.original.height * ratio;
        } else {
            ratio = renderedWidth / dimensions.original.width;
            actualWidth = dimensions.original.width * ratio;
        }

        dispatch({
            type: 'updateBeforeZoomDimensions',
            payload: { width: actualWidth, height: actualHeight },
        });
    }, [dimensions.original.height, dimensions.original.width, renderedHeight, renderedWidth]);

    return (
        <img
            // TODO forward and combine refs
            {...rest}
            ref={mergedRef}
            draggable={false}
            style={{
                ...style,
                objectFit: 'contain',
                maxWidth: '100%',
                maxHeight: '100%',
                minWidth: overlay.width ?? 0,
                minHeight: overlay.height ?? 0,
                transform: `translateX(${position.current.x ?? 0}px) translateY(${
                    position.current.y ? -position.current.y : 0
                }px) scale(${scale})`,
            }}
            onMouseDown={startDragging}
        />
    );
});

Img.displayName = 'Image';
