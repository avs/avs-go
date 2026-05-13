import './App.css'
import { AvsGoDataViz, type Renderer } from '@avs/go-react';

function App() {
  return (
    <>
	  <AvsGoDataViz
	    style={{ position: "absolute" }}
	    url='data/scene.json'
		urlLoadJsonFile
				renderer={Renderer.THREEJS }
		transformEnable
	  />
	  <h2>Read static ThreeJS JSON file with AvsGoDataViz React Component</h2>
    </>
  )
}

export default App
