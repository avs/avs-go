[![npm](https://img.shields.io/npm/v/@avs/go-react.svg)](https://www.npmjs.com/package/@avs/go-react)

# AVS/Go React

React wrapper for AVS/Go web components.

## Install
```
npm install @avs/go-react
```

## Usage
```jsx
import { AvsGoDataViz } from '@avs/go-react/src/AvsGoDataViz';

export function App() {
  return (
    <AvsGoDataViz
      url='<url-to-avs-go-server>'
      sceneName='MyGoScene'
      renderer='<THREEJS|SVG|IMAGE>'
    />
  );
}
```

## License
Apache-2.0