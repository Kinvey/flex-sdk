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

