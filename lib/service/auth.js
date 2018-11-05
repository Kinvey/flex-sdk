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

const logger = require('./logger');
const notImplementedHandler = require('./notImplementedHandler');

const authFunctions = new Map();

function logAlreadyResponded(handlerName) {
  logger.error(`Invoked done() or next() more than once to the same FlexAuth request in handler "${handlerName}"`);
}

function getHandlers() {
  return [...authFunctions.keys()];
}

function register(taskName, functionToExecute) {
  authFunctions.set(taskName, functionToExecute);
}

function resolve(taskName) {
  const functionToUse = authFunctions.get(taskName);
  return functionToUse || notImplementedHandler;
}

function process(task, modules, callback) {
  if (task.taskName === null) {
    const result = task.response;
    result.body = {
      error: 'server_error',
      error_description: 'No task name to execute'
    };
    result.statusCode = 401;
    return callback(task);
  }

  function authCompletionHandler(task, callback) {
    let responseCallback = callback;

    function completionHandler(token) {
      const result = task.response;

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

      function updateToken(token) {
        if (token) {
          result.body.token = token;
        }
      }

      result.body = {
        token: {},
        authenticated: false
      };

      updateToken(token);

      const api = {
        setToken(token) {
          updateToken(token);
          return this;
        },
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
            error_description: normalizeError(debug) || normalizeError(token)
          };
          return this;
        },
        accessDenied(debug) {
          result.statusCode = 401;
          result.body = {
            error: 'access_denied',
            error_description: normalizeError(debug) || normalizeError(token)
          };
          return this;
        },
        temporarilyUnavailable(debug) {
          result.statusCode = 401;
          result.body = {
            error: 'temporarily_unavailable',
            error_description: normalizeError(debug) || normalizeError(token)
          };
          return this;
        },
        notImplemented() {
          result.statusCode = 401;
          result.body = {
            error: 'server_error',
            error_description: 'The request invoked a method that is not implemented'
          };
          return this;
        },
        next() {
          if (!result.statusCode) {
            result.statusCode = 200;
          }

          // TODO:  Ensure that the result is a valid auth response

          result.continue = false;
          responseCallback(null, task);
          responseCallback = logAlreadyResponded.bind(null, task.taskName);
        },
        done() {
          if (!result.statusCode) {
            result.statusCode = 200;
          }

          // TODO:  Ensure that the result is a valid auth response

          result.continue = false;
          responseCallback(null, task);
          responseCallback = logAlreadyResponded.bind(null, task.taskName);
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
      result.body = {
        error: 'server_error',
        error_description: 'Request body is not JSON'
      };
      result.statusCode = 401;
      delete result.body.statusCode;
      return callback(task);
    }
  }

  const authHandler = resolve(task.taskName);
  return authHandler(task.request, requestCompletionHandler, modules);
}

function clearAll() {
  authFunctions.clear();
}

exports.getHandlers = getHandlers;
exports.register = register;
exports.resolve = resolve;
exports.process = process;
exports.clearAll = clearAll;
