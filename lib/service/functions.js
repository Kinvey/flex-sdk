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

const kinveyCompletionHandler = require('./kinveyCompletionHandler');
const kinveyErrors = require('kinvey-datalink-errors');
const notImplementedHandler = require('./notImplementedHandler');

const registeredFunctions = new Map();

function getHandlers() {
  return [...registeredFunctions.keys()];
}

function register(taskName, functionToExecute) {
  registeredFunctions.set(taskName, functionToExecute);
}

function resolve(taskName) {
  const functionToUse = registeredFunctions.get(taskName);
  return functionToUse || notImplementedHandler;
}

function process(task, modules, callback) {
  if (task.taskName === null) {
    const result = task.response;
    result.body = kinveyErrors.generateKinveyError('BadRequest', 'No task name to execute');
    result.statusCode = result.body.statusCode;
    delete result.body.statusCode;
    return callback(task);
  }

  const context = {};
  const currentContext = task.hookType === 'post' ? task.response : task.request;

  context.method = task.request.method;
  context.headers = currentContext.headers;
  context.username = task.request.username;
  context.userId = task.request.userId;
  context.objectName = task.request.objectName || task.request.collectionName;
  context.hookType = task.hookType;

  if (task.request.entityId) {
    context.entityId = task.request.entityId;
  }

  try {
    context.body = JSON.parse(currentContext.body);
  } catch (error) {
    if ((currentContext.body) && typeof currentContext.body !== 'object') {
      const result = task.response;
      result.body = kinveyErrors.generateKinveyError('BadRequest', 'Request body is not JSON');
      result.statusCode = result.body.statusCode;
      delete result.body.statusCode;
      return callback(task);
    }
    context.body = currentContext.body;
  }

  if (task.request.query != null) {
    try {
      task.request.query = JSON.parse(task.request.query);
    } catch (error) {
      if ((task.request.query) && typeof task.request.query !== 'object') {
        const result = task.response;
        result.body = kinveyErrors.generateKinveyError('BadRequest', 'Request body is not JSON');
        result.statusCode = result.body.statusCode;
        delete result.body.statusCode;
        return callback(task);
      }
      context.query = task.request.query;
    }
  }

  const functionCompletionHandler = kinveyCompletionHandler(task, task.hookType === 'pre', callback);
  const functionHandler = resolve(task.taskName);
  return functionHandler(context, functionCompletionHandler, modules);
}

function clearAll() {
  registeredFunctions.clear();
}

exports.getHandlers = getHandlers;
exports.register = register;
exports.resolve = resolve;
exports.process = process;
exports.clearAll = clearAll;
