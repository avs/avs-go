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

import { LitElement } from 'lit';
import { VERSION } from './constants.js';
import { HttpResponse } from './types.js';

type Constructor<T = {}> = new (...args: any[]) => T;

export declare class AvsElementMixinInterface {
  _httpRequest(url: string, onLoad?: (response: any) => void, onError?: () => void, model?: object);
  _dispatchErrorEvent(error: string);
}

export const AvsElementMixin = <T extends Constructor<LitElement>>(superClass: T) => {
  class AvsElementMixinClass extends superClass {
    /**
     * Generate a HTTP request.
     * @param url URL to an instance of AVS/Go server or file to get.
     * @param model Model content to POST to the server (or undefined to generate a GET request).
     */
    _httpRequest(url: string, onLoad?: (response: any) => void, onError?: () => void, model?: object) {
      if (!url) {
        this._dispatchErrorEvent("'url' property must point to an instance of AVS/Go server.");
        onError?.();
      }

      // Assembly the request body
      const verArray = VERSION.split('.');
      const version = [parseInt(verArray[0]), parseInt(verArray[1]), parseInt(verArray[2])];
      const body = {
        source: this.localName,
        model: model,
        version: version
      };

      // Send the request
      fetch(url, {
        method: model ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        body: model ? JSON.stringify(body) : undefined
      })
        .then(response => response.json())
        .then((response: HttpResponse) => {
          if (response.error) {
            this._processServerError(response.error);
            onError?.();
          }
          else {
            onLoad?.(response);
          }
        })
        .catch(error => {
          this._dispatchErrorEvent(error);
          onError?.();
        });        
}

    /**
     * @param error
     */
    _processServerError(error: string) {
      if (!error) {
        return;
      }

      const goException = JSON.parse(decodeURIComponent(error.replace(/\+/g, '%20')));
      let output = "An error occurred on the AVS/Go server";

      for (const key in goException) {
        if (goException.hasOwnProperty(key)) {
          if (output != "") {
            output += "\n  ";
          }
          output += key + ": ";
          const child = goException[key];
          if (child === Object(child)) {
            output = output + JSON.stringify(child);
          }
          else {
            output = output + goException[key];
          }
        }
      }

      this._dispatchErrorEvent(output);
    }

    /**
     * 
     * @param {any} error
     */
     _dispatchErrorEvent(error: string) {
      /**
       * Error message from AVS/Go Web Component or Server.
       * @event avs-error
       */
      this.dispatchEvent(new CustomEvent('avs-error', {
        bubbles: true,
        composed: true,
        detail: error
      }));
    }
  };

  return AvsElementMixinClass as Constructor<AvsElementMixinInterface> & T;
}