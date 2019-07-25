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
const async = require('async');

const BASE_ROUTE = 'appdata';
const SAVE_BATCH_SIZE = 100;

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
        return callback ? setImmediate(() => callback(error)) : Promise.reject(error);
      }
      return this._makeRequest(requestOptions, callback);
    }

    _makeAppdataBatchRequest(requestOptions, entities, collectionName, callback) {
      if (this._taskMetadata.objectName === collectionName && (this._useBl === true || this._useUserContext === true)) {
        const error = new Error('DataStoreError');
        error.description = 'Not Allowed';
        error.debug = 'Recursive data operations to the same collection cannot use user context or use BL.';
        return callback ? setImmediate(() => callback(error)) : Promise.reject(error);
      }

      // send multi-insert request in batches
      const entitiesInBatches = [];
      let start = 0;
      while (start < entities.length) {
        entitiesInBatches.push(entities.slice(start, start + SAVE_BATCH_SIZE));
        start += SAVE_BATCH_SIZE;
      }

      const totalEntities = [];
      const totalErrors = [];

      return new Promise((resolve, reject) => {
        async.eachOfSeries(entitiesInBatches, (batch, i, cb) => {
          requestOptions.body = batch;
          this._makeRequest(requestOptions, (err, resBody) => {
            if (err) return cb(err);

            totalEntities.push(...resBody.entities);
            // change batch-specific index to absolute index
            resBody.errors.forEach((e) => {
              e.index = (SAVE_BATCH_SIZE * i) + e.index;
            });
            totalErrors.push(...resBody.errors);
            cb();
          });
        }, (err) => {
          if (err) {
            return callback ? callback(err) : reject(err);
          }
          // form the result
          const resBody = {
            entities: totalEntities,
            errors: totalErrors
          };

          return callback ? callback(null, resBody) : resolve(resBody);
        });
      });
    }

    collection(collectionName) {
      const save = (entity, callback) => {
        if (!entity || typeof entity === 'function') {
          const cb = typeof entity === 'function' ? entity : callback;
          const err = new Error('DataStoreError');
          err.description = 'Bad Request';
          err.debug = 'entity is required';
          return cb ? setImmediate(() => cb(err)) : Promise.reject(err);
        }

        const requestOptions = this._buildAppdataRequest(collectionName);
        if (!Array.isArray(entity) && entity._id) {
          requestOptions.method = 'PUT';
          requestOptions.url += entity._id;
        } else {
          requestOptions.method = 'POST';
        }

        if (Array.isArray(entity) && entity.length > SAVE_BATCH_SIZE) {
          return this._makeAppdataBatchRequest(requestOptions, entity, collectionName, callback);
        }

        requestOptions.body = entity;
        return this._makeAppdataRequest(requestOptions, collectionName, callback);
      };

      const findById = (entityId, callback) => {
        if (!entityId || typeof entityId === 'function') {
          const cb = typeof entityId === 'function' ? entityId : callback;
          const err = new Error('DataStoreError');
          err.description = 'Bad Request';
          err.debug = 'entityId is required';
          return cb ? setImmediate(() => cb(err)) : Promise.reject(err);
        }

        const requestOptions = this._buildAppdataRequest(collectionName);

        requestOptions.method = 'GET';
        requestOptions.url += entityId;
        return this._makeAppdataRequest(requestOptions, collectionName, callback);
      };

      const find = (query, callback) => {
        const requestOptions = this._buildAppdataRequest(collectionName);
        const cb = !callback && typeof query === 'function' ? query : callback;

        requestOptions.method = 'GET';

        if (query && typeof query !== 'function') {
          requestOptions.qs = this._generateQueryString(query);
        }

        return this._makeAppdataRequest(requestOptions, collectionName, cb);
      };

      const removeById = (entityId, callback) => {
        if (!entityId || typeof entityId === 'function') {
          const cb = typeof entityId === 'function' ? entityId : callback;
          const err = new Error('DataStoreError');
          err.description = 'Bad Request';
          err.debug = 'entityId is required';
          return cb ? setImmediate(() => cb(err)) : Promise.reject(err);
        }

        const requestOptions = this._buildAppdataRequest(collectionName);

        requestOptions.method = 'DELETE';
        requestOptions.url += entityId;
        return this._makeAppdataRequest(requestOptions, collectionName, callback);
      };

      const remove = (query, callback) => {
        const requestOptions = this._buildAppdataRequest(collectionName);
        const cb = !callback && typeof query === 'function' ? query : callback;

        requestOptions.method = 'DELETE';

        if (query && typeof query !== 'function') {
          requestOptions.qs = this._generateQueryString(query);
        }

        return this._makeAppdataRequest(requestOptions, collectionName, cb);
      };

      const count = (query, callback) => {
        const requestOptions = this._buildAppdataRequest(collectionName);
        const cb = !callback && typeof query === 'function' ? query : callback;

        requestOptions.method = 'GET';
        requestOptions.url += '_count/';

        if (query && typeof query !== 'function') {
          requestOptions.qs = this._generateQueryString(query);
        }

        return this._makeAppdataRequest(requestOptions, collectionName, cb);
      };

      return {
        save,
        findById,
        find,
        removeById,
        remove,
        count,
        collectionName,
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
