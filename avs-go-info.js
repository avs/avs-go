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

import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {AvsHttpMixin} from './avs-http-mixin.js';
import {AvsDataSourceMixin} from './avs-data-source-mixin.js';

/**
 * `avs-go-info` is a Polymer 3.0 element which requests JSON data by instancing
 * the `infoName` class on the AVS/Go server application running at `url`.
 * After setting both these properties call the `updateInfo()` method to send the request.
 * Attach a listener for the `avs-go-info-response` event to receive the JSON response.
 *
 * Special case: use an `infoName` of `GetServerInfo` to request a listing of
 * data sources, themes, scenes, info and dynamic HTML available at `url`.
 *
 * @customElement
 * @polymer
 * @appliesMixin AvsHttpMixin
 * @appliesMixin AvsDataSourceMixin
 */
class AvsGoInfo extends AvsDataSourceMixin(AvsHttpMixin(PolymerElement)) {

  static get properties() {
    return {
      /**
       * The URL to an instance of AVS/Go server application.
       */
      url: {
        type: String
      },
      /**
       * The name of the info registered in the library map on the server.
       */
      infoName: {
        type: String
      },
      /**
       * User properties passed directly to the server.
       */
      infoUserProperties: {
        type: Object,
        value: {}
      }
    }
  }

    
  /**
   * Send the request to the server.
   */
  updateInfo() {
    // Use avs-http-mixin to send the model to the server
    var model = this._assembleModel();
    if (model !== undefined) {
      this._httpRequest(this.url, this._handleHttpResponse.bind(this), undefined, this._handleHttpError.bind(this), model);
    }
  }

  /**
   * Assemble the model from our properties to send to the server.
   */
  _assembleModel() {
    if (this.infoName === undefined) {
      this._logError( JSON.stringify( {"GoType":1, "error":"\'info-name\' property must be set to the name of the info registered in the library map on the server."} ) );
      return undefined;
    }

    var model = {infoProperties:{}};

    model.infoProperties.name = this.infoName;
    if (this.infoUserProperties !== undefined) {
      model.infoProperties.userProperties = this.infoUserProperties;
    }
    
    this._addDataSourceProperties(model);

    return model;
  }

  /**
   * HTTP error handler.
   * @param event
   */
  _handleHttpError(event) {

  }

  /**
   * HTTP response handler.
   * @param json JSON parsed from HTTP response.
   */
  _handleHttpResponse(json) {
	if (json.info !== undefined) {
	  var infoJSON = JSON.parse(decodeURIComponent(json.info.replace(/\+/g, '%20')));
	  var infoEvent = {detail: infoJSON};

      /**
       * JSON response from server.
       * @event avs-go-info-response
       */
	  this.dispatchEvent(new CustomEvent('avs-go-info-response', infoEvent));
	}
  }
}

window.customElements.define('avs-go-info', AvsGoInfo);
