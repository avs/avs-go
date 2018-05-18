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
import {afterNextRender} from '../@polymer/polymer/lib/utils/render-status.js';
import '../@polymer/iron-ajax/iron-ajax.js';
import {AvsRenderer} from './avs-renderer.js';
import * as AVSThree from './avsthree.js';

/**
 * `avs-viewer`
 * AVS Viewer
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

      <div on-click="handleClick" on-mousedown="handleOnMouseDown" on-mousemove="handleOnMouseMove" on-mouseup="handleOnMouseUp" id="viewerDiv">
      </div>
    `;
  }

  static get properties() {
    return {

      /** Viewer width in pixels. */
      width: {
        type: Number,
      },
      /** Viewer height in pixels. */
      height: {
        type: Number,
      },

      /** Scene properties. */
      sceneProperties: {
        type: Object
      },
      /** Viewer properties. */
      viewerProperties: {
        type: Object
      },
      /** Hover properties. */
      hoverProperties: {
        type: Object        
      },
      /** Pick properties. */
      pickProperties: {
        type: Object
      },
      /** Stream properties. */
      streamProperties: {
        type: Object
      },
      /** Transform properties. */
      transformProperties: {
        type: Object
      },
      /** Default line properties. */
      defaultLineProperties: {
        type: Object
      },
      /** Default text properties. */
      defaultTextProperties: {
        type: Object
      },

      /** Resize threshold (percent) to determine when the update is performed on the client or the server. */
      resizeThreshold: {
        type: Object,
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
      __drag: {
        type: Boolean,
        value: false
      },
      /** */
      __rect: {
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
  drawRect() {
    this.rectangleStyle();
    this.__rectCtx.strokeRect(this.__rect.startX, this.__rect.startY, this.__rect.w, this.__rect.h);
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

    // Background color
    if ( this.viewerProperties.backgroundColor == undefined) {
      var backgroundColor = window.getComputedStyle(this, null).getPropertyValue("background-color");
      request.viewerProperties = Object.assign(request.viewerProperties, {"backgroundColor":backgroundColor} );
    }

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
      fontFamily = fontFamily.replace('"', '');
      request.defaultTextProperties = Object.assign(request.defaultTextProperties, {"fontFamily":fontFamily});
    }

    // Line Properties
    if (this.defaultLineProperties != undefined) {
      request = Object.assign(request, {"defaultLineProperties":this.defaultLineProperties});
    }

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
    var boundingRect = this.$.viewerDiv.getBoundingClientRect();
    if (boundingRect.width < this.lowResizeWidth ||
        boundingRect.width > this.highResizeWidth ||
        boundingRect.height < this.lowResizeHeight ||
        boundingRect.height > this.highResizeHeight) {

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
    var boundingRect = this.$.viewerDiv.getBoundingClientRect();
    this.width = boundingRect.width;
    if (this.width == 0) {
      this.width = 200;  // default
    }
        
    if (this.height == 0 || this.height == undefined) {
      var height = boundingRect.height;
          
      if (height > 0) {
        this.height = height;
      }
      else {
        this.height = 200;  // default
      }
    }
    if (this.viewerProperties.renderer !== 'THREEJS' && this.pickProperties != undefined && this.pickProperties.type === 'RECTANGLE') {
      this.$$("#rectCanvas").width = this.width;
      this.$$("#rectCanvas").height = this.height;
    }

    this.lowResizeWidth = (100 - this.resizeThreshold) / 100 * this.width;
    this.highResizeWidth = (100 + this.resizeThreshold) / 100 * this.width;
    this.lowResizeHeight = (100 - this.resizeThreshold) / 100 * this.height;
    this.highResizeHeight = (100 + this.resizeThreshold) / 100 * this.height;
  } 

  /**
   * 
   */
  updateViewer() {
    this.updateStyles();
    this.updateSize();
    if (this.viewerProperties.renderer === 'THREEJS') {
      this.__viewer.setSize(this.width, this.height);
      var scope = this;
      var chartRequest = this.buildChartRequest();
      if (this.viewerProperties.backgroundColor != undefined) {
        this.__viewer.setBackgroundColor(this.viewerProperties.backgroundColor);
      }
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
  }

  /**
   * 
   */
  updateViewerClient() {
    if (this.viewerProperties.renderer === 'THREEJS') {
      var boundingRect = this.$.viewerDiv.getBoundingClientRect();
      this.__viewer.setSize(boundingRect.width, boundingRect.height);
      this.__viewer.render();
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
   * @param event
   */
  handleOnMouseDown(event) {
    if (this.viewerProperties.renderer != 'THREEJS') {
      if (this.pickProperties != undefined && this.pickProperties.type === 'RECTANGLE' && this.pickProperties.active) {
          this.__rect.startX = event.pageX - this.$.viewerDiv.offsetLeft;
          this.__rect.startY = event.pageY - this.$.viewerDiv.offsetTop;
          this.__rect.startEvent = event;
          this.__drag = true;
      }
    }
  }

  /**
   * @param event
   */
  handleOnMouseMove(event) {
    if (this.viewerProperties.renderer != 'THREEJS') {
      if (this.__drag && this.pickProperties != undefined && this.pickProperties.type === 'RECTANGLE' && this.pickProperties.active) {
        this.__rect.w = (event.pageX - this.$.viewerDiv.offsetLeft) - this.__rect.startX;
        this.__rect.h = (event.pageY - this.$.viewerDiv.offsetTop) - this.__rect.startY ;
        this.__rectCtx.clearRect(0,0,this.$$("#rectCanvas").width,this.$$("#rectCanvas").height);
        this.drawRect();
      }
    }
  }

  /**
   * @param event
   */
  handleOnMouseUp(event) {
    if (this.viewerProperties.renderer != 'THREEJS') {
      if (this.pickProperties != undefined && this.pickProperties.type === 'RECTANGLE' && this.pickProperties.active) {
         this.__rect.finishX = event.pageX - this.$.viewerDiv.offsetLeft;
         this.__rect.finishY = event.pageY - this.$.viewerDiv.offsetTop;
         this.__drag = false;
         this.__rectCtx.clearRect(0,0,this.$$("#rectCanvas").width,this.$$("#rectCanvas").height);
 
          this.$.getScene.body= this.buildChartRequest();
          this.pickProperties.mouseX=[event.offsetX - this.__rect.w, event.offsetX];
          this.pickProperties.mouseY=[event.offsetY - this.__rect.h, event.offsetY];
          console.log("mouse x1 = " + this.pickProperties.mouseX[0] + ", " + this.pickProperties.mouseX[1]);
          console.log("mouse y1 = " + this.pickProperties.mouseY[0] + ", " + this.pickProperties.mouseY[1]);
          this.$.getScene.body = Object.assign(this.$.getScene.body, {"pickProperties":this.pickProperties});
          this.$.getScene.url = this.sceneProperties.url;
          this.$.getScene.generateRequest();
      }
      else if (this.pickProperties !== undefined) {
          this.$.getScene.body= this.buildChartRequest();
          this.pickProperties.mouseX=[event.offsetX];
          this.pickProperties.mouseY=[event.offsetY];
          this.$.getScene.body = Object.assign(this.$.getScene.body, {"pickProperties":this.pickProperties});
          this.$.getScene.url = this.sceneProperties.url;
          this.$.getScene.generateRequest();

          var selectedObject = {"pickInfo":"went to server to get new scene"};
          this.dispatchEvent(new CustomEvent('onPick', selectedObject));        
      }
    }
  }

  /**
   * @param event
   */
  handleClick(event) {
    // if (this.pickProperties == undefined) return;
    // this.$.getScene.body= this.buildChartRequest();
    // this.pickProperties.mouseX=[event.offsetX];
    // this.pickProperties.mouseY=[event.offsetY];
    // this.$.getScene.body = Object.assign(this.$.getScene.body, {"pickProperties":this.pickProperties});
    // this.$.getScene.url = this.sceneProperties.url;
    // this.$.getScene.generateRequest();
    // var selectedObject = {"pickInfo":"went to server to get new scene"};
    // this.dispatchEvent(new CustomEvent('onPick', selectedObject));        
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
      this.updateViewer();

      if (this.__initialized != true) {  
        this.addEventListener('iron-resize', this.onResize);
        this.__initialized = true;
      }
    }); 

    if (this.viewerProperties.renderer === 'THREEJS') {
      if (this.__viewer != undefined) {  
        this.$.viewerDiv.removeChild( this.__viewer.getCanvas() );
      }
            
      this.__viewer = new AVSThree.Viewer();
      this.$.viewerDiv.appendChild( this.__viewer.getCanvas() );

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
  
      // Setup transform interactor
      if (this.transformProperties != undefined && this.transformProperties.sceneNode != undefined) {
        var ti = new AVSThree.TransformInteractor( this.__viewer.container );
        ti.setSceneNodeByName( this.transformProperties.sceneNode );  // the name of the workbox component set on the server
        this.__viewer.addInteractor( ti );  
      }

      // Setup hover interactor
      if (this.hoverProperties != undefined) {
            
        this.hoverProperties.depth = this.getPickDepth(this.hoverProperties.depth);
        this.hoverProperties.level = this.getPickLevel(this.hoverProperties.level);

        var scope = this;
        this.hoverProperties.onHover = function( selectedObject ) {
          if (selectedObject != undefined) {
            scope.dispatchEvent(new CustomEvent('onHover', selectedObject));        
          }
        }

        this.__viewer.addHoverListener(this.hoverProperties);
      }

      // Setup pick interactor
      if (this.pickProperties != undefined) {
            
        this.pickProperties.depth = this.getPickDepth(this.pickProperties.depth);
        this.pickProperties.level = this.getPickLevel(this.pickProperties.level);

        var scope = this;
        this.pickProperties.onPick = function( selectedObject ) {
          if (selectedObject != undefined) {
            scope.dispatchEvent(new CustomEvent('onPick', selectedObject));        
          }
        }

        if (this.pickProperties.type === 'RECTANGLE') {
          this.__viewer.addRectanglePickListener(this.pickProperties);
        }
        else {
          this.__viewer.addPickListener(this.pickProperties);
        }
      }

    }

    else if (this.viewerProperties.renderer === 'IMAGE') {
      var imageElem = document.createElement("img");
      imageElem.setAttribute("id", "sceneImage");
      imageElem.setAttribute("usemap", "#sceneImageMap");
      this.$.viewerDiv.appendChild(imageElem);

      // var mapElem = document.createElement("map");
      // mapElem.setAttribute("id", "sceneImageMap");
      // mapElem.setAttribute("name", "sceneImageMap");
      // this.$.viewerDiv.appendChild(mapElem);
    }

    if (this.viewerProperties.renderer === 'IMAGE' || this.viewerProperties.renderer === 'SVG') {
          
      if (this.pickProperties != undefined && this.pickProperties.type === 'RECTANGLE') {
        var canvasElem = document.createElement("canvas");
        canvasElem.setAttribute("id", "rectCanvas");
        this.$.viewerDiv.appendChild(canvasElem);

        this.pickProperties.active = true;
        this.__rectCtx = canvasElem.getContext('2d');
        this.__rect = {};
      }

    }
  }
}

window.customElements.define('avs-viewer', AvsViewer);
