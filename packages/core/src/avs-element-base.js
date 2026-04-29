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

export class AvsElementBase extends LitElement {

  /**
   * Generate a HTTP request.
   * @param url URL to an instance of AVS/Go server or file to get.
   * @param model Model content to POST to the server (or undefined to generate a GET request).
   */
  _httpRequest(url, onLoad, onError, model) {
    if (!url) {
      onError("\'url\' property must point to an instance of AVS/Go server.")
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
      .then(response => {
        onLoad(response);
      })
      .catch(error => {
        onError(error);
      });
  }

/**
 * @param error
 */
_logError(error) {
  if (!error) {
    return;
  }

  const goException = JSON.parse(decodeURIComponent(error.replace(/\+/g, '%20')));
  let output = "An error occurred on the AVS/Go server";

  for (const key in goException) {
    if (goException.hasOwnProperty(key)) {
      if (output != "") {
        output = output + "\n    ";
      }
      output = output + key + " : ";
      var child = goException[key];
      if (child === Object(child)) {
        output = output + JSON.stringify(child);
      }
      else {
        output = output + goException[key];
      }
    }
  }
  /*
        if (goException.GoType) {
            if (goException.GoType == 0 || goException.GoType == 3) {
                console.log(output);
            }
            else if (goException.GoType == 1) {
                console.warn(output);
            }
            else if (goException.GoType == 2) {
                console.error(output);
            }
        }
        else {
          console.log(output);
        }
     }
  */

  /**
   * Error message from AVS/Go Web Component or Server.
   * @event avs-error
   */
  this.dispatchEvent(new CustomEvent('avs-error', {
    bubbles: true,
    composed: true,
    detail: output
  }));
}
}