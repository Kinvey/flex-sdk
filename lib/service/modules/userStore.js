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
function initUserStore(appMetadata, requestContext, taskMetadata) {
  function UserStore(storeOptions = {}) {
    this.appMetadata = appMetadata;
    this.requestContext = requestContext;

    let useBl = this.useBl = storeOptions.useBl || false;
    let useUserContext = this.useUserContext = storeOptions.useUserContext || false;

    if (storeOptions.skipBl != null) {
      useBl = this.useBl = storeOptions.skipBl === false;
    }

    if (storeOptions.useMasterSecret != null) {
      useUserContext = this.useUserContext = storeOptions.useMasterSecret === false;
    }

    function _buildKinveyRequest(options = {}) {
      const url = `${appMetadata.baasUrl}/user/${appMetadata._id}/`;

      const headers = {
        'Content-Type': 'application/json',
        'X-Kinvey-API-Version': requestContext.apiVersion,
      };

      if (useBl == null || useBl !== true) {
        headers['x-kinvey-skip-business-logic'] = true;
      }

      const requestOptions = {
        url,
        headers,
        json: true
      };

      if (options.useAppSecret === true) {
        requestOptions.auth = {
          user: appMetadata._id,
          pass: appMetadata.appsecret
        };
      } else if ((useUserContext === true || options.useUserContext === true) && options.useMasterSecret !== true) {
        requestOptions.headers.authorization = requestContext.authorization;
      } else {
        requestOptions.auth = {
          user: appMetadata._id,
          pass: appMetadata.mastersecret
        };
      }

      return requestOptions;
    }

    function _makeRequest(requestOptions, callback) {
      if (taskMetadata.objectName === 'user' && (useBl === true || useUserContext === true)) {
        const error = new Error('UserStoreError');
        error.description = 'Not Allowed';
        error.debug = 'Recursive requests to the user store from the user store cannot use user credentials or use Bl';
        return callback(error);
      }

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

    function create(user, callback) {
      if (!user || typeof user === 'function') {
        callback = user;
        user = null;

        const error = new Error('UserStoreError');
        error.description = 'Bad Request';
        error.debug = 'A user entity must be supplied';
        return callback(error);
      }

      const requestOptions = _buildKinveyRequest({ useAppSecret: true });

      requestOptions.method = 'POST';
      requestOptions.body = user;

      return _makeRequest(requestOptions, callback);
    }

    function update(user, callback) {
      if (!user || typeof user === 'function') {
        callback = user;
        user = null;

        const error = new Error('UserStoreError');
        error.description = 'Bad Request';
        error.debug = 'A user entity must be supplied';
        return callback(error);
      }

      if (!user._id) {
        const error = new Error('UserStoreError');
        error.description = 'Bad Request';
        error.debug = 'A user entity must be supplied containing at least an _id';
        return callback(error);
      }

      const requestOptions = _buildKinveyRequest();

      requestOptions.method = 'PUT';
      requestOptions.url += user._id;
      requestOptions.body = user;

      return _makeRequest(requestOptions, callback);
    }

    function findById(userId, callback) {
      if (!userId || typeof userId === 'function') {
        callback = userId;
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'userId is required';
        return callback(err);
      }

      const requestOptions = _buildKinveyRequest();

      requestOptions.method = 'GET';
      requestOptions.url += userId;
      return _makeRequest(requestOptions, callback);
    }

    function getCurrentUser(callback) {
      findById(requestContext.authenticatedUserId, callback);
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

      return _makeRequest(requestOptions, callback);
    }

    function remove(userId, callback) {
      if (!userId || typeof userId === 'function') {
        callback = userId;
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'userId is required';
        return callback(err);
      }

      const requestOptions = _buildKinveyRequest();

      requestOptions.method = 'DELETE';
      requestOptions.url += userId;

      if (requestContext.apiVersion > 1) {
        requestOptions.qs = { hard: true };
      }

      return _makeRequest(requestOptions, callback);
    }

    function suspend(userId, callback) {
      if (!userId || typeof userId === 'function') {
        callback = userId;
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'userId is required';
        return callback(err);
      }

      const requestOptions = _buildKinveyRequest();

      requestOptions.method = 'DELETE';
      requestOptions.url += userId;

      if (requestContext.apiVersion <= 1) {
        requestOptions.qs = { soft: true };
      }

      return _makeRequest(requestOptions, callback);
    }

    function restore(userId, callback) {
      if (!userId || typeof userId === 'function') {
        callback = userId;
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'userId is required';
        return callback(err);
      }

      const requestOptions = _buildKinveyRequest({ useMasterSecret: true });

      requestOptions.method = 'POST';
      requestOptions.url += `${userId}/_restore`;

      return _makeRequest(requestOptions, callback);
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

      return _makeRequest(requestOptions, callback);
    }

    return {
      create,
      update,
      findById,
      find,
      getCurrentUser,
      remove,
      suspend,
      restore,
      count,
      _skipBl: !useBl,                    // Deprecated
      _useMasterSecret: !useUserContext,  // Deprecated
      _useUserContext: useUserContext,
      _useBl: useBl,
      _appMetadata: this.appMetadata,
      _requestContext: this.requestContext
    };
  }

  function generateUserStore(storeOptions = {}) {
    return new UserStore(storeOptions);
  }

  return generateUserStore;
}

module.exports = initUserStore;
