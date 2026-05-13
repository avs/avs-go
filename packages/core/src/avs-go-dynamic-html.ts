/**
 * @license
 * Copyright 2018-2026 Advanced Visual Systems Inc.
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

import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { AvsElementMixin } from './avs-element-mixin.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import DOMPurify from 'dompurify';
import { DynamicHtmlModel, DynamicHtmlResponse } from './types.js';

/**
 * `avs-go-dynamic-html` is a Lit element which requests HTML by instancing
 * the `dynamicHtmlName` class on the AVS/Go server application running at `url`.
 * The HTML response is inserted into this element's shadow DOM.
 *
 * @customElement
 * @lit
 * @applysMixin AvsElementMixin
 */
@customElement('avs-go-dynamic-html')
export class AvsGoDynamicHtml extends AvsElementMixin(LitElement) {

  /** The URL to an instance of AVS/Go server application. */
  @property()
  url: string;

  /** Name of the data source registered in the library map on the server. */
  @property({ attribute: 'data-source-name' })
  dataSourceName?: string;

  /** User properties as JSON passed directly to the data source on the server. */
  @property({ attribute: 'data-source-user-properties' })
  dataSourceUserProperties?: string;

  /** The name of the dynamic html registered in the library map on the server. */
  @property({ attribute: 'dynamic-html-name' })
  dynamicHtmlName?: string;

  /** User properties as JSON passed directly to the dynamic html on the server. */
  @property({ attribute: 'dynamic-html-user-properties' })
  dynamicHtmlUserProperties?: string;

  @state()
  _html?: string;

  render() {
    return html`${unsafeHTML(this._html)}`;
  }

  willUpdate(changedProperties: PropertyValues<this>) {
    if (!this.url) {
      if (changedProperties.has('url')) {
        this._dispatchErrorEvent("'url' property must be set to an instance of AVS/Go server.");
      }
      return;
    }
    if (!this.dynamicHtmlName) {
      if (changedProperties.has('dynamicHtmlName')) {
        this._dispatchErrorEvent("'dynamic-html-name' property must be set to the name of the dynamicHtml registered in the library map on the AVS/Go server.");
      }
      return;
    }

    // Assemble the model
    const model: DynamicHtmlModel = {
      dynamicHtmlProperties: {
        name: this.dynamicHtmlName
      }
    };
    if (this.dynamicHtmlUserProperties) {
      let dynamicHtmlUserProperties: object;
      try {
        dynamicHtmlUserProperties = JSON.parse(this.dynamicHtmlUserProperties);
      }
      catch (error) {
        this._dispatchErrorEvent("Can't parse 'dynamic-html-user-properties'. " + error);
        return;
      }
      model.dynamicHtmlProperties.userProperties = dynamicHtmlUserProperties;
    }

    // Data source properties
    if (this.dataSourceName) {
      model.dataSourceProperties = {
        name: this.dataSourceName
      }
      if (this.dataSourceUserProperties) {
        let dataSourceUserProperties: object;
        try {
          dataSourceUserProperties = JSON.parse(this.dataSourceUserProperties);
        }
        catch (error) {
          this._dispatchErrorEvent("Can't parse 'data-source-user-properties'. " + error);
          return;
        }
        model.dataSourceProperties.userProperties = dataSourceUserProperties;
      }
    }

    // Send the request
    this._httpRequest(this.url,
      (response: DynamicHtmlResponse) => {
        if (response.html) {
          const html = decodeURIComponent(response.html.replace(/\+/g, '%20'));
          this._html = DOMPurify.sanitize(html);
        }
        else {
          this._dispatchErrorEvent("Empty response from AVS/Go server.");
        }
      },
      null,
      model
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'avs-go-dynamic-html': AvsGoDynamicHtml;
  }
}