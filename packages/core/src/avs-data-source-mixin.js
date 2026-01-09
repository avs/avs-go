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
 * Mixin to add data source properties functionality.
 *
 * @polymer
 * @mixinFunction
 */
export const AvsDataSourceMixin = dedupingMixin((superClass) => class extends superClass {

  static get properties() {
    return {
      /**
       * Name of the data source registered in the library map on the server.
       */
      dataSourceName: {
        type: String
      },
      /**
       * User properties for the data source passed directly to the server.
       */
      dataSourceUserProperties: {
        type: Object,
        value: {}
      }
    }
  }

  /**
   * Add data-source-name and data-source-user-properties to model.
   * @param model Model to add to.
   */
  _addDataSourceProperties(model) {
    if (this.dataSourceName !== undefined) {
      model.dataSourceProperties = {"name":this.dataSourceName};
      if (this.dataSourceUserProperties !== undefined) {
        model.dataSourceProperties.userProperties = this.dataSourceUserProperties;
      }
    }
  }
});
