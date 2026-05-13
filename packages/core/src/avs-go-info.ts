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

import { LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { AvsElementMixin } from './avs-element-mixin.js';
import { InfoModel, InfoResponse } from './types.js';

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
 * @applysMixin AvsElementMixin
 */
@customElement('avs-go-info')
export class AvsGoInfo extends AvsElementMixin(LitElement) {
  
  /** The URL to an instance of AVS/Go server application. */
  @property()
  url: string;

  /** Name of the data source registered in the library map on the server. */
  @property({ attribute: 'data-source-name' })
  dataSourceName?: string;

  /** User properties as JSON passed directly to the data source on the server. */
  @property({ attribute: 'data-source-user-properties' })
  dataSourceUserProperties?: string;

  /** The name of the info registered in the library map on the server. */
  @property({ attribute: 'info-name' })
  infoName?: string;

  /** User properties as JSON passed directly to the info on the server. */
  @property({ attribute: 'info-user-properties' })
  infoUserProperties?: string;

  /**
   * Send the request to the server.
   */
  updateInfo() {
    if (!this.url) {
      this._dispatchErrorEvent("'url' property must be set to an instance of AVS/Go server.");
      return;
    }
    if (!this.infoName) {
      this._dispatchErrorEvent("'info-name' property must be set to the name of the info registered in the library map on the AVS/Go server.");
      return;
    }

    // Assemble the model
    const model: InfoModel = {
      infoProperties: {
        name: this.infoName
      }
    };
    if (this.infoUserProperties) {
      let infoUserProperties: object;
      try {
        infoUserProperties = JSON.parse(this.infoUserProperties);
      }
      catch (error) {
        this._dispatchErrorEvent("Can't parse 'info-user-properties'. " + error);
        return;
      }
      model.infoProperties.userProperties = infoUserProperties;
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
      (response: InfoResponse) => {
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
          this._dispatchErrorEvent("Empty response from AVS/Go server.");
        }
      },
      undefined,
      model
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'avs-go-info': AvsGoInfo;
  }
}