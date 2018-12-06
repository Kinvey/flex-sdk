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

function createCompletionHandler(task, requestBody, cb) {
  const callback = !cb && typeof requestBody === 'function' ? requestBody : cb;
  const updateRequestBody = typeof requestBody === 'function' ? {} : requestBody;

  function completionHandler(body) {
    let responseCallback = callback;
    const result = {};

    function normalizeError(error) {
      if (error instanceof Error) {
        return {
          name: error.name,
          message: error.message,
          stack: error.stack
        };
      }
      return error;
    }

    function updateBody(body) {
      if (body != null) {
        result.body = body;
      }
    }

    updateBody(body);

    const api = {
      setBody(body) {
        updateBody(body);
        return this;
      },
      setQuery(query) {
        if (query) {
          result.query = query;

          if (result.query.query && typeof result.query.query === 'object') {
            result.query.query = JSON.stringify(result.query.query);
          }

          if (result.query.sort && typeof result.query.sort === 'object') {
            result.query.sort = JSON.stringify(result.query.sort);
          }
        }
        return this;
      },
      created() {
        result.statusCode = 201;
        return this;
      },
      accepted() {
        result.statusCode = 202;
        return this;
      },
      ok() {
        result.statusCode = 200;
        return this;
      },
      notFound(debug) {
        result.statusCode = 404;
        result.body = {
          error: 'NotFound',
          description: 'The requested entity or entities were not found in the serviceObject',
          debug: normalizeError(debug) || normalizeError(result.body) || {}
        };
        return this;
      },
      badRequest(debug) {
        result.statusCode = 400;
        result.body = {
          error: 'BadRequest',
          description: 'Unable to understand request',
          debug: normalizeError(debug) || normalizeError(result.body) || {}
        };
        return this;
      },
      unauthorized(debug) {
        result.statusCode = 401;
        result.body = {
          error: 'InvalidCredentials',
          description: 'Invalid credentials. Please retry your request with correct credentials',
          debug: normalizeError(debug) || normalizeError(result.body) || {}
        };
        return this;
      },
      forbidden(debug) {
        result.statusCode = 403;
        result.body = {
          error: 'Forbidden',
          description: 'The request is forbidden',
          debug: normalizeError(debug) || normalizeError(result.body) || {}
        };
        return this;
      },
      notAllowed(debug) {
        result.statusCode = 405;
        result.body = {
          error: 'NotAllowed',
          description: 'The request is not allowed',
          debug: normalizeError(debug) || normalizeError(result.body) || {}
        };
        return this;
      },
      notImplemented(debug) {
        result.statusCode = 501;
        result.body = {
          error: 'NotImplemented',
          description: 'The request invoked a method that is not implemented',
          debug: normalizeError(debug) || normalizeError(result.body) || {}
        };
        return this;
      },
      runtimeError(debug) {
        result.statusCode = 550;
        result.body = {
          error: 'FlexRuntimeError',
          description: 'The Flex Service had a runtime error.  See debug message for details',
          debug: normalizeError(debug) || normalizeError(result.body) || {}
        };
        return this;
      },
      done() {
        if (!result.statusCode) {
          result.statusCode = 200;
        }

        task.response.body = result.body || task.response.body;
        task.response.statusCode = result.statusCode;

        // TODO:  Ensure that the result is a kinveyEntity or array of kinveyEntities or {count} object
        //
        //        if result.statusCode < 400 and entityParser.isKinveyEntity(entity) is false
        //          if entity.constructor isnt Array
        //            entity = entityParser.entity entity

        task.response.continue = false;
        responseCallback(null, task);
        responseCallback = () => null;
        return responseCallback;
      },
      next() {
        if (!result.statusCode) {
          result.statusCode = 200;
        }

        if (updateRequestBody) {
          task.request.body = result.body || task.request.body;
          task.request.query = result.query || task.request.query;
          task.request.params = result.query || task.request.query;
        } else {
          task.response.body = result.body || task.response.body;
        }

        task.response.statusCode = result.statusCode;

        // TODO:  Ensure that the result is a kinveyEntity or array of kinveyEntities or {count} object

        task.response.continue = true;
        responseCallback(null, task);
        responseCallback = () => null;
        return responseCallback;
      }
    };

    return api;
  }

  return completionHandler;
}

module.exports = createCompletionHandler;
