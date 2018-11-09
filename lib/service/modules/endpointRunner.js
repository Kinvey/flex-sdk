/**
 * Copyright (c) 2018 Kinvey Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

const BaseStore = require('./baseStore');

const BASE_ROUTE = 'rpc';

// Initialize the endpointRunner; initializes to mastersecret, unless useUserContext = true
function initEndpointRunner(appMetadata, requestContext, taskMetadata) {
  class EndpointRunner extends BaseStore {
    _buildEndpointRequest(options) {
      return this._buildKinveyRequest(BASE_ROUTE, 'custom', options);
    }

    _makeEndpointRequest(requestOptions, endpointName, callback) {
      if (this._taskMetadata.objectName === endpointName && this._taskMetadata.hookType === 'customEndpoint') {
        const error = new Error('EndpointRunnerError');
        error.description = 'Not Allowed';
        error.debug = 'Recursive requests to the same endpoint are prohibited.';
        return callback ? setImmediate(() => callback(error)) : Promise.reject(error);
      }
      return this._makeRequest(requestOptions, callback);
    }

    endpoint(endpointName) {
      const execute = (body = {}, cb) => {
        const callback = !cb && typeof body === 'function' ? body : cb;
        const requestBody = typeof body === 'function' ? {} : body;

        const requestOptions = this._buildEndpointRequest();

        requestOptions.method = 'POST';
        requestOptions.url += endpointName;
        requestOptions.body = requestBody || {};
        return this._makeEndpointRequest(requestOptions, endpointName, callback);
      };

      return {
        execute,
        endpointName,
        _useUserContext: this._useUserContext,
        _useBl: this._useBl,
        _appMetadata: this._appMetadata,
        _requestContext: this._requestContext
      };
    }
  }

  function generateEndpointRunner(storeOptions = {}) {
    storeOptions.useBl = true;
    return new EndpointRunner(storeOptions, appMetadata, requestContext, taskMetadata);
  }

  return generateEndpointRunner;
}

module.exports = initEndpointRunner;
