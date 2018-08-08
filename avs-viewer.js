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
import * as AVSThree from './avsthree.js';

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
       * * `url`: Fully qualified URL to an instance of AVS Web Components server.
       *
       * * `sceneLibraryKey`: Name of the scene on the server to acquire.
       *
       * @type {{url: string, sceneLibraryKey: string}}
       */
      sceneProperties: {
        type: Object
      },
      /**
       * * `renderer`: `IMAGE`, `SVG` or `THREEJS`
       *
       * * `backgroundColor`: Default background color, can be overridden using CSS.
       *
       * @type {{renderer: string, backgroundColor: string}}
       */
      viewerProperties: {
        type: Object
      },
      /**
       * Only used when `viewerProperties.renderer` is `THREEJS`
       *
       * * `level`: `CELL`, `CELL_SET` or `SCENE_NODE`
       *
       * * `depth`: `ALL` or `CLOSEST`
       *
       * * `highlight`: Control whether to highlight selected geometry.
       *
       * * `highlightColor`: Color to highlight with if `highlight` is true.
       *
       * @type {{level: string, depth: string, highlight: boolean, highlightColor: string}}
       */
      hoverProperties: {
        type: Object        
      },
      /**
       * * `level`: `CELL`, `CELL_SET` or `SCENE_NODE`
       *
       * * `depth`: `ALL` or `CLOSEST`
       *
       * * `type`: `POINT` or `RECTANGLE`
       *
       * * `highlight`: Control whether to highlight selected geometry.
       *
       * * `highlightColor`: Color to highlight with if `highlight` is true.
       *
       * * `evaluateServer`: Override the default picking location (if `viewerProperties.renderer` is `THREEJS` default is false, otherwise true).
       *
       * @type {{level: string, depth: string, type: string, highlight: boolean, highlightColor: string, evaluateServer: boolean}}
       */
      pickProperties: {
        type: Object
      },
      /**
       * Only used when `viewerProperties.renderer` is `THREEJS`
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
       * Only used when `viewerProperties.renderer` is `THREEJS`
       *
       * * `sceneNode`: Name of the scene node to attach a TransformInteractor to.
       *
       * @type {{sceneNode: string}}
       */
      transformProperties: {
        type: Object
      },
      /**
       * User properties passed directly to the server.
       */
      userProperties: {
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

    // Scene properties 
    if (this.sceneProperties == undefined) {
      this.sceneProperties = {};
    }
    var request = Object.assign(this.sceneProperties, {width:this.width, height:this.height});

    // Viewer Properties
    if (this.viewerProperties == undefined) {
      this.viewerProperties = {};
    }
    request = Object.assign(request, {"viewerProperties":this.viewerProperties});

    // User Properties
    if (this.userProperties == undefined) {
      this.userProperties = {};
    }
    request = Object.assign(request, {"userProperties":this.userProperties});

    // Text properties
    if (this.defaultTextProperties == undefined) {
      this.defaultTextProperties = {};
    }
    request = Object.assign(request, {"defaultTextProperties":this.defaultTextProperties});

    if (this.defaultTextProperties.color == undefined) {
      var textColor = window.getComputedStyle(this, null).getPropertyValue("color");
      request.defaultTextProperties = Object.assign(request.defaultTextProperties, {"color":textColor});
    }

    if (this.defaultTextProperties.fontFamily == undefined) {
      var fontFamily = window.getComputedStyle(this, null).getPropertyValue("font-family");
      fontFamily = fontFamily.replace(/['"]+/g, '');
      request.defaultTextProperties = Object.assign(request.defaultTextProperties, {"fontFamily":fontFamily});
    }

    // Line Properties
    if (this.defaultLineProperties == undefined) {
      this.defaultLineProperties = {};
    }
    request = Object.assign(request, {"defaultLineProperties":this.defaultLineProperties});

    if (this.defaultLineProperties.color == undefined) {
      var lineColor = window.getComputedStyle(this, null).getPropertyValue("color");
      request.defaultLineProperties = Object.assign(request.defaultLineProperties, {"color":lineColor});
    }

    // Stream Properties
    if (this.streamProperties != undefined) {
      this.streamProperties.chunkId = undefined;
      this.streamProperties.streamUpdate = function( count ) {
         console.log("Stream count = " + count);
         scope.__viewer.render();
      }
      request = Object.assign(request, {"streamProperties":this.streamProperties});
    }

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

    if (this.pickProperties != undefined && this.pickProperties.type === 'RECTANGLE') {
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
    if (this.viewerProperties.renderer === 'THREEJS') {
      var scope = this;
      var chartRequest = this.buildChartRequest();
      this.__viewer.loadGeometryAsUrl({
        url: this.sceneProperties.url, 
        success: function() {
          scope.__viewer.render();
        },	
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
    if (this.viewerProperties.renderer === 'THREEJS') {
      this.__viewer.render();
    }
    if (this.pickProperties != undefined && this.pickProperties.type === 'RECTANGLE') {
      this.$$("#rectCanvas").width = this.width;
      this.$$("#rectCanvas").height = this.height;
    }
  }
       
  /**
   * @param obj
   */
  handleResponse(obj) {
    if (this.viewerProperties.renderer === 'IMAGE') {
      var responseJSON = null;
      try {
        responseJSON = JSON.parse(obj.detail.response);
      } catch (_) {
        console.warn('Failed to parse JSON requested from ' + this.sceneProperties.url);
        return;
      }

      if (responseJSON == undefined || responseJSON == null) {
        console.log("Null JSON response");
        return;
      }

      this.$$("#sceneImage").src = responseJSON.imageurl;
      if (responseJSON.imagemap != undefined) {
//        this.$$("#sceneImageMap").innerHTML = decodeURIComponent(responseJSON.imagemap.replace(/\+/g, '%20'));
      }
      if (responseJSON.selectionInfo != undefined) {
        console.log("selection info = " + responseJSON.selectionInfo);
      }
    }
    else if (this.viewerProperties.renderer === 'SVG') {
      this.$.viewerDiv.innerHTML = obj.detail.response;
    }
  }

  /**
   * @param e
   */
  handleTap(e) {
	var rect = this.$.viewerDiv.getBoundingClientRect();
    var x = Math.round(e.detail.x - rect.left);
    var y = Math.round(e.detail.y - rect.top);

    this.pickProperties.mouseX=[x];
    this.pickProperties.mouseY=[y];

    var customEvent = {detail: {x: x, y: y, selected: []}};

    if (this.viewerProperties.renderer !== 'THREEJS' || (this.pickProperties.evaluateServer !== undefined && this.pickProperties.evaluateServer === true)) {

      this.$.getScene.body = this.buildChartRequest();
      this.$.getScene.body = Object.assign(this.$.getScene.body, {"pickProperties":this.pickProperties});
      this.$.getScene.url = this.sceneProperties.url;
      this.$.getScene.generateRequest();
     
    } else if (this.viewerProperties.renderer === 'THREEJS') {

      this.__viewer.setPickDepth( this.getPickDepth(this.pickProperties.depth) );
      this.__viewer.pickLevel = this.getPickLevel(this.pickProperties.level);
      this.__viewer.setPickRay( x, y );
      this.__viewer.pick();

      customEvent.detail.selected = this.__viewer.selectionList.list;

      if (this.pickProperties.highlight) {
        this.__viewer.highlightColor.set( this.pickProperties.highlightColor );
        this.__viewer.highlightObjects( this.__viewer.selectionList );
      }

    }

    this.dispatchEvent(new CustomEvent('pick', customEvent));
  }

  /**
   * @param e
   */
  handleTrack(e) {
	var rect = this.$.viewerDiv.getBoundingClientRect();
    var x = Math.round(e.detail.x - rect.left);
    var y = Math.round(e.detail.y - rect.top);
    var clampX = Math.max(0, Math.min(x, this.width));
    var clampY = Math.max(0, Math.min(y, this.height));
    var startX = x - e.detail.dx;
    var startY = y - e.detail.dy;

    switch(e.detail.state) {
      case 'start':
        break;

      case 'track':
        this.__rectCtx.clearRect(0,0,this.width,this.height);
        this.rectangleStyle();
        this.__rectCtx.strokeRect(startX, startY, clampX - startX, clampY - startY);
        break;

      case 'end':
        this.__rectCtx.clearRect(0,0,this.width,this.height);

        this.pickProperties.mouseX=[startX, clampX];
        this.pickProperties.mouseY=[startY, clampY];

        var customEvent = {detail: {x: x, y: y, selected: []}};

        if (this.viewerProperties.renderer !== 'THREEJS' || (this.pickProperties.evaluateServer !== undefined && this.pickProperties.evaluateServer === true)) {

          this.$.getScene.body = this.buildChartRequest();
          this.$.getScene.body = Object.assign(this.$.getScene.body, {"pickProperties":this.pickProperties});
          this.$.getScene.url = this.sceneProperties.url;
          this.$.getScene.generateRequest();
       
        } else if (this.viewerProperties.renderer === 'THREEJS') {

          this.__viewer.setPickDepth( this.getPickDepth(this.pickProperties.depth) );
          this.__viewer.pickLevel = this.getPickLevel(this.pickProperties.level);
          this.__viewer.setPickRectangle( startX, startY, clampX, clampY );
          this.__viewer.pick();

          customEvent.detail.selected = this.__viewer.selectionList.list;

          if (this.pickProperties.highlight) {
            this.__viewer.highlightColor.set( this.pickProperties.highlightColor );
            this.__viewer.highlightObjects( this.__viewer.selectionList );
          }

        }

        this.dispatchEvent(new CustomEvent('pick', customEvent));
        break;
    }
  }

  /**
   * @param e
   */
  handleMouseMove(e) {
    var rect = this.$.viewerDiv.getBoundingClientRect();
    var x = Math.round(e.pageX - rect.left);
    var y = Math.round(e.pageY - rect.top);
    var clampX = Math.max(0, Math.min(x, this.width));
    var clampY = Math.max(0, Math.min(y, this.height));

    var customEvent = {detail: {x: clampX, y: clampY, selected: []}};

    if (this.viewerProperties.renderer === 'THREEJS' && this.hoverProperties.evaluateServer !== true) {

      this.__viewer.setPickDepth( this.getPickDepth(this.hoverProperties.depth) );
      this.__viewer.pickLevel = this.getPickLevel(this.hoverProperties.level);
      this.__viewer.setPickRay( clampX, clampY );
      this.__viewer.pick();

      customEvent.detail.selected = this.__viewer.selectionList.list;

      if (this.hoverProperties.highlight) {
        this.__viewer.highlightColor.set( this.hoverProperties.highlightColor );
        this.__viewer.highlightObjects( this.__viewer.selectionList );
      }

    }

    this.dispatchEvent(new CustomEvent('hover', customEvent));
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
    if (this.viewerProperties.renderer === 'THREEJS') {
      if (this.transformProperties != undefined && this.transformProperties.sceneNode != undefined) {
        var ti = new AVSThree.TransformInteractor( this.__viewer.domElement );
        ti.setSceneNodeByName( this.transformProperties.sceneNode );  // the name of the workbox component set on the server
        this.__viewer.addInteractor( ti );  
      }
    }
  }

  initViewer() {
    if (this.viewerProperties.renderer === 'THREEJS') {
      if (this.__viewer != undefined) {  
        this.$.viewerDiv.removeChild( this.__viewer.domElement );
      }
            
      this.__viewer = new AVSThree.Viewer();
      this.$.viewerDiv.appendChild( this.__viewer.domElement );

      // Check if the user has requested a specific renderer
      var rendererId = 'avsDefaultWebGLRenderer';
      if (this.viewerProperties.webGLRendererId !== undefined) {
    	  rendererId = this.viewerProperties.webGLRendererId;
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
    else if (this.viewerProperties.renderer === 'IMAGE') {
      var imageElem = document.createElement("img");
      imageElem.setAttribute("id", "sceneImage");
      // imageElem.setAttribute("usemap", "#sceneImageMap");
      this.$.viewerDiv.appendChild(imageElem);

      // var mapElem = document.createElement("map");
      // mapElem.setAttribute("id", "sceneImageMap");
      // mapElem.setAttribute("name", "sceneImageMap");
      // this.$.viewerDiv.appendChild(mapElem);
    }

    // Setup pick interactor
    if (this.pickProperties != undefined) {
      if (this.pickProperties.type === 'RECTANGLE') {
        var canvasElem = document.createElement("canvas");
        canvasElem.setAttribute("id", "rectCanvas");
        this.$.viewerDiv.appendChild(canvasElem);

        this.__rectCtx = canvasElem.getContext('2d');

        Gestures.addListener(this, 'track', this.handleTrack.bind(this));
      }
      else {
        Gestures.addListener(this, 'tap', this.handleTap.bind(this));
      }
    }
  }
}

window.customElements.define('avs-viewer', AvsViewer);
