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
 * `avs-go-dataviz` is a Polymer 3.0 element which requests a data visualization
 * from either the `sceneName` class on the AVS/Go server application running at `url`,
 * or from a JSON file at `url` when `urlLoadJsonFile` is set.
 *
 * The request occurs:
 * * On connection of this element to a document.
 * * When this element is resized outside of the `resizeThresold` percentage.
 * * An explicit call to `updateViewer()`
 *
 * @customElement
 * @polymer
 * @appliesMixin AvsDataSourceMixin
 * @appliesMixin AvsStreamMixin
 * @appliesMixin AvsHttpMixin
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
          -webkit-animation:spin 2s ease-in-out infinite;
           -moz-animation:spin 2s ease-in-out infinite;
           animation:spin 2s ease-in-out infinite;
        }
        @-moz-keyframes spin { 100% { -moz-transform: rotate(360deg); } }
        @-webkit-keyframes spin { 100% { -webkit-transform: rotate(360deg); } }
        @keyframes spin { 100% { -webkit-transform: rotate(360deg); transform:rotate(360deg); } }
      </style>
      <div id="dataVizDiv" hidden="[[hidden]]"></div>
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
        value: "IMAGE",
        observer: "_rendererChanged"
      },
      /**
       * The name of the theme registered in the library map on the server, or undefined to use CSS, or one of the branded themes: `DEFAULT`, `AVS_LIGHT`, `AVS_DARK` or `AVS_BLACK`
       */
      themeName: {
        type: String
      },
      /**
       * Hide the data visualization.
       */
      hidden: {
        type: Boolean
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
       * Enables the `avs-tap` event.
       */
      tapEnable: {
        type: Boolean,
        observer: "_tapEnableChanged"
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
       * Enables the `avs-selection-info` event from tapping.
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
       * Enables the `avs-track` event.
       */
      trackEnable: {
        type: Boolean,
        observer: "_trackEnableChanged"
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
       * Enables the `avs-selection-info` event from tracking.
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
       * Enables the `avs-hover` event.
       */
      hoverEnable: {
        type: Boolean,
        observer: "_hoverEnableChanged"
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
       * Enables the `avs-selection-info` event from hover.
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
        type: Boolean,
        observer: "_transformEnableChanged"
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
        type: Boolean,
        observer: "_panEnableChanged"
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

    var model = {};

    // Scene Properties
    var sceneProperties = {name:this.sceneName};
    if (this.sceneUserProperties !== undefined) {
      sceneProperties.userProperties = this.sceneUserProperties;
    }
    model.sceneProperties = sceneProperties;

    // Renderer Properties
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

    // Base theme to use from themeName property
    rendererProperties.themeName = this.themeName;

    var style = window.getComputedStyle(this, null);

    // Theme Properties from page CSS
    var cssBackgroundColor = style.getPropertyValue("background-color").trim();
    var cssColor = style.getPropertyValue("color").trim();
    var cssFontFamily = style.getPropertyValue("font-family").trim().replace(/['"]+/g, '');
    rendererProperties.cssProperties = {
      sceneBackgroundColor: cssBackgroundColor,
      sceneLineColor: cssColor,
      sceneTextColor: cssColor,
      sceneFontFamily: cssFontFamily,
      sceneSurfaceColor: cssColor
    };

    // Theme Properties from custom CSS
    this._applyCustomCssProperties(rendererProperties.cssProperties, style,
      {
        // Scene
        "sceneBackgroundColor": "--avs-scene-background-color",
        "sceneHighlightColor": "--avs-scene-highlight-color",
        "sceneSurfaceColor": "--avs-scene-surface-color",
        "sceneBorderColor": "--avs-scene-border-color",
        "sceneLineColor": "--avs-scene-line-color",
        "sceneLineWidth": "--avs-scene-line-width",
        "sceneLineOpacity": "--avs-scene-line-opacity",
        "sceneTextColor": "--avs-scene-text-color",
        "sceneTextRotation": "--avs-scene-text-rotation",
        "sceneFontFamily": "--avs-scene-font-family",
        "sceneFontStyle": "--avs-scene-font-style",
        "sceneFontWeight": "--avs-scene-font-weight",
        "sceneFontSize": "--avs-scene-font-size",
        // Data maps
        "seriesColorMap": "--avs-series-color-map",
        "valueColorMap": "--avs-value-color-map",
        "valueColorMapInterpolation": "--avs-value-color-map-interpolation",
        "sizeMap": "--avs-size-map",
        "shapeMap": "--avs-shape-map",
        // Scene title
        "sceneTitleTextColor": "--avs-scene-title-text-color",
        "sceneTitleTextRotation": "--avs-scene-title-text-rotation",
        "sceneTitleFontFamily": "--avs-scene-title-font-family",
        "sceneTitleFontStyle": "--avs-scene-title-font-style",
        "sceneTitleFontWeight": "--avs-scene-title-font-weight",
        "sceneTitleFontSize": "--avs-scene-title-font-size",
        // Chart
        "chartBackgroundColor": "--avs-chart-background-color",
        "chartHighlightColor": "--avs-chart-highlight-color",
        "chartSurfaceColor": "--avs-chart-surface-color",
        "chartBorderColor": "--avs-chart-border-color",
        "chartLineColor": "--avs-chart-line-color",
        "chartLineWidth": "--avs-chart-line-width",
        "chartLinePattern": "--avs-chart-line-pattern",
        "chartLineOpacity": "--avs-chart-line-opacity",
        "chartTextColor": "--avs-chart-text-color",
        "chartTextRotation": "--avs-chart-text-rotation",
        "chartFontFamily": "--avs-chart-font-family",
        "chartFontStyle": "--avs-chart-font-style",
        "chartFontWeight": "--avs-chart-font-weight",
        "chartFontSize": "--avs-chart-font-size",
        // Chart title
        "chartTitleTextColor": "--avs-chart-title-text-color",
        "chartTitleTextRotation": "--avs-chart-title-text-rotation",
        "chartTitleFontFamily": "--avs-chart-title-font-family",
        "chartTitleFontStyle": "--avs-chart-title-font-style",
        "chartTitleFontWeight": "--avs-chart-title-font-weight",
        "chartTitleFontSize": "--avs-chart-title-font-size",
        // Axis
        "axisLineColor": "--avs-axis-line-color",
        "axisLineWidth": "--avs-axis-line-width",
        "axisLineOpacity": "--avs-axis-line-opacity",
        "axisTextColor": "--avs-axis-text-color",
        "axisTextRotation": "--avs-axis-text-rotation",
        "axisFontFamily": "--avs-axis-font-family",
        "axisFontStyle": "--avs-axis-font-style",
        "axisFontWeight": "--avs-axis-font-weight",
        "axisFontSize": "--avs-axis-font-size",
        // Axis axle
        "axisAxleColor": "--avs-axis-axle-color",
        "axisAxleWidth": "--avs-axis-axle-width",
        "axisAxleOpacity": "--avs-axis-axle-opacity",
        // Axis tick mark
        "axisTickMarkColor": "--avs-axis-tick-mark-color",
        "axisTickMarkWidth": "--avs-axis-tick-mark-width",
        "axisTickMarkOpacity": "--avs-axis-tick-mark-opacity",
        // Axis tick line
        "axisTicklineColor": "--avs-axis-tick-line-color",
        "axisTicklineWidth": "--avs-axis-tick-line-width",
        "axisTickLinePattern": "--avs-axis-tick-line-pattern",
        "axisTicklineOpacity": "--avs-axis-tick-line-opacity",
        // Axis title
        "axisTitleTextColor": "--avs-axis-title-text-color",
        "axisTitleTextRotation": "--avs-axis-title-text-rotation",
        "axisTitleFontFamily": "--avs-axis-title-font-family",
        "axisTitleFontStyle": "--avs-axis-title-font-style",
        "axisTitleFontWeight": "--avs-axis-title-font-weight",
        "axisTitleFontSize": "--avs-axis-title-font-size",
        // Axis unit
        "axisUnitTextColor": "--avs-axis-unit-text-color",
        "axisUnitTextRotation": "--avs-axis-unit-text-rotation",
        "axisUnitFontFamily": "--avs-axis-unit-font-family",
        "axisUnitFontStyle": "--avs-axis-unit-font-style",
        "axisUnitFontWeight": "--avs-axis-unit-font-weight",
        "axisUnitFontSize": "--avs-axis-unit-font-size",
        // Axis labels
        "axisLabelTextColor": "--avs-axis-label-text-color",
        "axisLabelTextRotation": "--avs-axis-label-text-rotation",
        "axisLabelFontFamily": "--avs-axis-label-font-family",
        "axisLabelFontStyle": "--avs-axis-label-font-style",
        "axisLabelFontWeight": "--avs-axis-label-font-weight",
        "axisLabelFontSize": "--avs-axis-label-font-size",
        // Legend
        "legendBackgroundColor": "--avs-legend-background-color",
        "legendTextColor": "--avs-legend-text-color",
        "legendTextRotation": "--avs-legend-text-rotation",
        "legendFontFamily": "--avs-legend-font-family",
        "legendFontStyle": "--avs-legend-font-style",
        "legendFontWeight": "--avs-legend-font-weight",
        "legendFontSize": "--avs-legend-font-size",
        // Legend title
        "legendTitleTextColor": "--avs-legend-title-text-color",
        "legendTitleTextRotation": "--avs-legend-title-text-rotation",
        "legendTitleFontFamily": "--avs-legend-title-font-family",
        "legendTitleFontStyle": "--avs-legend-title-font-style",
        "legendTitleFontWeight": "--avs-legend-title-font-weight",
        "legendTitleFontSize": "--avs-legend-title-font-size"
      } );

    this._addDataSourceProperties(model);

    if (this.renderer === 'THREEJS') {
	  this._addStreamProperties(rendererProperties);
    }

    return model;
  }

  /**
   *
   */
  _applyCustomCssProperties(cssProperties, style, values) {
    for (var key in values) {
      if (values.hasOwnProperty(key)) {
        var css = style.getPropertyValue(values[key]).trim().replace(/['"]+/g, '');
        if (css.length > 0) {
          cssProperties[key] = css;
        }
      }
    }
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
      this._updateViewerClient();
    }
  }

  /**
   * 
   */
  _updateSize() {
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

    this.$.dataVizDiv.style.width = this.width + 'px';
    this.$.dataVizDiv.style.height = this.height + 'px';

    if (this.trackEnable) {
      this.$$("#rectCanvas").width = this.width;
      this.$$("#rectCanvas").height = this.height;
    }
  } 

  /**
   * Send the request to the server.
   */
  updateViewer() {
    this._updateSize();

    this.lowResizeWidth = (100 - this.resizeThreshold) / 100 * this.width;
    this.highResizeWidth = (100 + this.resizeThreshold) / 100 * this.width;

    if (this.spinner === undefined) {
      this.spinnerDiv = document.createElement('div');
      this.spinnerDiv.id = 'spinnerDiv';
      this.$.dataVizDiv.appendChild(this.spinnerDiv);
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
   * HTTP error handler.
   * @param event
   */
  _handleHttpError(event) {
    if (this.spinner !== undefined) {
      this.spinner.style.display = 'none';
    }
  }

  /**
   * 
   */
  _updateViewerClient() {
    this._updateSize();
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
      var el = this.svgDiv;
      while (el.firstChild) el.removeChild(el.firstChild);
    }
    else {
      this.sceneImage.src = 'data:,';
    }
  }

  /**
   * HTTP response handler.
   * @param json JSON parsed from HTTP response.
   */
  _handleHttpResponse(json) {
	if (json.selectionInfo !== undefined) {
	  var infoEvent = {detail: json.selectionInfo};
      /**
       * Selection info from the `tap`, `track` or `hover` events.
       * @event avs-selection-info
       */
	  this.dispatchEvent(new CustomEvent('avs-selection-info', infoEvent));
	}

    if (json.sceneInfo !== undefined) {
      var sceneEvent = {detail: json.sceneInfo};
      /**
       * Scene info from the server.
       * @event avs-scene-info
       */
      this.dispatchEvent(new CustomEvent('avs-scene-info', sceneEvent));
    }

    var loadComplete = true;

	if (json.image !== undefined) {
	
	  this.sceneImage.src = json.image;
	  if (json.imagemap !== undefined) {
	//        this.$$("#sceneImageMap").innerHTML = decodeURIComponent(json.imagemap.replace(/\+/g, '%20'));
	  }
	}
	else if (json.svg !== undefined) {
	  this.svgDiv.innerHTML = decodeURIComponent(json.svg.replace(/\+/g, '%20'));
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
        loadComplete = false;
      }
    }
    else if (this.urlLoadJsonFile) {
      this.threeViewer.loadGeometryAsJson(json);
    }

    if (this.spinner !== undefined) {
      this.spinner.style.display = 'none';
    }

    if (loadComplete) {
      /**
       * Scene load has completed.
       * @event avs-load-complete
       */
      this.dispatchEvent(new CustomEvent('avs-load-complete'));
    }
  }

  /**
   * @param e
   */
  _handleTap(e) {
	var adjustedCoords = this._getAdjustedCoords(e.detail.x, e.detail.y);

    var tapEvent = {detail: {x: adjustedCoords.x, y: adjustedCoords.y, sourceEvent: e}};
    /**
     * A tap event occurred.
     * @event avs-tap
     */
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
    /**
     * A track event occurred.
     * @event avs-track
     */
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
    /**
     * A hover event occurred.
     * @event avs-hover
     */
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
        this.updateViewer();

        this.addEventListener('iron-resize', this._onResize);
        this.initialized = true;
      }
    }); 
  }

  /**
   * Change in 'transform-enable' property.
   */
  _transformEnableChanged(newValue, oldValue) {
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
    }
  }

  /**
   * Change in 'pan-enable' property.
   */
  _panEnableChanged(newValue, oldValue) {
    if (this.renderer === 'THREEJS') {
      if (this.panEnable) {
        this.panInteractor = new PanInteractor( this.threeViewer.domElement );
        this.threeViewer.addInteractor( this.panInteractor );

		this.panInteractor.widthScale = (this.panWidthZoomLevel > 100) ? (this.panWidthZoomLevel / 100) : 1;
		this.panInteractor.heightScale = (this.panHeightZoomLevel > 100) ? (this.panHeightZoomLevel / 100) : 1;
      }
    }
  }

  /**
   * Change in 'renderer' property.
   */
  _rendererChanged(newValue, oldValue) {
    if (oldValue === 'IMAGE' || oldValue === 'IMAGEURL') {
      this.sceneImage.src = 'data:,';
      this.$.dataVizDiv.removeChild(this.sceneImage);
    }
    else if (oldValue === 'SVG') {
      var el = this.svgDiv;
      while (el.firstChild) el.removeChild(el.firstChild);
      this.$.dataVizDiv.removeChild(this.svgDiv);
    }
    else if (oldValue === 'THREEJS') {
      this.threeViewer.clearGeometry();
      this.threeViewer.render();
      this.$.dataVizDiv.removeChild(this.threeViewer.domElement);
    }

    if (newValue === 'IMAGE' || newValue === 'IMAGEURL') {
      if (this.sceneImage === undefined) {
        this.sceneImage = document.createElement("img");
        this.sceneImage.setAttribute("id", "sceneImage");
        // this.sceneImage.setAttribute("usemap", "#sceneImageMap");

        // var mapElem = document.createElement("map");
        // mapElem.setAttribute("id", "sceneImageMap");
        // mapElem.setAttribute("name", "sceneImageMap");
        // this.$.dataVizDiv.appendChild(mapElem);
      }

      this.$.dataVizDiv.appendChild(this.sceneImage);
    }
    else if (newValue === 'SVG') {
      if (this.svgDiv === undefined) {
        this.svgDiv = document.createElement("div");
        this.svgDiv.setAttribute("id", "svgDiv");
      }

      this.$.dataVizDiv.appendChild(this.svgDiv);
    }
    else if (newValue === 'THREEJS') {
      if (this.threeViewer === undefined) {
        // Create ThreeJS viewer
        this.threeViewer = new Viewer();

        // Check if the user has requested a specific renderer
        var rendererId = 'avsDefaultWebGLRenderer';
//      if (this.rendererProperties.webGLRendererId !== undefined) {
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
        this.threeViewer.setWebGLRenderer(renderer.webGLRenderer);
      }

      this.$.dataVizDiv.appendChild(this.threeViewer.domElement);
    }

    if (this.initialized) {
      this.updateViewer();
    }
  }

  /**
   * Change in 'tap-enable' property.
   */
  _tapEnableChanged(newValue, oldValue) {
    if (newValue) {
      Gestures.addListener(this, 'tap', this._handleTap.bind(this));
    }
    else {
      Gestures.removeListener(this, 'tap', this.tapHandler.bind(this));
    }
  }

  /**
   * Change in 'track-enable' property.
   */
  _trackEnableChanged(newValue, oldValue) {
    if (newValue) {
      if (this.rectCanvas === undefined) {
        this.rectCanvas = document.createElement("canvas");
        rectCanvas.setAttribute("id", "rectCanvas");
        this.rectCtx = rectCanvas.getContext('2d');
      }
      this.appendChild(rectCanvas);
      Gestures.addListener(this, 'track', this._handleTrack.bind(this));
    }
    else {
      this.removeChild(this.rectCanvas);
      Gestures.removeListener(this, 'track', this._handleTrack.bind(this));
    }
  }

  /**
   * Change in 'hover-enable' property.
   */
  _hoverEnableChanged(newValue, oldValue) {
    if (newValue) {
      this.addEventListener('mousemove', this._handleMouseMove);
      this.addEventListener('mouseout', this._handleMouseMove);
    }
    else {
      this.removeEventListener('mousemove', this._handleMouseMove);
      this.removeEventListener('mouseout', this._handleMouseMove);
    }
  }
}

window.customElements.define('avs-go-dataviz', AvsGoDataViz);
