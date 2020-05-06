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

import {dedupingMixin} from '@polymer/polymer/lib/utils/mixin.js';
import {VERSION_MAJOR, VERSION_MINOR, VERSION_CHANGE} from './constants.js';

/**
 * Mixin to provide client-server communication using `XMLHttpRequest`
 */
export const AvsHttpMixin = dedupingMixin((superClass) => class extends superClass {

  static get properties() {
    return {
      /**
       * URL to an instance of AVS/Go server or file to get.
       */
      url: {
        type: String
      }
    }
  }

  /**
   * Generate a HTTP request.
   * @param url URL to an instance of AVS/Go server or file to get.
   * @param model Model content to POST to the server (or leave out to generate a GET request).
   */
  _httpRequest(url, onLoad, onProgress, onError, model) {

    if ( url === undefined ) {

		this._logError( JSON.stringify( {"GoType":1, "error":"\'url\' property must point to an instance of AVS/Go server."} ) );

		return;

    }

	if ( this.xhr !== undefined ) {

		this.xhr.cancel = true;

	}

	var xhr = new XMLHttpRequest();
	var scope = this;

    xhr.onload = function ( event ) {

		if ( xhr.status === 200 ) {

			var response = JSON.parse( xhr.responseText );

			if ( response == undefined || response == null ) {

				console.error("Empty response received in the " + scope.localName + " Web Component");

			} else if ( response.error !== undefined ) {

				scope._logError( response.error );

			}

			if ( xhr.cancel === undefined && onLoad !== undefined ) {

				onLoad( response );

			}

		} else {

			console.error("An error occurred in the " + scope.localName + " Web Component");

			if ( onError !== undefined ) {

				onError( event );

			}

		}

    };

	xhr.onprogress = onProgress;
    xhr.onerror = onError;

	if ( model === undefined ) {

		xhr.open( 'GET', url, true );

		xhr.send();

	} else {

		// Take the $Change$ RCS keyword from constants.js and parse out the revision number
		var re = /\$Change: (\d+) \$/;
		var revision = parseInt(re.exec(VERSION_CHANGE)[1]);
		var version = [ VERSION_MAJOR, VERSION_MINOR, revision ];

		var body = {source: this.localName, model: model, version: version};

		xhr.open( 'POST', url, true );

		xhr.send( JSON.stringify( body ) );

	}

    this.xhr = xhr;

  }

  /**
   * @param error
   */
  _logError(error) {
      if (error == undefined || error == null) {
          console.error("An unknown error occurred on the AVS/Go server.");
          return;
      }
      var goException = JSON.parse(decodeURIComponent(error.replace(/\+/g, '%20')));

      var output = "An error occurred on the AVS/Go server";
      
      for (var key in goException) {
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

      if (goException.GoType != undefined) {
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

});
