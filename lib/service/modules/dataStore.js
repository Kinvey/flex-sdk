/**
 * Copyright (c) 2016 Kinvey Inc.
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

const request = require('request');

// Initialize the DataStore; initializes to current User Context, unless useMasterSecret = true
function initDataStore(appMetadata, requestContext) {
  function DataStore(storeOptions = {}) {
    this.appMetadata = appMetadata;
    this.requestContext = requestContext;
    const skipBl = this.skipBl = storeOptions.skipBl || false;
    const useMasterSecret = this.useMasterSecret = storeOptions.useMasterSecret || false;

    function collection(collectionName) {
      function _buildKinveyRequest() {
        const url = `${appMetadata.baasUrl}/appdata/${appMetadata._id}/${collectionName}/`;
        const headers = {
          'Content-Type': 'application/json',
          'X-Kinvey-API-Version': requestContext.apiVersion,
        };

        if (skipBl) {
          headers['x-kinvey-skip-business-logic'] = true;
        }

        const requestOptions = {
          url,
          headers,
          json: true
        };

        if (storeOptions.useMasterSecret) {
          requestOptions.auth = {
            user: appMetadata._id,
            pass: appMetadata.mastersecret
          };
        } else {
          requestOptions.headers.authorization = requestContext.authorization;
        }

        return requestOptions;
      }

      function _makeRequest(requestOptions, callback) {
        request(requestOptions, (err, res, body) => {
          if (err) {
            return callback(err);
          } else if (res.statusCode > 299) {
            const error = new Error(body.error);
            error.description = body.description;
            error.debug = body.debug;
            return callback(err);
          }
          return callback(null, body);
        });
      }

      function _generateQueryString(query) {
        return query.toQueryString();
      }

      function save(entity, callback) {
        const requestOptions = _buildKinveyRequest();

        if (entity._id) {
          requestOptions.method = 'PUT';
          requestOptions.url += entity._id;
        } else {
          requestOptions.method = 'POST';
        }

        requestOptions.body = entity;

        _makeRequest(requestOptions, callback);
      }

      function findById(entityId, callback) {
        if (!entityId || typeof entityId === 'function') {
          callback = entityId;
          const err = new Error('DataStoreError');
          err.description = 'Bad Request';
          err.debug = 'entityId is required';
          return callback(err);
        }

        const requestOptions = _buildKinveyRequest();

        requestOptions.method = 'GET';
        requestOptions.url += entityId;
        _makeRequest(requestOptions, callback);
      }

      function find(query, callback) {
        const requestOptions = _buildKinveyRequest();

        if (typeof query === 'function' && !callback) {
          callback = query;
          query = null;
        }

        requestOptions.method = 'GET';

        if (query) {
          requestOptions.qs = _generateQueryString(query);
        }

        _makeRequest(requestOptions, callback);
      }

      function removeById(entityId, callback) {
        if (!entityId || typeof entityId === 'function') {
          callback = entityId;
          const err = new Error('DataStoreError');
          err.description = 'Bad Request';
          err.debug = 'entityId is required';
          return callback(err);
        }

        const requestOptions = _buildKinveyRequest();

        requestOptions.method = 'DELETE';
        requestOptions.url += entityId;
        _makeRequest(requestOptions, callback);
      }

      function remove(query, callback) {
        const requestOptions = _buildKinveyRequest();

        if (typeof query === 'function' && !callback) {
          callback = query;
          query = null;
        }

        requestOptions.method = 'DELETE';

        if (query) {
          requestOptions.qs = _generateQueryString(query);
        }

        _makeRequest(requestOptions, callback);
      }

      function count(query, callback) {
        const requestOptions = _buildKinveyRequest();

        if (typeof query === 'function' && !callback) {
          callback = query;
          query = null;
        }

        requestOptions.method = 'GET';
        requestOptions.url += '_count/';

        if (query) {
          requestOptions.qs = _generateQueryString(query);
        }

        _makeRequest(requestOptions, callback);
      }

      return {
        save,
        findById,
        find,
        removeById,
        remove,
        count,
        collectionName,
        _skipBl: skipBl,
        _useMasterSecret: useMasterSecret,
        _appMetadata: appMetadata,
        _requestContext: requestContext
      };
    }

    return {
      collection,
      _useMasterSecret: useMasterSecret,
      _appMetadata: appMetadata,
      _requestContext: requestContext,
      _skipBl: skipBl
    };
  }

  function generateDataStore(storeOptions = {}) {
    return new DataStore(storeOptions);
  }

  return generateDataStore;
}

module.exports = initDataStore;
