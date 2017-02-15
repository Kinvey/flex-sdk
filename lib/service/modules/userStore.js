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

const BaseStore = require('./baseStore');
const BASE_ROUTE = 'user';

// Initialize the DataStore; initializes to mastersecret, unless useUserContext = true
function initUserStore(appMetadata, requestContext, taskMetadata) {
  class UserStore extends BaseStore {
    _buildUserRequest(options) {
      return this._buildKinveyRequest(BASE_ROUTE, null, options);
    }

    _makeUserRequest(requestOptions, callback) {
      if (this._taskMetadata.objectName === 'user' && (this._useBl === true || this._useUserContext === true)) {
        const error = new Error('UserStoreError');
        error.description = 'Not Allowed';
        error.debug = 'Recursive requests to the user store from the user store cannot use user credentials or use Bl';
        return callback(error);
      }
      return this._makeRequest(requestOptions, callback);
    }

    create(user, callback) {
      if (!user || typeof user === 'function') {
        callback = user;
        user = null;

        const error = new Error('UserStoreError');
        error.description = 'Bad Request';
        error.debug = 'A user entity must be supplied';
        return callback(error);
      }

      const requestOptions = this._buildUserRequest({ useAppSecret: true });

      requestOptions.method = 'POST';
      requestOptions.body = user;

      return this._makeUserRequest(requestOptions, callback);
    }

    update(user, callback) {
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

      const requestOptions = this._buildUserRequest();

      requestOptions.method = 'PUT';
      requestOptions.url += user._id;
      requestOptions.body = user;

      return this._makeUserRequest(requestOptions, callback);
    }

    findById(userId, callback) {
      if (!userId || typeof userId === 'function') {
        callback = userId;
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'userId is required';
        return callback(err);
      }

      const requestOptions = this._buildUserRequest();

      requestOptions.method = 'GET';
      requestOptions.url += userId;
      return this._makeUserRequest(requestOptions, callback);
    }

    getCurrentUser(callback) {
      this.findById(requestContext.authenticatedUserId, callback);
    }

    find(query, callback) {
      const requestOptions = this._buildUserRequest();

      if (typeof query === 'function' && !callback) {
        callback = query;
        query = null;
      }

      requestOptions.method = 'GET';

      if (query) {
        requestOptions.qs = this._generateQueryString(query);
      }

      return this._makeUserRequest(requestOptions, callback);
    }

    remove(userId, callback) {
      if (!userId || typeof userId === 'function') {
        callback = userId;
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'userId is required';
        return callback(err);
      }

      const requestOptions = this._buildUserRequest();

      requestOptions.method = 'DELETE';
      requestOptions.url += userId;

      if (requestContext.apiVersion > 1) {
        requestOptions.qs = { hard: true };
      }

      return this._makeUserRequest(requestOptions, callback);
    }

    suspend(userId, callback) {
      if (!userId || typeof userId === 'function') {
        callback = userId;
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'userId is required';
        return callback(err);
      }

      const requestOptions = this._buildUserRequest();

      requestOptions.method = 'DELETE';
      requestOptions.url += userId;

      if (requestContext.apiVersion <= 1) {
        requestOptions.qs = { soft: true };
      }

      return this._makeUserRequest(requestOptions, callback);
    }

    restore(userId, callback) {
      if (!userId || typeof userId === 'function') {
        callback = userId;
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'userId is required';
        return callback(err);
      }

      const requestOptions = this._buildUserRequest({ useUserContext: false });

      requestOptions.method = 'POST';
      requestOptions.url += `${userId}/_restore`;

      return this._makeUserRequest(requestOptions, callback);
    }

    count(query, callback) {
      const requestOptions = this._buildUserRequest();

      if (typeof query === 'function' && !callback) {
        callback = query;
        query = null;
      }

      requestOptions.method = 'GET';
      requestOptions.url += '_count/';

      if (query) {
        requestOptions.qs = this._generateQueryString(query);
      }

      return this._makeUserRequest(requestOptions, callback);
    }

  }

  function generateUserStore(storeOptions = {}) {
    return new UserStore(storeOptions, appMetadata, requestContext, taskMetadata);
  }

  return generateUserStore;
}

module.exports = initUserStore;
