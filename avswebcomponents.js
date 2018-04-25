/*
avswebcomponents.js
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

function addPickListener(callback) {
        var viewerImage = document.querySelector('avs-viewer-image');
        if (viewerImage != undefined) {
                viewerImage.addEventListener('onPick', callback)
        }
        var viewerSVG = document.querySelector('avs-viewer-svg');
        if (viewerSVG != undefined) {
                viewerSVG.addEventListener('onPick', callback)
        }
        var viewerThreejs = document.querySelector('avs-viewer-threejs');
        if (viewerThreejs != undefined) {
                viewerThreejs.addEventListener('onPick', callback)
        }
}

function addHoverListener(callback) {
        var viewerImage = document.querySelector('avs-viewer-image');
        if (viewerImage != undefined) {
                viewerImage.addEventListener('onHover', callback)
        }
        var viewerSVG = document.querySelector('avs-viewer-svg');
        if (viewerSVG != undefined) {
                viewerSVG.addEventListener('onHover', callback)
        }
        var viewerThreejs = document.querySelector('avs-viewer-threejs');
        if (viewerThreejs != undefined) {
                viewerThreejs.addEventListener('onHover', callback)
        }
}
