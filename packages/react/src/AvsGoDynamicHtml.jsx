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
import { AvsGoDynamicHtml as AvsGoDynamicHtmlPolymer } from '@avs/go/src/avs-go-dynamic-html';

export const AvsGoDynamicHtml = forwardRef(({
  url,
  linkCss,
  dynamicHtmlName,
  dynamicHtmlUserProperties,
  dataSourceName,
  dataSourceUserProperties,
  onError
}, ref) => {

  const dynamicHtmlRef = useRef();
  
  useEffect(() => {
    if (!dynamicHtmlRef.current) {
      return;
    }

    function handleError(e) {
      if (onError) {
        onError(e.detail);
      }
    }

    dynamicHtmlRef.current.addEventListener('avs-error', handleError);

    return () => {
      if (dynamicHtmlRef.current) {
        dynamicHtmlRef.current.removeEventListener('avs-error', handleError);
      }
    }
  }, []);

  return (
    <avs-go-dynamic-html
	    ref={dynamicHtmlRef}
	    url={url}
      link-css={linkCss}
	    dynamic-html-name={dynamicHtmlName}
	    dynamic-html-user-properties={dynamicHtmlUserProperties}
	    data-source-name={dataSourceName}
	    data-source-user-properties={dataSourceUserProperties}
	  >
	  </avs-go-dynamic-html>
  );
});
