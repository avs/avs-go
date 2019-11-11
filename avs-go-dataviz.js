/*
avs-go-dataviz.js
Copyright 2018 Advanced Visual Systems Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

This product includes software developed at
Advanced Visual Systems Inc. (http://www.avs.com)
*/

import {PolymerElement, html} from '../@polymer/polymer/polymer-element.js';
import {mixinBehaviors} from '../@polymer/polymer/lib/legacy/class.js';
import {IronResizableBehavior} from '../@polymer/iron-resizable-behavior/iron-resizable-behavior.js';
import {GestureEventListeners} from '../@polymer/polymer/lib/mixins/gesture-event-listeners.js';
import * as Gestures from '../@polymer/polymer/lib/utils/gestures.js';
import {afterNextRender} from '../@polymer/polymer/lib/utils/render-status.js';
import {AvsRenderer} from './avs-renderer.js';
import * as AVSThree from './avs-three.js';
import {AvsHttpMixin} from './avs-http-mixin.js';
import {AvsStreamMixin} from './avs-stream-mixin.js';
import {AvsDataSourceMixin} from './avs-data-source-mixin.js';

/**
 * `avs-go-dataviz` is a Polymer 3.0 element which uses `AvsHttpMixin` to acquire
 * a scene from the specified URL as either an image, SVG or three.js.
 *
 * @customElement
 * @polymer
 */
class AvsGoDataViz extends AvsDataSourceMixin(AvsStreamMixin(AvsHttpMixin(mixinBehaviors([IronResizableBehavior, GestureEventListeners], PolymerElement)))) {
  static get template() {
    return html`
      <style>
        #dataVizDiv {
          width: 100%;
          height: 100%;
          position: relative;
        }   
        #sceneImage {
          width:100%; height:100%; 
          position:absolute; top:0px; left:0px;
        }   
        #rectCanvas {
          width:100%; height:100%; 
          overflow: hidden;
          position:absolute; top:0px; left:0px;
        }   
      </style>
      ${super.template}
      <div id="dataVizDiv"></div>
    `;
  }

  static get properties() {
    return {

      /**
       * * `libraryKey`: Name of the scene on the server to acquire.
       *
       * @type {{libraryKey: string}}
       */
      sceneProperties: {
        type: Object,
        value: function () {
          return {};
        }
      },
      /**
       * * `type`: `IMAGE`, `IMAGEURL`, `SVG` or `THREEJS`
       *
       * * `backgroundColor`: Default background color, can be overridden using CSS.
       *
       * @type {{type: string, backgroundColor: string}}
       */
      rendererProperties: {
        type: Object,
        value: function () {
          return {};
        }
      },
      /**
       * * `level`: `CELL`, `CELL_SET` or `SCENE_NODE`
       *
       * * `depth`: `ALL` or `CLOSEST`
       *
       * * `selectionInfo`: Control whether to return the selection info via avs-selection-info event.
       *
       * * `highlight`: Control whether to highlight selected geometry.
       *
       * * `highlightColor`: Color to highlight with if `highlight` is true.
       *
       * * `highlightLayer`: Draw highlighted objects in a separate layer in front. Faster but can create undesirable results, default is false. `rendererProperties.type` must be `THREEJS` and scene must be inside a 2D viewport.
       *
       * * `processOnServer`: Override the default picking location (if `rendererProperties.type` is `THREEJS` default is false, otherwise true).
       *
       * * `updateScene`: Control whether to update the scene due to the hover (default true, must be enabled to perform highlight).
       *
       * @type {{level: string, depth: string, selectionInfo: boolean, highlight: boolean, highlightColor: string, highlightLayer: boolean, processOnServer: boolean, updateScene: boolean}}
       */
      hoverProperties: {
        type: Object
      },
      /**
       * * `level`: `CELL`, `CELL_SET` or `SCENE_NODE`
       *
       * * `depth`: `ALL` or `CLOSEST`
       *
       * * `selectionInfo`: Control whether to return the selection info via avs-selection-info event.
       *
       * * `highlight`: Control whether to highlight selected geometry.
       *
       * * `highlightColor`: Color to highlight with if `highlight` is true.
       *
       * * `highlightLayer`: Draw highlighted objects in a separate layer in front. Faster but can create undesirable results, default is false. `rendererProperties.type` must be `THREEJS` and scene must be inside a 2D viewport.
       *
       * * `processOnServer`: Override the default picking location (if `rendererProperties.type` is `THREEJS` default is false, otherwise true).
       *
       * * `updateScene`: Control whether to update the scene due to the tap (default true, must be enabled to perform highlight).
       *
       * @type {{level: string, depth: string, selectionInfo: boolean, highlight: boolean, highlightColor: string, highlightLayer: boolean, processOnServer: boolean, updateScene: boolean}}
       */
      tapProperties: {
        type: Object
      },
      /**
       * * `level`: `CELL`, `CELL_SET` or `SCENE_NODE`
       *
       * * `depth`: `ALL` or `CLOSEST`
       *
       * * `selectionInfo`: Control whether to return the selection info via avs-selection-info event.
       *
       * * `highlight`: Control whether to highlight selected geometry.
       *
       * * `highlightColor`: Color to highlight with if `highlight` is true.
       *
       * * `highlightLayer`: Draw highlighted objects in a separate layer in front. Faster but can create undesirable results, default is false. `rendererProperties.type` must be `THREEJS` and scene must be inside a 2D viewport.
       *
       * * `processOnServer`: Override the default picking location (if `rendererProperties.type` is `THREEJS` default is false, otherwise true).
       *
       * * `updateScene`: Control whether to update the scene due to the track (default true, must be enabled to perform highlight).
       *
       * @type {{level: string, depth: string, selectionInfo: boolean, highlight: boolean, highlightColor: string, highlightLayer: boolean, processOnServer: boolean, updateScene: boolean}}
       */
      trackProperties: {
        type: Object
      },
      /**
       * Only used when `rendererProperties.type` is `THREEJS`
       *
       * Create an interactor for transforming a particular scene object on the client.
       * Use the addInteractor() method on the server to select which object to transform.
       *
       * * `enableRotate`: Control whether the interactor can rotate the object (default is true).
       *
       * * `enableZoom`: Control whether the interactor can zoom the object (default is true).
       *
       * * `enablePan`: Control whether the interactor can pan the object (default is true).
       *
       * * `twistAngle`: Set the starting twist angle of the object in degrees.
       *
       * * `tiltAngle`: Set the starting tilt angle of the object in degrees.
       *
       * * `scale`: Set the starting scale of the object.
       *
       * @type {{enableRotate: boolean, enableZoom: boolean, enablePan: boolean, twistAngle: number, tiltAngle: number, scale: number}}
       */
      transformProperties: {
        type: Object
      },
      /**
       * Only used when `rendererProperties.type` is `THREEJS`
       *
       * * `widthScale`: Horizontal zoom factor (number should be greater than 1.0)
       *
       * * `heightScale`: Vertical zoom factor (number should be greater than 1.0)
       *
       * @type {{widthScale: number, heightScale: number}}
       */
      domainTransformProperties: {
        type: Object
      },
      /**
       * User properties for the scene passed directly to the server.
       */
      sceneUserProperties: {
        type: Object,
        value: function () {
          return {};
        }
      },
      /**
       * * `visible`: control whether lines are visible
       *
       * * `color`: line color
       *
       * * `width`: line width in pixels
       *
       * * `opacity`: between 0.0 (fully transparent) and 1.0 (fully opaque)
       *
       * * `style`: `SOLID`, `DASH`, `DOT` or `DASH_DOT`
       *
       * @type {{visible: boolean, color: string, width: number, opacity: number, style: string}}
       */
      defaultLineProperties: {
        type: Object,
        value: function () {
          return {};
        }
      },
      /**
       * * `color`: text color
       *
       * * `angle`: text angle (in degrees between 0.0 and 360.0)
       *
       * * `size`: text size in points
       *
       * * `fontFamily`: font name
       *
       * * `fontStyle`: `NORMAL` or `ITALIC`
       *
       * * `fontWeight`: `NORMAL` or `BOLD`
       *
       * * `justification`: `START`, `MIDDLE` or `END`
       *
       * * `horizontalAlignment`: `LEFT`, `CENTER` or `RIGHT`
       *
       * * `verticalAlignment`: `TOP`, `MIDDLE`, `BOTTOM` or `BASELINE`
       *
       * @type {{color: string, angle: number, size: number, fontFamily: string, fontStyle: string, fontWeight: string, justification: string, horizontalAlignment: string, verticalAlignment: string}}
       */
      defaultTextProperties: {
        type: Object,
        value: function () {
          return {};
        }
      },

      /**
       * Resize threshold (percent) to determine when the update is performed on the client or the server.
       */
      resizeThreshold: {
        type: Number,
        value: 10
      }
    }
  }

  /**
   * Default line style and color
   */
  _rectangleStyle() {
    this.rectCtx.setLineDash([3]);
    this.rectCtx.strokeStyle="#ff0000";
  }

  /**
   * 
   */
  _assembleRequest() {
    var request = {};

    // Renderer Properties
    var rendererProperties = Object.assign(this.rendererProperties, {width:this.width, height:this.height});

    // Transform Properties
    if (this.transformProperties !== undefined) {
      // Transform interactor not yet created, create a matrix using the starting twist angle, tilt angle and scale from transformProperties
      if (this.transformInteractor === undefined) {
        var twist = this.transformProperties.twistAngle !== undefined ? this.transformProperties.twistAngle * Math.PI / 180 : 0;
        var tilt = this.transformProperties.tiltAngle !== undefined ? this.transformProperties.tiltAngle * Math.PI / 180 : 0;
        var scale = this.transformProperties.scale !== undefined ? this.transformProperties.scale : 1;

        var sinTW = Math.sin(twist);
        var cosTW = Math.cos(twist);
        var sinTI = Math.sin(tilt);
        var cosTI = Math.cos(tilt);

        var matrix = [ scale * cosTW, 0,             cosTI * sinTW,         0,
                       0,             scale * cosTI, -sinTI,                0,
                       -sinTW,        cosTW * sinTI, scale * cosTW * cosTI, 0,
                       0,             0,             0,                     1 ];
        rendererProperties = Object.assign(rendererProperties, {transformMatrix:matrix});
      }
      // Send the transform matrix directly from the transform interactor, we may have transformed locally since the last request
      else {
        rendererProperties = Object.assign(rendererProperties, {transformMatrix:this.transformInteractor.object.matrix.elements});
      }
    }

    // Domain Transform Properties
    if (this.domainTransformProperties !== undefined) {
      var width = this.width;
      if (this.domainTransformProperties.widthScale !== undefined) {
        width = Math.max(this.width, Math.round(width * this.domainTransformProperties.widthScale));
      }
      var height = this.height;
      if (this.domainTransformProperties.heightScale !== undefined) {
        height = Math.max(this.height, Math.round(height * this.domainTransformProperties.heightScale));
      }
      rendererProperties = Object.assign(rendererProperties, {width:width, height:height});
    }

    // Scene properties 
    var sceneProperties = Object.assign(this.sceneProperties, {"userProperties":this.sceneUserProperties});
    
    // Css Properties
    var cssColor = window.getComputedStyle(this, null).getPropertyValue("color");
    var cssFontFamily = window.getComputedStyle(this, null).getPropertyValue("font-family");
    cssFontFamily = cssFontFamily.replace(/['"]+/g, '');
    var cssProperties = {color:cssColor, fontFamily:cssFontFamily};
    sceneProperties = Object.assign(sceneProperties, {"cssProperties":cssProperties});

    // Default text properties
    sceneProperties = Object.assign(sceneProperties, {"defaultTextProperties":this.defaultTextProperties});

    // Default line properties
    sceneProperties = Object.assign(sceneProperties, {"defaultLineProperties":this.defaultLineProperties});

    request = Object.assign(request, {"rendererProperties":rendererProperties});
    request = Object.assign(request, {"sceneProperties":sceneProperties});
    
    // Add dataSource properties from the mixin
    this._addDataSourceProperties(request);

	// Add stream properties from the mixin
	this._addStreamProperties(rendererProperties);

    return request;
  }
                
  /**
   * 
   */
  _onResize() {
    if (this.clientWidth < this.lowResizeWidth ||
        this.clientWidth > this.highResizeWidth ||
        this.clientHeight < this.lowResizeHeight ||
        this.clientHeight > this.highResizeHeight) {

      this.updateViewer();
    }
    else {
      this.updateViewerClient();
    }
  }
        
  /**
   * 
   */
  updateSize() {          
    this.width = this.clientWidth;
    if (this.width <= 0) {
      this.width = 200;  // default
    }
        
    this.height = this.clientHeight;
    if (this.height <= 0) {
      this.height = 200;  // default
    }

    if (this.trackProperties !== undefined) {
      this.$$("#rectCanvas").width = this.width;
      this.$$("#rectCanvas").height = this.height;
    }
  } 

  /**
   * 
   */
  updateViewer() {
    this.updateStyles();
    this.updateSize();

    // Use avs-http-mixin to send the request to the server
    var request = this._assembleRequest();
    this._httpRequest(request);

    this.lowResizeWidth = (100 - this.resizeThreshold) / 100 * this.width;
    this.highResizeWidth = (100 + this.resizeThreshold) / 100 * this.width;
    this.lowResizeHeight = (100 - this.resizeThreshold) / 100 * this.height;
    this.highResizeHeight = (100 + this.resizeThreshold) / 100 * this.height;
  }

  /**
   * 
   */
  updateViewerClient() {
    this.updateSize();
    if (this.rendererProperties.type === 'THREEJS') {
      this.threeViewer.render();
    }
    if (this.trackProperties !== undefined) {
      this.$$("#rectCanvas").width = this.width;
      this.$$("#rectCanvas").height = this.height;
    }
  }
       
  /**
   * HTTP response handler.
   * @param json JSON parsed from HTTP response.
   */
  _handleHttpResponse(json) {
	if (json.selectionInfo !== undefined) {
	  var infoEvent = {detail: json.selectionInfo};
	  this.dispatchEvent(new CustomEvent('avs-selection-info', infoEvent));
	}
	
	if (json.image !== undefined) {
	
	  this.$$("#sceneImage").src = json.image;
	  if (json.imagemap !== undefined) {
	//        this.$$("#sceneImageMap").innerHTML = decodeURIComponent(json.imagemap.replace(/\+/g, '%20'));
	  }
	}
	else if (json.svg !== undefined) {
	  this.$.dataVizDiv.innerHTML = decodeURIComponent(json.svg.replace(/\+/g, '%20'));
	}
    else if (json.threejs !== undefined) {
      this.threeViewer.loadGeometryAsJson(json.threejs);
    }
    else if (json.chunkId !== undefined) {
//      this.threeViewer.clearGeometry();
      this.threeViewer.loadGeometryAsEvents(json);

      if (json.moreChunks === true) {
        this.streamProperties.chunkId = json.chunkId;
        this._httpRequest(this._assembleRequest());
      }
      else {
        this.streamProperties.chunkId = undefined;
      }
    }
  }

  /**
   * @param e
   */
  _handleTap(e) {
	var adjustedCoords = this._getAdjustedCoords(e.detail.x, e.detail.y);

    var tapEvent = {detail: {x: adjustedCoords.x, y: adjustedCoords.y, sourceEvent: e}};
    this.dispatchEvent(new CustomEvent('avs-tap', tapEvent));
    
    var pickProperties = this._createPickProperties(this.tapProperties, 'TAP');
    pickProperties.x = adjustedCoords.x;
    pickProperties.y = adjustedCoords.y;
    
    this._processPick( pickProperties );
  }
  
  /**
   * @param e
   */
  _handleTrack(e) {
	var adjustedCoords = this._getAdjustedRectangleCoords(e);
	
    var trackEvent = {detail: {state: e.detail.state, left: adjustedCoords.left, right: adjustedCoords.right, top: adjustedCoords.top, bottom: adjustedCoords.bottom, sourceEvent: e}};
    this.dispatchEvent(new CustomEvent('avs-track', trackEvent));

    switch(e.detail.state) {
      case 'start':
        break;

      case 'track':
        this.rectCtx.clearRect(0,0,this.width,this.height);
        this._rectangleStyle();
        this.rectCtx.strokeRect(adjustedCoords.left, adjustedCoords.top, adjustedCoords.right - adjustedCoords.left, adjustedCoords.bottom - adjustedCoords.top);
        break;

      case 'end':
        this.rectCtx.clearRect(0,0,this.width,this.height);

        var pickProperties = this._createPickProperties(this.trackProperties, 'TRACK');
        pickProperties.left = adjustedCoords.left;
        pickProperties.right = adjustedCoords.right;
        pickProperties.top = adjustedCoords.top;
        pickProperties.bottom = adjustedCoords.bottom;
        
        this._processPick( pickProperties );
        break;
    }
  }
  
  /**
   * @param e
   */
  _handleMouseMove(e) {
	var adjustedCoords = this._getAdjustedCoords(e.clientX, e.clientY);
	  
    var hoverEvent = {detail: {x: adjustedCoords.x, y: adjustedCoords.y, sourceEvent: e.detail.sourceEvent}};
    this.dispatchEvent(new CustomEvent('avs-hover', hoverEvent));
    
    var pickProperties = this._createPickProperties(this.hoverProperties, 'HOVER');
    pickProperties.x = adjustedCoords.x;
    pickProperties.y = adjustedCoords.y;
    
    this._processPick( pickProperties );
  }

  _getAdjustedCoords(x, y) {
	var rect = this.$.dataVizDiv.getBoundingClientRect();
	var x = Math.round(x - rect.left);
	var y = Math.round(y - rect.top);
	var clampX = Math.max(0, Math.min(x, this.width));
	var clampY = Math.max(0, Math.min(y, this.height));
	
	return {x:clampX, y:clampY};
  }
  
  _getAdjustedRectangleCoords(e) {
	var rect = this.$.dataVizDiv.getBoundingClientRect();
    var x = Math.round(e.detail.x - rect.left);
    var y = Math.round(e.detail.y - rect.top);
    var clampX = Math.max(0, Math.min(x, this.width));
    var clampY = Math.max(0, Math.min(y, this.height));
    var startX = x - e.detail.dx;
    var startY = y - e.detail.dy;
    
    var left = Math.min(startX, clampX);
    var right = Math.max(startX, clampX);
    var top = Math.min(startY, clampY);
    var bottom = Math.max(startY, clampY);

	return {left: left, right: right, top: top, bottom: bottom};
  }

  _processPick( pickProperties ) {
    if (this.rendererProperties.type === 'THREEJS' && pickProperties.processOnServer !== true) {

      // Client side pick processing
      this.threeViewer.setPickDepth( this._getPickDepth(pickProperties.depth) );
      if (pickProperties.type === 'TRACK') {
        this.threeViewer.setPickRectangle( pickProperties.left, pickProperties.top, pickProperties.right, pickProperties.bottom );
      }
      else {
   	    this.threeViewer.setPickRay( pickProperties.x, pickProperties.y );
      }
      this.threeViewer.pick();

      var selectionList = {};
      if (pickProperties.level === "CELL") {
        selectionList = this.threeViewer.getPickedCells();
      }
      else if (pickProperties.level === "CELL_SET") {
        selectionList = this.threeViewer.getPickedCellSets();
      }
      else {
        selectionList = this.threeViewer.getPickedSceneNodes();
      }

      if (pickProperties.selectionInfo) {
        var infoEvent = {detail: {mode: pickProperties.type}};
        if (pickProperties.type === 'TRACK') {
          infoEvent.detail.left   = pickProperties.left;
          infoEvent.detail.top    = pickProperties.top;
          infoEvent.detail.right  = pickProperties.right;
          infoEvent.detail.bottom = pickProperties.bottom;
        }
        else {
          infoEvent.detail.x = pickProperties.x;
          infoEvent.detail.y = pickProperties.y;
        }
        infoEvent.detail.selected =  this.threeViewer.getSelectionInfo(selectionList);

    	this.dispatchEvent(new CustomEvent('avs-selection-info', infoEvent));
      }
      
      if (pickProperties.updateScene !== false && pickProperties.highlight) {
        this.threeViewer.highlightColor.set( pickProperties.highlightColor );
        this.threeViewer.highlightObjects( selectionList, pickProperties.highlightLayer );
      }
    }
    else {

      // Server side pick processing
      var request = this._assembleRequest();
      request.rendererProperties = Object.assign(request.rendererProperties, {"pickProperties":pickProperties});
      this._httpRequest(request);

    } 
  }

  /**
   * @param strValue
   */
  _getPickDepth( strValue ) {
    if (strValue == "ALL") {
      return AVSThree.PickDepthEnum.All;
    }
    else {
      return AVSThree.PickDepthEnum.Closest;
    } 
  }

  /**
   * @param source
   * @param type
   */
  _createPickProperties(source, type) {
	  var pickProperties = {};
	  pickProperties.selectionInfo = source.selectionInfo;
	  pickProperties.highlight = source.highlight;
	  pickProperties.highlightColor = source.highlightColor;
	  pickProperties.highlightLayer = source.highlightLayer;
	  pickProperties.depth = source.depth;
	  pickProperties.level = source.level;
	  pickProperties.processOnServer = source.processOnServer;
	  pickProperties.updateScene = source.updateScene;
	  pickProperties.type = type;
	  
	  return pickProperties;
  }

  /**
   * 
   */
  connectedCallback() {
    super.connectedCallback();

    // Make sure all CSS and layout has been processed 
    afterNextRender(this, function() {
      if (this.initialized !== true) {  
        this._initViewer();
        this.updateViewer();
        this._initInteractors();

        this.addEventListener('iron-resize', this._onResize);
        this.initialized = true;
      }
    }); 
  }

  // Add interactors after canvas has been initialized and sized
  _initInteractors() {
    // Setup transform interactor
    if (this.rendererProperties.type === 'THREEJS') {
      if (this.transformProperties !== undefined) {
        this.transformInteractor = new AVSThree.TransformInteractor();
        this.threeViewer.addInteractor( this.transformInteractor );

        if (this.transformProperties.enableRotate === false) {
          this.transformInteractor.enableRotate = false;
        }
        if (this.transformProperties.enableZoom === false) {
          this.transformInteractor.enableZoom = false;
        }
        if (this.transformProperties.enablePan === false) {
          this.transformInteractor.enablePan = false;
        }
      }

      if (this.domainTransformProperties !== undefined) {
        this.domainTransformInteractor = new AVSThree.DomainTransformInteractor();
        this.threeViewer.addInteractor( this.domainTransformInteractor );

		this.domainTransformInteractor.widthScale = this.domainTransformProperties.widthScale;
		this.domainTransformInteractor.heightScale = this.domainTransformProperties.heightScale;
      }
    }
  }

  _initViewer() {
    if (this.rendererProperties.type === 'THREEJS') {
      if (this.threeViewer !== undefined) {  
        this.$.dataVizDiv.removeChild( this.threeViewer.domElement );
      }
            
      this.threeViewer = new AVSThree.Viewer();
      this.$.dataVizDiv.appendChild( this.threeViewer.domElement );

      // Check if the user has requested a specific renderer
      var rendererId = 'avsDefaultWebGLRenderer';
      if (this.rendererProperties.webGLRendererId !== undefined) {
    	  rendererId = this.rendererProperties.webGLRendererId;
      }

      // Search for renderer, if not found create one and save to the DOM
      var renderer = document.getElementById(rendererId);
      if (renderer === undefined || renderer === null) {
        renderer = new AvsRenderer();
        renderer.setAttribute('id', rendererId);
        document.body.appendChild(renderer);
//        console.log("create new webGL renderer = " + rendererId);
      }
      else {
//        console.log("reference existing webGL renderer = " + rendererId);
      }
      this.threeViewer.setWebGLRenderer( renderer.webGLRenderer );
    }
    else if (this.rendererProperties.type === 'IMAGE' || this.rendererProperties.type === 'IMAGEURL') {
      var imageElem = document.createElement("img");
      imageElem.setAttribute("id", "sceneImage");
      // imageElem.setAttribute("usemap", "#sceneImageMap");
      this.$.dataVizDiv.appendChild(imageElem);

      // var mapElem = document.createElement("map");
      // mapElem.setAttribute("id", "sceneImageMap");
      // mapElem.setAttribute("name", "sceneImageMap");
      // this.$.dataVizDiv.appendChild(mapElem);
    }

    // Setup tap interactor
    if (this.tapProperties !== undefined) {
      Gestures.addListener(this, 'tap', this._handleTap.bind(this));
    }

    // Setup track interactor
    if (this.trackProperties !== undefined) {
      var canvasElem = document.createElement("canvas");
      canvasElem.setAttribute("id", "rectCanvas");
      this.$.dataVizDiv.appendChild(canvasElem);

      this.rectCtx = canvasElem.getContext('2d');

      Gestures.addListener(this, 'track', this._handleTrack.bind(this));
    }

    // Setup hover interactor
    if (this.hoverProperties !== undefined) {
      this.addEventListener('mousemove', this._handleMouseMove);
      this.addEventListener('mouseout', this._handleMouseMove);
    }
  }
}

window.customElements.define('avs-go-dataviz', AvsGoDataViz);
