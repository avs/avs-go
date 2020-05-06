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
import '@polymer/polymer/lib/elements/dom-repeat.js';
import {afterNextRender} from '@polymer/polymer/lib/utils/render-status.js';
import {AvsHttpMixin} from './avs-http-mixin.js';
import {AvsDataSourceMixin} from './avs-data-source-mixin.js';

/**
 * `avs-go-dynamic-html` is a Polymer 3.0 element which uses `AvsHttpMixin` to acquire
 * HTML from the specified URL.
 *
 * @customElement
 * @polymer
 */
class AvsGoDynamicHtml extends AvsDataSourceMixin(AvsHttpMixin(PolymerElement)) {
  static get template() {
    return html`
      <template is="dom-repeat" items="{{linkCss}}">
        <link rel="stylesheet" href="[[item]]">
      </template>
      <style>
        #htmlDiv {
          width: 100%;
          height: 100%;
          position: relative;
        }   
      </style>
      <div id="htmlDiv"></div>
    `;
  }

  static get properties() {
    return {
      /**
       * An array of strings specifying CSS files to link into the template.
       */
      linkCss: {
        type: Array,
        value: function () {
          return [];
        }
      },
      /**
       * * `libraryKey`: Name of the dynamic HTML key on the server to run.
       *
       * @type {{libraryKey: string}}
       */
      dynamicHtmlProperties: {
        type: Object,
        value: function () {
          return {};
        }
      },
      /**
       * User properties passed directly to the server.
       */
      dynamicHtmlUserProperties: {
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

    var dynamicHtmlProperties = Object.assign(this.dynamicHtmlProperties, {"userProperties":this.dynamicHtmlUserProperties});
    request = Object.assign(request, {"dynamicHtmlProperties":dynamicHtmlProperties});
    
    // Add DataSource Properties
    this._addDataSourceProperties(request);

    return request;
  }

  /**
   *
   */
  _handleHttpError(event) {

  }

  /**
   * HTTP response handler.
   * @param json JSON parsed from HTTP response.
   */
  _handleHttpResponse(json) {
	if (json.html !== undefined) {
	  this.$.htmlDiv.innerHTML = decodeURIComponent(json.html.replace(/\+/g, '%20'));
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
        this._httpRequest(this.url, this._handleHttpResponse.bind(this), undefined, this._handleHttpError.bind(this), this._assembleRequest());
        this.__initialized = true;
      }
    }); 
  }
}

window.customElements.define('avs-go-dynamic-html', AvsGoDynamicHtml);
