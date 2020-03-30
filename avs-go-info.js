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

import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {afterNextRender} from '@polymer/polymer/lib/utils/render-status.js';
import {AvsHttpMixin} from './avs-http-mixin.js';
import {AvsDataSourceMixin} from './avs-data-source-mixin.js';

/**
 * `avs-go-info` is a Polymer 3.0 element which uses `AvsHttpMixin` to acquire
 * data in a particular format from the specified URL.
 *
 * @customElement
 * @polymer
 */
class AvsGoInfo extends AvsDataSourceMixin(AvsHttpMixin(PolymerElement)) {
  static get template() {
    return html`
      <style>
        #infoDiv {
          width: 100%;
          height: 100%;
          position: relative;
        }   
      </style>
      ${super.template}
      <div id="infoDiv"></div>
    `;
  }

  static get properties() {
    return {
      /**
       * * `libraryKey`: Name of the info key on the server to run.
       *
       * * `outputFormat`: Output format for the data from the server.
       *
       * @type {{libraryKey: string, outputFormat: string}}
       */
      infoProperties: {
        type: Object,
        value: function () {
          return {};
        }
      },
      /**
       * User properties passed directly to the server.
       */
      infoUserProperties: {
        type: Object,
        value: function () {
          return {};
        }
      }
    }
  }

    
  /**
   * 
   */
  updateInfo() {
    // Use avs-http-mixin to send the request to the server
    var request = this._assembleRequest();
    this._httpRequest(request);
  }

  /**
   * Assemble the JSON request from our properties to send to the server.
   */
  _assembleRequest() {
    var scope = this;
    var request = {};

    var infoProperties = Object.assign(this.infoProperties, {"userProperties":this.infoUserProperties});
    request = Object.assign(request, {"infoProperties":infoProperties});
    
    // Add DataSource Properties
    this._addDataSourceProperties(request);

    return request;
  }
       
  /**
   * HTTP response handler.
   * @param json JSON parsed from HTTP response.
   */
  _handleHttpResponse(json) {
	if (json.info !== undefined) {
	  var infoJSON = JSON.parse(decodeURIComponent(json.info.replace(/\+/g, '%20')));
	  var infoEvent = {detail: infoJSON};
	  this.dispatchEvent(new CustomEvent('avs-go-info-response', infoEvent));
	}
  }

  /**
   * 
   */
  connectedCallback() {
    super.connectedCallback();

    // Make sure all CSS and layout has been processed 
    afterNextRender(this, function() {
      if (this.__initialized != true) {
        this._httpRequest(this._assembleRequest());
        this.__initialized = true;
      }
    }); 
  }
}

window.customElements.define('avs-go-info', AvsGoInfo);
