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

const nock = require('nock');
const should = require('should');
const uuid = require('uuid');
const groupStore = require('../../../../lib/service/modules/groupStore');

const environmentId = 'kid1234';
const blFlags = {};
const appsecret = '123456';
const mastersecret = '789012';
const authenticatedUsername = 'test@test.com';
const baasUrl = 'https://baas.kinvey.com';
const authenticatedUserId = '1234abcd';
const apiVersion = 3;
const authorization = 'Kinvey adfjkldsafjdsalkfjds90fd8sfd=';
const clientAppVersion = {};
const customRequestProperties = {};

function _generateAppMetadata() {
  return {
    _id: environmentId,
    blFlags,
    appsecret,
    mastersecret,
    authenticatedUsername,
    baasUrl
  };
}

function _generateRequestContext() {
  return {
    authenticatedUsername,
    authenticatedUserId,
    apiVersion,
    authorization,
    clientAppVersion,
    customRequestProperties
  };
}

function _generateTaskMetadata() {
  return {
    taskType: 'data',
    objectName: 'someObject',
    hookType: undefined,
    target: undefined,
    taskId: uuid.v4(),
    containerId: uuid.v4()
  };
}

function _generateTaskMetadataForUser() {
  return {
    taskType: 'data',
    objectName: 'group',
    hookType: undefined,
    target: undefined,
    taskId: uuid.v4(),
    containerId: uuid.v4()
  };
}

describe('groupStore', () => {
  beforeEach(() => {
    this.appMetadata = _generateAppMetadata();
    this.requestContext = _generateRequestContext();
    this.taskMetadata = _generateTaskMetadata();
    this.taskMetadataUser = _generateTaskMetadataForUser();
  });

  it('should initialize groupStore', () => {
    const store = groupStore(this.appMetadata, this.requestContext, this.taskMetadata);
    store.should.be.a.Function();
    store.name.should.eql('generateGroupStore');
  });

  describe('groupStore object', () => {
    beforeEach(() => {
      this.store = groupStore(this.appMetadata, this.requestContext, this.taskMetadata);
    });

    afterEach(() => {
      this.store = null;
    });

    it('should create a GroupStore object', () => {
      const myStore = this.store();
      should.exist(myStore.create);
      should.exist(myStore.update);
      should.exist(myStore.findById);
      should.exist(myStore.remove);
      myStore.create.should.be.a.Function();
      myStore.create.name.should.eql('create');
      myStore.update.should.be.a.Function();
      myStore.update.name.should.eql('update');
      myStore.findById.should.be.a.Function();
      myStore.findById.name.should.eql('findById');
      myStore.remove.name.should.eql('remove');
      myStore._useUserContext.should.be.false();
      myStore._useBl.should.be.false();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
    });

    it('should create a GroupStore object that uses userContext', () => {
      const myStore = this.store({ useUserContext: true });
      myStore._useUserContext.should.be.true();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
    });

    it('should create a GroupStore object that uses BL', () => {
      const myStore = this.store({ useBl: true });
      myStore._useBl.should.be.true();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
    });

    it('should be able to create two GroupStore objects with different settings', () => {
      const myStore = this.store();
      const myStore2 = this.store({ useUserContext: true });
      myStore._useUserContext.should.be.false();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
      myStore2._useUserContext.should.be.true();
      myStore2._appMetadata.should.containDeep(this.appMetadata);
      myStore2._requestContext.should.containDeep(this.requestContext);
    });

    it('should create multiple group stores for two different apps', () => {
      const secondAppMetadata = _generateAppMetadata();
      secondAppMetadata._id = 'abcd';

      const myStore = this.store();
      const myStore2 = groupStore(secondAppMetadata, this.requestContext, this.taskMetadata)();

      myStore._appMetadata._id.should.eql(this.appMetadata._id);
      myStore2._appMetadata._id.should.eql(secondAppMetadata._id);
    });

    it('should create multiple group stores for two different requests', () => {
      const secondRequestContext = _generateRequestContext();
      secondRequestContext.authenticatedUserId = 'foo';

      const myStore = this.store();
      const myStore2 = groupStore(this.appMetadata, secondRequestContext, this.taskMetadata)();

      myStore._requestContext.authenticatedUserId.should.eql(this.requestContext.authenticatedUserId);
      myStore2._requestContext.authenticatedUserId.should.eql(secondRequestContext.authenticatedUserId);
    });
  });

  describe('findById', () => {
    beforeEach(() => {
      this.store = groupStore(this.appMetadata, this.requestContext, this.taskMetadata);
      this.storeUserRequest = groupStore(this.appMetadata, this.requestContext, this.taskMetadataUser);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should return a Promise', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/group/${environmentId}/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, username: 'abc' });

      (this.store().findById(1234)).should.be.a.Promise(); // eslint-disable-line new-cap
      return done();
    });

    it('should find a single group', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/group/${environmentId}/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, username: 'abc' });

      this.store().findById(1234, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, username: 'abc' });
        return done();
      });
    });

    it('should resolve a single group if a callback isn\'t passed', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/group/${environmentId}/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, username: 'abc' });

      this.store().findById(1234)
        .then((result) => {
          result.should.containDeep({ _id: 1234, username: 'abc' });
          return done();
        });
    });

    it('should find a single group record using user context', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('authorization', authorization)
        .get(`/group/${environmentId}/1234`)
        .reply(200, { _id: 1234, username: 'abc' });

      this.store({ useUserContext: true }).findById(1234, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, username: 'abc' });
        return done();
      });
    });

    it('should find a single group and use bl', (done) => {
      nock('https://baas.kinvey.com', { badheaders: ['x-kinvey-skip-business-logic'] })
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .get(`/group/${environmentId}/1234`)
        .reply(200, { _id: 1234, someData: 'abc' });

      this.store({ useBl: true }).findById('1234', (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use bl', (done) => {
      this.storeUserRequest({ useBl: true }).findById('1234', (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql(
          'Recursive requests to the group store from the group store cannot use user credentials or use Bl'
        );
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      this.storeUserRequest({ useUserContext: true }).findById('1234', (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql(
          'Recursive requests to the group store from the group store cannot use user credentials or use Bl'
        );
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      this.storeUserRequest({ useUserContext: true, useBl: true }).findById('1234', (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql(
          'Recursive requests to the group store from the group store cannot use user credentials or use Bl'
        );
        return done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/group/${environmentId}/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, username: 'abc' });

      this.storeUserRequest().findById(1234, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, username: 'abc' });
        return done();
      });
    });

    it('should return an error if missing group _id', (done) => {
      this.store().findById((err, result) => {
        should.not.exist(result);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('groupId is required');
        return done();
      });
    });

    it('should return an error if null group _id', (done) => {
      this.store().findById(null, (err, result) => {
        should.not.exist(result);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('groupId is required');
        return done();
      });
    });

    it('should return an error if blank group _id', (done) => {
      this.store().findById('', (err, result) => {
        should.not.exist(result);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('groupId is required');
        return done();
      });
    });

    it('should reject if missing group _id and no callback is passed', (done) => {
      this.store().findById()
        .catch((err) => {
          err.message.should.eql('GroupStoreError');
          err.description.should.eql('Bad Request');
          err.debug.should.eql('groupId is required');
          return done();
        });
    });

    it('should invoke rejection handler if an error occurs and a callback isn\'t passed', (done) => {
      this.storeUserRequest({ useBl: true }).findById('1234')
        .catch((err) => {
          should.exist(err);
          err.message.should.eql('GroupStoreError');
          err.description.should.eql('Not Allowed');
          err.debug.should.eql(
            'Recursive requests to the group store from the group store cannot use user credentials or use Bl'
          );
          return done();
        });
    });
  });

  describe('create', () => {
    beforeEach(() => {
      this.store = groupStore(this.appMetadata, this.requestContext, this.taskMetadata);
      this.storeUserRequest = groupStore(this.appMetadata, this.requestContext, this.taskMetadataUser);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should return a Promise', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .post(`/group/${environmentId}/`, {
          username: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, username: 'abc' });

      (this.store().create({ username: 'abc' })).should.be.a.Promise(); // eslint-disable-line new-cap
      return done();
    });

    it('should create a new entity', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .post(`/group/${environmentId}/`, {
          username: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, username: 'abc' });

      this.store().create({ username: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, username: 'abc' });
        return done();
      });
    });

    it('should resolve if a callback isn\'t passed', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .post(`/group/${environmentId}/`, {
          username: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, username: 'abc' });

      this.store().create({ username: 'abc' })
        .then((result) => {
          result.should.containDeep({ _id: 1234, username: 'abc' });
          return done();
        });
    });

    it('should create a new entity using appsecret', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .post(`/group/${environmentId}/`, {
          username: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, username: 'abc' });

      this.store().create({ username: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, username: 'abc' });
        return done();
      });
    });

    it('should create a new entity and use bl', (done) => {
      nock('https://baas.kinvey.com', { badheaders: ['x-kinvey-skip-business-logic'] })
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .post(`/group/${environmentId}/`, {
          username: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, username: 'abc' });

      this.store({ useBl: true }).create({ username: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, username: 'abc' });
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use bl', (done) => {
      this.storeUserRequest({ useBl: true }).create({ username: 'abc' }, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql(
          'Recursive requests to the group store from the group store cannot use user credentials or use Bl'
        );
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      this.storeUserRequest({ useUserContext: true }).create({ username: 'abc' }, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql(
          'Recursive requests to the group store from the group store cannot use user credentials or use Bl'
        );
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      this.storeUserRequest({ useUserContext: true, useBl: true }).create({ username: 'abc' }, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql(
          'Recursive requests to the group store from the group store cannot use user credentials or use Bl'
        );
        return done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .post(`/group/${environmentId}/`, {
          username: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, username: 'abc' });

      this.storeUserRequest().create({ username: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, username: 'abc' });
        return done();
      });
    });

    it('should return an error if no group entity is supplied', (done) => {
      this.store().create((err, result) => {
        should.not.exist(result);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('A group entity must be supplied');
        return done();
      });
    });

    it('should reject if missing group _id and no callback is passed', (done) => {
      this.store().create()
        .catch((err) => {
          err.message.should.eql('GroupStoreError');
          err.description.should.eql('Bad Request');
          err.debug.should.eql('A group entity must be supplied');
          return done();
        });
    });

    it('should invoke rejection handler if an error occurs and a callback isn\'t supplied', (done) => {
      this.storeUserRequest({ useBl: true }).create({ username: 'abc' })
        .catch((err) => {
          should.exist(err);
          err.message.should.eql('GroupStoreError');
          err.description.should.eql('Not Allowed');
          err.debug.should.eql(
            'Recursive requests to the group store from the group store cannot use user credentials or use Bl'
          );
          return done();
        });
    });
  });

  describe('update', () => {
    beforeEach(() => {
      this.store = groupStore(this.appMetadata, this.requestContext, this.taskMetadata);
      this.storeUserRequest = groupStore(this.appMetadata, this.requestContext, this.taskMetadataUser);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should return a Promise', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .put(`/group/${environmentId}/1234`, {
          _id: 1234,
          username: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, username: 'abc' });

      (this.store().update({ _id: 1234, username: 'abc' })).should.be.a.Promise(); // eslint-disable-line new-cap
      return done();
    });

    it('should update an existing group', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .put(`/group/${environmentId}/1234`, {
          _id: 1234,
          username: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, username: 'abc' });

      this.store().update({ _id: 1234, username: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, username: 'abc' });
        return done();
      });
    });

    it('should resolve on update of an existing group if a callback isn\'t passed', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .put(`/group/${environmentId}/1234`, {
          _id: 1234,
          username: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, username: 'abc' });

      this.store().update({ _id: 1234, username: 'abc' })
        .then((result) => {
          result.should.containDeep({ _id: 1234, username: 'abc' });
          return done();
        });
    });

    it('should update an existing group using user context', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('authorization', authorization)
        .put(`/group/${environmentId}/1234`, {
          _id: 1234,
          username: 'abc'
        })
        .reply(200, { _id: 1234, username: 'abc' });

      this.store({ useUserContext: true }).update({ _id: 1234, username: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, username: 'abc' });
        return done();
      });
    });

    it('should update an existing group and use bl', (done) => {
      nock('https://baas.kinvey.com', { badheaders: ['x-kinvey-skip-business-logic'] })
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('content-type', 'application/json')
        .put(`/group/${environmentId}/1234`, {
          _id: 1234,
          username: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, username: 'abc' });

      this.store({ useBl: true }).update({ _id: 1234, username: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, username: 'abc' });
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use bl', (done) => {
      this.storeUserRequest({ useBl: true }).update({ _id: 1234, username: 'abc' }, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql(
          'Recursive requests to the group store from the group store cannot use user credentials or use Bl'
        );
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      this.storeUserRequest({ useUserContext: true }).update({ _id: 1234, username: 'abc' }, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql(
          'Recursive requests to the group store from the group store cannot use user credentials or use Bl'
        );
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      this.storeUserRequest({ useUserContext: true, useBl: true }).update({ _id: 1234, username: 'abc' },
        (err, result) => {
          should.not.exist(result);
          should.exist(err);
          err.message.should.eql('GroupStoreError');
          err.description.should.eql('Not Allowed');
          err.debug.should.eql(
            'Recursive requests to the group store from the group store cannot use user credentials or use Bl'
          );
          return done();
        });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .put(`/group/${environmentId}/1234`, {
          _id: 1234,
          username: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, username: 'abc' });

      this.storeUserRequest().update({ _id: 1234, username: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, username: 'abc' });
        return done();
      });
    });

    it('should return an error if no group entity is supplied', (done) => {
      this.store().update((err, result) => {
        should.not.exist(result);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('A group entity must be supplied');
        return done();
      });
    });

    it('should reject if missing group entity and no callback is passed', (done) => {
      this.store().update()
        .catch((err) => {
          err.message.should.eql('GroupStoreError');
          err.description.should.eql('Bad Request');
          err.debug.should.eql('A group entity must be supplied');
          return done();
        });
    });

    it('should return an error if an entity is supplied without a valid _id', (done) => {
      this.store().update({ username: 'foo' }, (err, result) => {
        should.not.exist(result);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('A group entity must be supplied containing at least an _id');
        return done();
      });
    });

    it('should reject if an entity is supploed without a valid _id and no callback is passed', (done) => {
      this.store().update({ username: 'foo' })
        .catch((err) => {
          err.message.should.eql('GroupStoreError');
          err.description.should.eql('Bad Request');
          err.debug.should.eql('A group entity must be supplied containing at least an _id');
          return done();
        });
    });

    it('should invoke rejection handler if an error occurs and callback isn\'t passed', (done) => {
      this.storeUserRequest({ useBl: true }).update({ _id: 1234, username: 'abc' })
        .catch((err) => {
          should.exist(err);
          err.message.should.eql('GroupStoreError');
          err.description.should.eql('Not Allowed');
          err.debug.should.eql(
            'Recursive requests to the group store from the group store cannot use user credentials or use Bl'
          );
          return done();
        });
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      this.store = groupStore(this.appMetadata, this.requestContext, this.taskMetadata);
      this.storeUserRequest = groupStore(this.appMetadata, this.requestContext, this.taskMetadataUser);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should return a Promise', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/group/${environmentId}/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200);

      (this.store().remove(1234)).should.be.a.Promise(); // eslint-disable-line new-cap
      return done();
    });

    it('should remove a single group', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/group/${environmentId}/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200);

      this.store().remove(1234, (err, result) => {
        should.not.exist(err);
        should.not.exist(result);
        return done();
      });
    });

    it('should resolve on remove if a callback isn\'t passed', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/group/${environmentId}/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200);

      this.store().remove(1234)
        .then((result) => {
          should.not.exist(result);
          return done();
        });
    });

    it('should remove a single group record using user context', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('authorization', authorization)
        .delete(`/group/${environmentId}/1234`)
        .reply(200);

      this.store({ useUserContext: true }).remove(1234, (err, result) => {
        should.not.exist(err);
        should.not.exist(result);
        return done();
      });
    });

    it('should remove a single entity and use bl', (done) => {
      nock('https://baas.kinvey.com', { badheaders: ['x-kinvey-skip-business-logic'] })
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .delete(`/group/${environmentId}/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200);

      this.store({ useBl: true }).remove('1234', (err, result) => {
        should.not.exist(err);
        should.not.exist(result);
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use bl', (done) => {
      this.storeUserRequest({ useBl: true }).remove('1234', (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql(
          'Recursive requests to the group store from the group store cannot use user credentials or use Bl'
        );
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      this.storeUserRequest({ useUserContext: true }).remove('1234', (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql(
          'Recursive requests to the group store from the group store cannot use user credentials or use Bl'
        );
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      this.storeUserRequest({ useUserContext: true, useBl: true }).remove('1234', (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql(
          'Recursive requests to the group store from the group store cannot use user credentials or use Bl'
        );
        return done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/group/${environmentId}/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200);

      this.storeUserRequest().remove('1234', (err, result) => {
        should.not.exist(err);
        should.not.exist(result);
        return done();
      });
    });

    it('should return an error if missing groupId', (done) => {
      this.store().remove((err, result) => {
        should.not.exist(result);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('groupId is required');
        return done();
      });
    });

    it('should return an error if null groupId', (done) => {
      this.store().remove(null, (err, result) => {
        should.not.exist(result);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('groupId is required');
        return done();
      });
    });

    it('should return an error if blank groupId', (done) => {
      this.store().remove('', (err, result) => {
        should.not.exist(result);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('groupId is required');
        return done();
      });
    });

    it('should reject if missing group _id and no callback is passed', (done) => {
      this.store().remove()
        .catch((err) => {
          err.message.should.eql('GroupStoreError');
          err.description.should.eql('Bad Request');
          err.debug.should.eql('groupId is required');
          return done();
        });
    });

    it('should invoke rejection handler if an error occurs and callback isn\'t passed', (done) => {
      this.storeUserRequest({ useBl: true }).remove('1234')
        .catch((err) => {
          should.exist(err);
          err.message.should.eql('GroupStoreError');
          err.description.should.eql('Not Allowed');
          err.debug.should.eql(
            'Recursive requests to the group store from the group store cannot use user credentials or use Bl'
          );
          return done();
        });
    });
  });
});
