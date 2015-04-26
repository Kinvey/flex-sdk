# Copyright (c) 2015, Kinvey, Inc. All rights reserved.
#
# This software is licensed to you under the Kinvey terms of service located at
# http://www.kinvey.com/terms-of-use. By downloading, accessing and/or using this
# software, you hereby accept such terms of service  (and any agreement referenced
# therein) and agree that you have read, understand and agree to be bound by such
# terms of service and are of legal age to agree to such terms with Kinvey.
#
# This software contains valuable confidential and proprietary information of
# KINVEY, INC and is subject to applicable licensing agreements.
# Unauthorized reproduction, transmission or distribution of this file and its
# contents is a violation of applicable laws.

module.exports = do ->
  registeredCollections = {}
  dataRegistrationOperators = [
    'insert'
    'deleteEntity'
    'deleteAll'
    'deleteWithQuery'
    'update'
    'getEntity'
    'getAll'
    'getWithQuery'
    'getCount'
  ]

  register = (dataOp, collection, functionToExecute) ->
    unless dataOp? and dataOp in dataRegistrationOperators
      throw new Error 'Operation not permitted'

    unless registeredCollections[collection]?
      registeredCollections[collection] = {}

    registeredCollections[collection][dataOp] = functionToExecute

  insert = (collection, functionToExecute) ->
    register 'insert', collection, functionToExecute

  deleteEntity = (collection, functionToExecute) ->
    register 'deleteEntity', collection, functionToExecute

  deleteAll = (collection, functionToExecute) ->
    register 'deleteAll', collection, functionToExecute

  deleteWithQuery = (collection, functionToExecute) ->
    register 'deleteWithQuery', collection, functionToExecute

  update = (collection, functionToExecute) ->
    register 'update', collection, functionToExecute

  getEntity = (collection, functionToExecute) ->
    register 'getEntity', collection, functionToExecute

  getAll = (collection, functionToExecute) ->
    register 'getAll', collection, functionToExecute

  getWithQuery = (collection, functionToExecute) ->
    register 'getWithQuery', collection, functionToExecute

  getCount = (collection, functionToExecute) ->
    register 'getCount', collection, functionToExecute

  resolve = (collection, dataOp) ->
    unless registeredCollections[collection]?[dataOp]?
      throw new Error 'This collection is not registered'

    return registeredCollections[collection][dataOp]

  obj =
    insert: insert
    deleteEntity: deleteEntity
    deleteAll: deleteAll
    deleteWithQuery: deleteWithQuery
    update: update
    getEntity: getEntity
    getAll: getAll
    getWithQuery: getWithQuery
    getCount: getCount
    resolve: resolve

  return obj
