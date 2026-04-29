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
import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import DOMPurify from 'dompurify';

/**
 * `avs-go-dynamic-html` is a Lit element which requests HTML by instancing
 * the `dynamicHtmlName` class on the AVS/Go server application running at `url`.
 * The HTML response is inserted into this element's shadow DOM.
 *
 * @customElement
 * @lit
 */
export class AvsGoDynamicHtml extends AvsElementBase {
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
     * The name of the dynamic html registered in the library map on the server.
     */
    dynamicHtmlName: {
      type: String,
      attribute: 'dynamic-html-name'
    },

    /**
     * User properties passed directly to the server.
     */
    dynamicHtmlUserProperties: {
      type: Object,
      attribute: 'dynamic-html-user-properties'
    },

    _html: {
      state: true
    }
  }

  render() {
    return html`${unsafeHTML(this._html)}`;
  }

  willUpdate(changedProperties) {
    if (!this.url) {
      if (changedProperties.has('url')) {
        console.error("\'url\' property must be set to an instance of AVS/Go server.");
      }
      return;
    }
    if (!this.dynamicHtmlName) {
      if (changedProperties.has('dynamicHtmlName')) {
        console.error("\'dynamic-html-name\' property must be set to the name of the dynamicHtml registered in the library map on the AVS/Go server.");
      }
      return;
    }

    // Assemble the model
    const model = {
      dynamicHtmlProperties: {
        name: this.dynamicHtmlName,
        userProperties: this.dynamicHtmlUserProperties
      }
    };
    if (this.dataSourceName) {
      model.dataSourceProperties = {
        name: this.dataSourceName,
        userProperties: this.dataSourceUserProperties
      };
    }

    // Send the request
    this._httpRequest(this.url,
      (response) => {
        if (response.html) {
          const html = decodeURIComponent(response.html.replace(/\+/g, '%20'));
          this._html = DOMPurify.sanitize(html);
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

customElements.define('avs-go-dynamic-html', AvsGoDynamicHtml);