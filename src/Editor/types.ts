export interface Dimensions {
    width: number | null;
    height: number | null;
}

export interface Position {
    x: number | null;
    y: number | null;
}

export interface State {
    isDragging: boolean;
    position: {
        /**
         * The position where the dragging started.
         */
        start: Position;
        /**
         * If the position is negative, the element is dragged to the left/top
         * If the position is positive, the element is dragged to the right/bottom
         */
        current: Position;
        previous: Position;
    };
    dimensions: {
        original: Dimensions;
        beforeZoom: Dimensions;
    };
    scale: number;
}

export type Action =
    | { type: 'startDragging'; payload: Position }
    | { type: 'endDragging' }
    | { type: 'updateDraggingPosition'; payload: Position }
    | { type: 'updateOriginalDimensions'; payload: Dimensions }
    | { type: 'updateBeforeZoomDimensions'; payload: Dimensions }
    | { type: 'updateScale'; payload: number };
