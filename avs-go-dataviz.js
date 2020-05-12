/**
 * @license
 * Copyright 2018 Advanced Visual Systems Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * This product includes software developed at
 * Advanced Visual Systems Inc. (http://www.avs.com)
 */

import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {IronResizableBehavior} from '@polymer/iron-resizable-behavior/iron-resizable-behavior.js';
import {GestureEventListeners} from '@polymer/polymer/lib/mixins/gesture-event-listeners.js';
import * as Gestures from '@polymer/polymer/lib/utils/gestures.js';
import {afterNextRender} from '@polymer/polymer/lib/utils/render-status.js';
import {AvsRenderer} from './avs-renderer.js';
import {Viewer, TransformInteractor, PanInteractor, PickDepthEnum} from './avs-three.module.min.js';
import {AvsHttpMixin} from './avs-http-mixin.js';
import {AvsStreamMixin} from './avs-stream-mixin.js';
import {AvsDataSourceMixin} from './avs-data-source-mixin.js';
import {LOGO} from './logo.js';

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
        :host {
          display:block;
          width:100%;
          height:100%;
          overflow:hidden;
        }
        #dataVizDiv {
          position:relative;
        }   
        #sceneImage {
          width:100%;
          height:100%;
          position:absolute;
          outline:none;
        }   
        #rectCanvas {
          position:absolute;
          top:0px;
          left:0px;
        }
        #spinnerDiv {
          position:absolute;
          left:50%;
          top:50%;
          transform:translate(-50%,-50%);
        }
        .spin {
          -webkit-animation:spin 1s ease-in-out infinite;
           -moz-animation:spin 1s ease-in-out infinite;
           animation:spin 1s ease-in-out infinite;
        }
        @-moz-keyframes spin { 100% { -moz-transform: rotate(360deg); } }
        @-webkit-keyframes spin { 100% { -webkit-transform: rotate(360deg); } }
        @keyframes spin { 100% { -webkit-transform: rotate(360deg); transform:rotate(360deg); } }
      </style>
      <div id="container"></div>
    `;
  }

  static get properties() {
    return {

      /**
       * The URL to an instance of AVS/Go server application or file.
       */
      url: {
        type: String
      },
      /**
       * Enables loading JSON from a file.
       */
      urlLoadJsonFile: {
        type: Boolean
      },
      /**
       * The name of the scene registered in the library map on the server.
       */
      sceneName: {
        type: String
      },
      /**
       * User properties for the scene passed directly to the server.
       */
      sceneUserProperties: {
        type: Object,
        value: {}
      },
      /**
       * The type of renderer to be used to display a scene: `IMAGE`, `IMAGEURL`, `SVG` or `THREEJS`
       */
      renderer: {
        type: String,
        value: "IMAGE"
      },
      /**
       * Resize threshold (percent) to determine when the update is performed on the client or the server.
       */
      resizeThreshold: {
        type: Number,
        value: 10
      },
      /**
       * Aspect ratio (w/h) of the viewer if it is unable to determine the height of its parent element.
       */
      aspectRatio: {
        type: Number,
        value: 1.777777
      },
      /**
       * Enables the tap event.
       */
      tapEnable: {
        type: Boolean
      },
      /**
       * The level of geometry within the scene to be modified by the tap event: `CELL`, `CELL_SET` or `SCENE_NODE`
       */
      tapLevel: {
        type: String
      },
      /**
       * The depth at which an object is selected: `ALL` or `CLOSEST`
       */
      tapDepth: {
        type: String
      },
      /**
       * Enables the avs-selection-info event.
       */
      tapSelectionInfoEnable: {
        type: Boolean
      },
      /**
       * Enables highlight of selected geometry in the scene.
       */
      tapHighlightEnable: {
        type: Boolean
      },
      /**
       * The color to used to highlight the selected objects in the scene.
       */
      tapHighlightColor: {
        type: String
      },
      /**
       * Enables drawing highlighted objects in front of all objects in the scene. This results in faster rendering in a 2D viewport when using the `THREEJS` renderer.
       */
      tapHighlightLayerEnable: {
        type: Boolean
      },
      /**
       * Enables the processing of tap events on the client. `THREEJS` only.
       */
      tapProcessEventOnClient: {
        type: Boolean
      },
      /**
       * Enables the track event.
       */
      trackEnable: {
        type: Boolean
      },
      /**
       * The level of geometry within the scene to be modified by the track event: `CELL`, `CELL_SET` or `SCENE_NODE`
       */
      trackLevel: {
        type: String
      },
      /**
       * The depth at which an object is selected: `ALL` or `CLOSEST`
       */
      trackDepth: {
        type: String
      },
      /**
       * Enables the avs-selection-info event.
       */
      trackSelectionInfoEnable: {
        type: Boolean
      },
      /**
       * Enables highlight of selected geometry in the scene.
       */
      trackHighlightEnable: {
        type: Boolean
      },
      /**
       * The color to used to highlight the selected objects in the scene.
       */
      trackHighlightColor: {
        type: String
      },
      /**
       * Enables drawing highlighted objects in front of all objects in the scene. This results in faster rendering in a 2D viewport when using the `THREEJS` renderer.
       */
      trackHighlightLayerEnable: {
        type: Boolean
      },
      /**
       * Enables the processing of track events on the client. `THREEJS` only.
       */
      trackProcessEventOnClient: {
        type: Boolean
      },
      /**
       * Enables the hover event.
       */
      hoverEnable: {
        type: Boolean
      },
      /**
       * The level of geometry within the scene to be modified by the hover event: `CELL`, `CELL_SET` or `SCENE_NODE`
       */
      hoverLevel: {
        type: String
      },
      /**
       * The depth at which an object is selected: `ALL` or `CLOSEST`
       */
      hoverDepth: {
        type: String
      },
      /**
       * Enables the avs-selection-info event.
       */
      hoverSelectionInfoEnable: {
        type: Boolean
      },
      /**
       * Enables highlight of selected geometry in the scene.
       */
      hoverHighlightEnable: {
        type: Boolean
      },
      /**
       * The color to used to highlight the selected objects in the scene.
       */
      hoverHighlightColor: {
        type: String
      },
      /**
       * Enables drawing highlighted objects in front of all objects in the scene. This results in faster rendering in a 2D viewport when using the `THREEJS` renderer.
       */
      hoverHighlightLayerEnable: {
        type: Boolean
      },
      /**
       * Enables the processing of hover events on the client. `THREEJS` only.
       */
      hoverProcessEventOnClient: {
        type: Boolean
      },
      /**
       * Enable the transform interactor. Only available when `renderer` is `THREEJS`
       *
       * Create an interactor for transforming a particular scene object on the client.
       * Use the addInteractor() method on the server to select which object to transform.
      */
      transformEnable: {
        type: Boolean
      },
      /**
       * Disables rotation of the scene.
       */
      transformRotateDisable: {
        type: Boolean
      },
      /**
       * Disables zooming of the scene.
       */
      transformZoomDisable: {
        type: Boolean
      },
      /**
       * Disables panning of the scene.
       */
      transformPanDisable: {
        type: Boolean
      },
      /**
       * The twist angle of the object in degrees.
       */
      transformTwistAngle: {
        type: Number
      },
      /**
       * The tilt angle of the object in degrees.
       */
      transformTiltAngle: {
        type: Number
      },
      /**
       * The scale of the object in percent.
       */
      transformScale: {
        type: Number
      },
      /**
       * Enable the pan interactor. Only available when `renderer` is `THREEJS`
       *
       * Create an interactor for panning an OpenViz domain (and its axes and charts) on the client.
       */
      panEnable: {
        type: Boolean
      },
      /**
       * The width zoom level in percent of the original scene greater than 100%
       */
      panWidthZoomLevel: {
        type: Number
      },
      /**
       * The height zoom level in percent of the original scene greater than 100%
       */
      panHeightZoomLevel: {
        type: Number
      },
      /**
       * Disables rendering of lines.
       */
      lineDisable: {
        type: Boolean
      },
      /**
       * The color of the line(s).
       */
      lineColor: {
        type: String
      },
      /**
       * The width of the line(s).
       */
      lineWidth: {
        type: Number
      },
      /**
       * The opacity of the line(s)
       */
      lineOpacity: {
        type: Number
      },
      /**
       * The line pattern presented as: `SOLID`, `DASH`, `DOT` or `DASH_DOT`
       */
      lineStyle: {
        type: String
      },
      /**
       * The color of the text.
       */
      textColor: {
        type: String
      },
      /**
       * The angle of the text in degrees.
       */
      textAngle: {
        type: Number
      },
      /**
       * The size of the text in points.
       */
      fontSize: {
        type: Number
      },
      /**
       * The font family name of the text.
       */
      fontFamily: {
        type: String
      },
      /**
       * The style of the font: `NORMAL` or `ITALIC`
       */
      fontStyle: {
        type: String
      },
      /**
       * The weight of the font: `NORMAL` or `BOLD`
       */
      fontWeight: {
        type: String
      },
      /**
       * The justification of text: `START`, `MIDDLE` or `END`
       */
      textJustification: {
        type: String
      },
      /**
       * The horizontal alignment of text: `LEFT`, `CENTER` or `RIGHT`
       */
      textHorizontalAlignment: {
        type: String
      },
      /**
       * The vertical alignment of text: `TOP`, `MIDDLE`, `BOTTOM` or `BASELINE`
       */
      textVerticalAlignment: {
        type: String
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
   * Assemble the model from our properties to send to the server.
   */
  _assembleModel() {
    if (this.sceneName === undefined) {
      this._logError( JSON.stringify( {"GoType":1, "error":"\'scene-name\' property must be set to the name of the scene registered in the library map on the server."} ) );
      return undefined;
    }

    var model = {sceneProperties:{}};

    model.sceneProperties.name = this.sceneName;
    if (this.sceneUserProperties !== undefined) {
      model.sceneProperties.userProperties = this.sceneUserProperties;
    }

    var rendererProperties = {width:this.width, height:this.height, type:this.renderer};
    model.rendererProperties = rendererProperties;

    // Transform Properties
    if (this.transformEnable) {
      // Transform interactor not yet created, create a matrix using the starting twist angle, tilt angle and scale from properties
      if (this.transformInteractor === undefined) {
        var twist = this.transformTwistAngle !== undefined ? this.transformTwistAngle * Math.PI / 180 : 0;
        var tilt = this.transformTiltAngle !== undefined ? this.transformTiltAngle * Math.PI / 180 : 0;
        var scale = this.transformScale !== undefined ? this.transformScale / 100.0 : 1.0;

        var sinTW = Math.sin(twist);
        var cosTW = Math.cos(twist);
        var sinTI = Math.sin(tilt);
        var cosTI = Math.cos(tilt);

        var matrix = [ cosTW * scale,  0,                     cosTI * sinTW * scale, 0,
                       0,              cosTI * scale,         -sinTI * scale,        0,
                       -sinTW * scale, cosTW * sinTI * scale, cosTW * cosTI * scale, 0,
                       0,              0,                     0,                     1 ];
        rendererProperties.transformMatrix = matrix;
      }
      // Send the transform matrix directly from the transform interactor, we may have transformed locally since the last request
      else {
        rendererProperties.transformMatrix = this.transformInteractor.object.matrix.elements;
      }
    }

    // Pan Properties
    if (this.panEnable && this.renderer === 'THREEJS') {
      var width = this.width;
      if (this.panWidthZoomLevel !== undefined) {
        width = Math.max(this.width, Math.round(width * this.panWidthZoomLevel / 100.0));
      }
      rendererProperties.width = width;

      var height = this.height;
      if (this.panHeightZoomLevel !== undefined) {
        height = Math.max(this.height, Math.round(height * this.panHeightZoomLevel / 100.0));
      }
      rendererProperties.height = height;
    }

    // Css Properties
    var cssColor = window.getComputedStyle(this, null).getPropertyValue("color");
    var cssFontFamily = window.getComputedStyle(this, null).getPropertyValue("font-family").replace(/['"]+/g, '');
    model.sceneProperties.cssProperties = {color:cssColor, fontFamily:cssFontFamily};

    // Default text properties
    var textProperties = {};
    if (this.textColor !== undefined) {
      textProperties.color = this.textColor;
    }
    if (this.textAngle !== undefined) {
      textProperties.angle = this.textAngle;
    }
    if (this.fontSize !== undefined) {
      textProperties.size = this.fontSize;
    }
    if (this.fontFamily !== undefined) {
      textProperties.fontFamily = this.fontFamily;
    }
    if (this.fontStyle !== undefined) {
      textProperties.fontStyle = this.fontStyle;
    }
    if (this.fontWeight !== undefined) {
      textProperties.fontWeight = this.fontWeight;
    }
    if (this.textJustification !== undefined) {
      textProperties.justification = this.textJustification;
    }
    if (this.textHorizontalAlignment !== undefined) {
      textProperties.horizontalAlignment = this.textHorizontalAlignment;
    }
    if (this.textVerticalAlignment !== undefined) {
      textProperties.verticalAlignment = this.textVerticalAlignment;
    }
    if (Object.keys(textProperties).length !== 0) {
      model.sceneProperties.defaultTextProperties = textProperties;
    }

    // Default line properties
    var lineProperties = {};
    if (this.lineColor !== undefined) {
      lineProperties.color = this.lineColor;
    }
    if (this.lineWidth !== undefined) {
      lineProperties.width = this.lineWidth;
    }
    if (this.lineOpacity !== undefined) {
      lineProperties.opacity = this.lineOpacity;
    }
    if (this.lineStyle !== undefined) {
      lineProperties.style = this.lineStyle;
    }
    if (Object.keys(lineProperties).length !== 0) {
      model.sceneProperties.defaultLineProperties = lineProperties;
    }

    this._addDataSourceProperties(model);

    if (this.renderer === 'THREEJS') {
	  this._addStreamProperties(rendererProperties);
    }

    return model;
  }

  /**
   * 
   */
  _onResize() {
    if (!this.urlLoadJsonFile && (this.clientWidth < this.lowResizeWidth ||
        this.clientWidth > this.highResizeWidth)) {

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
    // Get the width provided by our container
    this.width = this.clientWidth;
    if (this.width <= 0) {
      this.width = 200;  // fallback if clientWidth fails
    }

    // Get the height provided by our container
    this.height = this.clientHeight;
    if (this.height <= 0) {
      if (this.aspectRatio > 0.1) {
        // Use the aspect ratio if one is set
        this.height = this.width / this.aspectRatio;
      }
      else {
         this.height = 200; // fallback if clientHeight fails
      }
    }

    this.dataVizDiv.style.width = this.width + 'px';
    this.dataVizDiv.style.height = this.height + 'px';

    if (this.trackEnable) {
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

    this.lowResizeWidth = (100 - this.resizeThreshold) / 100 * this.width;
    this.highResizeWidth = (100 + this.resizeThreshold) / 100 * this.width;

    if (this.spinner === undefined) {
      this.spinnerDiv = document.createElement('div');
      this.spinnerDiv.id = 'spinnerDiv';
      this.dataVizDiv.appendChild(this.spinnerDiv);
      this.spinner = document.createElement('img');
      this.spinner.id = 'spinner';
      this.spinner.src = LOGO;
      this.spinnerDiv.appendChild(this.spinner);
    }
    this.spinner.style.display = 'block';
    if (this.url !== undefined) {
      this.spinner.className = 'spin';
    }

    // Use avs-http-mixin to send the model to the server
    if (this.urlLoadJsonFile) {
      this.chunkFile = 0;
      this._httpRequest(this.url, this._handleHttpResponse.bind(this), undefined, this._handleHttpError.bind(this));
    } else {
      var model = this._assembleModel();
      if (model !== undefined) {
        this._httpRequest(this.url, this._handleHttpResponse.bind(this), undefined, this._handleHttpError.bind(this), model);
      }
    }
  }

  /**
   *
   */
  _handleHttpError(event) {
    if (this.spinner !== undefined) {
      this.spinner.style.display = 'none';
    }
  }

  /**
   * 
   */
  updateViewerClient() {
    this.updateSize();
    if (this.renderer === 'THREEJS') {
      this.threeViewer.render(true);
    }
  }

  /**
   *
   */
  clear() {
    if (this.renderer === 'THREEJS') {
      this.threeViewer.clearGeometry();
      this.threeViewer.render();
    }
    else if (this.renderer === 'SVG') {
      var el = this.dataVizDiv;
      while (el.firstChild) el.removeChild(el.firstChild);
    }
    else {
      this.$$("#sceneImage").src = 'data:,';
    }
  }

  /**
   *
   */
  hide() {
    if (this.$.container.hasChildNodes()) {
      this.$.container.removeChild(this.dataVizDiv);
    }
  }

  /**
   *
   */
  unhide() {
    if (!this.$.container.hasChildNodes()) {
      this.$.container.appendChild(this.dataVizDiv);
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

    if (json.sceneInfo !== undefined) {
      var sceneEvent = {detail: json.sceneInfo};
      this.dispatchEvent(new CustomEvent('avs-scene-info', sceneEvent));
    }

	if (json.image !== undefined) {
	
	  this.$$("#sceneImage").src = json.image;
	  if (json.imagemap !== undefined) {
	//        this.$$("#sceneImageMap").innerHTML = decodeURIComponent(json.imagemap.replace(/\+/g, '%20'));
	  }
	}
	else if (json.svg !== undefined) {
	  this.dataVizDiv.innerHTML = decodeURIComponent(json.svg.replace(/\+/g, '%20'));
	}
    else if (json.threejs !== undefined) {
      this.threeViewer.loadGeometryAsJson(json.threejs);
    }
    else if (json.chunkId !== undefined) {
      this.threeViewer.loadGeometryAsEvents(json);

      if (json.moreChunks === true) {
        if (this.urlLoadJsonFile) {
          this.chunkFile++;
          this._httpRequest(this.url + '.' + this.chunkFile, this._handleHttpResponse.bind(this), undefined, this._handleHttpError.bind(this));
        }
        else {
          var model = this._assembleModel();
          if (model !== undefined) {
            model.rendererProperties.streamProperties.chunkId = json.chunkId;
            this._httpRequest(this.url, this._handleHttpResponse.bind(this), undefined, this._handleHttpError.bind(this), model);
          }
        }
      }
    }
    else if (this.urlLoadJsonFile) {
      this.threeViewer.loadGeometryAsJson(json);
    }

    if (this.spinner !== undefined) {
      this.spinner.style.display = 'none';
    }
  }

  /**
   * @param e
   */
  _handleTap(e) {
	var adjustedCoords = this._getAdjustedCoords(e.detail.x, e.detail.y);

    var tapEvent = {detail: {x: adjustedCoords.x, y: adjustedCoords.y, sourceEvent: e}};
    this.dispatchEvent(new CustomEvent('avs-tap', tapEvent));

    var pickProperties = {type:"TAP", x:adjustedCoords.x, y:adjustedCoords.y};

	if (this.tapLevel !== undefined) pickProperties.level = this.tapLevel;
	if (this.tapDepth !== undefined) pickProperties.depth = this.tapDepth;
	if (this.tapSelectionInfoEnable) pickProperties.selectionInfo = true;
	if (this.tapHighlightEnable) pickProperties.highlight = true;
	if (this.tapHighlightColor !== undefined) pickProperties.highlightColor = this.tapHighlightColor;
	if (this.tapHighlightLayerEnable) pickProperties.highlightLayer = true;

    this._processPick( pickProperties, this.tapProcessEventOnClient );
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

        var pickProperties = {type:"TRACK"};
        pickProperties.left = adjustedCoords.left;
        pickProperties.right = adjustedCoords.right;
        pickProperties.top = adjustedCoords.top;
        pickProperties.bottom = adjustedCoords.bottom;

        if (this.trackLevel !== undefined) pickProperties.level = this.trackLevel;
        if (this.trackDepth !== undefined) pickProperties.depth = this.trackDepth;
        if (this.trackSelectionInfoEnable) pickProperties.selectionInfo = true;
        if (this.trackHighlightEnable) pickProperties.highlight = true;
        if (this.trackHighlightColor !== undefined) pickProperties.highlightColor = this.trackHighlightColor;
        if (this.trackHighlightLayerEnable) pickProperties.highlightLayer = true;

        this._processPick( pickProperties, this.trackProcessEventOnClient );
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

    var pickProperties = {type:"HOVER", x:adjustedCoords.x, y:adjustedCoords.y};

	if (this.hoverLevel !== undefined) pickProperties.level = this.hoverLevel;
	if (this.hoverDepth !== undefined) pickProperties.depth = this.hoverDepth;
	if (this.hoverSelectionInfoEnable) pickProperties.selectionInfo = true;
	if (this.hoverHighlightEnable) pickProperties.highlight = true;
	if (this.hoverHighlightColor !== undefined) pickProperties.highlightColor = this.hoverHighlightColor;
	if (this.hoverHighlightLayerEnable) pickProperties.highlightLayer = true;

    this._processPick( pickProperties, this.hoverProcessEventOnClient );
  }

  _getAdjustedCoords(x, y) {
	var rect = this.dataVizDiv.getBoundingClientRect();
	var x = Math.round(x - rect.left);
	var y = Math.round(y - rect.top);
	var clampX = Math.max(0, Math.min(x, this.width));
	var clampY = Math.max(0, Math.min(y, this.height));
	
	return {x:clampX, y:clampY};
  }
  
  _getAdjustedRectangleCoords(e) {
	var rect = this.dataVizDiv.getBoundingClientRect();
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

  _processPick( pickProperties, processEventOnClient ) {
    if (this.renderer === 'THREEJS' && processEventOnClient) {

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
      
      if (pickProperties.highlight) {
        this.threeViewer.highlightColor.set( pickProperties.highlightColor );
        this.threeViewer.highlightObjects( selectionList, pickProperties.highlightLayer );
      }
    }
    else {

      // Server side pick processing
      var model = this._assembleModel();
      if (model !== undefined) {
        model.rendererProperties.pickProperties = pickProperties;
        this._httpRequest(this.url, this._handleHttpResponse.bind(this), undefined, this._handleHttpError.bind(this), model);
      }

    } 
  }

  /**
   * @param strValue
   */
  _getPickDepth( strValue ) {
    if (strValue == "ALL") {
      return PickDepthEnum.All;
    }
    else {
      return PickDepthEnum.Closest;
    } 
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
    // Setup client-side interactors for ThreeJS
    if (this.renderer === 'THREEJS') {
      if (this.transformEnable) {
        this.transformInteractor = new TransformInteractor( this.threeViewer.domElement );
        this.threeViewer.addInteractor( this.transformInteractor );

        if (this.transformRotateDisable) {
          this.transformInteractor.enableRotate = false;
        }
        if (this.transformZoomDisable) {
          this.transformInteractor.enableZoom = false;
        }
        if (this.transformPanDisable) {
          this.transformInteractor.enablePan = false;
        }
      }

      if (this.panEnable) {
        this.panInteractor = new PanInteractor( this.threeViewer.domElement );
        this.threeViewer.addInteractor( this.panInteractor );

		this.panInteractor.widthScale = (this.panWidthZoomLevel > 100) ? (this.panWidthZoomLevel / 100) : 1;
		this.panInteractor.heightScale = (this.panHeightZoomLevel > 100) ? (this.panHeightZoomLevel / 100) : 1;
      }
    }
  }

  _initViewer() {
    this.dataVizDiv = document.createElement('div');
    this.dataVizDiv.setAttribute('id', 'dataVizDiv');
    this.$.container.appendChild(this.dataVizDiv);

    if (this.renderer === 'THREEJS') {
      if (this.threeViewer !== undefined) {  
        this.dataVizDiv.removeChild( this.threeViewer.domElement );
      }
            
      this.threeViewer = new Viewer();
      this.dataVizDiv.appendChild( this.threeViewer.domElement );

      // Check if the user has requested a specific renderer
      var rendererId = 'avsDefaultWebGLRenderer';
 //     if (this.rendererProperties.webGLRendererId !== undefined) {
//    	  rendererId = this.rendererProperties.webGLRendererId;
//      }

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
    else if (this.renderer === 'IMAGE' || this.renderer === 'IMAGEURL') {
      var imageElem = document.createElement("img");
      imageElem.setAttribute("id", "sceneImage");
      // imageElem.setAttribute("usemap", "#sceneImageMap");
      this.dataVizDiv.appendChild(imageElem);

      // var mapElem = document.createElement("map");
      // mapElem.setAttribute("id", "sceneImageMap");
      // mapElem.setAttribute("name", "sceneImageMap");
      // this.dataVizDiv.appendChild(mapElem);
    }

    // Setup tap interactor
    if (this.tapEnable) {
      Gestures.addListener(this, 'tap', this._handleTap.bind(this));
    }

    // Setup track interactor
    if (this.trackEnable) {
      var canvasElem = document.createElement("canvas");
      canvasElem.setAttribute("id", "rectCanvas");
      this.dataVizDiv.appendChild(canvasElem);

      this.rectCtx = canvasElem.getContext('2d');

      Gestures.addListener(this, 'track', this._handleTrack.bind(this));
    }

    // Setup hover interactor
    if (this.hoverEnable) {
      this.addEventListener('mousemove', this._handleMouseMove);
      this.addEventListener('mouseout', this._handleMouseMove);
    }
  }
}

window.customElements.define('avs-go-dataviz', AvsGoDataViz);
