# Copyright (c) 2014, Kinvey, Inc. All rights reserved.
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

moment = require 'moment'
BSON = require("bson").BSONPure

module.exports = do ->

  (environmentId, useBSONObjectId = false) ->

    _generateKinveyEntity = (entityOrId) ->

      _entity = {}

      _createEntityId = () ->
        if useBSONObjectId then return new BSON.ObjectID()
        return new BSON.ObjectID().toString()

      currentTimeString = moment().utc().toISOString()

      if typeof entityOrId in ['string', 'undefined']
        _entity =
          _id: entityOrId ? _createEntityId()
          _acl:
            creator: environmentId
          _kmd:
            lmt: currentTimeString
            ect: currentTimeString
      else
        if typeof entityOrId is 'object'
          _entity = entityOrId ? {}
          _entity._id ?= _createEntityId()
          _entity._acl ?= {}
          _entity._acl.creator ?= environmentId
          _entity._kmd ?= {}
          _entity._kmd.ect ?= currentTimeString
          _entity._kmd.lmt = currentTimeString


      aclFunctions =

        getCreator: () ->
          _entity._acl?.creator

        getReaders: () ->
          _entity._acl?.r ? []

        getWriters: () ->
          _entity._acl?.w ? []

        getReaderGroups: () ->
          _entity._acl?.groups?.r ? []

        getWriterGroups: () ->
          _entity._acl?.groups?.w ? []

        addReader: (userId) ->
          _entity._acl?.r ?= []
          if -1 is _entity._acl.r.indexOf userId
            _entity._acl.r.push userId
          return this

        addWriter: (userId) ->
          _entity._acl?.w ?= []
          if -1 is _entity._acl.w.indexOf userId
            _entity._acl.w.push userId
          return this

        addReaderGroup: (groupId) ->
          _entity._acl?.groups ?= []
          _entity._acl?.groups?.r ?= []
          if -1 is _entity._acl.groups.r.indexOf groupId
            _entity._acl.groups.r.push groupId
          return this

        addWriterGroup: (groupId) ->
          _entity._acl?.groups ?= []
          _entity._acl?.groups?.w ?= []
          if -1 is _entity._acl.groups.w.indexOf groupId
            _entity._acl.groups.w.push groupId
          return this

        removeReader: (userId) ->
          userIx = _entity._acl?.r?.indexOf(userId)
          while (userIx? and userIx isnt -1)
            _entity._acl.r.splice(userIx, 1)
            userIx = _entity._acl?.r?.indexOf(userId)
          return this

        removeWriter: (userId) ->
          userIx = _entity._acl?.w?.indexOf(userId)
          while (userIx? and userIx isnt -1)
            _entity._acl.w.splice(userIx, 1)
            userIx = _entity._acl?.w?.indexOf(userId)
          return this

        removeReaderGroup: (groupId) ->
          groupIx = _entity._acl?.groups?.r?.indexOf(groupId)
          while (groupIx? and groupIx isnt -1)
            _entity._acl.groups.r.splice(groupIx, 1)
            groupIx = _entity._acl?.groups?.r?.indexOf(groupId)
          return this

        removeWriterGroup: (groupId) ->
          groupIx = _entity._acl?.groups?.w?.indexOf(groupId)
          while (groupIx? and groupIx isnt -1)
            _entity._acl.groups.w.splice(groupIx, 1)
            groupIx = _entity._acl?.groups?.w?.indexOf(groupId)
          return this

        getGloballyReadable: () ->
          _entity._acl?.gr ?= null

        getGloballyWritable: () ->
          _entity._acl?.gw ?= null

        setGloballyReadable: (gr) ->
          _entity._acl?.gr = gr
          return this

        setGloballyWritable: (gw) ->
          _entity._acl?.gw = gw
          return this

      for functionName of aclFunctions
        Object.defineProperty(_entity._acl, functionName, {enumerable:false, writable:true, value:aclFunctions[functionName]})

      return _entity;


    _isKinveyEntity = (testObject) ->
      if testObject? and typeof testObject is 'object'
        objectKeys = Object.keys testObject

        hasMetadata = (objectKeys.length > 0) and
        (objectKeys.indexOf('_acl') isnt -1) and
        (objectKeys.indexOf('_kmd') isnt -1)

        hasAclMethods = (hasMetadata) and
        (typeof(testObject._acl.getCreator) is 'function')

        return (hasMetadata and hasAclMethods)

      return false



    return {

    entity: _generateKinveyEntity

    isKinveyEntity: _isKinveyEntity

    }

