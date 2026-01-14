/**
 * @license
 * Copyright 2026 Advanced Visual Systems Inc.
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

import { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import { AvsGoInfo as AvsGoInfoPolymer } from '@avs/go/src/avs-go-info';

export const AvsGoInfo = forwardRef(({
  url,
  infoName,
  infoUserProperties,
  dataSourceName,
  dataSourceUserProperties,
  onInfo,
  onError
}, ref) => {

  const infoRef = useRef();
  
  useEffect(() => {
    if (!infoRef.current) {
      return;
    }

    function handleInfo(e) {
      if (onInfo) {
        onInfo(e.detail);
      }
    }

    function handleError(e) {
      if (onError) {
        onError(e.detail);
      }
    }

    infoRef.current.addEventListener('avs-go-info-response', handleInfo);
    infoRef.current.addEventListener('avs-error', handleError);

    return () => {
      if (infoRef.current) {
        infoRef.current.removeEventListener('avs-go-info-response', handleSceneInfo);
        infoRef.current.removeEventListener('avs-error', handleError);
      }
    }
  }, []);

  useImperativeHandle(ref, () => ({
    updateInfo() {
      if (infoRef.current) {
        infoRef.current.updateInfo();
      }
    }
  }));

  return (
    <avs-go-info
	    ref={infoRef}
	    url={url}
	    info-name={infoName}
	    info-user-properties={infoUserProperties}
	    data-source-name={dataSourceName}
	    data-source-user-properties={dataSourceUserProperties}
	  >
	  </avs-go-info>
  );
});
