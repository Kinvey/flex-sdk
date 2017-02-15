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

// Initialize the GroupStore; initializes to current User Context, unless useMasterSecret = true
function initGroupStore(appMetadata, requestContext) {
  function GroupStore(storeOptions = {}) {
    this.appMetadata = appMetadata;
    this.requestContext = requestContext;
    this.useMasterSecret = storeOptions.useMasterSecret || false;

    function _buildKinveyRequest(options = {}) {
      const url = `${appMetadata.baasUrl}/group/${appMetadata._id}/`;

      const headers = {
        'Content-Type': 'application/json',
        'X-Kinvey-API-Version': requestContext.apiVersion,
      };

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

    function create(group, callback) {
      if (!group || typeof group === 'function') {
        callback = group;
        group = null;

        const error = new Error('GroupStoreError');
        error.description = 'Bad Request';
        error.debug = 'A group entity must be supplied';
        return callback(error);
      }

      const requestOptions = _buildKinveyRequest();

      requestOptions.method = 'POST';
      requestOptions.body = group;

      return _makeRequest(requestOptions, callback);
    }

    function update(group, callback) {
      if (!group || typeof group === 'function') {
        callback = group;
        group = null;

        const error = new Error('GroupStoreError');
        error.description = 'Bad Request';
        error.debug = 'A group entity must be supplied';
        return callback(error);
      }

      if (!group._id) {
        const error = new Error('GroupStoreError');
        error.description = 'Bad Request';
        error.debug = 'A group entity must be supplied containing at least an _id';
        return callback(error);
      }

      const requestOptions = _buildKinveyRequest();

      requestOptions.method = 'PUT';
      requestOptions.url += group._id;
      requestOptions.body = group;

      return _makeRequest(requestOptions, callback);
    }

    function findById(groupId, callback) {
      if (!groupId || typeof groupId === 'function') {
        callback = groupId;
        const err = new Error('GroupStoreError');
        err.description = 'Bad Request';
        err.debug = 'groupId is required';
        return callback(err);
      }

      const requestOptions = _buildKinveyRequest();

      requestOptions.method = 'GET';
      requestOptions.url += groupId;
      return _makeRequest(requestOptions, callback);
    }

    function remove(groupId, callback) {
      if (!groupId || typeof groupId === 'function') {
        callback = groupId;
        const err = new Error('GroupStoreError');
        err.description = 'Bad Request';
        err.debug = 'groupId is required';
        return callback(err);
      }

      const requestOptions = _buildKinveyRequest();

      requestOptions.method = 'DELETE';
      requestOptions.url += groupId;

      if (requestContext.apiVersion > 1) {
        requestOptions.qs = { hard: true };
      }

      return _makeRequest(requestOptions, callback);
    }

    return {
      create,
      update,
      findById,
      remove,
      _useMasterSecret: this.useMasterSecret,
      _appMetadata: this.appMetadata,
      _requestContext: this.requestContext
    };
  }

  function generateGroupStore(storeOptions = {}) {
    return new GroupStore(storeOptions);
  }

  return generateGroupStore;
}

module.exports = initGroupStore;
