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

import { AvsElementBase } from './avs-element-base.js';

/**
 * `avs-go-info` is a Lit element which requests data by instancing
 * the `infoName` class on the AVS/Go server application running at `url`.
 * After setting both these properties call the `updateInfo()` method to send the request.
 * Attach a listener for the `avs-go-info-response` event to receive the response.
 *
 * Special case: use an `infoName` of `GetServerInfo` to request a listing of
 * data sources, themes, scenes, info and dynamic HTML available at `url`.
 *
 * @customElement
 * @lit
 */
export class AvsGoInfo extends AvsElementBase {
  static properties = {
    /**
     * The URL to an instance of AVS/Go server application.
     */
    url: {
      type: String
    },

    /**
     * Name of the data source registered in the library map on the server.
     */
    dataSourceName: {
      type: String,
      attribute: 'data-source-name'
    },

    /**
     * User properties for the data source passed directly to the server.
     */
    dataSourceUserProperties: {
      type: Object,
      attribute: 'data-source-user-properties'
    },

    /**
     * The name of the info registered in the library map on the server.
     */
    infoName: {
      type: String,
      attribute: 'info-name'
    },

    /**
     * User properties passed directly to the server.
     */
    infoUserProperties: {
      type: Object,
      attribute: 'info-user-properties'
    }
  }
    
  /**
   * Send the request to the server.
   */
  updateInfo() {
    if (!this.url) {
      console.error("\'url\' property must be set to an instance of AVS/Go server.");
      return;
    }
    if (!this.infoName) {
      console.error("\'info-name\' property must be set to the name of the info registered in the library map on the AVS/Go server.");
      return;
    }

    // Assemble the model
    const model = {
      infoProperties: {
        name: this.infoName,
        userProperties: this.infoUserProperties
      }
    };
    if (this.dataSourceName) {
      model.dataSourceProperties = {
        name: this.dataSourceName,
        userProperties: this.dataSourceUserProperties
      }
    }

    // Send the request
    this._httpRequest(this.url,
      (response) => {
        if (response.info) {
          const info = JSON.parse(decodeURIComponent(response.info.replace(/\+/g, '%20')));

          /**
           * Info response from server.
           * @event avs-go-info-response
           */
          this.dispatchEvent(new CustomEvent('avs-go-info-response', {
            bubbles: true,
            composed: true,
            detail: info
          }));
        }
        else {
          console.error("Empty response from AVS/Go server.");
        }
      },
      (error) => {
        this._logError(error);
      },
      model
    );
  }
}

customElements.define('avs-go-info', AvsGoInfo);