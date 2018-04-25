// -------------------------------------------------------------------------//
//-*- javascript -*-
//
//                   Copyright (c) 1998-2018 by
//                   Advanced Visual Systems Inc.
//                   All Rights Reserved
//
//   This software comprises unpublished confidential information of
//   Advanced Visual Systems Inc. and may not be used, copied or made
//   available to anyone, except in accordance with the license
//   under which it is furnished.
//
//   This file is under Perforce control at AVS in:
//   $Id: //depot/dvc/internal/Research/AVSWebComponents/DemoApp/client/js/avs_web_components.js#1 $
//
// --------------------------------------------------------------------------//

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
