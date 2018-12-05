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
        return callback ? setImmediate(() => callback(error)) : Promise.reject(error);
      }
      return this._makeRequest(requestOptions, callback);
    }

    create(user, callback) {
      if (!user || typeof user === 'function') {
        const cb = user;

        const error = new Error('UserStoreError');
        error.description = 'Bad Request';
        error.debug = 'A user entity must be supplied';
        return cb ? setImmediate(() => cb(error)) : Promise.reject(error);
      }

      const requestOptions = this._buildUserRequest({ useAppSecret: true });

      requestOptions.method = 'POST';
      requestOptions.body = user;

      return this._makeUserRequest(requestOptions, callback);
    }

    update(user, callback) {
      if (!user || typeof user === 'function') {
        const cb = user;

        const error = new Error('UserStoreError');
        error.description = 'Bad Request';
        error.debug = 'A user entity must be supplied';
        return cb ? setImmediate(() => cb(error)) : Promise.reject(error);
      }

      if (!user._id) {
        const error = new Error('UserStoreError');
        error.description = 'Bad Request';
        error.debug = 'A user entity must be supplied containing at least an _id';
        return callback ? setImmediate(() => callback(error)) : Promise.reject(error);
      }

      const requestOptions = this._buildUserRequest();

      requestOptions.method = 'PUT';
      requestOptions.url += user._id;
      requestOptions.body = user;

      return this._makeUserRequest(requestOptions, callback);
    }

    findById(userId, callback) {
      if (!userId || typeof userId === 'function') {
        const cb = typeof userId === 'function' ? userId : callback;
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'userId is required';
        return cb ? setImmediate(() => cb(err)) : Promise.reject(err);
      }

      const requestOptions = this._buildUserRequest();

      requestOptions.method = 'GET';
      requestOptions.url += userId;
      return this._makeUserRequest(requestOptions, callback);
    }

    getCurrentUser(callback) {
      return this.findById(requestContext.authenticatedUserId, callback);
    }

    find(query, callback) {
      const requestOptions = this._buildUserRequest();
      const cb = !callback && typeof query === 'function' ? query : callback;

      requestOptions.method = 'GET';

      if (query && typeof query !== 'function') {
        requestOptions.qs = this._generateQueryString(query);
      }

      return this._makeUserRequest(requestOptions, cb);
    }

    remove(userId, callback) {
      if (!userId || typeof userId === 'function') {
        const cb = typeof userId === 'function' ? userId : callback;
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'userId is required';
        return cb ? setImmediate(() => cb(err)) : Promise.reject(err);
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
        const cb = typeof userId === 'function' ? userId : callback;
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'userId is required';
        return cb ? setImmediate(() => cb(err)) : Promise.reject(err);
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
        const cb = typeof userId === 'function' ? userId : callback;
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'userId is required';
        return cb ? setImmediate(() => cb(err)) : Promise.reject(err);
      }

      const requestOptions = this._buildUserRequest({ useUserContext: false });

      requestOptions.method = 'POST';
      requestOptions.url += `${userId}/_restore`;

      return this._makeUserRequest(requestOptions, callback);
    }

    count(query, callback) {
      const requestOptions = this._buildUserRequest();
      const cb = !callback && typeof query === 'function' ? query : callback;

      requestOptions.method = 'GET';
      requestOptions.url += '_count/';

      if (query && typeof query !== 'function') {
        requestOptions.qs = this._generateQueryString(query);
      }

      return this._makeUserRequest(requestOptions, cb);
    }

    assignRole(userId, roleId, callback) {
      if (!userId || typeof userId === 'function') {
        let cb;
        cb = typeof userId === 'function' ? userId : callback;
        cb = typeof roleId === 'function' ? roleId : cb;
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'userId is required';
        return cb ? setImmediate(() => cb(err)) : Promise.reject(err);
      }

      if (!roleId || typeof roleId === 'function') {
        const cb = typeof roleId === 'function' ? roleId : callback;
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'roleId is required';
        return cb ? setImmediate(() => cb(err)) : Promise.reject(err);
      }

      if (Array.isArray(userId) || Array.isArray(roleId)) {
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'Bulk role assignment is not currently supported.';
        return callback ? setImmediate(() => callback(err)) : Promise.reject(err);
      }

      const requestOptions = this._buildUserRequest();

      requestOptions.method = 'PUT';
      requestOptions.url += `${userId}/roles/${roleId}`;
      requestOptions.body = {};

      return this._makeUserRequest(requestOptions, callback);
    }

    revokeRole(userId, roleId, callback) {
      if (!userId || typeof userId === 'function') {
        let cb;
        cb = typeof userId === 'function' ? userId : callback;
        cb = typeof roleId === 'function' ? roleId : cb;
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'userId is required';
        return cb ? setImmediate(() => cb(err)) : Promise.reject(err);
      }

      if (!roleId || typeof roleId === 'function') {
        const cb = typeof roleId === 'function' ? roleId : callback;
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'roleId is required';
        return cb ? setImmediate(() => cb(err)) : Promise.reject(err);
      }

      if (Array.isArray(userId) || Array.isArray(roleId)) {
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'Bulk role revocation is not currently supported.';
        return callback ? setImmediate(() => callback(err)) : Promise.reject(err);
      }

      const requestOptions = this._buildUserRequest();

      requestOptions.method = 'DELETE';
      requestOptions.url += `${userId}/roles/${roleId}`;
      requestOptions.body = {};

      return this._makeUserRequest(requestOptions, callback);
    }

    listRoles(userId, callback) {
      if (!userId || typeof userId === 'function') {
        const cb = typeof userId === 'function' ? userId : callback;
        const err = new Error('UserStoreError');
        err.description = 'Bad Request';
        err.debug = 'userId is required';
        return cb ? setImmediate(() => cb(err)) : Promise.reject(err);
      }

      const requestOptions = this._buildUserRequest();

      requestOptions.method = 'GET';
      requestOptions.url += `${userId}/roles`;

      return this._makeUserRequest(requestOptions, callback);
    }
  }

  function generateUserStore(storeOptions = {}) {
    return new UserStore(storeOptions, appMetadata, requestContext, taskMetadata);
  }

  return generateUserStore;
}

module.exports = initUserStore;
