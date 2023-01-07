import { Center } from '@chakra-ui/react';
import { Editor, Image, Overlay } from './Editor';

function App() {
    return (
        <Center bgColor='#242424' boxSize='100%'>
            <Editor
                style={{ width: 700, height: 500, borderRadius: '4px' }}
                onImageDrag={position => {
                    console.log(position);
                }}
            >
                <Image src='https://i.imgur.com/yPZNinD.jpg' />
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
        </Center>
    );
}

export default App;
