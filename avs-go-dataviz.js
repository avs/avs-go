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
import {afterNextRender} from '@polymer/polymer/lib/utils/render-status.js';
import {AvsRenderer} from './avs-renderer.js';
import {Viewer, TransformInteractor, PanInteractor, ZoomRectangleInteractor, PickDepthEnum, Animator} from './avs-three.module.min.js';
import {AvsHttpMixin} from './avs-http-mixin.js';
import {AvsStreamMixin} from './avs-stream-mixin.js';
import {AvsDataSourceMixin} from './avs-data-source-mixin.js';
import {LOGO} from './logo.js';

/**
 * `avs-go-dataviz` is a Polymer 3.0 element which requests a data visualization
 * from either the `sceneName` class on the AVS/Go server application running at `url`,
 * or from a JSON file at `url` when `urlLoadJsonFile` is set.
 *
 * The request occurs upon:
 * * An explicit call to `updateViewer()`
 * * A change in `renderer`
 * * Additionally if `manualUpdate` is false:
 * * * Initialization of this element has completed
 * * * This element is resized outside of the `resizeThresold` percentage
 *
 * @customElement
 * @polymer
 * @appliesMixin AvsDataSourceMixin
 * @appliesMixin AvsStreamMixin
 * @appliesMixin AvsHttpMixin
 */
class AvsGoDataViz extends AvsDataSourceMixin(AvsStreamMixin(AvsHttpMixin(mixinBehaviors([IronResizableBehavior], PolymerElement)))) {

  static get template() {
    return html`
      <style>
        :host {
          display:block;
          width:100%;
          height:100%;
          overflow:hidden;
        }
        #container {
          position:relative;
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
          left:var(--avs-spinner-left, 50%);
          top:var(--avs-spinner-top, 50%);
          transform:var(--avs-spinner-transform, translate(-50%,-50%));
        }
        #spinner {
          display:none;
        }
        .spin {
          -webkit-animation:spin 2s ease-in-out infinite;
           -moz-animation:spin 2s ease-in-out infinite;
           animation:spin 2s ease-in-out infinite;
        }
        .spinnerBackground {
          fill:var(--avs-spinner-background-color, rgb(0,0,0,0));
          stroke-width:0.0160303
        }
        @-moz-keyframes spin { 100% { -moz-transform: rotate(360deg); } }
        @-webkit-keyframes spin { 100% { -webkit-transform: rotate(360deg); } }
        @keyframes spin { 100% { -webkit-transform: rotate(360deg); transform:rotate(360deg); } }
      </style>
      <div id="container">
        <div id="dataVizDiv"></div>
        <div id="spinnerDiv">
          <div id="spinner"></div>
        </div>
      </div>
    `;
  }

  static get properties() {
    return {

      /**
       * Don't request a new scene upon initialization or resize.
       */
      manualUpdate: {
        type: Boolean
      },
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
       * The name of the renderer registered in the library map on the server.
       */
      rendererName: {
        type: String
      },
      /**
       * User properties for the renderer passed directly to the server.
       */
      rendererUserProperties: {
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
        type: Boolean,
        observer: "_hiddenChanged"
      },
      /**
       * Resize threshold (percent) to determine when the update is performed on the client or the server.
       * Default is 10%. Set to zero to disable resize on the server.
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
       * Number of seconds between pointer moves before an `avs-pointer-timeout` event is dispatched.
       */
      pointerTimeout: {
        type: Number,
        value: 600
      },
      /**
       * Enables the `avs-tap` event.
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
       * Enable the transform interactor. Only available when `renderer` is `THREEJS`
       *
       * Create an interactor for transforming a particular scene object on the client.
       * Use the IGoRenderer.addInteractor() method on the server to select which object to transform.
       */
      transformEnable: {
        type: Boolean,
        observer: "_transformEnableChanged"
      },
      /**
       * Transform on the client only, do not update the transform matrix on the server.
       */
      transformClientOnly: {
        type: Boolean,
        observer: "_transformClientOnlyChanged"
      },
      /**
       * Disables rotation of the object.
       */
      transformRotateDisable: {
        type: Boolean,
        observer: "_transformRotateDisableChanged"
      },
      /**
       * Disables zooming of the object.
       */
      transformZoomDisable: {
        type: Boolean,
        observer: "_transformZoomDisableChanged"
      },
      /**
       * Disables panning of the object.
       */
      transformPanDisable: {
        type: Boolean,
        observer: "_transformPanDisableChanged"
      },
      /**
       * The twist angle of the object in degrees.
       */
      transformTwistAngle: {
        type: Number,
        observer: "_transformValueChanged"
      },
      /**
       * The tilt angle of the object in degrees.
       */
      transformTiltAngle: {
        type: Number,
        observer: "_transformValueChanged"
      },
      /**
       * The scale of the object in percent.
       */
      transformScale: {
        type: Number,
        observer: "_transformValueChanged"
      },
      /**
       * Enable the zoom rectangle interactor. Only available when `renderer` is `THREEJS`
       *
       * Create an interactor for scaling an object by drawing a rectangle.
       * Use the IGoRenderer.addInteractor() method on the server to select which object to transform.
       */
      zoomRectangleEnable: {
        type: Boolean,
        observer: "_zoomRectangleEnableChanged"
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
        type: Number,
        observer: "_panWidthZoomLevelChanged"
      },
      /**
       * The height zoom level in percent of the original scene greater than 100%
       */
      panHeightZoomLevel: {
        type: Number,
        observer: "_panHeightZoomLevelChanged"
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
  _assembleModel(fullReset) {
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
    var rendererProperties = {width:this.width, height:this.height, name:this.rendererName, type:this.renderer};
    if (this.rendererUserProperties !== undefined) {
      rendererProperties.userProperties = this.rendererUserProperties;
    }
    model.rendererProperties = rendererProperties;

    // Transform Properties
    if (this.transformInteractor !== undefined) {
      // Update the local transform matrix from the transform interactor, we may have transformed since the last request
      this.transformMatrix = this.transformInteractor.object.matrix.elements.slice();
      this.transformClientOnly = this.transformInteractor.clientOnly;
    }
    if (this.transformMatrix !== undefined && !this.transformClientOnly) {
      rendererProperties.transformMatrix = this.transformMatrix;
    }
    if (fullReset !== undefined) {
      if (this.transformClientOnly && this.transformInteractor !== undefined) {
        this.transformInteractor.fullReset = fullReset;
      }
      else {
        rendererProperties.fullReset = true;
      }
    }

    // PanInteractor
    if (this.panEnable) {
      rendererProperties.panProperties = {widthZoomLevel: this.panInteractor.widthZoomLevel, heightZoomLevel: this.panInteractor.heightZoomLevel};
    }

    // Base theme to use from themeName property
    rendererProperties.themeName = this.themeName;

    var style = window.getComputedStyle(this, null);

    // Theme Properties from page CSS
    var cssBackgroundColor = style.getPropertyValue("background-color").trim();
    var cssColor = style.getPropertyValue("color").trim();
    var cssFontFamily = style.getPropertyValue("font-family").trim().replace(/['"]+/g, '');
    rendererProperties.cssProperties = {
      sceneBackgroundType: "Solid",
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
        "sceneBackgroundType": "--avs-scene-background-type",
        "sceneBackgroundColor": "--avs-scene-background-color",
        "sceneBackgroundStartColor": "--avs-scene-background-start-color",
        "sceneBackgroundEndColor": "--avs-scene-background-end-color",
        "sceneBackgroundGradientStyle": "--avs-scene-background-gradient-style",
        "sceneBackgroundGradientInterpolation": "--avs-scene-background-gradient-interpolation",
        "sceneBackgroundGradientColorRepeat": "--avs-scene-background-gradient-color-repeat",
        "sceneHighlightColor": "--avs-scene-highlight-color",
        "sceneSurfaceColor": "--avs-scene-surface-color",
        "sceneLineColor": "--avs-scene-line-color",
        "sceneLineWidth": "--avs-scene-line-width",
        "sceneLineOpacity": "--avs-scene-line-opacity",
        "sceneTextColor": "--avs-scene-text-color",
        "sceneTextRotation": "--avs-scene-text-rotation",
        "sceneFontFamily": "--avs-scene-font-family",
        "sceneFontStyle": "--avs-scene-font-style",
        "sceneFontWeight": "--avs-scene-font-weight",
        "sceneFontSize": "--avs-scene-font-size",
        // Scene title
        "sceneTitleTextColor": "--avs-scene-title-text-color",
        "sceneTitleTextRotation": "--avs-scene-title-text-rotation",
        "sceneTitleFontFamily": "--avs-scene-title-font-family",
        "sceneTitleFontStyle": "--avs-scene-title-font-style",
        "sceneTitleFontWeight": "--avs-scene-title-font-weight",
        "sceneTitleFontSize": "--avs-scene-title-font-size",
        // Chart
        "chartBackgroundType": "--avs-chart-background-type",
        "chartBackgroundColor": "--avs-chart-background-color",
        "chartBackgroundStartColor": "--avs-chart-background-start-color",
        "chartBackgroundEndColor": "--avs-chart-background-end-color",
        "chartBackgroundGradientStyle": "--avs-chart-background-gradient-style",
        "chartBackgroundGradientInterpolation": "--avs-chart-background-gradient-interpolation",
        "chartBackgroundGradientColorRepeat": "--avs-chart-background-gradient-color-repeat",
        "chartHighlightColor": "--avs-chart-highlight-color",
        "chartSurfaceColor": "--avs-chart-surface-color",
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
        // Axis tick mark
        "axisTickMarkColor": "--avs-axis-tick-mark-color",
        "axisTickMarkWidth": "--avs-axis-tick-mark-width",
        // Axis tick line
        "axisTickLineColor": "--avs-axis-tick-line-color",
        "axisTickLineWidth": "--avs-axis-tick-line-width",
        "axisTickLineStyle": "--avs-axis-tick-line-style",
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
        var css = style.getPropertyValue(values[key]).trim();
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
    if (!this.urlLoadJsonFile &&
        !this.manualUpdate &&
        this.resizeThreshold > 0 &&
       (this.clientWidth < this.lowResizeWidth ||
        this.clientWidth > this.highResizeWidth ||
        this.clientHeight < this.lowResizeHeight ||
        this.clientHeight > this.highResizeHeight)) {

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

    if (this.rectCanvas) {
      this.rectCanvas.width = this.width;
      this.rectCanvas.height = this.height;
    }
  } 

  showSpinner() {
    var spinner = window.getComputedStyle(this, null).getPropertyValue("--avs-spinner").trim().replace(/['"]+/g, '');
    if (spinner.length > 0) {
      fetch(spinner)
        .then((response) => {
          if (!response.ok) {
            throw new Error(response);
          }
          return response.text();
        })
        .then((html) => {
          this.$.spinner.innerHTML = html;  
        })
        .catch((error) => {
          this.$.spinner.innerHTML = '';
        });
    }
    else {
      this.$.spinner.innerHTML = LOGO;
    }

    this.$.spinner.style.display = 'block';
  }

  hideSpinner() {
    this.$.spinner.style.display = 'none';
  }

  startSpinner() {
    this.$.spinner.className = 'spin';
  }

  stopSpinner() {
    this.$.spinner.className = '';
  }

  /**
   * Send the request to the server.
   */
  updateViewer(fullReset) {
    this._updateSize();

    this.lowResizeWidth = (100 - this.resizeThreshold) / 100 * this.width;
    this.highResizeWidth = (100 + this.resizeThreshold) / 100 * this.width;
    this.lowResizeHeight = (100 - this.resizeThreshold) / 100 * this.height;
    this.highResizeHeight = (100 + this.resizeThreshold) / 100 * this.height;

    this.showSpinner();
    if (this.url !== undefined && this.url !== null) {
      this.startSpinner();

      // Use avs-http-mixin to send the model to the server
      if (this.urlLoadJsonFile) {
        this.chunkFile = 0;
        this._httpRequest(this.url, this._handleHttpResponse.bind(this), undefined, this._handleHttpError.bind(this));
      }
      else {
        var model = this._assembleModel(fullReset);
        if (model !== undefined) {
          this._httpRequest(this.url, this._handleHttpResponse.bind(this), undefined, this._handleHttpError.bind(this), model);
        }
      }
    }
  }

  /**
   * HTTP error handler.
   * @param event
   */
  _handleHttpError(event) {
    this.hideSpinner();
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

    this.showSpinner();
  }

  /**
   * HTTP response handler.
   * @param json JSON parsed from HTTP response.
   */
  _handleHttpResponse(json) {
    var loadComplete = true;

    if (json !== undefined) {

      if (json.selectionInfo !== undefined) {
        this._dispatchPickEvents(json.selectionInfo);
	  }

      if (json.sceneInfo !== undefined) {
        var sceneEvent = {detail: json.sceneInfo};
        /**
         * Scene info from the server.
         * @event avs-scene-info
         */
        this.dispatchEvent(new CustomEvent('avs-scene-info', sceneEvent));
      }

  	  if (json.image !== undefined) {

        if (json.image.startsWith("?app=image")) {
          this.sceneImage.src = this.url + json.image;
        }
        else {	
	      this.sceneImage.src = json.image;
        }

	    if (json.imagemap !== undefined) {
	      this.sceneImageMap.innerHTML = decodeURIComponent(json.imagemap.replace(/\+/g, '%20'));

          this.imageMapData = Array.from(this.sceneImageMap.querySelectorAll('area')).map(area => {
            return {
              shape: area.getAttribute('shape'),
              coords: area.getAttribute('coords').split(',').map(Number),
              seriesIndex: area.getAttribute('series-index'),
              itemIndex: area.getAttribute('item-index'),
              componentInfo: area.getAttribute('component-info')
            };
          });
	    }
        else {
          this.sceneImageMap.innerHTML = "";
          this.imageMapData = undefined;
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
    }

    if (loadComplete) {
      // Hide the spinner and grab the scene background color for next time
      // Disable background temporarily
      this.hideSpinner();
      this.stopSpinner();
/*      if (json.backgroundColor !== undefined) {
        this.updateStyles({'--avs-spinner-background-color': json.backgroundColor});
      }*/

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

    var pickProperties = {type:"TAP", x:adjustedCoords.x, y:adjustedCoords.y};

	if (this.tapLevel !== undefined) pickProperties.level = this.tapLevel;
	if (this.tapDepth !== undefined) pickProperties.depth = this.tapDepth;
	if (this.tapHighlightEnable) pickProperties.highlight = true;
	if (this.tapHighlightColor !== undefined) pickProperties.highlightColor = this.tapHighlightColor;
	if (this.tapHighlightLayerEnable) pickProperties.highlightLayer = true;

    this._processPick( pickProperties, this.tapProcessEventOnClient, e.originalTarget );
  }
  
  /**
   * @param e
   */
  _handleTrack(e) {
	var adjustedCoords = this._getAdjustedRectangleCoords(e);

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
  _handlePointerDown(e) {
    this.pointerDownX = e.clientX;
    this.pointerDownY = e.clientY;

    this.pointerDown = true;

    if (this.tapEnable && e.buttons & 1) {
      this.tapping = true;
    }

    if (this.trackEnable && e.buttons & 2) {
      this.tracking = 1;
    }
  }

  /**
   * @param e
   */
  _handlePointerMove(e) {
    if (this.tracking >= 1) {
      if (this.tracking === 1) {
        var dx = Math.abs(e.clientX - this.pointerDownX);
        var dy = Math.abs(e.clientY - this.pointerDownY);
        if (dx*dx + dy*dy >= 5) {
          this.tracking = 2;
          this._handleTrack({detail:{state:"start", x:e.clientX, y:e.clientY, dx:e.clientX-this.pointerDownX, dy:e.clientY-this.pointerDownY}});
        }
      }
      if (this.tracking === 2) {
        this._handleTrack({detail:{state:"track", x:e.clientX, y:e.clientY, dx:e.clientX-this.pointerDownX, dy:e.clientY-this.pointerDownY}});
      }
    }

    if (this.hoverEnable && !this.pointerDown) {
      var adjustedCoords = this._getAdjustedCoords(e.clientX, e.clientY);
      var pickProperties = {type:"HOVER", x:adjustedCoords.x, y:adjustedCoords.y};

	  if (this.hoverLevel !== undefined) pickProperties.level = this.hoverLevel;
	  if (this.hoverDepth !== undefined) pickProperties.depth = this.hoverDepth;
	  if (this.hoverHighlightEnable) pickProperties.highlight = true;
	  if (this.hoverHighlightColor !== undefined) pickProperties.highlightColor = this.hoverHighlightColor;
	  if (this.hoverHighlightLayerEnable) pickProperties.highlightLayer = true;

      this._processPick( pickProperties, true, e.originalTarget );
    }

    this._resetTimer();      
  }

  /**
   * @param e
   */
  _handlePointerUp(e) {
    this.pointerDown = false;

    if (this.tapping) {
      this.tapping = false;
      var dx = Math.abs(e.clientX - this.pointerDownX);
      var dy = Math.abs(e.clientY - this.pointerDownY);
      if (dx*dx + dy*dy < 25) {
        this._handleTap({detail:{x:e.clientX, y:e.clientY}});
      }
    }

    if (this.tracking > 1) {
      this.tracking = 0;
      this._handleTrack({detail:{state:"end", x:e.clientX, y:e.clientY, dx:e.clientX-this.pointerDownX, dy:e.clientY-this.pointerDownY}});
    }
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

  _processPick( pickProperties, processEventOnClient, originalTarget ) {
    if (processEventOnClient) {
      if (this.renderer === 'THREEJS') {
        // ThreeJS client side pick processing

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

        pickProperties.selected = this.threeViewer.getSelectionInfo(selectionList);
        this._dispatchPickEvents(pickProperties);
      
        if (pickProperties.highlight) {
          this.threeViewer.highlightColor.set( pickProperties.highlightColor );
          this.threeViewer.highlightObjects( selectionList, pickProperties.highlightLayer );
        }
      }
      else if (this.renderer === 'SVG') {
        // Client side SVG pick processing

        pickProperties.selected = [];

        if (pickProperties.type !== 'TRACK' && (originalTarget.nodeName === "polygon" || originalTarget.nodeName === "circle")) {
          var selectedInfo = {};

          var seriesIndex = null;
          var element = originalTarget.parentElement;
          while (element !== null && (seriesIndex = element.getAttribute("series-index")) === null) {
            element = element.parentElement;
          }
          if (seriesIndex !== null) {
            selectedInfo.seriesIndex = parseInt(seriesIndex);
          }

          var itemIndex = null;
          element = originalTarget.parentElement;
          while (element !== null && (itemIndex = element.getAttribute("item-index")) === null) {
            element = element.parentElement;
          }
          if (itemIndex !== null) {
            selectedInfo.itemIndex = parseInt(itemIndex);
          }

          var componentInfo = null;
          element = originalTarget.parentElement;
          while (element !== null && (componentInfo = element.getAttribute("component-info")) === null) {
            element = element.parentElement;
          }
          if (componentInfo !== null) {
            selectedInfo.componentInfo = decodeURIComponent(componentInfo);
          }

          pickProperties.selected.push(selectedInfo);
        }

        this._dispatchPickEvents(pickProperties);
      
        if (pickProperties.highlight) {
          if (this.highlightSvg === undefined) {
            this.highlightSvg = [];
          }

          for (var i = 0; i < this.highlightSvg.length; i++) {
            this.highlightSvg[i].setAttribute("fill", this.highlightSvg[i].getAttribute("saveFill"));
          }
          this.highlightSvg.length = 0;

          if (pickProperties.type !== 'TRACK' && (originalTarget.nodeName === "polygon" || originalTarget.nodeName === "circle")) {
            this.highlightSvg.push(originalTarget);
            originalTarget.setAttribute("saveFill", originalTarget.getAttribute("fill"));
            originalTarget.setAttribute("fill", pickProperties.highlightColor);
          }
        }
      }
      else {
        // Client side imagemap pick processing

        pickProperties.selected = [];

        if (pickProperties.type !== 'TRACK' && this.imageMapData !== undefined) {
          for (var i = 0; i < this.imageMapData.length; i++) {
            var area = this.imageMapData[i];
            if (area.shape === "poly" && this._pointInPoly(pickProperties.x, pickProperties.y, area.coords) !== false) {

              var selectedInfo = {};
              if (area.seriesIndex !== null) {
                selectedInfo.seriesIndex = parseInt(area.seriesIndex);
              }
              if (area.itemIndex !== null) {
                selectedInfo.itemIndex = parseInt(area.itemIndex);
              }
              if (area.componentInfo !== null) {
                selectedInfo.componentInfo = decodeURIComponent(area.componentInfo);
              }
              pickProperties.selected.push(selectedInfo);
            }
          }
        }

        this._dispatchPickEvents(pickProperties);
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

  _pointInPoly(x, y, coords) {
    var dx1 = coords[0] - x;
    var dy1 = coords[1] - y;
    var dx2, dy2, f;
    var k = 0;

    for (var i=2; i < coords.length; i+=2) {

      dy2 = coords[i+1] - y;

      if ((dy1 < 0 && dy2 < 0) || (dy1 > 0 && dy2 > 0)) {
        dy1 = dy2;
        dx1 = coords[i] - x;
        continue;
      }

      dx2 = coords[i] - x;

      if (dy2 > 0 && dy1 <= 0) {
        f = (dx1 * dy2) - (dx2 * dy1);
        if (f > 0) k++;
        else if (f === 0) return 0;
      }
      else if (dy1 > 0 && dy2 <= 0) {
        f = (dx1 * dy2) - (dx2 * dy1);
        if (f < 0) k++;
        else if (f === 0) return 0;
      }
      else if (dy2 === 0 && dy1 < 0) {
        f = (dx1 * dy2) - (dx2 * dy1);
        if (f === 0) return 0;
      }
      else if (dy1 === 0 && dy2 < 0) {
        f = dx1 * dy2 - dx2 * dy1;
        if (f === 0) return 0;
      }
      else if (dy1 === 0 && dy2 === 0) {
        if (dx2 <= 0 && dx1 >= 0) {
          return 0;
        }
        else if (dx1 <= 0 && dx2 >= 0) {
          return 0;
        }
      }
 
      dy1 = dy2;
      dx1 = dx2;
    }

    if (k % 2 === 0) return false;
    return true;
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
   * Dispatch the appropriate tap, track or hover event.
   */
  _dispatchPickEvents(pickProperties) {

    var pickEvent = {detail: {selected: pickProperties.selected}};
    if (pickProperties.type === 'TRACK') {
      pickEvent.detail.left   = pickProperties.left;
      pickEvent.detail.top    = pickProperties.top;
      pickEvent.detail.right  = pickProperties.right;
      pickEvent.detail.bottom = pickProperties.bottom;

      /**
       * A track event occurred.
       * @event avs-track
       */
      this.dispatchEvent(new CustomEvent('avs-track', pickEvent));
    }
    else {
      pickEvent.detail.x = pickProperties.x;
      pickEvent.detail.y = pickProperties.y;

      if (pickProperties.type === 'HOVER') {
        /**
         * A hover event occurred.
         * @event avs-hover
         */
        this.dispatchEvent(new CustomEvent('avs-hover', pickEvent));
      }
      else {
        /**
         * A tap event occurred.
         * @event avs-tap
         */
        this.dispatchEvent(new CustomEvent('avs-tap', pickEvent));
      }
    }
  }

  _resetTimer() {
    clearTimeout(this.timer);
    this.timer = setTimeout(function() {
      /**
       * A pointer timeout event occurred.
       * @event avs-pointer-timeout
       */
      this.dispatchEvent(new Event('avs-pointer-timeout'));
    }.bind(this), this.pointerTimeout * 1000);
  }

  /**
   * 
   */
  connectedCallback() {
    super.connectedCallback();

    // Make sure all CSS and layout has been processed 
    afterNextRender(this, function() {
      if (this.initialized !== true) { 

		this._updateSize();
        if (!this.manualUpdate) {
          this.updateViewer(true);
        }

        this.addEventListener('iron-resize', this._onResize);
        this._updatePixelRatio();

        this.addEventListener('pointerdown', this._handlePointerDown);
        this.addEventListener('pointerup', this._handlePointerUp);
        this.addEventListener('pointermove', this._handlePointerMove);
        this.addEventListener('pointerout', this._handlePointerMove);
 
        var scope = this;
        this.addEventListener('contextmenu', function(e) {
          if (scope.trackEnable) {
            e.preventDefault();
          }
        });

		this._resetTimer();

        this.initialized = true;
      }
    }); 
  }

  _updatePixelRatio(change) {
    const pr = window.devicePixelRatio;
    matchMedia( `(resolution: ${pr}dppx)` ).addEventListener('change', this._updatePixelRatio.bind(this, true), { once: true } );
    this.updateViewer();
  }

  /**
   * Change in 'hidden' property.
   */
  _hiddenChanged(newValue, oldValue) {
    if (newValue) {
      this.$.dataVizDiv.style.display = 'none';
    }
    else {
      this.$.dataVizDiv.style.display = '';
      if (this.threeViewer) {
        this.threeViewer.render();
      }
    }
  }

  /**
   * Change in 'transform-enable' property.
   */
  _transformEnableChanged(newValue, oldValue) {
    if (this.threeViewer) {
      if (newValue) {
        if (this.transformInteractor === undefined) {
          this.transformInteractor = new TransformInteractor( this );
        }
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
        if (this.transformClientOnly) {
          this.transformInteractor.clientOnly = true;
        }
      }
      else {
        this.threeViewer.removeInteractor( this.transformInteractor );
      }
    }
  }

  /**
   * Change in the 'transform-client-only' property.
   */
  _transformClientOnlyChanged(newValue, oldValue) {
    if (this.transformInteractor) {
      this.transformInteractor.clientOnly = newValue;
    }
    if (this.zoomRectangleInteractor) {
      this.zoomRectangleInteractor.clientOnly = newValue;
    }
  }

  /**
   * Change in 'transform-rotate-disable' property.
   */
  _transformRotateDisableChanged(newValue, oldValue) {
    if (this.transformInteractor) {
      this.transformInteractor.enableRotate = !newValue;
    }
  }

  /**
   * Change in 'transform-zoom-disable' property.
   */
  _transformZoomDisableChanged(newValue, oldValue) {
    if (this.transformInteractor) {
      this.transformInteractor.enableZoom = !newValue;
    }
  }

  /**
   * Change in 'transform-pan-disable' property.
   */
  _transformPanDisableChanged(newValue, oldValue) {
    if (this.transformInteractor) {
      this.transformInteractor.enablePan = !newValue;
    }
  }

  /**
   * Reset the transform interactor.
   */
  resetTransform() {
    if (this.transformInteractor) {
      this.transformInteractor.reset();
    }
  }

  /**
   * Perform a zoom in using the transform interactor.
   */
  zoomIn() {
    if (this.transformInteractor) {
      this.transformInteractor.zoomIn();
    }
  }

  /**
   * Perform a zoom out using the transform interactor.
   */
  zoomOut() {
    if (this.transformInteractor) {
      this.transformInteractor.zoomOut();
    }
  }

  /**
   * Perform a pan to center the specified coordinate of the transformed object in the center of the scene.
   */
  panTo(x, y, z) {
    if (this.transformInteractor) {
      this.transformInteractor.panTo(x, y, z);
    }
  }

  /**
   * Change in 'transform-twist-angle', 'transform-tilt-angle' or 'transform-scale' properties.
   */
  _transformValueChanged(newValue, oldValue) {
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

    this.transformMatrix = matrix;
    if (this.transformInteractor) {    
      this.transformInteractor.object.matrix.fromArray( matrix );
    }
  }

  /**
   * Change in 'zoom-rectangle-enable' property.
   */
  _zoomRectangleEnableChanged(newValue, oldValue) {
    if (this.threeViewer) {
      if (newValue) {
        if (this.zoomRectangleInteractor === undefined) {
          this.zoomRectangleInteractor = new ZoomRectangleInteractor( this );
        }
        this.threeViewer.addInteractor( this.zoomRectangleInteractor );

        if (this.transformClientOnly) {
          this.zoomRectangleInteractor.clientOnly = true;
        }
      }
      else {
        this.threeViewer.removeInteractor( this.zoomRectangleInteractor );
      }
    }
  }

  /**
   * Change in 'pan-enable' property.
   */
  _panEnableChanged(newValue, oldValue) {
    if (this.threeViewer) {
      if (newValue) {
        if (this.panInteractor === undefined) {
          this.panInteractor = new PanInteractor( this );
        }
        this.threeViewer.addInteractor( this.panInteractor );
        this.panInteractor.addEventListener('zoom', this._handlePanZoomChanged.bind(this));
        if (this.panWidthZoomLevel >= 100) {
          this.panInteractor.widthZoomLevel = this.panWidthZoomLevel;
        }
        if (this.panHeightZoomLevel >= 100) {
          this.panInteractor.heightZoomLevel = this.panHeightZoomLevel;
        }
      }
      else {
        this.threeViewer.removeInteractor( this.panInteractor );
        this.panInteractor.removeEventListener('zoom', this._handlePanZoomChanged.bind(this));
      }
    }
  }

  _handlePanZoomChanged(e) {
    this.updateViewer();
  }

  /**
   * Change in 'pan-width-zoom-level' property.
   */
  _panWidthZoomLevelChanged(newValue, oldValue) {
    if (this.panInteractor && newValue >= 100) {
      this.panInteractor.widthZoomLevel = newValue;
    }
  }

  /**
   * Change in 'pan-height-zoom-level' property.
   */
  _panHeightZoomLevelChanged(newValue, oldValue) {
    if (this.panInteractor && newValue >= 100) {
      this.panInteractor.heightZoomLevel = newValue;
    }
  }

  /**
   * Change in 'renderer' property.
   */
  _rendererChanged(newValue, oldValue) {
    if (oldValue === 'IMAGE' || oldValue === 'IMAGEURL') {
      this.sceneImage.src = 'data:,';
      this.$.dataVizDiv.removeChild(this.sceneImage);
      this.$.dataVizDiv.removeChild(this.sceneImageMap);
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
        this.sceneImage.setAttribute("usemap", "#sceneImageMap");

        this.sceneImageMap = document.createElement("map");
        this.sceneImageMap.setAttribute("id", "sceneImageMap");
        this.sceneImageMap.setAttribute("name", "sceneImageMap");
      }

      this.$.dataVizDiv.appendChild(this.sceneImage);
      this.$.dataVizDiv.appendChild(this.sceneImageMap);
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

        var styleMap = {};
        this._applyCustomCssProperties(styleMap, window.getComputedStyle(this, null),
          {
            "scene": "--avs-scene-animations",
            "sceneTitle": "--avs-scene-title-animations",
            "chart": "--avs-chart-animations",
            "chartTitle": "--avs-chart-title-animations",
            "axis": "--avs-axis-animations",
            "legend": "--avs-legend-animations",
            "legendTitle": "--avs-legend-title-animations",
            "glyph": "--avs-glyph-animations"
          } );
		var animator = new Animator(styleMap);
		this.threeViewer.setAnimator(animator);
      }

      this.$.dataVizDiv.appendChild(this.threeViewer.domElement);
    }

    if (this.initialized && !this.manualUpdate) {
      this.updateViewer();
    }
  }

  /**
   * Change in 'track-enable' property.
   */
  _trackEnableChanged(newValue, oldValue) {
    if (newValue) {
      if (this.rectCanvas === undefined) {
        this.rectCanvas = document.createElement("canvas");
        this.rectCanvas.setAttribute("id", "rectCanvas");
        this.rectCtx = this.rectCanvas.getContext('2d');
      }
      this.$.container.appendChild(this.rectCanvas);
    }
    else {
      this.$.container.removeChild(this.rectCanvas);
    }
  }
}

window.customElements.define('avs-go-dataviz', AvsGoDataViz);
