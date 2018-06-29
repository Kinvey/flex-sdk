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

const registeredServiceObjects = new Map();
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
  'onGetCountByQuery'
];

class ServiceObject {
  constructor(serviceObjectName) {
    this.eventMap = new Map();
    this.serviceObjectName = serviceObjectName;
  }

  register(dataOp, functionToExecute) {
    if (dataOp == null || dataRegistrationOperators.indexOf(dataOp) < 0) {
      throw new Error('Operation not permitted');
    }

    this.eventMap.set(dataOp, functionToExecute);
  }

  unregister(dataOp) {
    if (dataOp == null || dataRegistrationOperators.indexOf(dataOp) < 0) {
      throw new Error('Operation not permitted');
    }

    this.eventMap.delete(dataOp);
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

  onGetCountByQuery(functionToExecute) {
    this.register('onGetCountByQuery', functionToExecute);
  }

  removeHandler(handler) {
    this.unregister(handler);
  }

  resolve(dataOp) {
    const eventToUse = this.eventMap.get(dataOp);
    return eventToUse || notImplementedHandler;
  }
}

function getServiceObjects() {
  return [...registeredServiceObjects.keys()];
}

function serviceObject(serviceObjectName) {
  if (!registeredServiceObjects.get(serviceObjectName)) {
    registeredServiceObjects.set(serviceObjectName, new ServiceObject(serviceObjectName));
  }

  return registeredServiceObjects.get(serviceObjectName);
}

function process(task, modules, callback) {
  if (task.request == null || task.request.serviceObjectName == null) {
    const result = task.response;
    result.body = kinveyErrors.generateKinveyError('NotFound', 'ServiceObject name not found');
    result.statusCode = result.body.statusCode;
    delete result.body.statusCode;
    return callback(task);
  }

  // Handle a bug in KCS - if query is part of the task, put it in the request
  if (!task.request.query) {
    task.request.query = task.query;
  }

  const serviceObjectToProcess = serviceObject(task.request.serviceObjectName);
  let dataOp = '';

  try {
    task.request.body = JSON.parse(task.request.body);
  } catch (e) {
    const body = task.request.body || null;
    if (body !== null && typeof body !== 'object') {
      const result = task.response;
      result.body = kinveyErrors.generateKinveyError('BadRequest', 'Request body contains invalid JSON');
      result.statusCode = result.body.statusCode;
      delete result.body.statusCode;
      return callback(task);
    }
  }

  try {
    task.request.query = JSON.parse(task.request.query);
  } catch (error) {
    const query = task.request.query || null;
    if (query !== null && typeof query !== 'object') {
      const result = task.response;
      result.body = kinveyErrors.generateKinveyError('BadRequest', 'Request query contains invalid JSON');
      result.statusCode = result.body.statusCode;
      delete result.body.statusCode;
      return callback(task);
    }
  }

  if (task.method === 'POST') {
    dataOp = 'onInsert';
  } else if (task.method === 'PUT') {
    dataOp = 'onUpdate';
  } else if (task.method === 'GET' && task.endpoint !== '_count') {
    const taskRequest = task.request || {};
    if (taskRequest.entityId != null) {
      dataOp = 'onGetById';
    } else if (taskRequest.query != null) {
      dataOp = 'onGetByQuery';
    } else {
      dataOp = 'onGetAll';
    }
  } else if (task.method === 'GET' && task.endpoint === '_count') {
    const taskRequest = task.request || {};
    if (taskRequest.query != null) {
      dataOp = 'onGetCountByQuery';
    } else {
      dataOp = 'onGetCount';
    }
  } else if (task.method === 'DELETE') {
    const taskRequest = task.request || {};
    if (taskRequest.entityId) {
      dataOp = 'onDeleteById';
    } else if (taskRequest.query != null) {
      dataOp = 'onDeleteByQuery';
    } else {
      dataOp = 'onDeleteAll';
    }
  } else {
    const result = task.response;
    result.body = kinveyErrors.generateKinveyError('BadRequest', 'Cannot determine data operation');
    result.statusCode = result.body.statusCode;
    delete result.body.statusCode;
    return callback(task);
  }

  const dataCompletionHandler = kinveyCompletionHandler(task, false, callback);
  const operationHandler = serviceObjectToProcess.resolve(dataOp);
  return operationHandler(task.request, dataCompletionHandler, modules);
}

function removeServiceObject(serviceObjectToRemove) {
  if (serviceObjectToRemove == null) {
    throw new Error('Must list ServiceObject name');
  }

  registeredServiceObjects.delete(serviceObjectToRemove);
}

function clearAll() {
  registeredServiceObjects.clear();
}

exports.getServiceObjects = getServiceObjects;
exports.serviceObject = serviceObject;
exports.process = process;
exports.removeServiceObject = removeServiceObject;
exports.clearAll = clearAll;
