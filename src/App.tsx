import { Center, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { Slider } from './components';
import { Editor, Image, Overlay } from './Editor';
import { Position } from './types';

// const placeholder = 'https://i.imgur.com/yPZNinD.jpg';
const placeholder = 'https://i.imgur.com/nJryNjC.png';
// const placeholder = 'https://i.imgur.com/qL7dPM7.jpg';

function App() {
    const [position, setPosition] = useState<Position>({ x: null, y: null });
    const [sliderValue, setSliderValue] = useState(1);

    const [url, setUrl] = useState<string>('');

    return (
        <Center bgColor='#242424' boxSize='100%'>
            <VStack spacing={30}>
                <Input
                    type='url'
                    value={url}
                    placeholder={placeholder}
                    onChange={e => setUrl(e.target.value)}
                    outline='1px solid'
                    outlineOffset='-1px'
                    outlineColor='whiteAlpha.200'
                    border='0px'
                    color='white'
                    bgColor='#313131'
                    _placeholder={{ color: 'whiteAlpha.500' }}
                />
                <HStack>
                    <Text fontSize='3xl' color='white'>
                        x: {position.x ?? 0},{' '}
                    </Text>
                    <Text fontSize='3xl' color='white'>
                        y: {position.y ?? 0}
                    </Text>
                </HStack>
                <VStack spacing={50}>
                    <Editor
                        style={{ width: 700, height: 500, borderRadius: '4px' }}
                        onImageDrag={({ position }) => {
                            setPosition(position);
                        }}
                        zoom={sliderValue}
                    >
                        <Image src={url || placeholder} />
                        <Overlay
                            style={{
                                width: 300,
                                height: 300,
                                backgroundColor: 'transparent',
                                outline: '1000px solid',
                                outlineColor: 'rgba(0, 0, 0, 0.5)',
                                border: '5px solid white',
                                borderRadius: '50%',
                            }}
                        />
                    </Editor>
                    <Slider
                        value={sliderValue}
                        onChange={val => setSliderValue(val)}
                        min={1}
                        max={2}
                        step={0.1}
                    />
                </VStack>
            </VStack>
        </Center>
    );
}

export default App;
