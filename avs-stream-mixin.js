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

import {dedupingMixin} from '@polymer/polymer/lib/utils/mixin.js';

/**
 * Mixin to add stream properties functionality.
 *
 * @polymer
 * @mixinFunction
 */
export const AvsStreamMixin = dedupingMixin((superClass) => class extends superClass {

  static get properties() {
    return {
      /**
       * Enables streaming of objects from the server.
       */
      streamEnable: {
        type: Boolean
      },
      /**
       * The number of objects streamed for the first chunk.
       */
      streamChunkSizeFirst: {
        type: Number
      },
      /**
       * The number of objects streamed per chunk.
       */
      streamChunkSize: {
        type: Number
      }
    }
  }

  /**
   * Add stream properties to renderer properties.
   * @param rendererProperties Property structure to add to.
   */
  _addStreamProperties(rendererProperties) {
    if (this.streamEnable) {
      rendererProperties.streamProperties = {};
      if (this.streamChunkSizeFirst !== undefined) rendererProperties.streamProperties.streamChunkSizeFirst = this.streamChunkSizeFirst;
      if (this.streamChunkSize !== undefined) rendererProperties.streamProperties.streamChunkSize = this.streamChunkSize;
    }
  }
});
