/*
avs-data-request.js
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

import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {afterNextRender} from '@polymer/polymer/lib/utils/render-status.js';
import {AvsHttpMixin} from './avs-http-mixin.js';
import {AvsDataMixin} from './avs-data-mixin.js';

/**
 * `avs-data-request` is a Polymer 3.0 element which uses `AvsHttpMixin` to acquire
 * data in a particular format from the specified URL.
 *
 * @customElement
 * @polymer
 */
class AvsDataRequest extends AvsDataMixin(AvsHttpMixin(PolymerElement)) {
  static get template() {
    return html`
      <style>
        #dataDiv {
          width: 100%;
          height: 100%;
          position: relative;
        }   
      </style>
      ${super.template}
      <div id="dataDiv"></div>
    `;
  }

  static get properties() {
    return {
      /**
       * * `libraryKey`: Name of the data request key on the server to run.
       *
       * * `outputFormat`: Output format for the data from the server.
       *
       * @type {{libraryKey: string, outputFormat: string}}
       */
      dataRequestProperties: {
        type: Object,
        value: function () {
          return {};
        }
      },
      /**
       * User properties passed directly to the server.
       */
      dataRequestUserProperties: {
        type: Object,
        value: function () {
          return {};
        }
      }
    }
  }

  /**
   * Assemble the JSON request from our properties to send to the server.
   */
  _assembleRequest() {
    var scope = this;
    var request = {};

    var dataRequest = Object.assign(this.dataRequestProperties, {"userProperties":this.dataRequestUserProperties});
    request = Object.assign(request, {"dataRequestRequest":dataRequest});
    
    // Add Data Properties
    this._addDataProperties(request);

    return request;
  }
       
  /**
   * HTTP response handler.
   * @param json JSON parsed from HTTP response.
   */
  _handleHttpResponse(json) {
	if (json.data !== undefined) {
	  var dataEvent = {detail: json.data};
	  this.dispatchEvent(new CustomEvent('avs-data-response', dataEvent));
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

window.customElements.define('avs-data-request', AvsDataRequest);
