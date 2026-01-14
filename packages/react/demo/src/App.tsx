import './App.css'
import { AvsGoDataViz } from '@avs/go-react/src/AvsGoDataViz';

function App() {
  return (
    <div style={{width: '100vw', height: '100vh'}}>
	  <AvsGoDataViz
	    url='hydrogen.json'
		urlLoadJsonFile
		renderer='THREEJS'
		transformEnable
	  />
    </div>
  )
}

export default App
