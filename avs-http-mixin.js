/*
avs-http-mixin.js
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

import {html} from '@polymer/polymer/polymer-element.js';
import {dedupingMixin} from '@polymer/polymer/lib/utils/mixin.js';
import '@polymer/iron-ajax/iron-ajax.js';

/**
 * Mixin to provide client-server communication using `iron-ajax`
 */
export const AvsHttpMixin = dedupingMixin((superClass) => class extends superClass {
  static get template() {
    return html`
      <iron-ajax id="ajax"
        handle-as="json"
        method="post"
        content-type="application/json"
        on-response="__httpResponse"
        >
      </iron-ajax>
    `;
  }

  static get properties() {
    return {
      /**
       * Fully qualified URL to an instance of AVS Go server.
       */
      url: {
        type: String
      }
    }
  }

  /**
   * Generate a HTTP request.
   * @param model Model content to send to the server.
   */
  _httpRequest(model) {
    if (this.url === undefined) {
      console.error('\'url\' property must point to an instance of AVS Go server.');
      return;
    }

    this.$.ajax.url = this.url;
    this.$.ajax.body = {source: this.localName, model: model};
    this.$.ajax.generateRequest();
  }

  /**
   * HTTP response handler.
   * @param e HTTP response event.
   */
  __httpResponse(e) {
    this._handleHttpResponse(e.detail.response);
  }

  /**
   * HTTP response handler, should be implemented by children.
   * @param response Object parsed from JSON HTTP response.
   */
  _handleHttpResponse(response) {
    console.error('Implement _handleHttpResponse(response) function when using AvsHttpMixin');
  }
});
