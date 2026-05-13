/**
 * @license
 * Copyright 2018-2026 Advanced Visual Systems Inc.
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

import { AvsElementMixin } from './avs-element-mixin.js';
import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { AvsRenderer } from './avs-renderer.js';
import { Viewer, TransformInteractor, PanInteractor, ZoomRectangleInteractor, PickDepthEnum, Animator } from '../lib/avs-three.module.min.js';
import { AVS, PLAY, CAMERA, TIMELAPSE, HOME, DELETE, COPY, LINK } from './icons.js';
import { Euler, Vector3, Quaternion } from 'three';
import { DataVizModel, DataVizResponse, MotionCaptureFrame, PickDepth, PickDetail, PickLevel, PickProperties, Renderer, RendererProperties, SelectedInfo } from './types.js';

const ro = new ResizeObserver((entries: ResizeObserverEntry[], observer: ResizeObserver) => {
  entries.forEach((entry: ResizeObserverEntry) => {
    const target = entry.target as AvsGoDataViz;
    target._onResize(entry.contentRect);
  });
});

/**
 * `avs-go-dataviz` is a Lit element which requests a data visualization
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
 * @lit
 * @applysMixin AvsElementMixin
 */
@customElement('avs-go-dataviz')
export class AvsGoDataViz extends AvsElementMixin(LitElement) {
  static styles = css`
        :host {
          display:block;
          width:100%;
          height:100%;
          overflow:hidden;
          position:relative;
          letter-spacing:normal;
          word-spacing:normal;
          line-height:normal;
          text-indent:0;
          text-transform:none;
          direction:ltr;
        }
        #dataVizDiv {
          position:relative;
          width:100%;
          height:100%;
        }
        #motionCapture {
          display: none;
          position:absolute;
          top: 8px;
          left: 8px;
          padding: 8px;
          background-color: rgba(128, 128, 128, 0.8);
          font-size: 10pt;
          border-radius: 8px;
          background:var(--avs-motion-capture-background, rgba(80,80,80,0.75));
          color:var(--avs-motion-capture-color, #ffffff);
          font-family:var(--avs-motion-capture-font-family);
          box-shadow: 0px 5px 5px -3px rgba(0, 0, 0, 0.2), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0, 0, 0, 0.12);
          user-select: none;
        }
        #motionCaptureTitle {
          margin-bottom: 4px;
          font-weight: 700;
        }
        .btn {
          padding: 4px;
          border-radius: 4px;
          margin: 2px;
          background:var(--avs-motion-capture-control-background, white);
          color:var(--avs-motion-capture-control-color, black);
          display: inline-flex;
          align-items: center;
          box-shadow: 0 2px 2px #00000024,0 3px 1px -2px #0000001f,0 1px 5px #0003;
        }
        a.btn {
          cursor: pointer;
        }
        .btn.disabled {
          cursor: default;
          pointer-events: none;
          box-shadow: none;
          background-color: darkgrey;
          color: grey;
        }
        #motionCaptureSnapshotIcon, #motionCaptureDelayIcon {
          height: 24px;
        }
        #motionCaptureSnapshotLabel, #motionCaptureDelayLabel {
          margin-left: 4px;
          height: 14px;
        }
        #motionCaptureDelayWheel {
          display: flex;
          flex-direction: column;
          margin: 0 4px;
          height: 24px;
          gap: 2px;
        }
        #motionCaptureDelayIncrease, #motionCaptureDelayDecrease {
          height: 8px;
          text-align: center;
          font-weight: 700;
          cursor: pointer;
        }
        #motionCaptureReset, #motionCaptureCopyData {
          margin-left: 12px;
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
        #zoomOverlay {
          position:absolute;
          opacity:0;
          transition:opacity ease 0.3s;
          pointer-events:none;
          background:var(--avs-zoom-overlay-background, rgba(80,80,80,0.75));
          color:var(--avs-zoom-overlay-color, #ffffff);
          border-radius:5px;
          padding:5px;
          transform:translate(-50%, -100%);
          font-size:var(--avs-zoom-overlay-font-size, 10pt);
          font-family:var(--avs-zoom-overlay-font-family);
          font-weight:var(--avs-zoom-overlay-font-weight, bold);
          font-style:var(--avs-zoom-overlay-font-style);
        }
        #tooltip, #motionCaptureTooltip, #motionCaptureAlert {
          position:absolute;
          opacity:0;
          transition:opacity ease 0.3s;
          pointer-events:none;
          padding:5px;
          border-radius:5px;
          background:var(--avs-tooltip-background, rgb(80,80,80));
          color:var(--avs-tooltip-color, #ffffff);
          box-shadow: 0px 5px 5px -3px rgba(0, 0, 0, 0.2), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0, 0, 0, 0.12);
          font-size:var(--avs-tooltip-font-size, 10pt);
          font-family:var(--avs-tooltip-font-family);
          font-weight:var(--avs-tooltip-font-weight);
          font-style:var(--avs-tooltip-font-style);
        }
        #motionCaptureAlert {
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
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
  `;

  render() {
    return html`
        <div id="dataVizDiv"></div>
        <div id="motionCapture">
          <div style="display: flex; justify-content: center" id="motionCaptureTitle">Motion Capture</div>
          <div>
            <a class="btn disabled" id="motionCapturePlay" data-tooltip="Play motion capture" @click="${this.runAnimation}" @pointermove="${this._handlePointerEnterMotionCaptureControl}" @pointerout="${this._handlePointerLeaveMotionCaptureControl}">${unsafeSVG(PLAY)}</a>
            <a class="btn" id="motionCaptureSnapshot" data-tooltip="Take snapshot" @click="${this._handleMotionCaptureSnapshot}" @pointermove="${this._handlePointerEnterMotionCaptureControl}" @pointerout="${this._handlePointerLeaveMotionCaptureControl}">
              <div id="motionCaptureSnapshotIcon">${unsafeSVG(CAMERA)}</div>
              <div id="motionCaptureSnapshotLabel">0</div>
            </a>
            <div class="btn disabled" id="motionCaptureDelay" data-tooltip="Frame delay (seconds)" @pointermove="${this._handlePointerEnterMotionCaptureControl}" @pointerout="${this._handlePointerLeaveMotionCaptureControl}">
              <div id="motionCaptureDelayIcon">${unsafeSVG(TIMELAPSE)}</div>
              <div id="motionCaptureDelayLabel">0</div>
              <div id="motionCaptureDelayWheel">
                <a id="motionCaptureDelayIncrease" @click="${this._handleMotionCaptureDelayIncrease}">+</a>
                <a id="motionCaptureDelayDecrease" @click="${this._handleMotionCaptureDelayDecrease}">-</a>
              </div>
            </div>
            <a class="btn" id="motionCaptureReset" data-tooltip="Reset transform" @click="${this.resetTransform}" @pointermove="${this._handlePointerEnterMotionCaptureControl}" @pointerout="${this._handlePointerLeaveMotionCaptureControl}">${unsafeSVG(HOME)}</a>
            <a class="btn disabled" id="motionCaptureClear" data-tooltip="Clear motion capture frames" @click="${this._handleMotionCaptureClear}" @pointermove="${this._handlePointerEnterMotionCaptureControl}" @pointerout="${this._handlePointerLeaveMotionCaptureControl}">${unsafeSVG(DELETE)}</a>
            <a class="btn disabled" id="motionCaptureCopyData" data-tooltip="Copy motion capture data to clipboard" @click="${this._handleMotionCaptureCopyData}" @pointermove="${this._handlePointerEnterMotionCaptureControl}" @pointerout="${this._handlePointerLeaveMotionCaptureControl}">${unsafeSVG(COPY)}</a>
            <a class="btn disabled" id="motionCaptureCopyUrl" data-tooltip="Copy motion capture URL to clipboard" @click="${this._handleMotionCaptureCopyUrl}" @pointermove="${this._handlePointerEnterMotionCaptureControl}" @pointerout="${this._handlePointerLeaveMotionCaptureControl}">${unsafeSVG(LINK)}</a>
          </div>
        </div>
        <div id="motionCaptureTooltip"></div>
        <div id="motionCaptureAlert"></div>
        <div id="zoomOverlay"></div>
        <div id="spinnerDiv">
          <div id="spinner"></div>
        </div>
        <div id="tooltip"></div>
    `;
  }

  /** Don't request a new scene upon initialization or resize. */
  @property({ attribute: 'manual-update', type: Boolean })
  manualUpdate?: boolean;

  /** Highlight canvas elements when using the `THREEJS` renderer. */
  @property({ attribute: 'display-canvas', type: Boolean })
  displayCanvas: boolean;
        
  /** The URL to an instance of AVS/Go server application or file. */
  @property()
  url: string;

  /** Enables loading JSON from a file. */
  @property({ attribute: 'url-load-json-file', type: Boolean })
  urlLoadJsonFile?: boolean;

  /** Name of the data source registered in the library map on the server. */
  @property({ attribute: 'data-source-name' })
  dataSourceName?: string;

  /** User properties as JSON passed directly to the data source on the server. */
  @property({ attribute: 'data-source-user-properties' })
  dataSourceUserProperties?: string;

  /** Name of the scene registered in the library map on the server. */
  @property({ attribute: 'scene-name' })
  sceneName?: string;

  /** User properties as JSON passed directly to the scene on the server. */
  @property({ attribute: 'scene-user-properties' })
  sceneUserProperties?: string;

  /** Name of the renderer registered in the library map on the server. */
  @property({ attribute: 'renderer-name' })
  rendererName?: string;

  /** User properties as JSON passed directly to the renderer on the server. */
  @property({ attribute: 'renderer-user-properties' })
  rendererUserProperties?: string;

  /** The type of renderer to be used to display a scene: `IMAGE`, `SVG` or `THREEJS` */
  @property()
  renderer: Renderer;

  /** Enables streaming of objects from the server. Only available when `renderer` is `THREEJS` */
  @property({ attribute: 'stream-enable', type: Boolean })
  streamEnable?: boolean;

  /** The number of objects streamed for the first chunk. */
  @property({ attribute: 'stream-chunk-size-first' })
  streamChunkSizeFirst?: number;

  /** The number of objects streamed per chunk. */
  @property({ attribute: 'stream-chunk-size' })
  streamChunkSize?: number;      

  /** The name of the theme registered in the library map on the server, or undefined to use CSS, or one of the branded themes: `DEFAULT`, `AVS_LIGHT`, `AVS_DARK` or `AVS_BLACK` */
  @property({ attribute: 'theme-name' })
  themeName?: string;

  /** Resize threshold (percent) to determine when the update is performed on the client or the server.
      Default is 10%. Set to zero to disable resize on the server. */
  @property({ attribute: 'resize-threshold' })
  resizeThreshold?: number;

  /** Number of seconds between pointer moves before an `avs-pointer-timeout` event is dispatched. */
  @property({ attribute: 'pointer-timeout' })
  pointerTimeout?: number;

  /** Enables the `avs-tap` event. */
  @property({ attribute: 'tap-enable', type: Boolean })
  tapEnable?: boolean;

  /** The level of geometry within the scene to be modified by the tap event: `CELL`, `CELL_SET` or `SCENE_NODE` */
  @property({ attribute: 'tap-level' })
  tapLevel?: PickLevel;

  /** The depth at which an object is selected: `ALL` or `CLOSEST` */
  @property({ attribute: 'tap-depth' })
  tapDepth?: PickDepth;

  /** Enables highlight of selected geometry in the scene. */
  @property({ attribute: 'tap-highlight-enable', type: Boolean })
  tapHighlightEnable?: boolean;

  /** The color to used to highlight the selected objects in the scene. */
  @property({ attribute: 'tap-highlight-color' })
  tapHighlightColor?: string;

  /** Enables drawing highlighted objects in front of all objects in the scene. This results in faster rendering in a 2D viewport when using the `THREEJS` renderer. */
  @property({ attribute: 'tap-highlight-layer-enable', type: Boolean })
  tapHighlightLayerEnable?: boolean;

  /** Enables the processing of tap events on the client. Only available when `renderer` is `THREEJS` */
  @property({ attribute: 'tap-process-event-on-client', type: Boolean })
  tapProcessEventOnClient?: boolean;

  /** Enables the `avs-track` event. */
  @property({ attribute: 'track-enable', type: Boolean })
  trackEnable?: boolean;

  /** The level of geometry within the scene to be modified by the track event: `CELL`, `CELL_SET` or `SCENE_NODE` */
  @property({ attribute: 'track-level' })
  trackLevel?: PickLevel;

  /** The depth at which an object is selected: `ALL` or `CLOSEST` */
  @property({ attribute: 'track-depth' })
  trackDepth?: PickDepth;

  /** Enables highlight of selected geometry in the scene. */
  @property({ attribute: 'track-highlight-enable', type: Boolean })
  trackHighlightEnable?: boolean;

  /** The color to used to highlight the selected objects in the scene. */
  @property({ attribute: 'track-highlight-color' })
  trackHighlightColor?: string;

  /** Enables drawing highlighted objects in front of all objects in the scene. This results in faster rendering in a 2D viewport when using the `THREEJS` renderer. */
  @property({ attribute: 'track-highlight-layer-enable', type: Boolean })
  trackHighlightLayerEnable?: boolean;

  /** Enables the processing of track events on the client. Only available when `renderer` is `THREEJS` */
  @property({ attribute: 'track-process-event-on-client', type: Boolean })
  trackProcessEventOnClient?: boolean;

  /** Enables the `avs-hover` event. */
  @property({ attribute: 'hover-enable', type: Boolean })
  hoverEnable?: boolean;

  /** The level of geometry within the scene to be modified by the hover event: `CELL`, `CELL_SET` or `SCENE_NODE` */
  @property({ attribute: 'hover-level' })
  hoverLevel?: PickLevel;

  /** The depth at which an object is selected: `ALL` or `CLOSEST` */
  @property({ attribute: 'hover-depth' })
  hoverDepth?: PickDepth;

  /** Enables highlight of selected geometry in the scene. */
  @property({ attribute: 'hover-highlight-enable', type: Boolean })
  hoverHighlightEnable?: boolean;

  /** The color to used to highlight the selected objects in the scene. */
  @property({ attribute: 'hover-highlight-color' })
  hoverHighlightColor?: string;

  /** Enables drawing highlighted objects in front of all objects in the scene. This results in faster rendering in a 2D viewport when using the `THREEJS` renderer. */
  @property({ attribute: 'hover-highlight-layer-enable', type: Boolean })
  hoverHighlightLayerEnable?: boolean;

  /**
   * Enable the transform interactor. Only available when `renderer` is `THREEJS`
   *
   * Create an interactor for transforming a particular scene object on the client.
   * Use the IGoRenderer.addInteractor() method on the server to select which object to transform.
   */
  @property({ attribute: 'transform-enable', type: Boolean })
  transformEnable?: boolean;

  /** Transform on the client only, do not update the transform matrix on the server. */
  @property({ attribute: 'transform-client-only', type: Boolean })
  transformClientOnly?: boolean;

  /** Disables rotation of the object. */
  @property({ attribute: 'transform-rotate-disable', type: Boolean })
  transformRotateDisable?: boolean;

  /** Disables zooming of the object. */
  @property({ attribute: 'transform-zoom-disable', type: Boolean })
  transformZoomDisable?: boolean;

  /** Disables panning of the object. */
  @property({ attribute: 'transform-pan-disable', type: Boolean })
  transformPanDisable?: boolean;

  /** The twist angle of the object in degrees. */
  @property({ attribute: 'transform-twist-angle' })
  transformTwistAngle?: number;

  /** The tilt angle of the object in degrees. */
  @property({ attribute: 'transform-tilt-angle' })
  transformTiltAngle?: number;

  /** The scale of the object in percent. */
  @property({ attribute: 'transform-scale' })
  transformScale?: number;

  /** Motion capture data or URL. */
  @property({ attribute: 'motion-capture' })
  motionCapture?: string;

  /**
   * Enable the zoom rectangle interactor. Only available when `renderer` is `THREEJS`
   *
   * Create an interactor for scaling an object by drawing a rectangle.
   * Use the IGoRenderer.addInteractor() method on the server to select which object to transform.
   */
  @property({ attribute: 'zoom-rectangle-enable', type: Boolean })
  zoomRectangleEnable?: boolean;

  /**
   * Enable the pan interactor. Only available when `renderer` is `THREEJS`
   *
   * Create an interactor for panning an OpenViz domain (axes and charts) on the client.
   */
  @property({ attribute: 'pan-enable', type: Boolean })
  panEnable?: boolean;

  /**
   * Use mousewheel or pinch zoom to adjust the pan interactor's zoom level.
   * Otherwise the zoom level must be set using `pan-width-zoom-level` and `pan-height-zoom-level`.
   */
  @property({ attribute: 'pan-zoom-enable', type: Boolean })
  panZoomEnable?: boolean;

  /** The width zoom level in percent of the original scene greater than 100% */
  @property({ attribute: 'pan-width-zoom-level' })
  panWidthZoomLevel?: number;

  /** The height zoom level in percent of the original scene greater than 100% */
  @property({ attribute: 'pan-height-zoom-level' })
  panHeightZoomLevel?: number;

  /** The maximum zoom level in percent of the original scene greater than 100% Default is 1000% */
  @property({ attribute: 'pan-maximum-zoom-level' })
  panMaximumZoomLevel?: number;

  /** Show animated glyphs. Only available when `renderer` is `THREEJS` */
  @property({ attribute: 'animated-glyphs-visible', type: Boolean })
  animatedGlyphsVisible?: boolean;

  /** Enable animated glyphs. Only available when `renderer` is `THREEJS` */
  @property({ attribute: 'animated-glyphs-enable', type: Boolean })
  animatedGlyphsEnable?: boolean;

  /** Enable motion capture controls. Only available when `renderer` is `THREEJS` */
  @property({ attribute: 'motion-capture-controls-enable', type: Boolean })
  motionCaptureControlsEnable?: boolean;

  // Local variables
  width: number;
  height: number;
  lowResizeWidth: number;
  highResizeWidth: number;
  lowResizeHeight: number;
  highResizeHeight: number;
  forceUpdate: boolean;
  chunkFile: number;
  model: DataVizModel;
  tapping: boolean;
  tracking: number;
  threeViewer: Viewer;
  transformInteractor: TransformInteractor;
  transformMatrix: Array<number>;
  animator: Animator;
  panInteractor: PanInteractor;
  zoomRectangleInteractor: ZoomRectangleInteractor;
  highlightSvg: Array<any>;
  pointerDown: boolean;
  pointerDownX: number;
  pointerDownY: number;
  imageMapData: Array<any>;
  rectCanvas: HTMLCanvasElement;
  rectCtx: CanvasRenderingContext2D;
  sceneImage: HTMLImageElement;
  sceneImageMap: HTMLMapElement;
  svgDiv: HTMLDivElement;
  motionCaptureDelay: number;
  motionCaptureTime: number;
  motionCaptureFrames: Array<MotionCaptureFrame>;
  showMotionCaptureTooltip: boolean;
  zoomOverlayTimeoutId: number;
  timer: number;

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
  _assembleModel(fullReset?: boolean): DataVizModel {
    if (!this.sceneName) {
      this._dispatchErrorEvent("'scene-name' property must be set to the name of the scene registered in the library map on the AVS/Go server.");
      return undefined;
    }
    if (!this.width || !this.height) {
      return undefined;
    }

    // Scene Properties
    const model: DataVizModel = {
      sceneProperties: {
        name: this.sceneName
      }
    };
    if (this.sceneUserProperties) {
      let sceneUserProperties;
      try {
        sceneUserProperties = JSON.parse(this.sceneUserProperties);
      }
      catch (error) {
        this._dispatchErrorEvent("Can't parse 'scene-user-properties'. " + error.message);
        return undefined;
      }
      model.sceneProperties.userProperties = sceneUserProperties;
    }

    // Renderer Properties
    const rendererProperties: RendererProperties = {
      width: this.width,
      height: this.height,
      name: this.rendererName,
      type: this.renderer
    };
    if (this.rendererUserProperties) {
      let rendererUserProperties;
      try {
        rendererUserProperties = JSON.parse(this.rendererUserProperties);
      }
      catch (error) {
        this._dispatchErrorEvent("Can't parse 'renderer-user-properties'. " + error.message);
        return undefined;
      }
      rendererProperties.userProperties = rendererUserProperties;
    }
    model.rendererProperties = rendererProperties;

    // Transform Properties
    if (this.transformInteractor) {
      // Update the local transform matrix from the transform interactor, we may have transformed since the last request
      this.transformMatrix = this.transformInteractor.object.matrix.elements.slice();
//      this.transformClientOnly = this.transformInteractor.clientOnly;
    }
    if (this.transformMatrix && !this.transformClientOnly) {
      rendererProperties.transformMatrix = this.transformMatrix;
    }
    if (fullReset) {
      if (this.transformClientOnly && this.transformInteractor) {
        this.transformInteractor.fullReset = fullReset;
      }
      else {
        rendererProperties.fullReset = true;
      }
    }

    // PanInteractor
    if (this.panEnable) {
      rendererProperties.panProperties = {
        widthZoomLevel: Math.min(this.panWidthZoomLevel, this.panMaximumZoomLevel),
        heightZoomLevel: Math.min(this.panHeightZoomLevel, this.panMaximumZoomLevel)
      };
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
        "scenePointColor": "--avs-scene-point-color",
        "sceneLineColor": "--avs-scene-line-color",
        "sceneLineWidth": "--avs-scene-line-width",
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
        "chartPointColor": "--avs-chart-point-color",
        "chartLineColor": "--avs-chart-line-color",
        "chartLineWidth": "--avs-chart-line-width",
        "chartLinePattern": "--avs-chart-line-pattern",
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
        "axisTextColor": "--avs-axis-text-color",
        "axisTextRotation": "--avs-axis-text-rotation",
        "axisFontFamily": "--avs-axis-font-family",
        "axisFontStyle": "--avs-axis-font-style",
        "axisFontWeight": "--avs-axis-font-weight",
        "axisFontSize": "--avs-axis-font-size",
        // Axis axle
        "axisAxleColor": "--avs-axis-axle-color",
        "axisAxleWidth": "--avs-axis-axle-width",
        // Axis major tick marks
        "axisMajorTickMarkColor": "--avs-axis-major-tick-mark-color",
        "axisMajorTickMarkWidth": "--avs-axis-major-tick-mark-width",
        // Axis major tick lines
        "axisMajorTickLineColor": "--avs-axis-major-tick-line-color",
        "axisMajorTickLineWidth": "--avs-axis-major-tick-line-width",
        "axisMajorTickLineStyle": "--avs-axis-major-tick-line-style",
        // Axis major unlabeled tick marks
        "axisMajorUnlabeledTickMarkColor": "--avs-axis-major-unlabeled-tick-mark-color",
        "axisMajorUnlabeledTickMarkWidth": "--avs-axis-major-unlabeled-tick-mark-width",
        // Axis major unlabeled tick lines
        "axisMajorUnlabeledTickLineColor": "--avs-axis-major-unlabeled-tick-line-color",
        "axisMajorUnlabeledTickLineWidth": "--avs-axis-major-unlabeled-tick-line-width",
        "axisMajorUnlabeledTickLineStyle": "--avs-axis-major-unlabeled-tick-line-style",
        // Axis minor tick marks
        "axisMinorTickMarkColor": "--avs-axis-minor-tick-mark-color",
        "axisMinorTickMarkWidth": "--avs-axis-minor-tick-mark-width",
        // Axis minor tick lines
        "axisMinorTickLineColor": "--avs-axis-minor-tick-line-color",
        "axisMinorTickLineWidth": "--avs-axis-minor-tick-line-width",
        "axisMinorTickLineStyle": "--avs-axis-minor-tick-line-style",
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
        "legendPointColor": "--avs-legend-point-color",
        // Legend title
        "legendTitleTextColor": "--avs-legend-title-text-color",
        "legendTitleTextRotation": "--avs-legend-title-text-rotation",
        "legendTitleFontFamily": "--avs-legend-title-font-family",
        "legendTitleFontStyle": "--avs-legend-title-font-style",
        "legendTitleFontWeight": "--avs-legend-title-font-weight",
        "legendTitleFontSize": "--avs-legend-title-font-size"
      } );

    // Data source properties
    if (this.dataSourceName) {
      model.dataSourceProperties = {
        name: this.dataSourceName
      }
      if (this.dataSourceUserProperties) {
        let dataSourceUserProperties;
        try {
          dataSourceUserProperties = JSON.parse(this.dataSourceUserProperties);
        }
        catch (error) {
          this._dispatchErrorEvent("Can't parse 'data-source-user-properties'. " + error.message);
          return undefined;
        }
        model.dataSourceProperties.userProperties = dataSourceUserProperties;
      }
    }
    
    // Stream properties
    if (this.threeViewer) {
      if (this.streamEnable) {
        rendererProperties.streamProperties = {
          chunkSizeFirst: this.streamChunkSizeFirst,
          chunkSize: this.streamChunkSize
        };
      }
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
  _onResize(contentRect: DOMRect) {
    // Get the width & height provided by our container
    this.width = Math.round(contentRect.width);
    this.height = Math.round(contentRect.height);

    if (this.rectCanvas) {
      this.rectCanvas.width = this.width;
      this.rectCanvas.height = this.height;
    }

    // Check if we need to acquire a new scene due to
    // the size change and other properties
    if (!this.urlLoadJsonFile &&
        !this.manualUpdate &&
        this.resizeThreshold > 0 &&
       (!this.lowResizeWidth ||
        this.width < this.lowResizeWidth ||
        this.width > this.highResizeWidth ||
        this.height < this.lowResizeHeight ||
        this.height > this.highResizeHeight)) {

      this._updateResizeLimits();
      this.updateViewer();
    }
    else {
      if (this.threeViewer) {
        this.threeViewer.render(true);
      }
    }
  }

  _updateResizeLimits() {
    this.lowResizeWidth = (100 - this.resizeThreshold) / 100 * this.width;
    this.highResizeWidth = (100 + this.resizeThreshold) / 100 * this.width;
    this.lowResizeHeight = (100 - this.resizeThreshold) / 100 * this.height;
    this.highResizeHeight = (100 + this.resizeThreshold) / 100 * this.height;
  }

  showSpinner() {
    var spinner = window.getComputedStyle(this, null).getPropertyValue("--avs-spinner").trim().replace(/['"]+/g, '');
    if (spinner.length > 0) {
      fetch(spinner)
        .then((response) => {
          if (response.ok) {
            return response.text();
          }
        })
        .then((html) => {
          this.renderRoot.querySelector('#spinner').innerHTML = html;  
        })
        .catch((error) => {
          this.renderRoot.querySelector('#spinner').innerHTML = AVS;
        });
    }
    else {
      this.renderRoot.querySelector('#spinner').innerHTML = AVS;
    }

    const spinnerEl = this.renderRoot.querySelector('#spinner') as HTMLDivElement;
    spinnerEl.style.display = 'block';
  }

  hideSpinner() {
    const spinnerEl = this.renderRoot.querySelector('#spinner') as HTMLDivElement;
    spinnerEl.style.display = 'none';
  }

  startSpinner() {
    this.renderRoot.querySelector('#spinner').className = 'spin';
  }

  stopSpinner() {
    this.renderRoot.querySelector('#spinner').className = '';
  }

  /**
   * At least one of the properties was changed.
   */
  updated(changedProperties: PropertyValues<this>) {
    if (!['IMAGE', 'SVG', 'THREEJS'].includes(this.renderer)) {
      this._dispatchErrorEvent("'renderer' property must be 'IMAGE', 'SVG' or 'THREEJS'.");
      return;
    }

    if (changedProperties.has('renderer')) {
      this._rendererChanged(this.renderer, changedProperties['renderer']);
    }
    if (changedProperties.has('transformEnable')) {
      this._transformEnableChanged(this.transformEnable, changedProperties['transformEnable']);
    }
    if (changedProperties.has('transformClientOnly')) {
      this._transformClientOnlyChanged(this.transformClientOnly, changedProperties['transformClientOnly']);
    }
    if (changedProperties.has('transformRotateDisable')) {
      this._transformRotateDisableChanged(this.transformRotateDisable, changedProperties['transformRotateDisable']);
    }
    if (changedProperties.has('transformZoomDisable')) {
      this._transformZoomDisableChanged(this.transformZoomDisable, changedProperties['transformZoomDisable']);
    }
    if (changedProperties.has('transformPanDisable')) {
      this._transformPanDisableChanged(this.transformPanDisable, changedProperties['transformPanDisable']);
    }
    if (changedProperties.has('animatedGlyphsVisible')) {
      this._animatedGlyphsVisibleChanged(this.animatedGlyphsVisible, changedProperties['animatedGlyphsVisible']);
    }
    if (changedProperties.has('animatedGlyphsEnable')) {
      this._animatedGlyphsEnableChanged(this.animatedGlyphsEnable, changedProperties['animatedGlyphsEnable']);
    }
    if (changedProperties.has('transformTwistAngle') || changedProperties.has('transformTiltAngle') || changedProperties.has('transformScale')) {
      this._transformValueChanged();
    }
    if (changedProperties.has('animatedGlyphsEnable')) {
      this._animatedGlyphsEnableChanged(this.animatedGlyphsEnable, changedProperties['animatedGlyphsEnable']);
    }
    if (changedProperties.has('zoomRectangleEnable')) {
      this._zoomRectangleEnableChanged(this.zoomRectangleEnable, changedProperties['zoomRectangleEnable']);
    }
    if (changedProperties.has('panEnable')) {
      this._panEnableChanged(this.panEnable, changedProperties['panEnable']);
    }
    if (changedProperties.has('panZoomEnable')) {
      this._panZoomEnableChanged(this.panZoomEnable, changedProperties['panZoomEnable']);
    }
    if (changedProperties.has('panWidthZoomLevel')) {
      this._panWidthZoomLevelChanged(this.panWidthZoomLevel, changedProperties['panWidthZoomLevel']);
    }
    if (changedProperties.has('panHeightZoomLevel')) {
      this._panHeightZoomLevelChanged(this.panHeightZoomLevel, changedProperties['panHeightZoomLevel']);
    }
    if (changedProperties.has('panMaximumZoomLevel')) {
      this._panMaximumZoomLevelChanged(this.panMaximumZoomLevel, changedProperties['panMaximumZoomLevel']);
    }
    if (changedProperties.has('trackEnable')) {
      this._trackEnableChanged(this.trackEnable, changedProperties['trackEnable']);
    }
    if (changedProperties.has('displayCanvas')) {
      this._displayCanvasChanged(this.displayCanvas, changedProperties['displayCanvas']);
    }
    if (changedProperties.has('motionCaptureControlsEnable')) {
      this._motionCaptureControlsEnableChanged(this.motionCaptureControlsEnable, changedProperties['motionCaptureControlsEnable']);
    }
    if (changedProperties.has('motionCapture')) {
      this._motionCaptureValueChanged(this.motionCapture, changedProperties['motionCapture']);
    }

    if (!this.url) {
      //this._dispatchErrorEvent(''url' property must point to an instance of AVS/Go server.');
      return;
    }

    let doUpdate = false;
    if (this.manualUpdate) {
      if (this.forceUpdate) {
        doUpdate = true;
      }
    }
    else {
      if (this.forceUpdate ||
        changedProperties.has('url') ||
        changedProperties.has('renderer') ||
        changedProperties.has('urlLoadJsonFile') ||
        changedProperties.has('sceneName') ||
        changedProperties.has('sceneUserProperties') ||
        changedProperties.has('dataSourceName') ||
        changedProperties.has('dataSourceUserProperties') ||
        changedProperties.has('rendererName') ||
        changedProperties.has('rendererUserProperties') ||
        changedProperties.has('streamEnable') ||
        (this.panEnable && changedProperties.has('panWidthZoomLevel')) ||
        (this.panEnable && changedProperties.has('panHeightZoomLevel'))) {
        doUpdate = true;
      }
    }

    if (doUpdate) {
      this.forceUpdate = false;

      // Send the model to the server
      if (this.urlLoadJsonFile) {
        this.chunkFile = 0;
        this.showSpinner();
        this.startSpinner();
        this._httpRequest(this.url, this._handleHttpResponse.bind(this), this._handleHttpError.bind(this));
      }
      else {
        this.model = this._assembleModel(/*fullReset*/);
        if (this.model) {
          this.showSpinner();
          this.startSpinner();
          this._httpRequest(this.url, this._handleHttpResponse.bind(this), this._handleHttpError.bind(this), this.model);
        }
      }
    }
  }

  /**
   * HTTP error handler.
   */
  _handleHttpError() {
    this.hideSpinner();
  }

  /**
   * 
   */
  updateViewer() {
    this.forceUpdate = true;
    this.requestUpdate();
  }

  /**
   *
   */
  clear() {
    if (this.threeViewer) {
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
   * @param response Response parsed from HTTP or file.
   */
  _handleHttpResponse(response: DataVizResponse) {
    if (response) {
      if (response.selectionInfo) {
        this._dispatchPickEvents(response.selectionInfo);
      }

      if (response.sceneInfo) {
        /**
         * Scene info from the server.
         * @event avs-scene-info
         */
        this.dispatchEvent(new CustomEvent('avs-scene-info', { detail: response.sceneInfo }));

        const motionCapture = this.renderRoot.querySelector('#motionCapture') as HTMLDivElement;
        const zoomOverlay = this.renderRoot.querySelector('#zoomOverlay') as HTMLDivElement;
        const tooltip = this.renderRoot.querySelector('#tooltip') as HTMLDivElement;
        const motionCaptureTooltip = this.renderRoot.querySelector('#motionCaptureTooltip') as HTMLDivElement;

        // Set animation controls, tooltip and zoom overlay style to reversed theme
        if (response.sceneInfo.backgroundColor) {
          var col = response.sceneInfo.backgroundColor.match(/[0-9.]+/gi);
          var bgCol = this.getInheritedBackgroundCol(this).trim().match(/[0-9.]+/gi);
          var blendedR = (Number(col[0]) * Number(col[3]));
          var blendedG = (Number(col[1]) * Number(col[3]));
          var blendedB = (Number(col[2]) * Number(col[3]));
		      if (Number(col[3]) == 0) {
            // In case sceneInfo.backgroundColor is transparent, blend with inherited background color
            blendedR += (bgCol[0] * (1 - Number(col[3])));
            blendedG += (bgCol[1] * (1 - Number(col[3])));
            blendedB += (bgCol[2] * (1 - Number(col[3])));
          }
          motionCapture.style.color = "var(--avs-motion-capture-color, rgb(" + blendedR + ", " + blendedG + ", " + blendedB + "))";
          zoomOverlay.style.color = "var(--avs-zoom-overlay-color, rgb(" + blendedR + "," + blendedG + "," + blendedB + "))";
          tooltip.style.color = "var(--avs-tooltip-color, rgb(" + blendedR + "," + blendedG + "," + blendedB + "))";
          motionCaptureTooltip.style.color = "var(--avs-tooltip-color, rgb(" + blendedR + "," + blendedG + "," + blendedB + "))";
        }
        if (response.sceneInfo.color) {
          var col = response.sceneInfo.color.match(/[0-9.]+/gi);
          motionCapture.style.background = "var(--avs-motion-capture-background, rgba(" + col[0] + "," + col[1] + "," + col[2] + ",0.75))";
          zoomOverlay.style.background = "var(--avs-zoom-overlay-background, rgba(" + col[0] + "," + col[1] + "," + col[2] + ",0.75))";
          tooltip.style.background = "var(--avs-tooltip-background, rgb(" + col[0] + "," + col[1] + "," + col[2] + "))";
          motionCaptureTooltip.style.background = "var(--avs-tooltip-background, rgb(" + col[0] + "," + col[1] + "," + col[2] + "))";
        }
        if (response.sceneInfo.fontFamily) {
          motionCapture.style.fontFamily = "var(--avs-motion-capture-font-family, " + response.sceneInfo.fontFamily + ")";
          zoomOverlay.style.fontFamily = "var(--avs-zoom-overlay-font-family, " + response.sceneInfo.fontFamily + ")";
          tooltip.style.fontFamily = "var(--avs-tooltip-font-family, " + response.sceneInfo.fontFamily + ")";
          motionCaptureTooltip.style.fontFamily = "var(--avs-tooltip-font-family, " + response.sceneInfo.fontFamily + ")";
        }
      }

      if (response.image) {
        this.sceneImage.src = response.image;

        if (response.imagemap) {
          this.sceneImageMap.innerHTML = decodeURIComponent(response.imagemap.replace(/\+/g, '%20'));

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
        
        if (!this.urlLoadJsonFile) {
          this._dispatchSceneData(response);
        }

        this._handleLoadComplete();
      }
      else if (response.svg) {
        this.svgDiv.innerHTML = decodeURIComponent(response.svg.replace(/\+/g, '%20'));
        
        if (!this.urlLoadJsonFile) {
          this._dispatchSceneData(response);
        }

        this._handleLoadComplete();
      }
      else if (response.threejs) {
        if (!this.urlLoadJsonFile) {
          this._dispatchSceneData(response);
        }

        if (response.threejs.chunkId) {
          this.threeViewer.loadGeometryAsEvents(response.threejs, this._handleLoadComplete.bind(this));

          if (response.threejs.moreChunks) {
            if (this.urlLoadJsonFile) {
              // Load the next chunk file
              this.chunkFile++;
              const urlBase = this.url.substring(0, this.url.lastIndexOf('.')) || this.url;
              const ext = this.url.split('.').pop();
              this._httpRequest(urlBase + '-' + this.chunkFile + '.' + ext, this._handleHttpResponse.bind(this), this._handleHttpError.bind(this));
            }
            else {
              // Get the next chunk from the server
              this.model.rendererProperties.streamProperties.chunkId = response.threejs.chunkId;
              this._httpRequest(this.url, this._handleHttpResponse.bind(this), this._handleHttpError.bind(this), this.model);
            }
          }
        }
        else {
          this.threeViewer.loadGeometryAsJson(response.threejs, this._handleLoadComplete.bind(this));
        }
      }
      else {
        this._dispatchErrorEvent("No image, SVG, or ThreeJS found in response.");
        this._handleLoadComplete();
      }
    }
  }

  getInheritedBackgroundCol(el: HTMLElement) {
    var defaultStyle = this.getDefaultBackground();

    var bgCol = window.getComputedStyle(el).backgroundColor;
    if (bgCol != defaultStyle) {
      return bgCol;
    }

    if (!el.parentElement) {
      return defaultStyle;
    }

    return this.getInheritedBackgroundCol(el.parentElement);
  }

  getDefaultBackground() {
    // have to add to the document in order to use getComputedStyle
    var div = document.createElement("div");
    document.head.appendChild(div);
    var bg = window.getComputedStyle(div).backgroundColor;
    document.head.removeChild(div);
    return bg;
  }

  /**
   *
   */
  _handleLoadComplete() {
    // Stop and hide the spinner
    this.hideSpinner();
    this.stopSpinner();

    /**
     * Scene load has completed.
     * @event avs-load-complete
     */
    this.dispatchEvent(new CustomEvent('avs-load-complete'));
  }

  /**
   * 
   */
  _dispatchSceneData(data: DataVizResponse) {
    /**
     * Scene data from server.
     * @event avs-scene-data
     */
    this.dispatchEvent(new CustomEvent('avs-scene-data', { detail: data }));
  }

  /**
   * @param e
   */
  _handleTap(x: number, y: number, currentTarget: EventTarget) {
    const adjustedCoords = this._getAdjustedCoords(x, y);
    const pickProperties: PickProperties = {
      type: "TAP",
      x: adjustedCoords.x,
      y: adjustedCoords.y,
      level: this.tapLevel,
      depth: this.tapDepth,
      highlight: this.tapHighlightEnable,
      highlightColor: this.tapHighlightColor,
      highlightLayer: this.tapHighlightLayerEnable
    };

    this._processPick( pickProperties, this.tapProcessEventOnClient, currentTarget );
  }
  
  /**
   * @param e
   */
  _handleTrack(state: string, x: number, y: number, dx: number, dy: number) {
    var adjustedCoords = this._getAdjustedRectangleCoords(x, y, dx, dy);

    switch(state) {
      case 'start':
        break;

      case 'track':
        this.rectCtx.clearRect(0,0,this.width,this.height);
        this._rectangleStyle();
        this.rectCtx.strokeRect(adjustedCoords.left, adjustedCoords.top, adjustedCoords.right - adjustedCoords.left, adjustedCoords.bottom - adjustedCoords.top);
        break;

      case 'end':
        this.rectCtx.clearRect(0,0,this.width,this.height);

        const pickProperties: PickProperties = {
          type: "TRACK",
          left: adjustedCoords.left,
          right: adjustedCoords.right,
          top: adjustedCoords.top,
          bottom: adjustedCoords.bottom,
          level: this.trackLevel,
          depth: this.trackDepth,
          highlight: this.trackHighlightEnable,
          highlightColor: this.trackHighlightColor,
          highlightLayer: this.trackHighlightLayerEnable
        };

        this._processPick( pickProperties, this.trackProcessEventOnClient );
        break;
    }
  }

  /**
   * @param e
   */
  _handlePointerDown(e: PointerEvent) {
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
  _handlePointerMove(e: PointerEvent) {
    if (this.tracking >= 1) {
      if (this.tracking === 1) {
        var dx = Math.abs(e.clientX - this.pointerDownX);
        var dy = Math.abs(e.clientY - this.pointerDownY);
        if (dx*dx + dy*dy >= 5) {
          this.tracking = 2;
          this._handleTrack("start", e.clientX, e.clientY, e.clientX-this.pointerDownX, e.clientY-this.pointerDownY);
        }
      }
      if (this.tracking === 2) {
        this._handleTrack("track", e.clientX, e.clientY, e.clientX-this.pointerDownX, e.clientY-this.pointerDownY);
      }
    }

    if (this.hoverEnable) {
      var adjustedCoords = this._getAdjustedCoords(e.clientX, e.clientY);
      const pickProperties: PickProperties = {
        type: "HOVER",
        x: adjustedCoords.x,
        y: adjustedCoords.y
      };

      if (this.pointerDown) {
        pickProperties.selected = [];
        this._dispatchPickEvents( pickProperties );
      }
      else {
	    if (this.hoverLevel !== undefined) pickProperties.level = this.hoverLevel;
	    if (this.hoverDepth !== undefined) pickProperties.depth = this.hoverDepth;
	    if (this.hoverHighlightEnable) pickProperties.highlight = true;
	    if (this.hoverHighlightColor !== undefined) pickProperties.highlightColor = this.hoverHighlightColor;
	    if (this.hoverHighlightLayerEnable) pickProperties.highlightLayer = true;

        this._processPick( pickProperties, true, e.target );
      }
    }

    this._resetTimer();      
  }

  /**
   * @param e
   */
  _handlePointerUp(e: PointerEvent) {
    this.pointerDown = false;

    if (this.tapping) {
      this.tapping = false;
      var dx = Math.abs(e.clientX - this.pointerDownX);
      var dy = Math.abs(e.clientY - this.pointerDownY);
      if (dx*dx + dy*dy < 25) {
        this._handleTap(e.clientX, e.clientY, e.currentTarget);
      }
    }

    if (this.tracking > 1) {
      this.tracking = 0;
      this._handleTrack("end", e.clientX, e.clientY, e.clientX-this.pointerDownX, e.clientY-this.pointerDownY);
    }
  }

  _getAdjustedCoords(x: number, y: number) {
    var rect = this.renderRoot.querySelector('#dataVizDiv').getBoundingClientRect();
    var adjustedX = Math.round(x - rect.left);
    var adjustedY = Math.round(y - rect.top);
    var clampX = Math.max(0, Math.min(adjustedX, this.width));
    var clampY = Math.max(0, Math.min(adjustedY, this.height));
	
    return {x:clampX, y:clampY};
  }
  
  _getAdjustedRectangleCoords(x: number, y: number, dx: number, dy: number) {
    var rect = this.renderRoot.querySelector('#dataVizDiv').getBoundingClientRect();
    var adjustedX = Math.round(x - rect.left);
    var adjustedY = Math.round(y - rect.top);
    var clampX = Math.max(0, Math.min(adjustedX, this.width));
    var clampY = Math.max(0, Math.min(adjustedY, this.height));
    var startX = Math.max(0, Math.min(adjustedX - dx, this.width));
    var startY = Math.max(0, Math.min(adjustedY - dy, this.height));
    
    var left = Math.min(startX, clampX);
    var right = Math.max(startX, clampX);
    var top = Math.min(startY, clampY);
    var bottom = Math.max(startY, clampY);

    return {left: left, right: right, top: top, bottom: bottom};
  }

  _processPick( pickProperties: PickProperties, processEventOnClient?: boolean, originalTarget?: any ) {
    if (processEventOnClient) {
      if (this.threeViewer) {
        // ThreeJS client side pick processing

        this.threeViewer.setPickDepth( pickProperties.depth === "ALL" ? PickDepthEnum.All : PickDepthEnum.Closest );
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
          const selectedInfo: SelectedInfo = {};

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
            console.log(pickProperties.x + " " + pickProperties.y);
            if (area.shape === "poly" && this._pointInPoly(pickProperties.x, pickProperties.y, area.coords)) {

              const selectedInfo: SelectedInfo = {};
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
    else if (!this.urlLoadJsonFile) {
      // Server side pick processing

      this.showSpinner();
      if (this.url) {
        this.startSpinner();

        // Send the model to the server
        this.model = this._assembleModel();
        if (this.model) {
          this.model.rendererProperties.pickProperties = pickProperties;
          this._httpRequest(this.url, this._handleHttpResponse.bind(this), this._handleHttpError.bind(this), this.model);
        }
      }
    } 
  }

  _pointInPoly(x: number, y: number, coords: Array<number>): boolean {
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
        else if (f === 0) return false;
      }
      else if (dy1 > 0 && dy2 <= 0) {
        f = (dx1 * dy2) - (dx2 * dy1);
        if (f < 0) k++;
        else if (f === 0) return false;
      }
      else if (dy2 === 0 && dy1 < 0) {
        f = (dx1 * dy2) - (dx2 * dy1);
        if (f === 0) return false;
      }
      else if (dy1 === 0 && dy2 < 0) {
        f = dx1 * dy2 - dx2 * dy1;
        if (f === 0) return false;
      }
      else if (dy1 === 0 && dy2 === 0) {
        if (dx2 <= 0 && dx1 >= 0) {
          return false;
        }
        else if (dx1 <= 0 && dx2 >= 0) {
          return false;
        }
      }
 
      dy1 = dy2;
      dx1 = dx2;
    }

    if (k % 2 === 0) return false;
    return true;
  }

  /**
   * Dispatch the appropriate tap, track or hover event.
   */
  _dispatchPickEvents(pickProperties: PickProperties) {

    const pickDetail: PickDetail = {
      selected: pickProperties.selected
    };

    if (pickProperties.type === 'TRACK') {
      pickDetail.left   = pickProperties.left;
      pickDetail.top    = pickProperties.top;
      pickDetail.right  = pickProperties.right;
      pickDetail.bottom = pickProperties.bottom;

      /**
       * A track event occurred.
       * @event avs-track
       */
      this.dispatchEvent(new CustomEvent('avs-track', { detail: pickDetail }));
    }
    else {
      pickDetail.x = pickProperties.x;
      pickDetail.y = pickProperties.y;

      if (pickProperties.type === 'HOVER') {
        /**
         * A hover event occurred.
         * @event avs-hover
         */
        this.dispatchEvent(new CustomEvent('avs-hover', { detail: pickDetail }));
      }
      else {
        /**
         * A tap event occurred.
         * @event avs-tap
         */
        this.dispatchEvent(new CustomEvent('avs-tap', { detail: pickDetail }));
      }
    }
  }

  _resetTimer() {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      /**
       * A pointer timeout event occurred.
       * @event avs-pointer-timeout
       */
      this.dispatchEvent(new Event('avs-pointer-timeout'));
    }, this.pointerTimeout * 1000);
  }

  constructor() {
    super();

    // Set default property values
    this.renderer = "THREEJS";
    this.resizeThreshold = 10;
    this.pointerTimeout = 600;
    this.panWidthZoomLevel = 100;
    this.panHeightZoomLevel = 100;
    this.panMaximumZoomLevel = 1000;

    this.lowResizeWidth = this.highResizeWidth = 0;
    this.highResizeWidth = this.highResizeHeight = 0;

    this.motionCaptureTime = 0;
    this.motionCaptureFrames ??= [];

    this._resetTimer();
    this._updatePixelRatio();
  }

  /**
   * Element connected to the DOM
   */
  connectedCallback() {
    super.connectedCallback();

    ro.observe(this);

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
  }

  /**
   * Element disconnected from the DOM
   */
  disconnectedCallback() {
    super.disconnectedCallback();

    ro.unobserve(this);
  }

  _handlePointerEnterMotionCaptureControl(e: PointerEvent) {
    if (!this.showMotionCaptureTooltip) {
      var adjustedCoords = this._getAdjustedCoords(e.clientX, e.clientY);
      var motionCaptureTooltip = this.renderRoot.querySelector('#motionCaptureTooltip') as HTMLDivElement;
      var pos = this._calcTooltipPosition(motionCaptureTooltip, adjustedCoords.x, adjustedCoords.y);
      motionCaptureTooltip.style.left = pos.x + "px";
      motionCaptureTooltip.style.top = pos.y + "px";
      motionCaptureTooltip.style.opacity = "1";
      const target = e.currentTarget as HTMLElement;
      motionCaptureTooltip.innerHTML = target.dataset.tooltip ?? target.id;
      this.showMotionCaptureTooltip = true;
    }
  }

  _handlePointerLeaveMotionCaptureControl() {
    var motionCaptureTooltip = this.renderRoot.querySelector('#motionCaptureTooltip') as HTMLDivElement;
    motionCaptureTooltip.style.opacity = "0";
    this.showMotionCaptureTooltip = false;
  }

  _round2dp(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  _handleMotionCaptureSnapshot() {
    const transform = this._getTransformComponents();
    if (this.motionCaptureFrames.length > 0) {
      this.motionCaptureTime += this.motionCaptureDelay;
    }
    const frame: MotionCaptureFrame = {
      time: this.motionCaptureTime * 1000,
      scale: this._round2dp(transform.scale),
      position: [this._round2dp(transform.position[0]),
                 this._round2dp(transform.position[1]),
                 this._round2dp(transform.position[2])],
      rotation: [this._round2dp(transform.rotation[0]),
                 this._round2dp(transform.rotation[1]),
                 this._round2dp(transform.rotation[2]),
                 transform.rotation[3]]
    };
    this.motionCaptureFrames.push(frame);

    if (this.motionCaptureFrames.length == 1) {
      this.renderRoot.querySelector('#motionCapturePlay').classList.remove("disabled");
      this.renderRoot.querySelector('#motionCaptureDelay').classList.remove("disabled");
      this.renderRoot.querySelector('#motionCaptureDelayLabel').innerHTML = "2";
      this.renderRoot.querySelector('#motionCaptureClear').classList.remove("disabled");
      this.renderRoot.querySelector('#motionCaptureCopyData').classList.remove("disabled");
      this.renderRoot.querySelector('#motionCaptureCopyUrl').classList.remove("disabled");
      this.motionCaptureDelay = 2;
    }
    this.renderRoot.querySelector('#motionCaptureSnapshotLabel').innerHTML = String(this.motionCaptureFrames.length);
  }

  _handleMotionCaptureDelayIncrease() {
    this.motionCaptureDelay++;
    if (this.motionCaptureDelay > 9) {
      this.motionCaptureDelay = 9;
    }
    this.renderRoot.querySelector('#motionCaptureDelayLabel').innerHTML = String(this.motionCaptureDelay);
  }

  _handleMotionCaptureDelayDecrease() {
    this.motionCaptureDelay--;
    if (this.motionCaptureDelay < 1) {
      this.motionCaptureDelay = 1;
    }
    this.renderRoot.querySelector('#motionCaptureDelayLabel').innerHTML = String(this.motionCaptureDelay);
  }

  _handleMotionCaptureCopyData() {
    // Convert to JSON and copy to clipboard
    const data = JSON.stringify(this.motionCaptureFrames);
    navigator.clipboard.writeText(data);

    // Show alert
    const motionCaptureAlert = this.renderRoot.querySelector('#motionCaptureAlert') as HTMLDivElement;
    motionCaptureAlert.innerHTML = "Motion capture URL copied to clipboard";
    motionCaptureAlert.style.opacity = "1";
    setTimeout(() => {
      motionCaptureAlert.style.opacity = "0";
    }, 2000);
  }

  async _handleMotionCaptureCopyUrl() {
    // Convert to JSON, compress and base64url encode
    const json = JSON.stringify(this.motionCaptureFrames);
    const compressed = await this._compress(json);
    const encoded = btoa(String.fromCharCode(...new Uint8Array(compressed))).replaceAll('/', '_').replaceAll('+', '-');

    // Create URL and copy to clipboard
    const url = window.location.origin + window.location.pathname + "?motionCapture=" + encoded;
    navigator.clipboard.writeText(url);

    // Show alert
    const motionCaptureAlert = this.renderRoot.querySelector('#motionCaptureAlert') as HTMLDivElement;
    motionCaptureAlert.innerHTML = "Motion capture URL copied to clipboard";
    motionCaptureAlert.style.opacity = "1";
    setTimeout(() => {
      motionCaptureAlert.style.opacity = "0";
    }, 2000);
  }

  /**
   * Convert a string to its UTF-8 bytes and compress it.
   *
   * @param {string} str
   * @returns {Promise<Uint8Array>}
   */
  async _compress(str: string) {
    // Convert the string to a byte stream.
    const stream = new Blob([str]).stream();

    // Create a compressed stream.
    const compressedStream = stream.pipeThrough(
      new CompressionStream("gzip")
    );

    // Read all the bytes from this stream.
    const chunks = [];
    for await (const chunk of compressedStream) {
      chunks.push(chunk);
    }
    return this._concatUint8Arrays(chunks);
  }

  /**
   * Decompress bytes into a UTF-8 string.
   *
   * @param {Uint8Array} compressedBytes
   * @returns {Promise<string>}
   */
  async _decompress(compressedBytes) {
    // Convert the bytes to a stream.
    const stream = new Blob([compressedBytes]).stream();

    // Create a decompressed stream.
    const decompressedStream = stream.pipeThrough(
      new DecompressionStream("gzip")
    );

    // Read all the bytes from this stream.
    const chunks = [];
    for await (const chunk of decompressedStream) {
      chunks.push(chunk);
    }
    const stringBytes = await this._concatUint8Arrays(chunks);

    // Convert the bytes to a string.
    return new TextDecoder().decode(stringBytes);
  }

  /**
   * Combine multiple Uint8Arrays into one.
   *
   * @param {ReadonlyArray<Uint8Array>} uint8arrays
   * @returns {Promise<Uint8Array>}
   */
  async _concatUint8Arrays(uint8arrays) {
    const blob = new Blob(uint8arrays);
    const buffer = await blob.arrayBuffer();
    return new Uint8Array(buffer);
  }

  _handleMotionCaptureClear() {
    this.motionCaptureFrames.length = 0;
    this.renderRoot.querySelector('#motionCapturePlay').classList.add("disabled");
    this.renderRoot.querySelector('#motionCaptureSnapshotLabel').innerHTML = "0";
    this.renderRoot.querySelector('#motionCaptureDelay').classList.add("disabled");
    this.renderRoot.querySelector('#motionCaptureDelayLabel').innerHTML = "0";
    this.renderRoot.querySelector('#motionCaptureClear').classList.add("disabled");
    this.renderRoot.querySelector('#motionCaptureCopyData').classList.add("disabled");
    this.renderRoot.querySelector('#motionCaptureCopyUrl').classList.add("disabled");
    this.motionCaptureDelay = 0;
    this.motionCaptureTime = 0;
  }

  _updatePixelRatio(change?: boolean) {
    const pr = window.devicePixelRatio;
    matchMedia( `(resolution: ${pr}dppx)` ).addEventListener('change', this._updatePixelRatio.bind(this, true), { once: true } );
    if (change) {
      this.updateViewer();
    }
  }

  /**
   * Change in 'motion-capture-controls-enable' property.
   */
  _motionCaptureControlsEnableChanged(newValue, oldValue) {
    const el = this.renderRoot.querySelector('#motionCapture') as HTMLDivElement;
    el.style.display = newValue ? "block" : "none";
  }

  /**
   * Change in 'transform-enable' property.
   */
  _transformEnableChanged(newValue, oldValue) {
    if (this.threeViewer) {
      if (newValue) {
        if (this.transformInteractor === undefined) {
          this.transformInteractor = new TransformInteractor(this.renderRoot.querySelector('#dataVizDiv'));
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
  panTo(x: number, y: number, z: number) {
    if (this.transformInteractor) {
      this.transformInteractor.panTo(x, y, z);
    }
  }

  _getTransformComponents() {
    var pos = new Vector3();
    var quat = new Quaternion();
    var scale = new Vector3();
    var euler = new Euler();
    var mat;
    if (this.transformInteractor) {
      mat = this.transformInteractor.object.matrix;
    }
    mat.decompose(pos, quat, scale);
    euler.setFromQuaternion(quat);
    return {
      position: pos.toArray(),
      rotation: [euler.x * 180 / Math.PI, euler.y * 180 / Math.PI, euler.z * 180 / Math.PI],
      rotationOrder: euler.order,
      scale: 100 * scale.x
    };
  }

  getTransformMatrix() {
    if (this.transformInteractor) {
      return this.transformInteractor.object.matrix.elements.slice();
    }
  }

  runAnimation() {
    if (this.threeViewer) {
      var style = window.getComputedStyle(this, null);
      var styleMap = {
        transform: this.motionCaptureFrames.length > 0 ? JSON.stringify(this.motionCaptureFrames) : null
      };
      this._applyCustomCssProperties(styleMap, style,
        {
          "scene": "--avs-scene-animations",
          "sceneTitle": "--avs-scene-title-animations",
          "chart": "--avs-chart-animations",
          "chartTitle": "--avs-chart-title-animations",
          "axis": "--avs-axis-animations",
          "legend": "--avs-legend-animations",
          "legendTitle": "--avs-legend-title-animations",
          "glyph": "--avs-glyph-animations"
        });

      this.animator.setStyleMap(styleMap);
	    this.threeViewer.runAnimation();
    }
  }
  
  /**
   * Change in 'animated-glyphs-visible' property.
   */
  _animatedGlyphsVisibleChanged(newValue, oldValue) {
	if (this.threeViewer) {
      this.threeViewer.setVisibleAnimatedGlyphs(newValue);
    }
  }
  
  /**
   * Change in 'animated-glyphs-enable' property.
   */
  _animatedGlyphsEnableChanged(newValue, oldValue) {
	if (this.threeViewer) {
      this.threeViewer.setEnableAnimatedGlyphs(newValue);
    }
  }

  /**
   * Change in 'transform-twist-angle', 'transform-tilt-angle' or 'transform-scale' properties.
   */
  _transformValueChanged() {
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
   * Change in 'motion-capture' property.
   */
  async _motionCaptureValueChanged(newValue, oldValue) {
    if (newValue) {
      // Try parsing JSON first
      try {
        this.motionCaptureFrames = JSON.parse(newValue);
      }
      catch {
        // Decode from base64url, decompress and parse JSON
        const decoded = atob(newValue).replaceAll('_', '/').replaceAll('-', '+');
        const decompressed = await this._decompress(decoded);
        this.motionCaptureFrames = JSON.parse(decompressed);
      }

      if (!this.motionCaptureFrames) {
        this.motionCaptureFrames = [];
      }

      if (this.motionCaptureFrames.length > 0) {
        this.renderRoot.querySelector('#motionCapturePlay').classList.remove("disabled");
        this.renderRoot.querySelector('#motionCaptureSnapshotLabel').innerHTML = String(this.motionCaptureFrames.length);
        this.renderRoot.querySelector('#motionCaptureDelay').classList.remove("disabled");
        this.renderRoot.querySelector('#motionCaptureDelayLabel').innerHTML = "2";
        this.renderRoot.querySelector('#motionCaptureClear').classList.remove("disabled");
        this.renderRoot.querySelector('#motionCaptureCopyData').classList.remove("disabled");
        this.renderRoot.querySelector('#motionCaptureCopyUrl').classList.remove("disabled");
        this.motionCaptureDelay = 2;
        this.motionCaptureTime = this.motionCaptureFrames[this.motionCaptureFrames.length - 1].time / 1000;
      }
      else {
        this.renderRoot.querySelector('#motionCapturePlay').classList.add("disabled");
        this.renderRoot.querySelector('#motionCaptureSnapshotLabel').innerHTML = "0";
        this.renderRoot.querySelector('#motionCaptureDelay').classList.add("disabled");
        this.renderRoot.querySelector('#motionCaptureDelayLabel').innerHTML = "0";
        this.renderRoot.querySelector('#motionCaptureClear').classList.add("disabled");
        this.renderRoot.querySelector('#motionCaptureCopyData').classList.add("disabled");
        this.renderRoot.querySelector('#motionCaptureCopyUrl').classList.add("disabled");
        this.motionCaptureDelay = 0;
        this.motionCaptureTime = 0;
      }
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
        if (this.panZoomEnable) {
          this.panInteractor.addEventListener('change', this._handlePanChanged.bind(this));
          this.panInteractor.addEventListener('zoom', this._handlePanZoom.bind(this));
          this.panInteractor.addEventListener('zoomEnd', this._handlePanZoomEnd.bind(this));
        }
        this.panInteractor.setWidthZoomLevel(this.panWidthZoomLevel);
        this.panInteractor.setHeightZoomLevel(this.panHeightZoomLevel);
        this.panInteractor.setMaximumZoomLevel(this.panMaximumZoomLevel);
        this.panInteractor.saveState();
      }
      else {
        this.threeViewer.removeInteractor( this.panInteractor );
        if (this.panZoomEnable) {
          this.panInteractor.removeEventListener('change', this._handlePanChanged.bind(this));
          this.panInteractor.removeEventListener('zoom', this._handlePanZoom.bind(this));
          this.panInteractor.removeEventListener('zoomEnd', this._handlePanZoomEnd.bind(this));
        }
      }
    }
  }

  /**
   * Change in 'pan-zoom-enable' property.
   */
  _panZoomEnableChanged(newValue, oldValue) {
    if (this.threeViewer && this.panInteractor) {
      if (newValue) {	  
          this.panInteractor.addEventListener('change', this._handlePanChanged.bind(this));
          this.panInteractor.addEventListener('zoom', this._handlePanZoom.bind(this));
          this.panInteractor.addEventListener('zoomEnd', this._handlePanZoomEnd.bind(this));
      }
      else {
          this.panInteractor.removeEventListener('change', this._handlePanChanged.bind(this));
          this.panInteractor.removeEventListener('zoom', this._handlePanZoom.bind(this));
          this.panInteractor.removeEventListener('zoomEnd', this._handlePanZoomEnd.bind(this));
      }
    }
  }

  _handlePanChanged(e) {
    /**
     * A pan info event occurred.
     * @event avs-pan-info
     */
    this.dispatchEvent(new CustomEvent('avs-pan-info', e));
  }

  _handlePanZoom(e) {
    window.clearTimeout(this.zoomOverlayTimeoutId);

    var width = Math.round(e.detail.widthZoomLevel);
    var height = Math.round(e.detail.heightZoomLevel);
    if (width === height) {
      this.renderRoot.querySelector('#zoomOverlay').innerHTML = width + "%";
    }
    else {
      this.renderRoot.querySelector('#zoomOverlay').innerHTML = width + "%," + height + "%";
    }

    var coords = this._getAdjustedCoords(e.detail.clientX, e.detail.clientY);
    const zoomOverlay = this.renderRoot.querySelector('#zoomOverlay') as HTMLDivElement;
    zoomOverlay.style.left = coords.x + "px";
    zoomOverlay.style.top = coords.y + "px";
    zoomOverlay.style.opacity = "1";

    this.pointerDown = true;
    this._dispatchPickEvents( {type:"HOVER",x:0,y:0,selected:[]} );

    this.zoomOverlayTimeoutId = window.setTimeout(() => {
      const el = this.renderRoot.querySelector('#zoomOverlay') as HTMLDivElement;
      el.style.opacity = "0";
      this.pointerDown = false;
    }, 1000);
  }

  _handlePanZoomEnd(e) {
    this.panWidthZoomLevel = e.detail.widthZoomLevel;
    this.panHeightZoomLevel = e.detail.heightZoomLevel;
  }

  /**
   * Change in 'pan-width-zoom-level' property.
   */
  _panWidthZoomLevelChanged(newValue, oldValue) {
    if (this.panInteractor) {
      this.panInteractor.setWidthZoomLevel(newValue);
    }
  }

  /**
   * Change in 'pan-height-zoom-level' property.
   */
  _panHeightZoomLevelChanged(newValue, oldValue) {
    if (this.panInteractor) {
      this.panInteractor.setHeightZoomLevel(newValue);
    }
  }

  /**
   * Change in 'pan-maximum-zoom-level' property.
   */
  _panMaximumZoomLevelChanged(newValue, oldValue) {
    if (this.panInteractor) {
      this.panInteractor.setMaximumZoomLevel(newValue);
    }
  }

  /**
   * Reset the pan interactor.
   */
  resetPan() {
    if (this.panInteractor) {
      this.panInteractor.reset();
    }
  }

  /**
   * Change in 'renderer' property.
   */
  _rendererChanged(newValue, oldValue) {
    if (oldValue === 'IMAGE') {
      this.sceneImage.src = 'data:,';
      this.renderRoot.querySelector('#dataVizDiv').removeChild(this.sceneImage);
      this.renderRoot.querySelector('#dataVizDiv').removeChild(this.sceneImageMap);
    }
    else if (oldValue === 'SVG') {
      var el = this.svgDiv;
      while (el.firstChild) el.removeChild(el.firstChild);
      this.renderRoot.querySelector('#dataVizDiv').removeChild(this.svgDiv);
    }
    else if (this.threeViewer) {
      this.threeViewer.clearGeometry();
      this.threeViewer.render();
      this.renderRoot.querySelector('#dataVizDiv').removeChild(this.threeViewer.domElement);
    }

    if (newValue === 'IMAGE') {
      if (this.sceneImage === undefined) {
        this.sceneImage = document.createElement("img");
        this.sceneImage.setAttribute("id", "sceneImage");
        this.sceneImage.setAttribute("usemap", "#sceneImageMap");

        this.sceneImageMap = document.createElement("map");
        this.sceneImageMap.setAttribute("id", "sceneImageMap");
        this.sceneImageMap.setAttribute("name", "sceneImageMap");
      }

      this.renderRoot.querySelector('#dataVizDiv').appendChild(this.sceneImage);
      this.renderRoot.querySelector('#dataVizDiv').appendChild(this.sceneImageMap);
      this.threeViewer = null;
    }
    else if (newValue === 'SVG') {
      if (this.svgDiv === undefined) {
        this.svgDiv = document.createElement("div");
        this.svgDiv.setAttribute("id", "svgDiv");
      }

      this.renderRoot.querySelector('#dataVizDiv').appendChild(this.svgDiv);
      this.threeViewer = null;
    }
    else {
      if (!this.threeViewer) {
        // Create ThreeJS viewer
        this.threeViewer = new Viewer();

        // Check if the user has requested a specific renderer
        var rendererId = 'avsDefaultWebGLRenderer';
//      if (this.rendererProperties.webGLRendererId !== undefined) {
//    	  rendererId = this.rendererProperties.webGLRendererId;
//      }

        // Search for renderer, if not found create one and save to the DOM
        var renderer = document.getElementById(rendererId) as AvsRenderer;
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

        this.animator = new Animator();
        this.threeViewer.setAnimator(this.animator);
      }

      this.renderRoot.querySelector('#dataVizDiv').appendChild(this.threeViewer.domElement);
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
      this.renderRoot.appendChild(this.rectCanvas);
    }
    else {
      this.renderRoot.removeChild(this.rectCanvas);
    }
  }

  /**
   * Change in 'display-canvas' property.
   */
  _displayCanvasChanged(newValue, oldValue) {
    if (this.threeViewer) {
      this.threeViewer.displayCanvas = newValue;
    }
  }

  setTooltipHTML(html: string) {
    this.renderRoot.querySelector('#tooltip').innerHTML = html;
  }

  showTooltip(clientX: number, clientY: number) {
    var tooltip = this.renderRoot.querySelector('#tooltip') as HTMLDivElement;
    var pos = this._calcTooltipPosition(tooltip, clientX, clientY);
    tooltip.style.left = pos.x + "px";
    tooltip.style.top = pos.y + "px";
    tooltip.style.opacity = "1";
  }

  hideTooltip() {
    var tooltip = this.renderRoot.querySelector('#tooltip') as HTMLDivElement;
    tooltip.style.opacity = "0";
  }

  _calcTooltipPosition(tooltip: HTMLDivElement, clientX: number, clientY: number) {

    // Calculate the tooltip location based on 4 quadrants of the visible portion
    // of the visualization window

    var dataVizDiv = this.renderRoot.querySelector('#dataVizDiv') as HTMLDivElement;

    var offset = this._getOffset(dataVizDiv);
    var deltaTop = -Math.min(0, offset.top - window.pageYOffset);
    var deltaLeft = -Math.min(0, offset.left - window.pageXOffset);
    var deltaBottom = -Math.min(0, window.innerHeight - (dataVizDiv.offsetHeight + offset.top - window.pageYOffset));
    var deltaRight = -Math.min(0, window.innerWidth - (dataVizDiv.offsetWidth + offset.left - window.pageXOffset));
    var vizHeight = dataVizDiv.offsetHeight - deltaTop - deltaBottom;
    var vizWidth = dataVizDiv.offsetWidth - deltaLeft - deltaRight;
    var vizHalfX = vizWidth / 2 + deltaLeft;
    var vizHalfY = vizHeight / 2 + deltaTop;

    var toolPosition = { x: 0, y: 0 };
    if (clientX < vizHalfX) {
      var offst = (clientY < vizHalfY) ? 15 : 5;
      toolPosition.x = clientX + offst + dataVizDiv.offsetLeft;
    }
    else {
      toolPosition.x = clientX - 10 + dataVizDiv.offsetLeft - tooltip.offsetWidth;
    }
    if (clientY < vizHalfY) {
      toolPosition.y = clientY + 5 + dataVizDiv.offsetTop;
    }
    else {
      toolPosition.y = clientY - 10 + dataVizDiv.offsetTop - tooltip.offsetHeight;
    }

    return toolPosition;
  }

  _getOffset(dataVizDiv: HTMLDivElement) {
    var rect = dataVizDiv.getBoundingClientRect(),
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'avs-go-dataviz': AvsGoDataViz;
  }
}