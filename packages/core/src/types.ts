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

export type Renderer = "IMAGE" | "SVG" | "THREEJS";

export type PickDepth = "CLOSEST" | "ALL" | "FIRST";

export type PickLevel = "SCENE_NODE" | "CELL_SET" | "CELL";

export interface PanProperties {
  widthZoomLevel?: number;
  heightZoomLevel?: number;
}

export interface StreamProperties {
  chunkSizeFirst?: number;
  chunkSize?: number;
  chunkId?: string;
}

export interface PickDetail {
  x?: number;
  y?: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  selected?: Array<SelectedInfo>;
}

export interface PickProperties extends PickDetail {
  type: string;
  level?: PickLevel;
  depth?: PickDepth;
  highlight?: boolean;
  highlightLayer?: boolean;
}

export interface RendererProperties {
  name?: string;
  userProperties?: object;
  type: Renderer;
  width: number;
  height: number;
  themeName?: string;
  css?: object;
  pick?: PickProperties;
  pan?: PanProperties;
  stream?: StreamProperties;
  transformMatrix?: Array<number>;
  fullReset?: boolean;
}

export interface DataVizModel {
  scene: {
    name: string;
    userProperties?: object;
  };
  dataSource?: {
    name: string;
    userProperties?: object;
  };
  renderer?: RendererProperties;
}

export interface SelectedInfo {
  seriesIndex?: number;
  itemIndex?: number;
  componentInfo?: string;
}

export interface MotionCaptureFrame {
  time: number;
  scale: number;
  position: Array<number>;
  rotation: Array<number>;
}

export interface HttpResponse {
  error?: string;
}

export interface SceneInfo {
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  highlightColor?: string;
}

export interface ThreeJS {
  chunkId?: string;
  moreChunks?: boolean;
}

export interface DataVizResponse extends HttpResponse {
  sceneInfo?: SceneInfo;
  selectionInfo?: PickProperties;
  image?: string;
  imagemap?: string;
  svg?: string;
  threejs?: ThreeJS;
}

export interface InfoModel {
  info: {
    name: string;
    userProperties?: object;
  };
  dataSource?: {
    name: string;
    userProperties?: object;
  };
}

export interface InfoResponse extends HttpResponse {
  info?: string;
}

export interface DynamicHtmlModel {
  dynamicHtml: {
    name: string;
    userProperties?: object;
  };
  dataSource?: {
    name: string;
    userProperties?: object;
  };
}

export interface DynamicHtmlResponse extends HttpResponse {
  html?: string;
}