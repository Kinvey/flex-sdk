# Copyright (c) 2015 Kinvey Inc.
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

entityHelper = require './modules/entity'
domain = require 'domain'

module.exports = do ->
  registeredCollections = {}
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

  class Collection
    constructor: (collectionName) ->
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

  collection = (collectionName) ->

    unless registeredCollections[collectionName]?
      registeredCollections[collectionName] = new Collection(collectionName)

    return registeredCollections[collectionName]

  initCompletionHandler = (task, callback) ->

    environmentId = task.appMetadata._id

    convertToError = (body) ->
      errorResult = new Error (body?.message or body.toString())
      errorResult.debugMessage = body.toString()
      errorResult.taskId = task.taskId
      if body?.unhandledException is true
        errorResult.metadata.unhandled = true

      return errorResult

    completionHandler = (entity = {}) ->
      entityParser = entityHelper environmentId

      responseCallback = callback
      result = task.response
      result.body = entity
      methods = {}

      created = ->
        result.statusCode = 201
        return methods

      accepted = ->
        result.statusCode = 202
        return methods

      ok = ->
        result.statusCode = 200
        return methods

      notFound = (debug) ->
        result.statusCode = 404
        result.body =
          error: "NotFound"
          description: "The requested entity or entities were not found in the collection"
          debug: debug or result.body or {}
        return methods

      badRequest = (debug) ->
        result.statusCode = 400
        result.body =
          error: "BadRequest"
          description: "Unable to understand request"
          debug: debug or result.body or {}
        return methods

      unauthorized = (debug) ->
        result.statusCode = 401
        result.body =
          error: "InvalidCredentials"
          description: "Invalid credentials. Please retry your request with correct credentials"
          debug: debug or result.body or {}
        return methods

      forbidden = (debug) ->
        result.statusCode = 403
        result.body =
          error: "Forbidden"
          description: "The request is forbidden"
          debug: debug or result.body or {}
        return methods

      notAllowed = (debug) ->
        result.statusCode = 405
        result.body =
          error: "NotAllowed"
          description: "The request is not allowed"
          debug: debug or result.body or {}
        return methods

      notImplemented = (debug) ->
        result.statusCode = 501
        result.body =
          error: "NotImplemented"
          description: "The request invoked a method that is not implemented"
          debug: debug or result.body or {}
        return methods

      runtimeError = (debug) ->
        result.statusCode = 550
        result.body =
          error: "DataLinkRuntimeError"
          description: "The Datalink had a runtime error.  See debug message for details"
          debug: debug or result.body or {}
        return methods

      done = ->
        unless result.statusCode?
          result.statusCode = 200

        result.body = JSON.stringify result.body

#        if result.statusCode < 400 and entityParser.isKinveyEntity(entity) is false
#          if entity.constructor isnt Array
#            entity = entityParser.entity entity

        result.continue = false
        responseCallback null, task

      next = ->
        unless result.statusCode?
          result.statusCode = 200

        result.body = JSON.stringify result.body
        #if result.statusCode < 400 and entityParser.isKinveyEntity(entity) is false

          #if entity.constructor isnt Array
          #  entity = entityParser.entity entity


        result.continue = true

#        if result.statusCode >= 400
#          convertToError result.body
        responseCallback null, task

      methods =
        created: created
        accepted: accepted
        ok: ok
        done: done
        next: next
        notFound: notFound
        badRequest: badRequest
        unauthorized: unauthorized
        forbidden: forbidden
        notAllowed: notAllowed
        notImplemented: notImplemented
        runtimeError: runtimeError

      return methods

    return completionHandler

  process = (task, modules, callback) ->
    unless task.collectionName?
      return callback new Error "CollectionName not found"

    collectionToProcess = collection task.collectionName
    dataOp = ''
    completionHandler = initCompletionHandler task, callback

    try
      task.request.body = JSON.parse task.request.body
    catch e
      if task.request.body? and typeof task.request.body isnt 'object'
        return callback new Error 'Requst body is not JSON'

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
      return callback new Error "Cannot determine data operation"

    operationHandler = collectionToProcess.resolve dataOp

    if operationHandler instanceof Error
      return callback operationHandler

    taskDomain = domain.create()

    taskDomain.on 'error', (err) ->
      err.metadata = {}
      err.metadata.unhandled = true
      err.taskId = task.taskId
      err.requestId = task.requestId
      return callback err

    domainBoundOperationHandler = taskDomain.bind operationHandler

    domainBoundOperationHandler task.request, (err, result) ->
      taskDomain.dispose()
      completionHandler err, result

  removeCollection = (collection) ->
    unless collection?
      throw new Error 'Must list collection name'

    delete registeredCollections[collection]

  clearAll = () ->
    registeredCollections = {}

  obj =
    collection: collection
    removeCollection: removeCollection
    clearAll: clearAll
    process: process

  return obj
