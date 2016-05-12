/** Copyright (c) 2016 Kinvey Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

'use strict';

const _ = require('lodash');
const kinveyCompletionHandler = require('./kinveyCompletionHandler');
const kinveyErrors = require('kinvey-datalink-errors');

let registeredServiceObjects = {};
const dataRegistrationOperators = [
  'onInsert',
  'onDeleteById',
  'onDeleteAll',
  'onDeleteByQuery',
  'onUpdate',
  'onGetById',
  'onGetAll',
  'onGetByQuery',
  'onGetCount',
  'onGetCountWithQuery'
];

class ServiceObject {
  constructor(serviceObjectName) {
    this.eventMap = {};
    this.serviceObjectName = serviceObjectName;
  }

  register(dataOp, functionToExecute) {
    if ((typeof dataOp === "undefined" && dataOp === null) ||
      dataRegistrationOperators.indexOf(dataOp) < 0) {
      throw new Error('Operation not permitted');
    }

    let util = require('util');
    console.log('registered op: ' + functionToExecute.toString());

    this.eventMap[dataOp] = functionToExecute;
  }

  unregister(dataOp) {
    if ((typeof dataOp === "undefined" && dataOp === null) ||
      dataRegistrationOperators.indexOf(dataOp) < 0) {
      throw new Error('Operation not permitted');
    }

    delete this.eventMap[dataOp];
  }

  onInsert(functionToExecute) {
    this.register('onInsert', functionToExecute);
  }

  onDeleteById(functionToExecute) {
    this.register('onDeleteById', functionToExecute);
  }

  onDeleteAll(functionToExecute) {
    this.register('onDeleteAll', functionToExecute);
  }

  onDeleteByQuery(functionToExecute) {
    this.register('onDeleteByQuery', functionToExecute);
  }

  onUpdate(functionToExecute) {
    this.register('onUpdate', functionToExecute);
  }

  onGetById(functionToExecute) {
    this.register('onGetById', functionToExecute);
  }

  onGetAll(functionToExecute) {
    this.register('onGetAll', functionToExecute);
  }

  onGetByQuery(functionToExecute) {
    this.register('onGetByQuery', functionToExecute);
  }

  onGetCount(functionToExecute) {
    this.register('onGetCount', functionToExecute);
  }

  onGetCountWithQuery(functionToExecute) {
    this.register('onGetCountWithQuery', functionToExecute);
  }

  removeHandler(handler) {
    this.unregister(handler);
  }

  resolve(dataOp) {
    if (this.eventMap[dataOp] == null) {
      return new Error('This data operation is not registered');
    }

    let util = require('util');
    console.log('resolved op: ' + util.inspect(this.eventMap[dataOp]));

    return this.eventMap[dataOp];
  }
}

const serviceObject = (serviceObjectName) => {
  if (registeredServiceObjects[serviceObjectName] == null) {
    registeredServiceObjects[serviceObjectName] = new ServiceObject(serviceObjectName);
  }

  return registeredServiceObjects[serviceObjectName];
};

const process = (task, modules, callback) => {
  if (task.request.serviceObjectName === null) {
    const result = task.response;
    result.body = kinveyErrors.generateKinveyError('NotFound', 'ServiceObject name not found');
    result.statusCode = result.body.statusCode;
    delete result.body.statusCode;
    return callback(task);
  }

  console.log('111111');

  const serviceObjectToProcess = serviceObject(task.request.serviceObjectName);
  let dataOp = '';
  const dataLinkCompletionHandler = kinveyCompletionHandler(task, callback);

  console.log('tRB: ' + JSON.stringify(task.request.body));

  try {
    task.request.body = JSON.parse(task.request.body);
  }
  catch (e) {
    console.log('err:' + e.message);
    console.log('333333');
    if (task.request.body != null && typeof task.request.body !== 'object') {
      const result = task.response;
      result.body = kinveyErrors.generateKinveyError('BadRequest', 'Request body is not JSON');
      result.statusCode = result.body.statusCode;
      delete result.body.statusCode;
      return callback(task);
    }
  }

  console.log('2222222');

  if (task.method === 'POST') {
    dataOp = 'onInsert';
  }
  else if (task.method === 'PUT') {
    dataOp = 'onUpdate';
  }
  else if (task.method === 'GET' && task.endpoint !== '_count') {
    const taskRequest = _.get(task, 'request', {});
    if (typeof taskRequest.entityId !== 'undefined' && taskRequest.entityId !== null) {
      dataOp = 'onGetById';
    }
    else if (typeof taskRequest.query !== 'undefined' && taskRequest.query !== null) {
      dataOp = 'onGetByQuery';
    }
    else {
      dataOp = 'onGetAll'
    }
  }
  else if (task.method === 'GET' && task.endpoint === '_count') {
    if (typeof task.query !== 'undefined' && task.query !== null) {
      dataOp = 'onGetCountWithQuery';
    }
    else {
      dataOp = 'onGetCount';
    }
  }
  else if (task.method === 'DELETE') {
    if (task.request.entityId) {
      dataOp = 'onDeleteById';
    }
    else if (typeof task.query !== 'undefined' && task.query !== null) {
      dataOp = 'onDeleteByQuery';
    }
    else {
      dataOp = 'onDeleteAll';
    }
  }
  else {
    const result = task.response;
    result.body = kinveyErrors.generateKinveyError('BadRequest', 'Cannot determine data operation');
    result.statusCode = result.body.statusCode;
    delete result.body.statusCode;
    return callback(task);
  }

  console.log('444');
  console.log('data op: ' + dataOp);

  const operationHandler = serviceObjectToProcess.resolve(dataOp);

  let util  = require('util');
  console.log('operationHandler: ' + util.inspect(operationHandler));


  if (operationHandler instanceof Error) {
    console.log('555');
    console.log('err: ' + operationHandler);
    const result = task.response;
    result.body = kinveyErrors.generateKinveyError('BadRequest', operationHandler);
    result.statusCode = result.body.statusCode;
    delete result.body.statusCode;
    return callback(task);
  }

  operationHandler(task.request, (err, result) => {
    console.log('processing...');
    console.log('dlCHandler: ' + dataLinkCompletionHandler.toString());
    dataLinkCompletionHandler(err, result);
  });
};

const removeServiceObject = (serviceObject) => {
  if (typeof serviceObject === "undefined" || serviceObject === null) {
    throw new Error('Must list ServiceObject name');
  }

  delete registeredServiceObjects[serviceObject];
};

const clearAll = () => {
  registeredServiceObjects = {};
};

const api = {
  serviceObject,
  removeServiceObject,
  clearAll,
  process
};

module.exports = api;
