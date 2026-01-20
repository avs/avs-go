/**
 * @license
 * Copyright 2026 Advanced Visual Systems Inc.
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

import { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import { AvsGoDataViz as AvsGoDataVizPolymer } from '@avs/go/src/avs-go-dataviz';

export const AvsGoDataViz = forwardRef(({
  style,
  manualUpdate,
  displayCanvas,
  url,
  urlLoadJsonFile,
  sceneName,
  sceneUserProperties,
  dataSourceName,
  dataSourceUserProperties,
  rendererName,
  rendererUserProperties,
  renderer,
  streamEnable,
  streamChunkSizeFirst,
  streamChunkSize,
  themeName,
  hidden,
  resizeThreshold,
  aspectRatio,
  pointerTimeout,
  tapEnable,
  tapLevel,
  tapDepth,
  tapHighlightEnable,
  tapHighlightColor,
  tapHighlightLayerEnable,
  tapProcessEventOnClient,
  onTap,
  trackEnable,
  trackLevel,
  trackDepth,
  trackHighlightEnable,
  trackHighlightColor,
  trackHighlightLayerEnable,
  trackProcessEventOnClient,
  onTrack,
  hoverEnable,
  hoverLevel,
  hoverDepth,
  hoverHighlightEnable,
  hoverHighlightColor,
  hoverHighlightLayerEnable,
  onHover,
  transformEnable,
  transformClientOnly,
  transformRotateDisable,
  transformZoomDisable,
  transformPanDisable,
  transformTwistAngle,
  transformTiltAngle,
  transformScale,
  zoomRectangleEnable,
  panEnable,
  panZoomEnable,
  panWidthZoomLevel,
  panHeightZoomLevel,
  panMaximumZoomLevel,
  animatedGlyphsVisible,
  animatedGlyphsEnable,
  onSceneInfo,
  onLoadComplete,
  onPanInfo,
  onError
}, ref) => {

  const dataVizRef = useRef();
  
  useEffect(() => {
    if (!dataVizRef.current) {
      return;
    }

    function handleTap(e) {
      if (onTap) {
        onTap(e.detail);
      }
    }

    function handleTrack(e) {
      if (onTrack) {
        onTrack(e.detail);
      }
    }

    function handleHover(e) {
      if (onHover) {
        onHover(e.detail);
      }
    }

    function handleSceneInfo(e) {
      if (onSceneInfo) {
        onSceneInfo(e.detail);
      }
    }

    function handleLoadComplete(e) {
      if (onLoadComplete) {
        onLoadComplete();
      }
    }

    function handlePanInfo(e) {
      if (onPanInfo) {
        onPanInfo(e.detail);
      }
    }

    function handleError(e) {
      if (onError) {
        onError(e.detail);
      }
    }

    dataVizRef.current.addEventListener('avs-tap', handleTap);
    dataVizRef.current.addEventListener('avs-track', handleTrack);
    dataVizRef.current.addEventListener('avs-hover', handleHover);
    dataVizRef.current.addEventListener('avs-scene-info', handleSceneInfo);
    dataVizRef.current.addEventListener('avs-load-complete', handleLoadComplete);
    dataVizRef.current.addEventListener('avs-pan-info', handlePanInfo);
    dataVizRef.current.addEventListener('avs-error', handleError);

    return () => {
      if (dataVizRef.current) {
        dataVizRef.current.removeEventListener('avs-tap', handleTap);
        dataVizRef.current.removeEventListener('avs-track', handleTrack);
        dataVizRef.current.removeEventListener('avs-hover', handleHover);
        dataVizRef.current.removeEventListener('avs-scene-info', handleSceneInfo);
        dataVizRef.current.removeEventListener('avs-load-complete', handleLoadComplete);
        dataVizRef.current.removeEventListener('avs-pan-info', handlePanInfo);
        dataVizRef.current.removeEventListener('avs-error', handleError);
      }
    }
  }, []);

  useImperativeHandle(ref, () => ({
    updateViewer() {
      if (dataVizRef.current) {
        dataVizRef.current.updateViewer();
      }
    },

    runAnimation() {
      if (dataVizRef.current) {
        dataVizRef.current.runAnimation();
      }
    },
  
    resetTransform() {
      if (dataVizRef.current) {
        dataVizRef.current.resetTransform();
      }
    },
  
    zoomIn() {
      if (dataVizRef.current) {
        dataVizRef.current.zoomIn();
      }
    },
  
    zoomOut() {
      if (dataVizRef.current) {
        dataVizRef.current.zoomOut();
      }
    },
  
    panTo() {
      if (dataVizRef.current) {
        dataVizRef.current.panTo();
      }
    }
  }));

  return (
    <avs-go-dataviz
        style={style}
	    ref={dataVizRef}
	    manual-update={manualUpdate}
	    display-canvas={displayCanvas}
	    url={url}
	    url-load-json-file={urlLoadJsonFile}
	    scene-name={sceneName}
	    scene-user-properties={sceneUserProperties}
	    data-source-name={dataSourceName}
	    data-source-user-properties={dataSourceUserProperties}
	    renderer-name={rendererName}
	    renderer-user-properties={rendererUserProperties}
	    renderer={renderer}
	    stream-enable={streamEnable}
	    stream-chunk-size-first={streamChunkSizeFirst}
	    stream-chunk-size={streamChunkSize}
	    theme-name={themeName}
	    hidden={hidden}
	    resize-threshold={resizeThreshold}
	    aspect-ratio={aspectRatio}
	    pointer-timeout={pointerTimeout}
	    tap-enable={tapEnable}
	    tap-level={tapLevel}
	    tap-depth={tapDepth}
	    tap-highlight-enable={tapHighlightEnable}
	    tap-highlight-color={tapHighlightColor}
	    tap-highlight-layer-enable={tapHighlightLayerEnable}
	    tap-process-event-on-client={tapProcessEventOnClient}
	    track-enable={trackEnable}
	    track-level={trackLevel}
	    track-depth={trackDepth}
	    track-highlight-enable={trackHighlightEnable}
	    track-highlight-color={trackHighlightColor}
	    track-highlight-layer-enable={trackHighlightLayerEnable}
	    track-process-event-on-client={trackProcessEventOnClient}
	    hover-enable={hoverEnable}
	    hover-level={hoverLevel}
	    horer-depth={hoverDepth}
	    hover-highlight-enable={hoverHighlightEnable}
	    hover-highlight-color={hoverHighlightColor}
	    hover-highlight-layer-enable={hoverHighlightLayerEnable}
	    transform-enable={transformEnable}
	    transform-client-only={transformClientOnly}
	    transform-rotate-disable={transformRotateDisable}
	    transform-zoom-disable={transformZoomDisable}
	    transform-pan-disable={transformPanDisable}
	    transform-twist-angle={transformTwistAngle}
	    transform-tilt-angle={transformTiltAngle}
	    transform-scale={transformScale}
	    zoom-reactangle-enable={zoomRectangleEnable}
	    pan-enable={panEnable}
	    pan-zoom-enable={panZoomEnable}
	    pan-width-zoom-level={panWidthZoomLevel}
	    pan-height-zoom-level={panHeightZoomLevel}
	    pan-maximum-zoom-level={panMaximumZoomLevel}
	    animated-glyphs-visible={animatedGlyphsVisible}
	    animated-glyphs-enable={animatedGlyphsEnable}
	  >
	  </avs-go-dataviz>
  );
});
