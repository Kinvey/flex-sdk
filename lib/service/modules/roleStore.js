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

const BASE_ROUTE = 'roles';

// Initialize the RoleStore; initializes to mastersecret, unless useUserContext = true
function initRoleStore(appMetadata, requestContext, taskMetadata) {
  class RoleStore extends BaseStore {
    _buildRoleRequest(options) {
      return this._buildKinveyRequest(BASE_ROUTE, null, options);
    }

    _makeRoleRequest(requestOptions, callback) {
      if (this._taskMetadata.objectName === BASE_ROUTE && (this._useBl === true || this._useUserContext === true)) {
        const error = new Error('RoleStoreError');
        error.description = 'Not Allowed';
        error.debug = 'Recursive requests to the role store from the role store cannot use user credentials or use BL';
        return callback ? setImmediate(() => callback(error)) : Promise.reject(error);
      }
      return this._makeRequest(requestOptions, callback);
    }

    create(role, callback) {
      if (!role || typeof role === 'function') {
        const cb = role;

        const error = new Error('RoleStoreError');
        error.description = 'Bad Request';
        error.debug = 'A role entity must be supplied';
        return cb ? setImmediate(() => cb(error)) : Promise.reject(error);
      }

      const requestOptions = this._buildRoleRequest();

      requestOptions.method = 'POST';
      requestOptions.body = role;

      return this._makeRoleRequest(requestOptions, callback);
    }

    update(role, callback) {
      if (!role || typeof role === 'function') {
        const cb = role;

        const error = new Error('RoleStoreError');
        error.description = 'Bad Request';
        error.debug = 'A role entity must be supplied';
        return cb ? setImmediate(() => cb(error)) : Promise.reject(error);
      }

      if (!role._id) {
        const error = new Error('RoleStoreError');
        error.description = 'Bad Request';
        error.debug = 'A role entity must be supplied containing at least an _id';
        return callback ? setImmediate(() => callback(error)) : Promise.reject(error);
      }

      const requestOptions = this._buildRoleRequest();

      requestOptions.method = 'PUT';
      requestOptions.url += role._id;
      requestOptions.body = role;

      return this._makeRoleRequest(requestOptions, callback);
    }

    findById(roleId, callback) {
      if (!roleId || typeof roleId === 'function') {
        const cb = typeof roleId === 'function' ? roleId : callback;
        const err = new Error('RoleStoreError');
        err.description = 'Bad Request';
        err.debug = 'roleId is required';
        return cb ? setImmediate(() => cb(err)) : Promise.reject(err);
      }

      const requestOptions = this._buildRoleRequest();

      requestOptions.method = 'GET';
      requestOptions.url += roleId;
      return this._makeRoleRequest(requestOptions, callback);
    }

    remove(roleId, callback) {
      if (!roleId || typeof roleId === 'function') {
        const cb = typeof roleId === 'function' ? roleId : callback;
        const err = new Error('RoleStoreError');
        err.description = 'Bad Request';
        err.debug = 'roleId is required';
        return cb ? setImmediate(() => cb(err)) : Promise.reject(err);
      }

      const requestOptions = this._buildRoleRequest();

      requestOptions.method = 'DELETE';
      requestOptions.url += roleId;

      return this._makeRoleRequest(requestOptions, callback);
    }

    listMembers(roleId, callback) {
      if (!roleId || typeof roleId === 'function') {
        const cb = typeof roleId === 'function' ? roleId : callback;
        const err = new Error('RoleStoreError');
        err.description = 'Bad Request';
        err.debug = 'roleId is required';
        return cb ? setImmediate(() => cb(err)) : Promise.reject(err);
      }

      const requestOptions = this._buildRoleRequest();

      requestOptions.method = 'GET';
      requestOptions.url += `${roleId}/membership`;

      return this._makeRoleRequest(requestOptions, callback);
    }
  }

  function generateRoleStore(storeOptions = {}) {
    return new RoleStore(storeOptions, appMetadata, requestContext, taskMetadata);
  }

  return generateRoleStore;
}

module.exports = initRoleStore;
