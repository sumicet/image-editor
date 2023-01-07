import {
    Slider as ChakraSlider,
    SliderFilledTrack,
    SliderMark,
    SliderProps,
    SliderThumb,
    SliderTrack,
} from '@chakra-ui/react';

export function Slider(props: SliderProps) {
    const { value } = props;
    return (
        <ChakraSlider {...props} aria-label='slider-ex-6'>
            <SliderMark
                value={value ?? 0}
                textAlign='center'
                bg='blue.500'
                color='white'
                mt='-10'
                ml='-5'
                w='12'
            >
                {value}%
            </SliderMark>
            <SliderTrack>
                <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
        </ChakraSlider>
    );
}
