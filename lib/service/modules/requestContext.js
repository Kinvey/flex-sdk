/** Copyright (c) 2016 Kinvey Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

'use strict';

const _ = require('lodash');

module.exports = (metadata) => {
  let string = null;
  const numericParts = [Number.NaN, Number.NaN, Number.NaN];

  if ((typeof metadata.clientAppVersion !== 'undefined' && metadata.clientAppVersion !== null)
    && metadata.clientAppVersion !== '') {
    string = metadata.clientAppVersion;
    const parts = string.split('.');
    let index = 0;
    for (const part of parts) {
      if (index >= 3) break;
      if (part.match(/^\d+$/) !== null) numericParts[index] = parseInt(part);
      index++;
    }
  }

  const clientAppVersion = {
    stringValue: () => string,
    majorVersion: () => numericParts[0],
    minorVersion: () => numericParts[1],
    patchVersion: () => numericParts[2]
  };

  metadata.customRequestProperties = _.get(metadata, 'customRequestProperties', {});
  const getCustomRequestProperties = () => metadata.customRequestProperties;

  const requestContextObject = {
    getAuthenticatedUsername: () => metadata.authenticatedUsername,
    getAuthenticatedUserId: () => metadata.authenticatedUserId,
    getCustomRequestProperty: (propertyName) => metadata.customRequestProperties[propertyName],
    setCustomRequestProperty: (propertyName, propertyValue) => {
      metadata.customRequestProperties[propertyName] = propertyValue;
      return metadata.customRequestProperties[propertyName];
    },
    clientAppVersion
  };

  Object.defineProperty(requestContextObject, 'getCustomRequestProperties', {
    enumerable: false,
    configurable: false,
    value: getCustomRequestProperties
  });

  return requestContextObject;
};
