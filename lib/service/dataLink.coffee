# Copyright (c) 2016 Kinvey Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

kinveyCompletionHandler = require('./kinveyCompletionHandler')
kinveyErrors = require 'kinvey-datalink-errors'

module.exports = do ->
  registeredServiceObjects = {}
  dataRegistrationOperators = [
    'onInsert'
    'onDeleteById'
    'onDeleteAll'
    'onDeleteByQuery'
    'onUpdate'
    'onGetById'
    'onGetAll'
    'onGetByQuery'
    'onGetCount'
    'onGetCountWithQuery'
  ]

  class ServiceObject
    constructor: (@serviceObjectName) ->
      @eventMap = {}

    register: (dataOp, functionToExecute) ->
      unless dataOp? and dataOp in dataRegistrationOperators
        throw new Error 'Operation not permitted'

      @eventMap[dataOp] = functionToExecute

    unregister: (dataOp) ->
      unless dataOp? and dataOp in dataRegistrationOperators
        throw new Error 'Operation not permitted'

      delete @eventMap[dataOp]

    onInsert: (functionToExecute) ->
      @register 'onInsert', functionToExecute

    onDeleteById: (functionToExecute) ->
      @register 'onDeleteById', functionToExecute

    onDeleteAll: (functionToExecute) ->
      @register 'onDeleteAll', functionToExecute

    onDeleteByQuery: (functionToExecute) ->
      @register 'onDeleteByQuery', functionToExecute

    onUpdate: (functionToExecute) ->
      @register 'onUpdate', functionToExecute

    onGetById: (functionToExecute) ->
      @register 'onGetById', functionToExecute

    onGetAll: (functionToExecute) ->
      @register 'onGetAll', functionToExecute

    onGetByQuery: (functionToExecute) ->
      @register 'onGetByQuery', functionToExecute

    onGetCount: (functionToExecute) ->
      @register 'onGetCount', functionToExecute

    onGetCountWithQuery: (functionToExecute) ->
      @register 'onGetCountWithQuery', functionToExecute

    removeHandler: (handler) ->
      @unregister handler

    resolve: (dataOp) ->
      unless @eventMap[dataOp]?
        return new Error 'This data operation is not registered'

      return @eventMap[dataOp]

  serviceObject = (serviceObjectName) ->

    unless registeredServiceObjects[serviceObjectName]?
      registeredServiceObjects[serviceObjectName] = new ServiceObject(serviceObjectName)

    return registeredServiceObjects[serviceObjectName]

  process = (task, modules, callback) ->
    unless task.request.serviceObjectName?
      result = task.response
      result.body = kinveyErrors.generateKinveyError 'NotFound', 'ServiceObject name not found'
      result.statusCode = result.body.statusCode
      delete result.body.statusCode
      return callback task

    # Handle a bug in KCS - if query is part of the task, put it in the request
    task.request.query = task.request.query ? task.query

    serviceObjectToProcess = serviceObject task.request.serviceObjectName
    dataOp = ''
    dataLinkCompletionHandler = kinveyCompletionHandler task, callback

    try
      task.request.body = JSON.parse task.request.body
    catch e
      if task.request.body? and typeof task.request.body isnt 'object'
        result = task.response
        result.body = kinveyErrors.generateKinveyError 'BadRequest', 'Request body is not JSON'
        result.statusCode = result.body.statusCode
        delete result.body.statusCode
        return callback task

    try
      task.request.query = JSON.parse task.request.query
    catch e
      if task.request.query? and typeof task.request.query isnt 'object'
        result = task.response
        result.body = kinveyErrors.generateKinveyError 'BadRequest', 'Request query is not JSON'
        result.statusCode = result.body.statusCode
        delete result.body.statusCode
        return callback task

    if task.method is 'POST'
      dataOp = 'onInsert'
    else if task.method is 'PUT'
      dataOp = 'onUpdate'
    else if task.method is 'GET' and task.endpoint isnt '_count'
      if task.request?.entityId?
        dataOp = 'onGetById'
      else if task.request?.query?
        dataOp = 'onGetByQuery'
      else
        dataOp = 'onGetAll'
    else if task.method is 'GET' and task.endpoint is '_count'
      if task.query?
        dataOp = 'onGetCountWithQuery'
      else
        dataOp = 'onGetCount'
    else if task.method is 'DELETE'
      if task.request.entityId?
        dataOp = 'onDeleteById'
      else if task.query?
        dataOp = 'onDeleteByQuery'
      else
        dataOp = 'onDeleteAll'
    else
      result = task.response
      result.body = kinveyErrors.generateKinveyError 'BadRequest', 'Cannot determine data operation'
      result.statusCode = result.body.statusCode
      delete result.body.statusCode
      return callback task

    operationHandler = serviceObjectToProcess.resolve dataOp

    if operationHandler instanceof Error
      result = task.response
      result.body = kinveyErrors.generateKinveyError 'BadRequest', operationHandler
      result.statusCode = result.body.statusCode
      delete result.body.statusCode
      return callback task

    operationHandler task.request, (err, result) ->
      dataLinkCompletionHandler err, result

  removeServiceObject = (serviceObject) ->
    unless serviceObject?
      throw new Error 'Must list ServiceObject name'

    delete registeredServiceObjects[serviceObject]

  clearAll = () ->
    registeredServiceObjects = {}

  obj =
    serviceObject: serviceObject
    removeServiceObject: removeServiceObject
    clearAll: clearAll
    process: process

  return obj
