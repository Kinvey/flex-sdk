/** Copyright (c) 2018 Kinvey Inc.
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

function requestContextModule(metadata) {
  let string = null;
  const numericParts = [Number.NaN, Number.NaN, Number.NaN];

  if (typeof metadata.clientAppVersion === 'string' && metadata.clientAppVersion.length > 0) {
    string = metadata.clientAppVersion;
    const parts = string.split('.');
    let index = 0;

    parts.forEach((part) => {
      if (index >= 3) return;
      if (part.match(/^\d+$/) !== null) numericParts[index] = parseInt(part);
      index += 1;
    });
  }

  const clientAppVersion = {
    stringValue: () => string,
    majorVersion: () => numericParts[0],
    minorVersion: () => numericParts[1],
    patchVersion: () => numericParts[2]
  };

  metadata.customRequestProperties = metadata.customRequestProperties || {};

  function getCustomRequestProperties() {
    return metadata.customRequestProperties;
  }

  function getAuthenticatedUsername() {
    return metadata.authenticatedUsername;
  }
  function getAuthenticatedUserId() {
    return metadata.authenticatedUserId;
  }

  function getCustomRequestProperty(propertyName) {
    return metadata.customRequestProperties[propertyName];
  }

  function setCustomRequestProperty(propertyName, propertyValue) {
    metadata.customRequestProperties[propertyName] = propertyValue;
    return metadata.customRequestProperties[propertyName];
  }

  function getSecurityContext() {
    return metadata.securityContext;
  }

  const requestContextObject = {
    getAuthenticatedUsername,
    getAuthenticatedUserId,
    getCustomRequestProperty,
    setCustomRequestProperty,
    getSecurityContext,
    clientAppVersion
  };

  Object.defineProperty(requestContextObject, 'getCustomRequestProperties', {
    enumerable: false,
    configurable: false,
    value: getCustomRequestProperties
  });

  return requestContextObject;
}

module.exports = requestContextModule;
