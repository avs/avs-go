/* 
avs-renderer.js
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

import {PolymerElement} from '../@polymer/polymer/polymer-element.js';
import {WebGLRenderer} from 'three';

/**
 * `avs-renderer` is a Polymer 3.0 element created internally by
 * `avs-viewer` to share a single instance of THREE.WebGLRenderer
 * between multiple viewers.
 *
 * @customElement
 * @polymer
 */
export class AvsRenderer extends PolymerElement {
  static get properties() {
    return {

      __renderer: {
        type: Object
      }
    }
  }

  /**
   * Get the THREE.WebGLRenderer instance.
   *
   * @return {THREE.WebGLRenderer} The THREE.WebGLRenderer instance.
   */
  getWebGLRenderer() {
    return this.__renderer;
  }

  constructor() {
    super();
    this.__renderer = new WebGLRenderer( {alpha: true} );
  }

  connectedCallback() {
    super.connectedCallback();
  }
}

window.customElements.define('avs-renderer', AvsRenderer);
