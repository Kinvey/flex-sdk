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
    'onInsert'
    'onDeleteById'
    'onDeleteAll'
    'onDeleteByQuery'
    'onUpdate'
    'onGetById'
    'onGetAll'
    'onGetByQuery'
    'onGetCount'
  ]

  class Collection
    constructor: (collectionName) ->
      @eventMap = {}

    register: (dataOp, functionToExecute) ->
      unless dataOp? and dataOp in dataRegistrationOperators
        throw new Error 'Operation not permitted'

      @eventMap[dataOp] = functionToExecute

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

    resolve: (dataOp) ->
      unless @eventMap[dataOp]?
        throw new Error 'This data operation is not registered'

      return @eventMap[dataOp]

  collection = (collectionName) ->

    unless registeredCollections[collectionName]?
      registeredCollections[collectionName] = new Collection(collectionName)

    return registeredCollections[collectionName]

  obj =
    collection: collection


  return obj
