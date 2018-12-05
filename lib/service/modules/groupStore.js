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

const BASE_ROUTE = 'group';

// Initialize the GroupStore; initializes to mastersecret, unless useUserContext = true
function initGroupStore(appMetadata, requestContext, taskMetadata) {
  class GroupStore extends BaseStore {
    _buildUserRequest(options) {
      return this._buildKinveyRequest(BASE_ROUTE, null, options);
    }

    _makeUserRequest(requestOptions, callback) {
      if (this._taskMetadata.objectName === 'group' && (this._useBl === true || this._useUserContext === true)) {
        const error = new Error('GroupStoreError');
        error.description = 'Not Allowed';
        error.debug =
          'Recursive requests to the group store from the group store cannot use user credentials or use Bl';
        return callback ? setImmediate(() => callback(error)) : Promise.reject(error);
      }
      return this._makeRequest(requestOptions, callback);
    }

    create(group, callback) {
      if (!group || typeof group === 'function') {
        const cb = group;

        const error = new Error('GroupStoreError');
        error.description = 'Bad Request';
        error.debug = 'A group entity must be supplied';
        return cb ? setImmediate(() => cb(error)) : Promise.reject(error);
      }

      const requestOptions = this._buildUserRequest();

      requestOptions.method = 'POST';
      requestOptions.body = group;

      return this._makeUserRequest(requestOptions, callback);
    }

    update(group, callback) {
      if (!group || typeof group === 'function') {
        const cb = group;

        const error = new Error('GroupStoreError');
        error.description = 'Bad Request';
        error.debug = 'A group entity must be supplied';
        return cb ? setImmediate(() => cb(error)) : Promise.reject(error);
      }

      if (!group._id) {
        const error = new Error('GroupStoreError');
        error.description = 'Bad Request';
        error.debug = 'A group entity must be supplied containing at least an _id';
        return callback ? setImmediate(() => callback(error)) : Promise.reject(error);
      }

      const requestOptions = this._buildUserRequest();

      requestOptions.method = 'PUT';
      requestOptions.url += group._id;
      requestOptions.body = group;

      return this._makeUserRequest(requestOptions, callback);
    }

    findById(groupId, callback) {
      if (!groupId || typeof groupId === 'function') {
        const cb = typeof groupId === 'function' ? groupId : callback;
        const err = new Error('GroupStoreError');
        err.description = 'Bad Request';
        err.debug = 'groupId is required';
        return cb ? setImmediate(() => cb(err)) : Promise.reject(err);
      }

      const requestOptions = this._buildUserRequest();

      requestOptions.method = 'GET';
      requestOptions.url += groupId;
      return this._makeUserRequest(requestOptions, callback);
    }

    remove(groupId, callback) {
      if (!groupId || typeof groupId === 'function') {
        const cb = typeof groupId === 'function' ? groupId : callback;
        const err = new Error('GroupStoreError');
        err.description = 'Bad Request';
        err.debug = 'groupId is required';
        return cb ? setImmediate(() => cb(err)) : Promise.reject(err);
      }

      const requestOptions = this._buildUserRequest();

      requestOptions.method = 'DELETE';
      requestOptions.url += groupId;

      return this._makeUserRequest(requestOptions, callback);
    }
  }

  function generateGroupStore(storeOptions = {}) {
    return new GroupStore(storeOptions, appMetadata, requestContext, taskMetadata);
  }

  return generateGroupStore;
}

module.exports = initGroupStore;
