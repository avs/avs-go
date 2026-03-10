import './App.css'
import { AvsGoDataViz } from '@avs/go-react/src/AvsGoDataViz';

function App() {
  return (
    <>
	  <AvsGoDataViz
	    style={{ position: "absolute" }}
	    url='data/scene.json'
		urlLoadJsonFile
		renderer='THREEJS'
		transformEnable
	  />
	  <h2>Read static ThreeJS JSON file with AvsGoDataViz React Component</h2>
    </>
  )
}

export default App
