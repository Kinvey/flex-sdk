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

const nock = require('nock');
const should = require('should');
const uuid = require('uuid');
const userStore = require('../../../lib/service/modules/userStore');
const Query = require('../../../lib/service/modules/query');
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
    objectName: 'user',
    hookType: undefined,
    target: undefined,
    taskId: uuid.v4(),
    containerId: uuid.v4()
  };
}

describe('userStore', () => {
  beforeEach(() => {
    this.appMetadata = _generateAppMetadata();
    this.requestContext = _generateRequestContext();
    this.taskMetadata = _generateTaskMetadata();
    this.taskMetadataUser = _generateTaskMetadataForUser();
  });

  it('should initialize userstore', () => {
    const store = userStore(this.appMetadata, this.requestContext, this.taskMetadata);
    store.should.be.a.Function();
    store.name.should.eql('generateUserStore');
  });

  describe('userstore object', () => {
    beforeEach(() => {
      this.store = userStore(this.appMetadata, this.requestContext, this.taskMetadata);
    });

    afterEach(() => {
      this.store = null;
    });

    it('should create a UserStore object', () => {
      const myStore = this.store();
      should.exist(myStore.create);
      should.exist(myStore.update);
      should.exist(myStore.findById);
      should.exist(myStore.find);
      should.exist(myStore.getCurrentUser);
      should.exist(myStore.remove);
      should.exist(myStore.suspend);
      should.exist(myStore.restore);
      should.exist(myStore.count);
      myStore.create.should.be.a.Function();
      myStore.create.name.should.eql('create');
      myStore.update.should.be.a.Function();
      myStore.update.name.should.eql('update');
      myStore.findById.should.be.a.Function();
      myStore.findById.name.should.eql('findById');
      myStore.find.should.be.a.Function();
      myStore.find.name.should.eql('find');
      myStore.getCurrentUser.should.be.a.Function();
      myStore.getCurrentUser.name.should.eql('getCurrentUser');
      myStore.remove.should.be.a.Function();
      myStore.remove.name.should.eql('remove');
      myStore.suspend.should.be.a.Function();
      myStore.suspend.name.should.eql('suspend');
      myStore.restore.should.be.a.Function();
      myStore.restore.name.should.eql('restore');
      myStore.count.should.be.a.Function();
      myStore.count.name.should.eql('count');
      myStore._useMasterSecret.should.be.true();                              // DEPRECATED
      myStore._skipBl.should.be.true();                                       // DEPRECATED
      myStore._useUserContext.should.be.false();
      myStore._useBl.should.be.false();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
    });

    // DEPRECATED
    it('should create a UserStore object that uses mastersecret', () => {
      const myStore = this.store({ useMasterSecret: true });
      myStore._useMasterSecret.should.be.true();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
    });

    it('should create a UserStore object that uses userContext', () => {
      const myStore = this.store({ useUserContext: true });
      myStore._useUserContext.should.be.true();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
    });

    // DEPRECATED
    it('should create a UserStore object that skips BL', () => {
      const myStore = this.store({ skipBl: true });
      myStore._skipBl.should.be.true();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
    });

    it('should create a UserStore object that uses BL', () => {
      const myStore = this.store({ useBl: true });
      myStore._useBl.should.be.true();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
    });

    it('should be able to create two UserStore objects with different settings', () => {
      const myStore = this.store();
      const myStore2 = this.store({ useUserContext: true });
      myStore._useUserContext.should.be.false();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
      myStore2._useUserContext.should.be.true();
      myStore2._appMetadata.should.containDeep(this.appMetadata);
      myStore2._requestContext.should.containDeep(this.requestContext);
    });

    it('should create multiple user stores for two different apps', () => {
      const secondAppMetadata = _generateAppMetadata();
      secondAppMetadata._id = 'abcd';

      const myStore = this.store();
      const myStore2 = userStore(secondAppMetadata, this.requestContext, this.taskMetadata)();

      myStore._appMetadata._id.should.eql(this.appMetadata._id);
      myStore2._appMetadata._id.should.eql(secondAppMetadata._id);
    });

    it('should create multiple user stores for two different requests', () => {
      const secondRequestContext = _generateRequestContext();
      secondRequestContext.authenticatedUserId = 'foo';

      const myStore = this.store();
      const myStore2 = userStore(this.appMetadata, secondRequestContext, this.taskMetadata)();

      myStore._requestContext.authenticatedUserId.should.eql(this.requestContext.authenticatedUserId);
      myStore2._requestContext.authenticatedUserId.should.eql(secondRequestContext.authenticatedUserId);
    });
  });

  describe('find', () => {
    beforeEach(() => {
      this.store = userStore(this.appMetadata, this.requestContext, this.taskMetadata);
      this.storeUserRequest = userStore(this.appMetadata, this.requestContext, this.taskMetadataUser);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should find all records', (done) => {
      nock('https://baas.kinvey.com')
       .matchHeader('content-type', 'application/json')
       .matchHeader('x-kinvey-api-version', '3')
       .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/user/${environmentId}/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, [{ _id: 123, username: 'abc' }, { _id: 456, username: 'xyz' }]);

      this.store().find((err, result) => {
        should.not.exist(err);
        result.should.containDeep([{ _id: 123, username: 'abc' }, { _id: 456, username: 'xyz' }]);
        return done();
      });
    });

    it('should find all records using userContext', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('authorization', authorization)
        .get(`/user/${environmentId}/`)
        .reply(200, [{ _id: 123, username: 'abc' }, { _id: 456, username: 'xyz' }]);

      this.store({ useUserContext: true }).find((err, result) => {
        should.not.exist(err);
        result.should.containDeep([{ _id: 123, username: 'abc' }, { _id: 456, username: 'xyz' }]);
        return done();
      });
    });

    it('should find all records and use bl', (done) => {
      nock('https://baas.kinvey.com', { badheaders: ['x-kinvey-skip-business-logic'] })
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .get(`/user/${environmentId}/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, [{ _id: 123, username: 'abc' }, { _id: 456, username: 'xyz' }]);

      this.store({ useBl: true }).find((err, result) => {
        should.not.exist(err);
        result.should.containDeep([{ _id: 123, username: 'abc' }, { _id: 456, username: 'xyz' }]);
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use bl', (done) => {
      this.storeUserRequest({ useBl: true }).find((err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      this.storeUserRequest({ useUserContext: true }).find((err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      this.storeUserRequest({ useUserContext: true, useBl: true }).find((err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/user/${environmentId}/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, [{ _id: 123, username: 'abc' }, { _id: 456, username: 'xyz' }]);

      this.storeUserRequest().find((err, result) => {
        should.not.exist(err);
        result.should.containDeep([{ _id: 123, username: 'abc' }, { _id: 456, username: 'xyz' }]);
        return done();
      });
    });

    it('should find records with a query object', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/user/${environmentId}/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .query({ query: '{"foo":"bar"}' })
        .reply(200, [{ _id: 123, username: 'abc' }, { _id: 456, username: 'xyz' }]);

      const query = new Query();
      query.equalTo('foo', 'bar');

      this.store().find(query, (err, result) => {
        should.not.exist(err);
        result.should.containDeep([{ _id: 123, username: 'abc' }, { _id: 456, username: 'xyz' }]);
        return done();
      });
    });
  });

  describe('findById', () => {
    beforeEach(() => {
      this.store = userStore(this.appMetadata, this.requestContext, this.taskMetadata);
      this.storeUserRequest = userStore(this.appMetadata, this.requestContext, this.taskMetadataUser);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should find a single user', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/user/${environmentId}/1234`)
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

    it('should find a single user record using user context', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('authorization', authorization)
        .get(`/user/${environmentId}/1234`)
        .reply(200, { _id: 1234, username: 'abc' });

      this.store({ useUserContext: true }).findById(1234, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, username: 'abc' });
        return done();
      });
    });

    it('should find a single user and use bl', (done) => {
      nock('https://baas.kinvey.com', { badheaders: ['x-kinvey-skip-business-logic'] })
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .get(`/user/${environmentId}/1234`)
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
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      this.storeUserRequest({ useUserContext: true }).findById('1234', (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      this.storeUserRequest({ useUserContext: true, useBl: true }).findById('1234', (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/user/${environmentId}/1234`)
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

    it('should return an error if missing user _id', (done) => {
      this.store().findById((err, result) => {
        should.not.exist(result);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('userId is required');
        return done();
      });
    });
  });

  describe('getCurrentUser', () => {
    beforeEach(() => {
      this.store = userStore(this.appMetadata, this.requestContext, this.taskMetadata);
      this.storeUserRequest = userStore(this.appMetadata, this.requestContext, this.taskMetadataUser);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should get the current user entity', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/user/${environmentId}/${authenticatedUserId}`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: `${authenticatedUserId}`, username: 'abc' });

      this.store().getCurrentUser((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: `${authenticatedUserId}`, username: 'abc' });
        return done();
      });
    });

    it('should get the current user and use bl', (done) => {
      nock('https://baas.kinvey.com', { badheaders: ['x-kinvey-skip-business-logic'] })
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .get(`/user/${environmentId}/${authenticatedUserId}`)
        .reply(200, { _id: 1234, someData: 'abc' });

      this.store({ useBl: true }).getCurrentUser((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use bl', (done) => {
      this.storeUserRequest({ useBl: true }).getCurrentUser((err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      this.storeUserRequest({ useUserContext: true }).getCurrentUser((err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      this.storeUserRequest({ useUserContext: true, useBl: true }).getCurrentUser((err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/user/${environmentId}/${authenticatedUserId}`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: `${authenticatedUserId}`, username: 'abc' });

      this.storeUserRequest().getCurrentUser((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: `${authenticatedUserId}`, username: 'abc' });
        return done();
      });
    });

    it('should return an error if missing user _id', (done) => {
      this.store().findById((err, result) => {
        should.not.exist(result);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('userId is required');
        return done();
      });
    });
  });

  describe('create', () => {
    beforeEach(() => {
      this.store = userStore(this.appMetadata, this.requestContext, this.taskMetadata);
      this.storeUserRequest = userStore(this.appMetadata, this.requestContext, this.taskMetadataUser);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should create a new entity', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .post(`/user/${environmentId}/`, {
          username: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: appsecret
        })
        .reply(200, { _id: 1234, username: 'abc' });

      this.store().create({ username: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, username: 'abc' });
        return done();
      });
    });

    it('should create a new entity using appsecret', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .post(`/user/${environmentId}/`, {
          username: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: appsecret
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
        .post(`/user/${environmentId}/`, {
          username: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: appsecret
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
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      this.storeUserRequest({ useUserContext: true }).create({ username: 'abc' }, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      this.storeUserRequest({ useUserContext: true, useBl: true }).create({ username: 'abc' }, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .post(`/user/${environmentId}/`, {
          username: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: appsecret
        })
        .reply(200, { _id: 1234, username: 'abc' });

      this.storeUserRequest().create({ username: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, username: 'abc' });
        return done();
      });
    });

    it('should return an error if no user entity is supplied', (done) => {
      this.store().create((err, result) => {
        should.not.exist(result);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('A user entity must be supplied');
        return done();
      });
    });
  });

  describe('update', () => {
    beforeEach(() => {
      this.store = userStore(this.appMetadata, this.requestContext, this.taskMetadata);
      this.storeUserRequest = userStore(this.appMetadata, this.requestContext, this.taskMetadataUser);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should update an existing user', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .put(`/user/${environmentId}/1234`, {
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

    it('should update an existing user using user context', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('authorization', authorization)
        .put(`/user/${environmentId}/1234`, {
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

    it('should update an existing user and use bl', (done) => {
      nock('https://baas.kinvey.com', { badheaders: ['x-kinvey-skip-business-logic'] })
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('content-type', 'application/json')
        .put(`/user/${environmentId}/1234`, {
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
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      this.storeUserRequest({ useUserContext: true }).update({ _id: 1234, username: 'abc' }, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      this.storeUserRequest({ useUserContext: true, useBl: true }).update({ _id: 1234, username: 'abc' }, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .put(`/user/${environmentId}/1234`, {
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

    it('should return an error if no user entity is supplied', (done) => {
      this.store().update((err, result) => {
        should.not.exist(result);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('A user entity must be supplied');
        return done();
      });
    });

    it('should return an error if an entity is supplied without a valid _id', (done) => {
      this.store().update({ username: 'foo' }, (err, result) => {
        should.not.exist(result);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('A user entity must be supplied containing at least an _id');
        return done();
      });
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      this.store = userStore(this.appMetadata, this.requestContext, this.taskMetadata);
      this.storeUserRequest = userStore(this.appMetadata, this.requestContext, this.taskMetadataUser);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should remove a single user', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/user/${environmentId}/1234?hard=true`)
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

    it('should not include hard=true if apiVersion is 1', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '1')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/user/${environmentId}/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200);

      const myStore = this.store();

      myStore._requestContext.apiVersion = 1;
      this.store().remove(1234, (err, result) => {
        should.not.exist(err);
        should.not.exist(result);
        return done();
      });
    });

    it('should remove a single user record using user context', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('authorization', authorization)
        .delete(`/user/${environmentId}/1234?hard=true`)
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
        .delete(`/user/${environmentId}/1234?hard=true`)
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
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      this.storeUserRequest({ useUserContext: true }).remove('1234', (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      this.storeUserRequest({ useUserContext: true, useBl: true }).remove('1234', (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/user/${environmentId}/1234?hard=true`)
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

    it('should return an error if missing userId', (done) => {
      this.store().remove((err, result) => {
        should.not.exist(result);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('userId is required');
        return done();
      });
    });
  });

  describe('count', () => {
    beforeEach(() => {
      this.store = userStore(this.appMetadata, this.requestContext, this.taskMetadata);
      this.storeUserRequest = userStore(this.appMetadata, this.requestContext, this.taskMetadataUser);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should get a count of all users', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/user/${environmentId}/_count/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 30 });

      this.store().count((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        return done();
      });
    });

    it('should get a count of all users using user context', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('authorization', authorization)
        .get(`/user/${environmentId}/_count/`)
        .reply(200, { count: 30 });

      this.store({ useUserContext: true }).count((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        return done();
      });
    });

    it('should get a count of all users and use bl', (done) => {
      nock('https://baas.kinvey.com', { badheaders: ['x-kinvey-skip-business-logic'] })
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .get(`/user/${environmentId}/_count/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 30 });

      this.store({ useBl: true }).count((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use bl', (done) => {
      this.storeUserRequest({ useBl: true }).count((err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      this.storeUserRequest({ useUserContext: true }).count((err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      this.storeUserRequest({ useUserContext: true, useBl: true }).count((err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/user/${environmentId}/_count/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 30 });

      this.storeUserRequest().count((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        return done();
      });
    });

    it('should get a count of records with a query object', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/user/${environmentId}/_count/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .query({ query: '{"foo":"bar"}' })
        .reply(200, { count: 12 });

      const query = new Query();
      query.equalTo('foo', 'bar');

      this.store().count(query, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 12 });
        return done();
      });
    });
  });

  describe('suspend', () => {
    beforeEach(() => {
      this.store = userStore(this.appMetadata, this.requestContext, this.taskMetadata);
      this.storeUserRequest = userStore(this.appMetadata, this.requestContext, this.taskMetadataUser);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should suspend a single user', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/user/${environmentId}/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200);

      this.store().suspend(1234, (err, result) => {
        should.not.exist(err);
        should.not.exist(result);
        return done();
      });
    });

    it('should include soft=true if apiVersion is 1', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '1')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/user/${environmentId}/1234?soft=true`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200);

      const myStore = this.store();

      myStore._requestContext.apiVersion = 1;
      this.store().suspend(1234, (err, result) => {
        should.not.exist(err);
        should.not.exist(result);
        return done();
      });
    });

    it('should suspend a single user record using user context', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('authorization', authorization)
        .delete(`/user/${environmentId}/1234`)
        .reply(200);

      this.store({ useUserContext: true }).suspend(1234, (err, result) => {
        should.not.exist(err);
        should.not.exist(result);
        return done();
      });
    });

    it('should remove a single entity and use bl', (done) => {
      nock('https://baas.kinvey.com', { badheaders: ['x-kinvey-skip-business-logic'] })
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .delete(`/user/${environmentId}/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200);

      this.store({ useBl: true }).suspend('1234', (err, result) => {
        should.not.exist(err);
        should.not.exist(result);
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use bl', (done) => {
      this.storeUserRequest({ useBl: true }).suspend('1234', (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      this.storeUserRequest({ useUserContext: true }).suspend('1234', (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      this.storeUserRequest({ useUserContext: true, useBl: true }).suspend('1234', (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/user/${environmentId}/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200);

      this.storeUserRequest().suspend('1234', (err, result) => {
        should.not.exist(err);
        should.not.exist(result);
        return done();
      });
    });

    it('should return an error if missing userId', (done) => {
      this.store().suspend((err, result) => {
        should.not.exist(result);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('userId is required');
        return done();
      });
    });
  });

  describe('restore', () => {
    beforeEach(() => {
      this.store = userStore(this.appMetadata, this.requestContext, this.taskMetadata);
      this.storeUserRequest = userStore(this.appMetadata, this.requestContext, this.taskMetadataUser);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should restore a single user', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .post(`/user/${environmentId}/1234/_restore`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200);

      this.store().restore(1234, (err, result) => {
        should.not.exist(err);
        should.not.exist(result);
        return done();
      });
    });

    it('should restore a single user record and override user context with mastersecret', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .post(`/user/${environmentId}/1234/_restore`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200);

      this.store({ useUserContext: true }).restore(1234, (err, result) => {
        should.not.exist(err);
        should.not.exist(result);
        return done();
      });
    });

    it('should restore a single entity and use bl', (done) => {
      nock('https://baas.kinvey.com', { badheaders: ['x-kinvey-skip-business-logic'] })
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .post(`/user/${environmentId}/1234/_restore`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200);

      this.store({ useBl: true }).restore('1234', (err, result) => {
        should.not.exist(err);
        should.not.exist(result);
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use bl', (done) => {
      this.storeUserRequest({ useBl: true }).restore(1234, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      this.storeUserRequest({ useUserContext: true }).restore(1234, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      this.storeUserRequest({ useUserContext: true, useBl: true }).restore(1234, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the user store from the user store cannot use user credentials or use Bl');
        return done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .post(`/user/${environmentId}/1234/_restore`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200);

      this.storeUserRequest().restore(1234, (err, result) => {
        should.not.exist(err);
        should.not.exist(result);
        return done();
      });
    });

    it('should return an error if missing userId', (done) => {
      this.store().suspend((err, result) => {
        should.not.exist(result);
        err.message.should.eql('UserStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('userId is required');
        return done();
      });
    });
  });
});
