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
const BASE_ROUTE = 'appdata';

// Initialize the DataStore; initializes to current User Context, unless useMasterSecret = true
function initDataStore(appMetadata, requestContext, taskMetadata) {
  class DataStore extends BaseStore {
    _buildAppdataRequest(collectionName, options) {
      return this._buildKinveyRequest(BASE_ROUTE, collectionName, options);
    }

    _makeAppdataRequest(requestOptions, collectionName, callback) {
      if (this._taskMetadata.objectName === collectionName && (this._useBl === true || this._useUserContext === true)) {
        const error = new Error('DataStoreError');
        error.description = 'Not Allowed';
        error.debug = 'Recursive data operations to the same collection cannot use user context or use BL.';
        return callback(error);
      }
      return this._makeRequest(requestOptions, callback);
    }

    collection(collectionName) {
      const save = (entity, callback) => {
        const requestOptions = this._buildAppdataRequest(collectionName);

        if (entity._id) {
          requestOptions.method = 'PUT';
          requestOptions.url += entity._id;
        } else {
          requestOptions.method = 'POST';
        }

        requestOptions.body = entity;

        this._makeAppdataRequest(requestOptions, collectionName, callback);
      };

      const findById = (entityId, callback) => {
        if (!entityId || typeof entityId === 'function') {
          callback = entityId;
          const err = new Error('DataStoreError');
          err.description = 'Bad Request';
          err.debug = 'entityId is required';
          return callback(err);
        }

        const requestOptions = this._buildAppdataRequest(collectionName);

        requestOptions.method = 'GET';
        requestOptions.url += entityId;
        return this._makeAppdataRequest(requestOptions, collectionName, callback);
      };

      const find = (query, callback) => {
        const requestOptions = this._buildAppdataRequest(collectionName);

        if (typeof query === 'function' && !callback) {
          callback = query;
          query = null;
        }

        requestOptions.method = 'GET';

        if (query) {
          requestOptions.qs = this._generateQueryString(query);
        }

        return this._makeAppdataRequest(requestOptions, collectionName, callback);
      };

      const removeById = (entityId, callback) => {
        if (!entityId || typeof entityId === 'function') {
          callback = entityId;
          const err = new Error('DataStoreError');
          err.description = 'Bad Request';
          err.debug = 'entityId is required';
          return callback(err);
        }

        const requestOptions = this._buildAppdataRequest(collectionName);

        requestOptions.method = 'DELETE';
        requestOptions.url += entityId;
        return this._makeAppdataRequest(requestOptions, collectionName, callback);
      };

      const remove = (query, callback) => {
        const requestOptions = this._buildAppdataRequest(collectionName);

        if (typeof query === 'function' && !callback) {
          callback = query;
          query = null;
        }

        requestOptions.method = 'DELETE';

        if (query) {
          requestOptions.qs = this._generateQueryString(query);
        }

        return this._makeAppdataRequest(requestOptions, collectionName, callback);
      };

      const count = (query, callback) => {
        const requestOptions = this._buildAppdataRequest(collectionName);

        if (typeof query === 'function' && !callback) {
          callback = query;
          query = null;
        }

        requestOptions.method = 'GET';
        requestOptions.url += '_count/';

        if (query) {
          requestOptions.qs = this._generateQueryString(query);
        }

        return this._makeAppdataRequest(requestOptions, collectionName, callback);
      };

      return {
        save,
        findById,
        find,
        removeById,
        remove,
        count,
        collectionName,
        _skipBl: !(this._useBl),                    // Deprecated
        _useMasterSecret: !(this._useUserContext),  // Deprecated
        _useUserContext: this._useUserContext,
        _useBl: this._useBl,
        _appMetadata: this._appMetadata,
        _requestContext: this._requestContext
      };
    }
  }

  function generateDataStore(storeOptions = {}) {
    return new DataStore(storeOptions, appMetadata, requestContext, taskMetadata);
  }

  return generateDataStore;
}

module.exports = initDataStore;
