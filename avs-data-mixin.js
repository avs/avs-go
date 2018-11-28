/*
avs-data-mixin.js
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

import {dedupingMixin} from '@polymer/polymer/lib/utils/mixin.js';

/**
 * Mixin to add data-properties functionality.
 */
export const AvsDataMixin = dedupingMixin((superClass) => class extends superClass {
  static get properties() {
    return {
      /**
       * * `libraryKey`: Name of the data on the server to acquire.
       *
       * @type {{libraryKey: string}}
       */
      dataProperties: {
        type: Object,
        value: function () {
          return {};
        }
      },
      /**
       * User properties for the data passed directly to the server.
       */
      dataUserProperties: {
        type: Object,
        value: function () {
          return {};
        }
      }
    }
  }

  /**
   * Add data-properties and data-user-properties to request structure.
   * @param request Request structure to add to.
   */
  _addDataProperties(request) {
    if (request === undefined) {
      request = {};
    }

    var dataRequest = Object.assign(this.dataProperties, {"userProperties":this.dataUserProperties});

    request = Object.assign(request, {"dataRequest":dataRequest});
  }
});
