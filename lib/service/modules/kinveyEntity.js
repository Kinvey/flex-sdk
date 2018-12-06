/**
 * Copyright (c) 2018 Kinvey Inc.
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

const moment = require('moment');
const BSON = require('bson').BSONPure;

function kinveyEntityModule(environmentId, useBSONObjectId = false) {
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
    } else if (typeof entityOrId === 'object' && entityOrId !== null) {
      _entity = entityOrId;

      if (!_entity._acl) _entity._acl = {};
      if (!_entity._id) _entity._id = _createEntityId();
      if (!_entity._acl.creator) _entity._acl.creator = environmentId;
      if (!_entity._kmd) _entity._kmd = {};
      if (!_entity._kmd.ect) _entity._kmd.ect = currentTimeString;
      if (!_entity._kmd.lmt) _entity._kmd.lmt = currentTimeString;
    }

    let aclFunctions = {};

    function getCreator() {
      return _entity._acl.creator;
    }

    function getReaders() {
      return _entity._acl.r || [];
    }

    function getWriters() {
      return _entity._acl.w || [];
    }

    function getReaderGroups() {
      return _entity._acl.groups ? _entity._acl.groups.r || [] : [];
    }

    function getWriterGroups() {
      return _entity._acl.groups ? _entity._acl.groups.w || [] : [];
    }

    function getReaderRoles() {
      return _entity._acl.roles ? _entity._acl.roles.r || [] : [];
    }

    function getUpdateRoles() {
      return _entity._acl.roles ? _entity._acl.roles.u || [] : [];
    }

    function getDeleteRoles() {
      return _entity._acl.roles ? _entity._acl.roles.d || [] : [];
    }

    function addReader(userId) {
      if (!_entity._acl.r) _entity._acl.r = [];
      if (_entity._acl.r.indexOf(userId) === -1) _entity._acl.r.push(userId);
      return aclFunctions;
    }

    function addWriter(userId) {
      if (!_entity._acl.w) _entity._acl.w = [];
      if (_entity._acl.w.indexOf(userId) === -1) _entity._acl.w.push(userId);
      return this;
    }

    function addReaderGroup(groupId) {
      if (!_entity._acl.groups) _entity._acl.groups = {};
      if (!_entity._acl.groups.r) _entity._acl.groups.r = [];
      if (_entity._acl.groups.r.indexOf(groupId) === -1) _entity._acl.groups.r.push(groupId);
      return aclFunctions;
    }

    function addWriterGroup(groupId) {
      if (!_entity._acl.groups) _entity._acl.groups = {};
      if (!_entity._acl.groups.w) _entity._acl.groups.w = [];
      if (_entity._acl.groups.w.indexOf(groupId) === -1) _entity._acl.groups.w.push(groupId);
      return aclFunctions;
    }

    function addReaderRole(roleId) {
      if (!_entity._acl.roles) _entity._acl.roles = {};
      if (!_entity._acl.roles.r) _entity._acl.roles.r = [];
      if (_entity._acl.roles.r.indexOf(roleId) === -1) _entity._acl.roles.r.push(roleId);
      return aclFunctions;
    }

    function addUpdateRole(roleId) {
      if (!_entity._acl.roles) _entity._acl.roles = {};
      if (!_entity._acl.roles.u) _entity._acl.roles.u = [];
      if (_entity._acl.roles.u.indexOf(roleId) === -1) _entity._acl.roles.u.push(roleId);
      return aclFunctions;
    }

    function addDeleteRole(roleId) {
      if (!_entity._acl.roles) _entity._acl.roles = {};
      if (!_entity._acl.roles.d) _entity._acl.roles.d = [];
      if (_entity._acl.roles.d.indexOf(roleId) === -1) _entity._acl.roles.d.push(roleId);
      return aclFunctions;
    }

    function removeReader(userId) {
      let userIx = (_entity._acl.r || []).indexOf(userId);
      while (userIx !== -1) {
        _entity._acl.r.splice(userIx, 1);
        userIx = _entity._acl.r.indexOf(userId);
      }
      return aclFunctions;
    }

    function removeWriter(userId) {
      let userIx = (_entity._acl.w || []).indexOf(userId);
      while (userIx !== -1) {
        _entity._acl.w.splice(userIx, 1);
        userIx = _entity._acl.w.indexOf(userId);
      }
      return aclFunctions;
    }

    function removeReaderGroup(groupId) {
      let groupIx = (_entity._acl.groups ? _entity._acl.groups.r || [] : []).indexOf(groupId);
      while (groupIx !== -1) {
        _entity._acl.groups.r.splice(groupIx, 1);
        groupIx = (_entity._acl.groups ? _entity._acl.groups.r || [] : []).indexOf(groupId);
      }
      return aclFunctions;
    }

    function removeWriterGroup(groupId) {
      let groupIx = (_entity._acl.groups ? _entity._acl.groups.w || [] : []).indexOf(groupId);
      while (groupIx !== -1) {
        _entity._acl.groups.w.splice(groupIx, 1);
        groupIx = (_entity._acl.groups ? _entity._acl.groups.w || [] : []).indexOf(groupId);
      }
      return aclFunctions;
    }

    function removeReaderRole(roleId) {
      let roleIx = (_entity._acl.roles ? _entity._acl.roles.r || [] : []).indexOf(roleId);
      while (roleIx !== -1) {
        _entity._acl.roles.r.splice(roleIx, 1);
        roleIx = (_entity._acl.roles ? _entity._acl.roles.r || [] : []).indexOf(roleId);
      }
      return aclFunctions;
    }

    function removeUpdateRole(roleId) {
      let roleIx = (_entity._acl.roles ? _entity._acl.roles.u || [] : []).indexOf(roleId);
      while (roleIx !== -1) {
        _entity._acl.roles.u.splice(roleIx, 1);
        roleIx = (_entity._acl.roles ? _entity._acl.roles.u || [] : []).indexOf(roleId);
      }
      return aclFunctions;
    }

    function removeDeleteRole(roleId) {
      let roleIx = (_entity._acl.roles ? _entity._acl.roles.d || [] : []).indexOf(roleId);
      while (roleIx !== -1) {
        _entity._acl.roles.d.splice(roleIx, 1);
        roleIx = (_entity._acl.roles ? _entity._acl.roles.d || [] : []).indexOf(roleId);
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
      getReaderRoles,
      getUpdateRoles,
      getDeleteRoles,
      addReader,
      addWriter,
      addReaderGroup,
      addWriterGroup,
      addReaderRole,
      addUpdateRole,
      addDeleteRole,
      removeReader,
      removeWriter,
      removeReaderGroup,
      removeWriterGroup,
      removeReaderRole,
      removeUpdateRole,
      removeDeleteRole,
      getGloballyReadable,
      getGloballyWritable,
      setGloballyReadable,
      setGloballyWritable
    };

    Object.keys(aclFunctions).forEach((key) => {
      Object.defineProperty(_entity._acl, key, {
        enumerable: false,
        writable: true,
        value: aclFunctions[key]
      });
    });

    return _entity;
  }

  function _isKinveyEntity(testObject) {
    if (testObject != null && typeof testObject === 'object') {
      const hasMetadata = testObject._acl && testObject._kmd;
      const hasAclMethods = hasMetadata && typeof testObject._acl.getCreator === 'function';
      return !!(hasMetadata && hasAclMethods);
    }

    return false;
  }

  return {
    entity: _generateKinveyEntity,
    isKinveyEntity: _isKinveyEntity
  };
}

module.exports = kinveyEntityModule;
