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

const kinveyErrors = require('kinvey-datalink-errors');
const notImplementedHandler = require('./notImplementedHandler');

let authFunction;

function resolve() {
  return authFunction;
}

function register(functionToExecute) {
  authFunction = functionToExecute;
}

function process(task, modules, callback) {
  function authCompletionHandler(task, callback) {
    function completionHandler(token) {
      if (!token) token = {};

      const responseCallback = callback;
      const result = task.response;

      result.body = token !== null ? { token } : {};

      const api = {
        addAttribute(key, value) {
          result.body = result.body || {};
          result.body[key] = value;
          return this;
        },
        removeAttribute(key) {
          delete result.body[key];
          return this;
        },
        ok() {
          result.statusCode = 200;
          result.body.authenticated = true;
          return this;
        },
        serverError(debug) {
          result.statusCode = 401;
          result.body = {
            error: 'server_error',
            error_description: debug
          };
          return this;
        },
        accessDenied(debug) {
          result.statusCode = 401;
          result.body = {
            error: 'access_denied',
            error_description: debug
          };
          return this;
        },
        temporarilyUnavailable(debug) {
          result.statusCode = 401;
          result.body = {
            error: 'temporarily_unavailable',
            error_description: debug
          };
          return this;
        },
        done() {
          if (!result.statusCode) {
            result.statusCode = 200;
          }
          result.body = JSON.stringify(result.body);

          // TODO:  Ensure that the result is a valid auth response

          result.continue = false;
          return responseCallback(null, task);
        }
      };

      return api;
    }
    return completionHandler;
  }

  const requestCompletionHandler = authCompletionHandler(task, callback);

  try {
    task.request.body = JSON.parse(task.request.body);
  } catch (error) {
    if ((task.request.body) && typeof task.request.body !== 'object') {
      const result = task.response;
      result.body = kinveyErrors.generateKinveyError('BadRequest', 'Request body is not JSON');
      result.statusCode = result.body.statusCode;
      delete result.body.statusCode;
      return callback(task);
    }
  }

  const authHandler = authFunction || notImplementedHandler;
  return authHandler(task.request, requestCompletionHandler, modules);
}

function clearAll() {
  authFunction = null;
}

function getAuthHandler() {
  return authFunction !== null;
}

exports.getAuthHandler = getAuthHandler;
exports.register = register;
exports.resolve = resolve;
exports.process = process;
exports.clearAll = clearAll;
