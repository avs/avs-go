[![npm](https://img.shields.io/npm/v/avs-go.svg)](https://www.npmjs.com/package/avs-go)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/avs-go)

# AVS Go

Polymer 3.0 based elements for AVS.

## Install
```
npm install avs-go
```

## Usage
```html
<html>
  <head>
    <script type="module" src="avs-go/avs-go-dataviz.js"></script>
  </head>
  <body>
    <avs-go-dataviz id="mydataviz"
       url="<url-to-avs-go-server>"
       scene-properties='{
         "libraryKey":"MyGoScene"
       }'
       renderer-properties='{
         "type":"<IMAGE|SVG|THREEJS>"
       }'
    >
    </avs-go-dataviz>
  </body>
</html>
```

## License
Apache-2.0