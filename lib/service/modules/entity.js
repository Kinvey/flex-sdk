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

'use strict';

const _ = require('lodash');
const moment = require('moment');
const BSON = require('bson').BSONPure;

module.exports = (environmentId, useBSONObjectId) => {
  if (!useBSONObjectId) useBSONObjectId = false;

  const _generateKinveyEntity = (entityOrId) => {
    let _entity = {};

    const _createEntityId = () => {
      if (useBSONObjectId) return new BSON.ObjectID();
      return new BSON.ObjectID().toString();
    };

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
      if (typeof entityOrId === 'object') {
        _entity = entityOrId;

        if (!_entity._acl) _entity._acl = {};
        if (!_entity._id) _entity._id = _createEntityId();
        if (!_entity._acl) _entity._acl = {};
        if (!_entity._acl.creator) _entity._acl.creator = environmentId;
        if (!_entity._kmd) _entity._kmd = {};
        if (!_entity._kmd.ect) _entity._kmd.ect = currentTimeString;
        if (!_entity._kmd.lmt) _entity._kmd.lmt = currentTimeString;
      }
    }

    const aclFunctions = {
      getCreator: () => _.get(_entity, ['_acl', 'creator']),
      getReaders: () => _.get(_entity, ['_acl', 'r'], []),
      getWriters: () => _.get(_entity, ['_acl', 'w'], []),
      getReaderGroups: () => _.get(_entity, ['_acl', 'groups', 'r'], []),
      getWriterGroups: () => _.get(_entity, ['_acl', 'groups', 'w'], []),
      addReader: (userId) => {
        if (!(_.get(_entity, ['_acl', 'r']))) _entity._acl.r = [];
        if (_entity._acl.r.indexOf(userId) === -1) _entity._acl.r.push(userId);
        return aclFunctions;
      },
      addWriter: (userId) => {
        if (!(_.get(_entity, ['_acl', 'w']))) _entity._acl.w = [];
        if (_entity._acl.w.indexOf(userId) === -1) _entity._acl.w.push(userId);
        return this;
      },
      addReaderGroup: (groupId) => {
        if (!(_.get(_entity, ['_acl', 'groups']))) _entity._acl.groups = [];
        if (!(_.get(_entity, ['_acl', 'groups', 'r']))) _entity._acl.groups.r = [];
        if (_entity._acl.groups.r.indexOf(groupId) === -1) _entity._acl.groups.r.push(groupId);
        return aclFunctions;
      },

      addWriterGroup: (groupId) => {
        if (!(_.get(_entity, ['_acl', 'groups']))) _entity._acl.groups = [];
        if (!(_.get(_entity, ['_acl', 'groups', 'w']))) _entity._acl.groups.w = [];
        if (_entity._acl.groups.w.indexOf(groupId) === -1) _entity._acl.groups.w.push(groupId);
        return aclFunctions;
      },
      removeReader: (userId) => {
        let readers = _.get(_entity, ['_acl', 'r'], []);
        let userIx = readers.indexOf(userId);
        while (userIx !== -1) {
          _entity._acl.r.splice(userIx, 1);
          readers = _.get(_entity, ['_acl', 'r'], []);
          userIx = readers.indexOf(userId);
        }
        return aclFunctions;
      },
      removeWriter: (userId) => {
        let writers = _.get(_entity, ['_acl', 'w'], []);
        let userIx = writers.indexOf(userId);
        while (userIx !== -1) {
          _entity._acl.w.splice(userIx, 1);
          writers = _.get(_entity, ['_acl', 'w'], []);
          userIx = writers.indexOf(userId);
        }
        return aclFunctions;
      },
      removeReaderGroup: (groupId) => {
        let readers = _.get(_entity, ['_acl', 'groups', 'r'], []);
        let groupIx = readers.indexOf(groupId);
        while (groupIx !== -1) {
          _entity._acl.groups.r.splice(groupIx, 1);
          readers = _.get(_entity, ['_acl', 'groups', 'r'], []);
          groupIx = readers.indexOf(groupId);
        }
        return aclFunctions;
      },
      removeWriterGroup: (groupId) => {
        let writers = _.get(_entity, ['_acl', 'groups', 'w'], []);
        let groupIx = writers.indexOf(groupId);
        while (groupIx !== -1) {
          _entity._acl.groups.w.splice(groupIx, 1);
          writers = _.get(_entity, ['_acl', 'groups', 'w'], []);
          groupIx = writers.indexOf(groupId);
        }
        return aclFunctions;
      },
      getGloballyReadable: () => {
        if (typeof _entity._acl.gr === 'undefined') _entity._acl.gr = null;
        return _entity._acl.gr;
      },
      getGloballyWritable: () => {
        if (typeof _entity._acl.gw === 'undefined') _entity._acl.gw = null;
        return _entity._acl.gw;
      },
      setGloballyReadable: (gr) => {
        _entity._acl.gr = gr;
        return aclFunctions;
      },
      setGloballyWritable: (gw) => {
        _entity._acl.gw = gw;
        return aclFunctions;
      }
    };

    for (const functionName in aclFunctions) {
      if ({}.hasOwnProperty.call(aclFunctions, functionName)) {
        Object.defineProperty(_entity._acl, functionName, {
          enumerable: false,
          writable: true,
          value: aclFunctions[functionName]
        });
      }
    }

    return _entity;
  };

  const _isKinveyEntity = (testObject) => {
    if ((typeof testObject !== 'undefined' && testObject !== null) && typeof testObject === 'object') {
      const objectKeys = Object.keys(testObject);

      const hasMetadata = (objectKeys.length > 0)
        && (objectKeys.indexOf('_acl') !== -1)
        && (objectKeys.indexOf('_kmd') !== -1);

      const hasAclMethods = (hasMetadata)
        && (typeof(testObject._acl.getCreator) === 'function');

      return (hasMetadata && hasAclMethods);
    }

    return false;
  };

  return {
    entity: _generateKinveyEntity,
    isKinveyEntity: _isKinveyEntity
  };
};
