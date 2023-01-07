import { Center, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { Editor, Image, Overlay } from './Editor';
import { Position } from './types';

const placeholder = 'https://i.imgur.com/yPZNinD.jpg';

function App() {
    const [position, setPosition] = useState<Position>({ x: null, y: null });

    const [url, setUrl] = useState<string>('');

    return (
        <Center bgColor='#242424' boxSize='100%'>
            <VStack>
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
                <Editor
                    style={{ width: 700, height: 500, borderRadius: '4px' }}
                    onImageDrag={({ position }) => {
                        setPosition(position);
                    }}
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
            </VStack>
        </Center>
    );
}

export default App;
