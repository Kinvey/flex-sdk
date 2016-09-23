/**
 * Copyright (c) 2016 Kinvey Inc.
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

const has = require('lodash.has');
const isNil = require('lodash.isnil');
const getProp = require('lodash.get');
const moment = require('moment');
const BSON = require('bson').BSONPure;

function kinveyEntityModule(environmentId, useBSONObjectId) {
  if (!useBSONObjectId) useBSONObjectId = false;

  function _generateKinveyEntity(entityOrId) {
    let _entity = {};

    function _createEntityId() {
      if (useBSONObjectId) return new BSON.ObjectID();
      return new BSON.ObjectID().toString();
    }

    const currentTimeString = moment().utc().toISOString();

    if (typeof entityOrId === 'string' || typeof entityOrId === 'undefined') {
      _entity = {
        _acl: {
          creator: environmentId
        },
        _kmd: {
          lmt: currentTimeString,
          ect: currentTimeString
        }
      };

      if (entityOrId) {
        _entity._id = entityOrId;
      } else {
        _entity._id = _createEntityId();
      }
    } else {
      if (typeof entityOrId === 'object' && entityOrId !== null) {
        _entity = entityOrId;

        if (!has(_entity, ['_acl'])) _entity._acl = {};
        if (!has(_entity, ['_id)'])) _entity._id = _createEntityId();
        if (!has(_entity, ['_acl', 'creator'])) _entity._acl.creator = environmentId;
        if (!has(_entity, ['_kmd'])) _entity._kmd = {};
        if (!has(_entity, ['_kmd', 'ect'])) _entity._kmd.ect = currentTimeString;
        if (!has(_entity, ['_kmd', 'lmt'])) _entity._kmd.lmt = currentTimeString;
      }
    }

    let aclFunctions = {};

    function getCreator() {
      return getProp(_entity, ['_acl', 'creator']);
    }

    function getReaders() {
      return getProp(_entity, ['_acl', 'r'], []);
    }

    function getWriters() {
      return getProp(_entity, ['_acl', 'w'], []);
    }

    function getReaderGroups() {
      return getProp(_entity, ['_acl', 'groups', 'r'], []);
    }

    function getWriterGroups() {
      return getProp(_entity, ['_acl', 'groups', 'w'], []);
    }

    function addReader(userId) {
      if (!(getProp(_entity, ['_acl', 'r']))) _entity._acl.r = [];
      if (_entity._acl.r.indexOf(userId) === -1) _entity._acl.r.push(userId);
      return aclFunctions;
    }

    function addWriter(userId) {
      if (!(getProp(_entity, ['_acl', 'w']))) _entity._acl.w = [];
      if (_entity._acl.w.indexOf(userId) === -1) _entity._acl.w.push(userId);
      return this;
    }

    function addReaderGroup(groupId) {
      if (!(getProp(_entity, ['_acl', 'groups']))) _entity._acl.groups = {};
      if (!(getProp(_entity, ['_acl', 'groups', 'r']))) _entity._acl.groups.r = [];
      if (_entity._acl.groups.r.indexOf(groupId) === -1) _entity._acl.groups.r.push(groupId);
      return aclFunctions;
    }

    function addWriterGroup(groupId) {
      if (!(getProp(_entity, ['_acl', 'groups']))) _entity._acl.groups = {};
      if (!(getProp(_entity, ['_acl', 'groups', 'w']))) _entity._acl.groups.w = [];
      if (_entity._acl.groups.w.indexOf(groupId) === -1) _entity._acl.groups.w.push(groupId);
      return aclFunctions;
    }

    function removeReader(userId) {
      let userIx = (getProp(_entity, ['_acl', 'r'], [])).indexOf(userId);
      while (userIx !== -1) {
        _entity._acl.r.splice(userIx, 1);
        userIx = _entity._acl.r.indexOf(userId);
      }
      return aclFunctions;
    }

    function removeWriter(userId) {
      let userIx = (getProp(_entity, ['_acl', 'w'], [])).indexOf(userId);
      while (userIx !== -1) {
        _entity._acl.w.splice(userIx, 1);
        userIx = _entity._acl.w.indexOf(userId);
      }
      return aclFunctions;
    }

    function removeReaderGroup(groupId) {
      let groupIx = (getProp(_entity, ['_acl', 'groups', 'r'], [])).indexOf(groupId);
      while (groupIx !== -1) {
        _entity._acl.groups.r.splice(groupIx, 1);
        groupIx = _entity._acl.groups.r.indexOf(groupId);
      }
      return aclFunctions;
    }

    function removeWriterGroup(groupId) {
      let writers = getProp(_entity, ['_acl', 'groups', 'w'], []);
      let groupIx = writers.indexOf(groupId);
      while (groupIx !== -1) {
        _entity._acl.groups.w.splice(groupIx, 1);
        writers = getProp(_entity, ['_acl', 'groups', 'w'], []);
        groupIx = writers.indexOf(groupId);
      }
      return aclFunctions;
    }

    function getGloballyReadable() {
      if (typeof _entity._acl.gr === 'undefined') _entity._acl.gr = null;
      return _entity._acl.gr;
    }

    function getGloballyWritable() {
      if (typeof _entity._acl.gw === 'undefined') _entity._acl.gw = null;
      return _entity._acl.gw;
    }

    function setGloballyReadable(gr) {
      _entity._acl.gr = gr;
      return aclFunctions;
    }

    function setGloballyWritable(gw) {
      _entity._acl.gw = gw;
      return aclFunctions;
    }

    aclFunctions = {
      getCreator,
      getReaders,
      getWriters,
      getReaderGroups,
      getWriterGroups,
      addReader,
      addWriter,
      addReaderGroup,
      addWriterGroup,
      removeReader,
      removeWriter,
      removeReaderGroup,
      removeWriterGroup,
      getGloballyReadable,
      getGloballyWritable,
      setGloballyReadable,
      setGloballyWritable
    };

    for (const functionName in aclFunctions) {
      if (aclFunctions.hasOwnProperty(functionName)) {
        Object.defineProperty(_entity._acl, functionName, {
          enumerable: false,
          writable: true,
          value: aclFunctions[functionName]
        });
      }
    }

    return _entity;
  }

  function _isKinveyEntity(testObject) {
    if (!isNil(testObject) && typeof testObject === 'object') {
      const hasMetadata = testObject.hasOwnProperty('_acl') && testObject.hasOwnProperty('_kmd');
      const hasAclMethods = hasMetadata && typeof(testObject._acl.getCreator) === 'function';
      return (hasMetadata && hasAclMethods);
    }

    return false;
  }

  return {
    entity: _generateKinveyEntity,
    isKinveyEntity: _isKinveyEntity
  };
}

module.exports = kinveyEntityModule;
