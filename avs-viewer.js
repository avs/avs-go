/*
avs-viewer.js
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
import '../@polymer/iron-ajax/iron-ajax.js';
import {AvsRenderer} from './avs-renderer.js';
import * as AVSThree from './avs-three.js';

/**
 * `avs-viewer` is a Polymer 3.0 element which uses `iron-ajax` to acquire
 * a scene from the specified URL as either an image, SVG or three.js.
 *
 * @customElement
 * @polymer
 */
class AvsViewer extends mixinBehaviors([IronResizableBehavior, GestureEventListeners], PolymerElement) {
  static get template() {
    return html`
      <style>
        #viewerDiv {
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

      <iron-ajax id="getScene"
        url=[[sceneUrl]]
        handle-as="text"
        method="post"
        content-type="application/json"
        on-response="handleResponse"
        >
      </iron-ajax>

      <div id="viewerDiv"></div>
    `;
  }

  static get properties() {
    return {

      /**
       * Viewer width in pixels.
       */
      width: {
        type: Number,
      },
      /**
       * Viewer height in pixels.
       */
      height: {
        type: Number,
      },

      /**
       * * `dataLibraryKey`: Name of the data on the server to acquire.
       *
       * @type {{dataLibraryKey: string}}
       */
      dataProperties: {
        type: Object
      },
      /**
       * * `url`: Fully qualified URL to an instance of AVS Go server.
       *
       * * `sceneLibraryKey`: Name of the scene on the server to acquire.
       *
       * @type {{url: string, sceneLibraryKey: string}}
       */
      sceneProperties: {
        type: Object
      },
      /**
       * * `rendererType`: `IMAGE`, `SVG` or `THREEJS`
       *
       * * `backgroundColor`: Default background color, can be overridden using CSS.
       *
       * @type {{rendererType: string, backgroundColor: string}}
       */
      rendererProperties: {
        type: Object
      },
      /**
       * Only used when `rendererProperties.rendererType` is `THREEJS`
       *
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
       * @type {{level: string, depth: string, selectionInfo: boolean, highlight: boolean, highlightColor: string}}
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
       * * `processOnServer`: Override the default picking location (if `rendererProperties.rendererType` is `THREEJS` default is false, otherwise true).
       *
       * * `updateScene`: Control whether to update the scene due to the tap (default true, must be enabled to perform highlight).
       *
       * @type {{level: string, depth: string, selectionInfo: boolean, highlight: boolean, highlightColor: string, processOnServer: boolean, updateScene: boolean}}
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
       * * `processOnServer`: Override the default picking location (if `rendererProperties.rendererType` is `THREEJS` default is false, otherwise true).
       *
       * * `updateScene`: Control whether to update the scene due to the tap (default true, must be enabled to perform highlight).
       *
       * @type {{level: string, depth: string, selectionInfo: boolean, highlight: boolean, highlightColor: string, processOnServer: boolean, updateScene: boolean}}
       */
      trackProperties: {
        type: Object
      },
      /**
       * Only used when `rendererProperties.rendererType` is `THREEJS`
       *
       * * `type`: `CHUNK` or `OBOE_STREAM`
       *
       * * `chunkSizeFirstUpdate`: Number of objects in the first chunk when type is `CHUNK`
       *
       * * `chunkSize`: Number of objects in remaining chunks when type is `CHUNK`
       *
       * @type {{type: string, chunkSizeFirstUpdate: number, chunkSize: number}}
       */
      streamProperties: {
        type: Object
      },
      /**
       * Only used when `rendererProperties.rendererType` is `THREEJS`
       *
       * * `sceneNode`: Name of the scene node to attach a TransformInteractor to.
       *
       * @type {{sceneNode: string}}
       */
      transformProperties: {
        type: Object
      },
      /**
       * User properties for the data passed directly to the server.
       */
      dataUserProperties: {
        type: Object
      },
      /**
       * User properties for the scene passed directly to the server.
       */
      sceneUserProperties: {
        type: Object
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
       * * `style`: `solid`, `dash`, `dot` or `dashdot`
       *
       * @type {{visible: boolean, color: string, width: number, opacity: number, style: string}}
       */
      defaultLineProperties: {
        type: Object
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
       * * `fontStyle`: `normal` or `italic`
       *
       * * `fontWeight`: `normal` or `bold`
       *
       * * `justification`: `start`, `middle` or `end`
       *
       * * `horizontalAlignment`: `left`, `center` or `right`
       *
       * * `verticalAlignment`: `top`, `middle`, `bottom` or `baseline`
       *
       * @type {{color: string, angle: number, size: number, fontFamily: string, fontStyle: string, fontWeight: string, justification: string, horizontalAlignment: string, verticalAlignment: string}}
       */
      defaultTextProperties: {
        type: Object
      },

      /**
       * Resize threshold (percent) to determine when the update is performed on the client or the server.
       */
      resizeThreshold: {
        type: Number,
        value: 10
      },

      /** */
      __initialized: {
        type: Boolean
      },
      /** */
      __viewer: {
        type: Object
      },
      /** */
      __rectCtx: {
        type: Object
      },
    }
  }

  constructor() {
    super();
  }

  /**
   * 
   */
  rectangleStyle() {
    // default line style and color
    this.__rectCtx.setLineDash([3]);
    this.__rectCtx.strokeStyle="#ff0000";
  }

  /**
   * 
   */
  buildChartRequest() {
    var scope = this;
    var request = {};

    // Data properties 
    if (this.dataProperties == undefined) {
        this.dataProperties = {};
    }

    // Data user Properties
    if (this.dataUserProperties == undefined) {
      this.dataUserProperties = {};
    }
    var dataPropertiesRequest = Object.assign(this.dataProperties, {"userProperties":this.dataUserProperties});
    
    // Renderer Properties
    if (this.rendererProperties == undefined) {
      this.rendererProperties = {};
    }
    var rendererPropertiesRequest = Object.assign(this.rendererProperties, {width:this.width, height:this.height});

    // Stream Properties
    if (this.streamProperties != undefined) {
      this.streamProperties.chunkId = undefined;
      this.streamProperties.streamUpdate = function( count ) {
         console.log("Stream count = " + count);
         scope.__viewer.render();
      }
      rendererPropertiesRequest = Object.assign(rendererPropertiesRequest, {"streamProperties":this.streamProperties});
    }

    // Scene properties 
    if (this.sceneProperties == undefined) {
      this.sceneProperties = {};
    }

    // Scene user Properties
    if (this.sceneUserProperties == undefined) {
      this.sceneUserProperties = {};
    }
    var scenePropertiesRequest = Object.assign(this.sceneProperties, {"userProperties":this.sceneUserProperties});

    // Text properties
    if (this.defaultTextProperties == undefined) {
      this.defaultTextProperties = {};
    }
    scenePropertiesRequest = Object.assign(scenePropertiesRequest, {"defaultTextProperties":this.defaultTextProperties});

    if (this.defaultTextProperties.color == undefined) {
      var textColor = window.getComputedStyle(this, null).getPropertyValue("color");
      scenePropertiesRequest.defaultTextProperties = Object.assign(scenePropertiesRequest.defaultTextProperties, {"color":textColor});
    }

    if (this.defaultTextProperties.fontFamily == undefined) {
      var fontFamily = window.getComputedStyle(this, null).getPropertyValue("font-family");
      fontFamily = fontFamily.replace(/['"]+/g, '');
      scenePropertiesRequest.defaultTextProperties = Object.assign(scenePropertiesRequest.defaultTextProperties, {"fontFamily":fontFamily});
    }

    // Line Properties
    if (this.defaultLineProperties == undefined) {
      this.defaultLineProperties = {};
    }
    scenePropertiesRequest = Object.assign(scenePropertiesRequest, {"defaultLineProperties":this.defaultLineProperties});

    if (this.defaultLineProperties.color == undefined) {
      var lineColor = window.getComputedStyle(this, null).getPropertyValue("color");
      scenePropertiesRequest.defaultLineProperties = Object.assign(scenePropertiesRequest.defaultLineProperties, {"color":lineColor});
    }

    request = Object.assign(request, {"dataRequest":dataPropertiesRequest});
    request = Object.assign(request, {"rendererRequest":rendererPropertiesRequest});
    request = Object.assign(request, {"sceneRequest":scenePropertiesRequest});

    return request;
  }
                
  /**
   * 
   */
  onResize() {
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
    if (this.rendererProperties.rendererType === 'THREEJS') {
      var scope = this;
      var chartRequest = this.buildChartRequest();
      this.__viewer.loadGeometryAsUrl({
        url: this.sceneProperties.url, 
        jsonRequest: chartRequest
      });
    }
    else {
      this.$.getScene.body= this.buildChartRequest();
      this.$.getScene.url = this.sceneProperties.url;
      this.$.getScene.generateRequest();
    }

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
    if (this.rendererProperties.rendererType === 'THREEJS') {
      this.__viewer.render();
    }
    if (this.trackProperties !== undefined) {
      this.$$("#rectCanvas").width = this.width;
      this.$$("#rectCanvas").height = this.height;
    }
  }
       
  /**
   * @param obj
   */
  handleResponse(obj) {
	var responseJSON = null;
	try {
	  responseJSON = JSON.parse(obj.detail.response);
	} catch (_) {
	  console.warn('Failed to parse JSON requested from ' + this.sceneProperties.url);
	  return;
	}
	
	if (responseJSON === undefined || responseJSON === null) {
	  console.log("Null JSON response");
	  return;
	}
	
	if (responseJSON.selectionInfo !== undefined) {
	  var infoEvent = {detail: responseJSON.selectionInfo};
	  this.dispatchEvent(new CustomEvent('avs-selection-info', infoEvent));
	}
	
	if (responseJSON.imageurl !== undefined) {
	
	  this.$$("#sceneImage").src = responseJSON.imageurl;
	  if (responseJSON.imagemap !== undefined) {
	//        this.$$("#sceneImageMap").innerHTML = decodeURIComponent(responseJSON.imagemap.replace(/\+/g, '%20'));
	  }
	}
	else if (responseJSON.svg !== undefined) {
	  this.$.viewerDiv.innerHTML = decodeURIComponent(responseJSON.svg.replace(/\+/g, '%20'));
	}
  }

  /**
   * @param e
   */
  handleTap(e) {
	var pick = this.getPickCoords(e.detail.x, e.detail.y);

    var tapEvent = {detail: {x: pick.x, y: pick.y, sourceEvent: e}};
    this.dispatchEvent(new CustomEvent('avs-tap', tapEvent));
    
    var pickProperties = this.createPickProperties(this.tapProperties, 'tap');
    pickProperties.x=pick.x;
    pickProperties.y=pick.y;
    
    this.processPick( pickProperties );
  }
  
  /**
   * @param e
   */
  handleTrack(e) {
	var rect = this.getPickRectangleCoords(e);
	
    var trackEvent = {detail: {state: e.detail.state, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, sourceEvent: e}};
    this.dispatchEvent(new CustomEvent('avs-track', trackEvent));

    switch(e.detail.state) {
      case 'start':
        break;

      case 'track':
        this.__rectCtx.clearRect(0,0,this.width,this.height);
        this.rectangleStyle();
        this.__rectCtx.strokeRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
        break;

      case 'end':
        this.__rectCtx.clearRect(0,0,this.width,this.height);

        var pickProperties = this.createPickProperties(this.trackProperties, 'track');
        pickProperties.left=rect.left;
        pickProperties.right=rect.right;
        pickProperties.top=rect.top;
        pickProperties.bottom=rect.bottom;
        
        this.processPick( pickProperties );
        break;
    }
  }
  
  /**
   * @param e
   */
  handleMouseMove(e) {
	var pick = this.getPickCoords(e.pageX, e.pageY);
	  
    var hoverEvent = {detail: {x: pick.x, y: pick.y, sourceEvent: e.detail.sourceEvent}};
    this.dispatchEvent(new CustomEvent('avs-hover', hoverEvent));
    
    var pickProperties = this.createPickProperties(this.hoverProperties, 'hover');
    pickProperties.x=pick.x;
    pickProperties.y=pick.y;
    
    this.processPick( pickProperties );
  }
  
  getPickCoords(x, y) {
	var rect = this.$.viewerDiv.getBoundingClientRect();
	var x = Math.round(x - rect.left);
	var y = Math.round(y - rect.top);
	var clampX = Math.max(0, Math.min(x, this.width));
	var clampY = Math.max(0, Math.min(y, this.height));
	
	return {x:clampX, y:clampY};
  }
  
  getPickRectangleCoords(e) {
	var rect = this.$.viewerDiv.getBoundingClientRect();
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

  processPick( pickProperties ) {
    if (this.rendererProperties.rendererType === 'THREEJS') {

      // Server side processing
      if (pickProperties.processOnServer === true) {
     
        var scope = this;
        var chartRequest = this.buildChartRequest();
        chartRequest.rendererRequest = Object.assign(chartRequest.rendererRequest, {"pickProperties":pickProperties});
        this.__viewer.loadGeometryAsUrl({
          url: this.sceneProperties.url, 
          success: function(selectionInfo) {
            if (selectionInfo !== undefined) {
              var infoEvent = {detail: selectionInfo};
              scope.dispatchEvent(new CustomEvent('avs-selection-info', infoEvent));
            }
          },	
          jsonRequest: chartRequest
        });
      } 
    
      // Client side processing
      else {

        this.__viewer.setPickDepth( this.getPickDepth(pickProperties.depth) );
        this.__viewer.pickLevel = this.getPickLevel(pickProperties.level);
        if (pickProperties.type === 'track') {
          this.__viewer.setPickRectangle( pickProperties.left, pickProperties.top, pickProperties.right, pickProperties.bottom );
        }
        else {
       	  this.__viewer.setPickRay( pickProperties.x, pickProperties.y );
        }
        this.__viewer.pick();
      
        if (pickProperties.selectionInfo == true) {
    	  var infoEvent = {detail: {mode: pickProperties.type, x: pickProperties.x, y: pickProperties.y, selected: this.__viewer.selectionList.list}};
    	  this.dispatchEvent(new CustomEvent('avs-selection-info', infoEvent));
        }
      
        if (pickProperties.highlight) {
          this.__viewer.highlightColor.set( pickProperties.highlightColor );
          this.__viewer.highlightObjects( this.__viewer.selectionList );
        }
      }
    }
    else {

      this.$.getScene.body = this.buildChartRequest();
      this.$.getScene.body.rendererRequest = Object.assign(this.$.getScene.body.rendererRequest, {"pickProperties":pickProperties});
      this.$.getScene.url = this.sceneProperties.url;
      this.$.getScene.generateRequest();

    } 
  }

  /**
   * @param strValue
   */
  getPickDepth( strValue ) {
    if (strValue == "ALL") {
      return AVSThree.PickDepthEnum.All;
    }
    else {
      return AVSThree.PickDepthEnum.Closest;
    } 
  }

  /**
   * @param strValue
   */
  getPickLevel( strValue) {
    if (strValue == "CELL_SET") {
      return AVSThree.PickLevelEnum.CellSet;
    }
    else if (strValue == "SCENE_NODE") {
      return AVSThree.PickLevelEnum.SceneNode;
    }
    else {
      return AVSThree.PickLevelEnum.Cell;
    }
  }

  /**
   * @param source
   * @param type
   */
  createPickProperties(source, type) {
	  var pickProperties = {};
	  pickProperties.selectionInfo = source.selectionInfo;
	  pickProperties.highlight = source.highlight;
	  pickProperties.highlightColor = source.highlightColor;
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

    // Hack to make sure all CSS and layout has been processed 
    afterNextRender(this, function() {
      if (this.__initialized != true) {  
        this.initViewer();
        this.updateViewer();
        this.initInteractors();

        this.addEventListener('iron-resize', this.onResize);
        this.__initialized = true;
      }
    }); 
  }

  // Add interactors after canvas has been initialized and sized
  initInteractors() {
    // Setup transform interactor
    if (this.rendererProperties.rendererType === 'THREEJS') {
      if (this.transformProperties != undefined && this.transformProperties.sceneNode != undefined) {
        var ti = new AVSThree.TransformInteractor( this.__viewer.domElement );
        ti.setSceneNodeByName( this.transformProperties.sceneNode );  // the name of the workbox component set on the server
        this.__viewer.addInteractor( ti );  
      }
    }
  }

  initViewer() {
    if (this.rendererProperties.rendererType === 'THREEJS') {
      if (this.__viewer != undefined) {  
        this.$.viewerDiv.removeChild( this.__viewer.domElement );
      }
            
      this.__viewer = new AVSThree.Viewer();
      this.$.viewerDiv.appendChild( this.__viewer.domElement );

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
        console.log("create new webGL renderer = " + rendererId);
      }
      else {
        console.log("reference existing webGL renderer = " + rendererId);
      }
      this.__viewer.setWebGLRenderer( renderer.getWebGLRenderer() );

      // Setup hover interactor
      if (this.hoverProperties != undefined) {
        this.addEventListener('mousemove', this.handleMouseMove);
      }
    }
    else if (this.rendererProperties.rendererType === 'IMAGE') {
      var imageElem = document.createElement("img");
      imageElem.setAttribute("id", "sceneImage");
      // imageElem.setAttribute("usemap", "#sceneImageMap");
      this.$.viewerDiv.appendChild(imageElem);

      // var mapElem = document.createElement("map");
      // mapElem.setAttribute("id", "sceneImageMap");
      // mapElem.setAttribute("name", "sceneImageMap");
      // this.$.viewerDiv.appendChild(mapElem);
    }

    // Setup tap interactor
    if (this.tapProperties !== undefined) {
      Gestures.addListener(this, 'tap', this.handleTap.bind(this));
    }

    // Setup track interactor
    if (this.trackProperties !== undefined) {
      var canvasElem = document.createElement("canvas");
      canvasElem.setAttribute("id", "rectCanvas");
      this.$.viewerDiv.appendChild(canvasElem);

      this.__rectCtx = canvasElem.getContext('2d');

      Gestures.addListener(this, 'track', this.handleTrack.bind(this));
    }
  }
}

window.customElements.define('avs-viewer', AvsViewer);
