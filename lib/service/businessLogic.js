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

'use strict';

const kinveyCompletionHandler = require('./kinveyCompletionHandler');
const kinveyErrors = require('kinvey-datalink-errors');

let registeredFunctions = {};
let resolve = null;

exports.register = (taskName, functionToExecute) => {
  registeredFunctions[taskName] = functionToExecute;
};

exports.resolve = resolve = (taskName) => {
  if (!registeredFunctions[taskName]) return new Error('No such task registered');
  return registeredFunctions[taskName];
};

exports.process = (task, modules, callback) => {
  if (task.taskName === null) {
    return callback(new Error('No taskname to execute'));
  }

  const businessLogicCompletionHandler = kinveyCompletionHandler(task, callback);

  try {
    task.request.body = JSON.parse(task.request.body);
  } catch (error) {
    if ((task.request.body) && typeof task.request.body !== 'object') {
      const result = task.response;
      result.body = kinveyErrors.generateKinveyError('BadRequest', 'Requst body is not JSON');
      result.statusCode = result.body.statusCode;
      delete result.body.statusCode;
      return callback(task);
    }
  }

  const logicHandler = resolve(task.taskName);

  if (logicHandler instanceof Error) {
    const result = task.response;
    result.body = kinveyErrors.generateKinveyError('BadRequest', logicHandler);
    result.statusCode = result.body.statusCode;
    delete result.body.statusCode;
    return callback(task);
  }

  logicHandler(task.request, (err, result) => businessLogicCompletionHandler(err, result));
};

exports.clearAll = () => {
  registeredFunctions = {};
};
