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
 * Mixin to add stream-properties functionality.
 */
export const AvsStreamMixin = dedupingMixin((superClass) => class extends superClass {
  static get properties() {
    return {
      /**
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
      }
    }
  }

  /**
   * Add stream-properties to request structure.
   * @param request Request structure to add to.
   */
  _addStreamProperties(request) {
    var scope = this;

    if (request === undefined) {
      request = {};
    }

    if (this.streamProperties !== undefined) {
      request = Object.assign(request, {"streamProperties":this.streamProperties});
    }
  }
});
