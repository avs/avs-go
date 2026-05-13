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

import * as React from 'react';
import { createComponent, type EventName } from '@lit/react';

import { AvsGoDataViz as AvsGoDataVizLit } from '@avs/go/dist/avs-go-dataviz.js';
import { AvsGoInfo as AvsGoInfoLit } from '@avs/go/dist/avs-go-info.js';
import { AvsGoDynamicHtml as AvsGoDynamicHtmlLit } from '@avs/go/dist/avs-go-dynamic-html.js';

export type { Renderer, PickDepth, PickLevel } from '@avs/go/dist/types';

/**
 * `<avs-go-dataviz>` as a React component.
 */
export const AvsGoDataViz = createComponent({
  tagName: 'avs-go-dataviz',
  elementClass: AvsGoDataVizLit,
  react: React,
  events: {
    onSceneInfo: 'avs-scene-info' as EventName<CustomEvent>,
    onError: 'avs-error' as EventName<CustomEvent>,
    onTap: 'avs-tap' as EventName<CustomEvent>,
    onTrack: 'avs-track' as EventName<CustomEvent>,
    onHover: 'avs-hover' as EventName<CustomEvent>,
    onSceneData: 'avs-scene-data' as EventName<CustomEvent>,
    onLoadComplete: 'avs-load-complete',
    onPanInfo: 'avs-pan-info' as EventName<CustomEvent>
  }
});

/**
 * `<avs-go-info>` as a React component.
 */
export const AvsGoInfo = createComponent({
  tagName: 'avs-go-info',
  elementClass: AvsGoInfoLit,
  react: React,
  events: {
    onInfo: 'avs-go-info-response' as EventName<CustomEvent>,
    onError: 'avs-error' as EventName<CustomEvent>
  }
});

/**
 * `<avs-go-dynamic-html>` as a React component.
 */
export const AvsGoDynamicHtml = createComponent({
  tagName: 'avs-go-dynamic-html',
  elementClass: AvsGoDynamicHtmlLit,
  react: React,
  events: {
    onError: 'avs-error' as EventName<CustomEvent>
  }
});