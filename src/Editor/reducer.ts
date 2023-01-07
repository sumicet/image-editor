import { Action, State } from './types';

export const initialState = {
    isDragging: false,
    position: {
        start: { x: null, y: null },
        current: { x: null, y: null },
        previous: { x: null, y: null },
    },
    dimensions: {
        original: { width: null, height: null },
        beforeZoom: { width: null, height: null },
    },
    scale: 1,
};

export function reducer(state: State, action: Action) {
    switch (action.type) {
        case 'startDragging':
            return {
                ...state,
                isDragging: true,
                position: {
                    ...state.position,
                    start: action.payload,
                },
            };
        case 'endDragging':
            return {
                ...state,
                isDragging: false,
            };
        case 'updateDraggingPosition':
            return {
                ...state,
                position: {
                    ...state.position,
                    previous: state.position.current,
                    current: action.payload,
                },
            };
        case 'updateOriginalDimensions':
            return {
                ...state,
                dimensions: {
                    ...state.dimensions,
                    original: action.payload,
                },
            };
        case 'updateBeforeZoomDimensions':
            return {
                ...state,
                dimensions: {
                    ...state.dimensions,
                    beforeZoom: action.payload,
                },
            };
        case 'updateScale':
            return {
                ...state,
                scale: action.payload,
            };
        default:
            return state;
    }
}
