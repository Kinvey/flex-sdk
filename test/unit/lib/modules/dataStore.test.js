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
const dataStore = require('../../../../lib/service/modules/dataStore');
const Query = require('../../../../lib/service/modules/query');
const uuid = require('uuid');

const environmentId = 'kid1234';
const blFlags = {};
const appsecret = '123456';
const mastersecret = '789012';
const authenticatedUsername = 'test@test.com';
const baasUrl = 'https://baas.kinvey.com';
const authenticatedUserId = '1234abcd';
const apiVersion = 5;
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

describe('dataStore', () => {
  beforeEach(() => {
    this.appMetadata = _generateAppMetadata();
    this.requestContext = _generateRequestContext();
    this.taskMetadata = _generateTaskMetadata();
  });

  it('should initialize datastore', () => {
    const store = dataStore(this.appMetadata, this.requestContext, this.taskMetadata);
    store.should.be.a.Function();
    store.name.should.eql('generateDataStore');
  });

  describe('datastore object', () => {
    beforeEach(() => {
      this.store = dataStore(this.appMetadata, this.requestContext, this.taskMetadata);
    });

    afterEach(() => {
      this.store = null;
    });

    it('should create a datastore object', () => {
      const myStore = this.store();
      should.exist(myStore.collection);
      myStore.collection.should.be.a.Function();
      myStore.collection.name.should.eql('collection');
      myStore._useUserContext.should.be.false();
      myStore._useBl.should.be.false();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
      myStore._apiVersion.should.eql(this.requestContext.apiVersion);
    });

    it('should create a datastore object that uses userContext', () => {
      const myStore = this.store({ useUserContext: true });
      should.exist(myStore.collection);
      myStore.collection.should.be.a.Function();
      myStore.collection.name.should.eql('collection');
      myStore._useUserContext.should.be.true();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
    });

    it('should create a datastore object that uses BL', () => {
      const myStore = this.store({ useBl: true });
      should.exist(myStore.collection);
      myStore.collection.should.be.a.Function();
      myStore.collection.name.should.eql('collection');
      myStore._useBl.should.be.true();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
    });

    it('should create a datastore object that overrides the apiVersion', () => {
      const API_VERSION = 4;

      const myStore = this.store({ apiVersion: API_VERSION });
      should.exist(myStore.collection);
      myStore.collection.should.be.a.Function();
      myStore.collection.name.should.eql('collection');
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
      myStore._apiVersion.should.not.eql(this.requestContext.apiVersion);
      myStore._apiVersion.should.eql(API_VERSION);
    });

    it('should be able to create two datastore objects with different settings', () => {
      const myStore = this.store();
      const myStore2 = this.store({ useUserContext: true });

      should.exist(myStore.collection);
      myStore.collection.should.be.a.Function();
      myStore.collection.name.should.eql('collection');
      myStore._useUserContext.should.be.false();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);

      should.exist(myStore2.collection);
      myStore2.collection.should.be.a.Function();
      myStore2.collection.name.should.eql('collection');
      myStore2._useUserContext.should.be.true();
      myStore2._appMetadata.should.containDeep(this.appMetadata);
      myStore2._requestContext.should.containDeep(this.requestContext);
    });

    it('should create multiple data stores for two different apps', () => {
      const secondAppMetadata = _generateAppMetadata();
      secondAppMetadata._id = 'abcd';

      const myStore = this.store();
      const myStore2 = dataStore(secondAppMetadata, this.requestContext)();

      myStore._appMetadata._id.should.eql(this.appMetadata._id);
      myStore2._appMetadata._id.should.eql(secondAppMetadata._id);
    });

    it('should create multiple data stores for two different requests', () => {
      const secondRequestContext = _generateRequestContext();
      secondRequestContext.authenticatedUserId = 'foo';

      const myStore = this.store();
      const myStore2 = dataStore(this.appMetadata, secondRequestContext)();

      myStore._requestContext.authenticatedUserId.should.eql(this.requestContext.authenticatedUserId);
      myStore2._requestContext.authenticatedUserId.should.eql(secondRequestContext.authenticatedUserId);
    });
  });

  describe('collection object', () => {
    beforeEach(() => {
      this.store = dataStore(this.appMetadata, this.requestContext);
    });

    afterEach(() => {
      this.store = null;
    });

    it('should create a collection object', () => {
      const myCollection = this.store().collection('myCollection');
      myCollection.collectionName.should.eql('myCollection');
      should.exist(myCollection.save);
      should.exist(myCollection.findById);
      should.exist(myCollection.find);
      should.exist(myCollection.removeById);
      should.exist(myCollection.remove);
      myCollection.save.should.be.a.Function();
      myCollection.findById.should.be.a.Function();
      myCollection.find.should.be.a.Function();
      myCollection.removeById.should.be.a.Function();
      myCollection.remove.should.be.a.Function();
      myCollection.save.name.should.eql('save');
      myCollection.findById.name.should.eql('findById');
      myCollection.find.name.should.eql('find');
      myCollection.removeById.name.should.eql('removeById');
      myCollection.remove.name.should.eql('remove');
      myCollection._useUserContext.should.be.false();
      myCollection._appMetadata.should.containDeep(this.appMetadata);
      myCollection._requestContext.should.containDeep(this.requestContext);
      myCollection._useBl.should.be.false();
    });

    it('should allow creation of multiple collection objects', () => {
      const collection = this.store().collection('myCollection');
      const collection2 = this.store().collection('mySecondCollection');
      collection.collectionName.should.eql('myCollection');
      collection2.collectionName.should.eql('mySecondCollection');
    });
  });

  describe('find', () => {
    beforeEach(() => {
      this.store = dataStore(this.appMetadata, this.requestContext, this.taskMetadata);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should return a promise', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/appdata/${environmentId}/myCollection/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, [{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);

      const collection = this.store().collection('myCollection');
      (collection.find()).should.be.a.Promise(); // eslint-disable-line new-cap
      done();
    });

    it('should find all records', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/appdata/${environmentId}/myCollection/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, [{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);

      const collection = this.store().collection('myCollection');
      collection.find((err, result) => {
        should.not.exist(err);
        result.should.containDeep([{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);
        return done();
      });
    });

    it('should resolve with all records if callback isn\'t passed', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/appdata/${environmentId}/myCollection/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, [{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);

      const collection = this.store().collection('myCollection');
      collection.find()
        .then((result) => {
          result.should.containDeep([{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);
          done();
        });
    });

    it('should find all records using userContext', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('authorization', authorization)
        .get(`/appdata/${environmentId}/myCollection/`)
        .reply(200, [{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);

      const collection = this.store({ useUserContext: true }).collection('myCollection');
      collection.find((err, result) => {
        should.not.exist(err);
        result.should.containDeep([{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);
        return done();
      });
    });

    it('should find all records and use bl', (done) => {
      nock('https://baas.kinvey.com', { badheaders: ['x-kinvey-skip-business-logic'] })
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .get(`/appdata/${environmentId}/myCollection/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, [{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);

      const collection = this.store({ useBl: true }).collection('myCollection');
      collection.find((err, result) => {
        should.not.exist(err);
        result.should.containDeep([{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);
        return done();
      });
    });

    it('should find all records with overriden API version', (done) => {
      const API_VERSION = 4;

      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', `${API_VERSION}`)
        .get(`/appdata/${environmentId}/myCollection/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, [{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);

      const collection = this.store({ apiVersion: API_VERSION }).collection('myCollection');
      collection.find((err, result) => {
        should.not.exist(err);
        result.should.containDeep([{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use bl', (done) => {
      const collection = this.store({ useBl: true }).collection(this.taskMetadata.objectName);
      collection.find((err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      const collection = this.store({ useUserContext: true }).collection(this.taskMetadata.objectName);
      collection.find((err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        return done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      const collection = this.store({ useUserContext: true, useBl: true }).collection(this.taskMetadata.objectName);
      collection.find((err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        return done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/appdata/${environmentId}/${this.taskMetadata.objectName}/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, [{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);

      const collection = this.store().collection(this.taskMetadata.objectName);
      collection.find((err, result) => {
        should.not.exist(err);
        result.should.containDeep([{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);
        return done();
      });
    });

    it('should invoke rejection handler if there is an error and callback isn\'t passed', (done) => {
      const collection = this.store({ useBl: true }).collection(this.taskMetadata.objectName);
      collection.find()
        .catch((err) => {
          should.exist(err);
          err.message.should.eql('DataStoreError');
          err.description.should.eql('Not Allowed');
          err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
          done();
        });
    });

    it('should find records with a query object', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/appdata/${environmentId}/myCollection/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .query({ query: '{"foo":"bar"}' })
        .reply(200, [{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);

      const query = new Query();
      query.equalTo('foo', 'bar');

      const collection = this.store().collection('myCollection');
      collection.find(query, (err, result) => {
        should.not.exist(err);
        result.should.containDeep([{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);
        done();
      });
    });

    it('should resolve and return records with a query object', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/appdata/${environmentId}/myCollection/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .query({ query: '{"foo":"bar"}' })
        .reply(200, [{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);

      const query = new Query();
      query.equalTo('foo', 'bar');

      const collection = this.store().collection('myCollection');
      collection.find(query)
        .then((result) => {
          result.should.containDeep([{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);
          done();
        });
    });
  });

  describe('findById', () => {
    beforeEach(() => {
      this.store = dataStore(this.appMetadata, this.requestContext, this.taskMetadata);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should return a promise', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/appdata/${environmentId}/myCollection/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store().collection('myCollection');
      (collection.findById(1234)).should.be.a.Promise(); // eslint-disable-line new-cap
      done();
    });

    it('should find a single entity', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/appdata/${environmentId}/myCollection/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store().collection('myCollection');
      collection.findById(1234, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        done();
      });
    });

    it('should resolve with a single entity if callback isn\'t passed', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/appdata/${environmentId}/myCollection/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store().collection('myCollection');
      collection.findById(1234)
        .then((result) => {
          result.should.containDeep({ _id: 1234, someData: 'abc' });
          done();
        });
    });

    it('should find a single entity record using user context', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('authorization', authorization)
        .get(`/appdata/${environmentId}/myCollection/1234`)
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store({ useUserContext: true }).collection('myCollection');
      collection.findById(1234, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        done();
      });
    });

    it('should find a single entity and use bl', (done) => {
      nock('https://baas.kinvey.com', { badheaders: ['x-kinvey-skip-business-logic'] })
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .get(`/appdata/${environmentId}/myCollection/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store({ useBl: true }).collection('myCollection');
      collection.findById('1234', (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        done();
      });
    });

    it('should find a single entity with overriden API version', (done) => {
      const API_VERSION = 4;

      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', `${API_VERSION}`)
        .get(`/appdata/${environmentId}/myCollection/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store({ apiVersion: API_VERSION }).collection('myCollection');
      collection.findById('1234', (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        done();
      });
    });

    it('should prevent recursive requests to the same object that use bl', (done) => {
      const collection = this.store({ useBl: true }).collection(this.taskMetadata.objectName);
      collection.findById(1234, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      const collection = this.store({ useUserContext: true }).collection(this.taskMetadata.objectName);
      collection.findById(1234, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      const collection = this.store({ useUserContext: true, useBl: true }).collection(this.taskMetadata.objectName);
      collection.findById(1234, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/appdata/${environmentId}/${this.taskMetadata.objectName}/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store().collection(this.taskMetadata.objectName);
      collection.findById(1234, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        done();
      });
    });

    it('should return an error if missing entityId', (done) => {
      const collection = this.store().collection('myCollection');
      collection.findById((err, result) => {
        should.not.exist(result);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('entityId is required');
        done();
      });
    });

    it('should return an error if null entityId', (done) => {
      const collection = this.store().collection('myCollection');
      collection.findById(null, (err, result) => {
        should.not.exist(result);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('entityId is required');
        done();
      });
    });

    it('should return an error if blank entityId', (done) => {
      const collection = this.store().collection('myCollection');
      collection.findById('', (err, result) => {
        should.not.exist(result);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('entityId is required');
        done();
      });
    });

    it('should reject if missing entityId and no callback is passed', (done) => {
      const collection = this.store().collection('myCollection');
      collection.findById()
        .catch((err) => {
          err.message.should.eql('DataStoreError');
          err.description.should.eql('Bad Request');
          err.debug.should.eql('entityId is required');
          done();
        });
    });

    it('should invoke rejection handler if an error occurs and callback isn\'t passed', (done) => {
      const collection = this.store({ useBl: true }).collection(this.taskMetadata.objectName);
      collection.findById(1234)
        .catch((err) => {
          should.exist(err);
          err.message.should.eql('DataStoreError');
          err.description.should.eql('Not Allowed');
          err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
          done();
        });
    });
  });

  describe('save', () => {
    beforeEach(() => {
      this.store = dataStore(this.appMetadata, this.requestContext, this.taskMetadata);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should return a promise', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .post(`/appdata/${environmentId}/myCollection/`, {
          someData: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store().collection('myCollection');
      (collection.save({ someData: 'abc' })).should.be.a.Promise(); // eslint-disable-line new-cap
      done();
    });

    it('should save a new entity', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .post(`/appdata/${environmentId}/myCollection/`, {
          someData: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store().collection('myCollection');
      collection.save({ someData: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        done();
      });
    });

    it('should return an error for multiple entities', (done) => {
      const entities = [{
        someData: 'abc'
      }, {
        someData: 'xyz'
      }];

      const collection = this.store().collection('myCollection');
      collection.save(entities, (err, result) => {
        err.should.have.property('message', 'DataStoreError');
        err.should.have.property('description', 'Unable to save an array of entities. To insert multiple entities use "create" function.');
        should.not.exist(result);
        done();
      });
    });

    it('should resolve if a callback isn\'t passed', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .post(`/appdata/${environmentId}/myCollection/`, {
          someData: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store().collection('myCollection');
      collection.save({ someData: 'abc' })
        .then((result) => {
          result.should.containDeep({ _id: 1234, someData: 'abc' });
          done();
        });
    });

    it('should save a new entity using user context', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('authorization', authorization)
        .post(`/appdata/${environmentId}/myCollection/`, {
          someData: 'abc'
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store({ useUserContext: true }).collection('myCollection');
      collection.save({ someData: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        done();
      });
    });

    it('should save a new entity and use bl', (done) => {
      nock('https://baas.kinvey.com', { badheaders: ['x-kinvey-skip-business-logic'] })
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .post(`/appdata/${environmentId}/myCollection/`, {
          someData: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store({ useBl: true }).collection('myCollection');
      collection.save({ someData: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        done();
      });
    });

    it('should save a new entity with overriden API version', (done) => {
      const API_VERSION = 4;

      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', `${API_VERSION}`)
        .post(`/appdata/${environmentId}/myCollection/`, {
          someData: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store({ apiVersion: API_VERSION }).collection('myCollection');
      collection.save({ someData: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        done();
      });
    });

    it('should prevent recursive requests to the same object that use bl', (done) => {
      const collection = this.store({ useBl: true }).collection(this.taskMetadata.objectName);
      collection.save({ someData: 'abc' }, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      const collection = this.store({ useUserContext: true }).collection(this.taskMetadata.objectName);
      collection.save({ someData: 'abc' }, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      const collection = this.store({ useUserContext: true, useBl: true }).collection(this.taskMetadata.objectName);
      collection.save({ someData: 'abc' }, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .post(`/appdata/${environmentId}/${this.taskMetadata.objectName}/`, {
          someData: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store().collection(this.taskMetadata.objectName);
      collection.save({ someData: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        done();
      });
    });

    it('should return an error if missing entity', (done) => {
      const collection = this.store().collection('myCollection');
      collection.save((err, result) => {
        should.not.exist(result);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('entity is required');
        done();
      });
    });

    it('should return an error if null entity', (done) => {
      const collection = this.store().collection('myCollection');
      collection.save(null, (err, result) => {
        should.not.exist(result);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('entity is required');
        done();
      });
    });

    it('should return an error if blank entityId', (done) => {
      const collection = this.store().collection('myCollection');
      collection.save('', (err, result) => {
        should.not.exist(result);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('entity is required');
        done();
      });
    });

    it('should reject if missing entityId and no callback is passed', (done) => {
      const collection = this.store().collection('myCollection');
      collection.save()
        .catch((err) => {
          err.message.should.eql('DataStoreError');
          err.description.should.eql('Bad Request');
          err.debug.should.eql('entity is required');
          done();
        });
    });

    it('should invoke the rejection handler if an error occurs and no callback is passed', (done) => {
      const collection = this.store({ useBl: true }).collection(this.taskMetadata.objectName);
      collection.save({ someData: 'abc' })
        .catch((err) => {
          should.exist(err);
          err.message.should.eql('DataStoreError');
          err.description.should.eql('Not Allowed');
          err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
          done();
        });
    });

    it('should save an existing entity', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .put(`/appdata/${environmentId}/myCollection/1234`, {
          _id: 1234,
          someData: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store().collection('myCollection');
      collection.save({ _id: 1234, someData: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        done();
      });
    });

    it('should save an existing entity using user context', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('authorization', authorization)
        .put(`/appdata/${environmentId}/myCollection/1234`, {
          _id: 1234,
          someData: 'abc'
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store({ useUserContext: true }).collection('myCollection');
      collection.save({ _id: 1234, someData: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        done();
      });
    });

    it('should save an existing entity and use bl', (done) => {
      nock('https://baas.kinvey.com', { badheaders: ['x-kinvey-skip-business-logic'] })
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .put(`/appdata/${environmentId}/myCollection/1234`, {
          _id: 1234,
          someData: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store({ useBl: true }).collection('myCollection');
      collection.save({ _id: 1234, someData: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        done();
      });
    });

    it('should save an existing entity with overriden API version', (done) => {
      const API_VERSION = 4;

      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', `${API_VERSION}`)
        .put(`/appdata/${environmentId}/myCollection/1234`, {
          _id: 1234,
          someData: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store({ apiVersion: API_VERSION }).collection('myCollection');
      collection.save({ _id: 1234, someData: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        done();
      });
    });

    it('should prevent recursive requests to the same object that use bl', (done) => {
      const collection = this.store({ useBl: true }).collection(this.taskMetadata.objectName);
      collection.save({ _id: 1234, someData: 'abc' }, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      const collection = this.store({ useUserContext: true }).collection(this.taskMetadata.objectName);
      collection.save({ _id: 1234, someData: 'abc' }, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      const collection = this.store({ useUserContext: true, useBl: true }).collection(this.taskMetadata.objectName);
      collection.save({ _id: 1234, someData: 'abc' }, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .put(`/appdata/${environmentId}/${this.taskMetadata.objectName}/1234`, {
          _id: 1234,
          someData: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store().collection(this.taskMetadata.objectName);
      collection.save({ _id: 1234, someData: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        done();
      });
    });
  });

  describe('create', () => {
    const entities = [];
    before('entities', () => {
      // create 250 entities
      for (let i = 0; i < 250; i += 1) {
        entities.push({ index: i, name: uuid.v4() });
      }
    });

    beforeEach(() => {
      this.store = dataStore(this.appMetadata, this.requestContext, this.taskMetadata);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should insert entities in batches of 100', (done) => {
      const firstBatch = entities.slice(0, 100);
      const secondBatch = entities.slice(100, 200);
      const thirdBatch = entities.slice(200, 250);

      const firstBatchResponse = {
        entities: firstBatch,
        errors: []
      };
      const secondBatchResponse = {
        entities: secondBatch,
        errors: []
      };
      const thirdBatchResponse = {
        entities: thirdBatch,
        errors: []
      };

      const expectedFinalResponse = {
        entities,
        errors: []
      };

      const scope = nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .post(`/appdata/${environmentId}/myCollection/`, firstBatch)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(207, firstBatchResponse)
        .post(`/appdata/${environmentId}/myCollection/`, secondBatch)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(207, secondBatchResponse)
        .post(`/appdata/${environmentId}/myCollection/`, thirdBatch)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(207, thirdBatchResponse);

      const collection = this.store().collection('myCollection');
      collection.create(entities, (err, result) => {
        should.not.exist(err);
        result.should.have.keys('entities', 'errors');
        result.should.deepEqual(expectedFinalResponse);
        scope.isDone().should.be.true;
        done();
      });
    });

    it('should resolve if a callback is not passed', (done) => {
      const firstBatch = entities.slice(0, 100);
      const secondBatch = entities.slice(100, 200);
      const thirdBatch = entities.slice(200, 250);

      const firstBatchResponse = {
        entities: firstBatch,
        errors: []
      };
      const secondBatchResponse = {
        entities: secondBatch,
        errors: []
      };
      const thirdBatchResponse = {
        entities: thirdBatch,
        errors: []
      };

      const expectedFinalResponse = {
        entities,
        errors: []
      };

      const scope = nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .post(`/appdata/${environmentId}/myCollection/`, firstBatch)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(207, firstBatchResponse)
        .post(`/appdata/${environmentId}/myCollection/`, secondBatch)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(207, secondBatchResponse)
        .post(`/appdata/${environmentId}/myCollection/`, thirdBatch)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(207, thirdBatchResponse);

      const collection = this.store().collection('myCollection');
      collection.create(entities)
        .then((result) => {
          result.should.deepEqual(expectedFinalResponse);
          scope.isDone().should.be.true;
          done();
        });
    });

    it('should set error index correctly when saving in batches', (done) => {
      const firstBatch = entities.slice(0, 100);
      const secondBatch = entities.slice(100, 200);
      const thirdBatch = entities.slice(200, 250);

      // first batch has one failure: entity with index = 5
      const firstBatchResponse = {
        entities: firstBatch,
        errors: [{ index: 5 }]
      };

      // second batch has one failure too
      const secondBatchResponse = {
        entities: secondBatch,
        errors: [{ index: 6 }]
      };

      // third batch has 2 failures
      const thirdBatchResponse = {
        entities: thirdBatch,
        errors: [{ index: 25 }, { index: 40 }]
      };

      // final response should have index matching original request
      const expectedFinalResponse = {
        entities,
        errors: [{ index: 5 }, { index: 106 }, { index: 225 }, { index: 240 }]
      };

      const scope = nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .post(`/appdata/${environmentId}/myCollection/`, firstBatch)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(207, firstBatchResponse)
        .post(`/appdata/${environmentId}/myCollection/`, secondBatch)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(207, secondBatchResponse)
        .post(`/appdata/${environmentId}/myCollection/`, thirdBatch)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(207, thirdBatchResponse);

      const collection = this.store().collection('myCollection');
      collection.create(entities, (err, result) => {
        should.not.exist(err);
        result.should.have.keys('entities', 'errors');
        result.entities.should.eql(entities);
        result.errors.should.eql(expectedFinalResponse.errors);
        scope.isDone().should.be.true;
        done();
      });
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      this.store = dataStore(this.appMetadata, this.requestContext, this.taskMetadata);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should return a Promise', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/appdata/${environmentId}/myCollection/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 30 });

      const collection = this.store().collection('myCollection');
      (collection.remove()).should.be.a.Promise(); // eslint-disable-line new-cap
      done();
    });

    it('should remove all records', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/appdata/${environmentId}/myCollection/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 30 });

      const collection = this.store().collection('myCollection');
      collection.remove((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        done();
      });
    });

    it('should resolve if a callback isn\'t passed', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/appdata/${environmentId}/myCollection/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 30 });

      const collection = this.store().collection('myCollection');
      collection.remove()
        .then((result) => {
          result.should.containDeep({ count: 30 });
          done();
        });
    });

    it('should remove all records using user context', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('authorization', authorization)
        .delete(`/appdata/${environmentId}/myCollection/`)
        .reply(200, { count: 30 });

      const collection = this.store({ useUserContext: true }).collection('myCollection');
      collection.remove((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        done();
      });
    });

    it('should remove all records and skip bl', (done) => {
      nock('https://baas.kinvey.com', { badheaders: ['x-kinvey-skip-business-logic'] })
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .delete(`/appdata/${environmentId}/myCollection/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 30 });

      const collection = this.store({ useBl: true }).collection('myCollection');
      collection.remove((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        done();
      });
    });

    it('should remove all records with overriden API version', (done) => {
      const API_VERSION = 4;

      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', `${API_VERSION}`)
        .delete(`/appdata/${environmentId}/myCollection/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 30 });

      const collection = this.store({ apiVersion: API_VERSION }).collection('myCollection');
      collection.remove((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        done();
      });
    });

    it('should prevent recursive requests to the same object that use bl', (done) => {
      const collection = this.store({ useBl: true }).collection(this.taskMetadata.objectName);
      collection.remove((err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      const collection = this.store({ useUserContext: true }).collection(this.taskMetadata.objectName);
      collection.remove((err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      const collection = this.store({ useUserContext: true, useBl: true }).collection(this.taskMetadata.objectName);
      collection.remove((err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/appdata/${environmentId}/${this.taskMetadata.objectName}/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 30 });

      const collection = this.store().collection(this.taskMetadata.objectName);
      collection.remove((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        done();
      });
    });

    it('should invoke rejection handler if an error occurs and a callback isn\'t passed', (done) => {
      const collection = this.store({ useBl: true }).collection(this.taskMetadata.objectName);
      collection.remove()
        .catch((err) => {
          should.exist(err);
          err.message.should.eql('DataStoreError');
          err.description.should.eql('Not Allowed');
          err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
          done();
        });
    });

    it('should remove records with a query object', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/appdata/${environmentId}/myCollection/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .query({ query: '{"foo":"bar"}' })
        .reply(200, { count: 12 });

      const query = new Query();
      query.equalTo('foo', 'bar');

      const collection = this.store().collection('myCollection');
      collection.remove(query, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 12 });
        done();
      });
    });

    it('should resolve with a query object', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/appdata/${environmentId}/myCollection/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .query({ query: '{"foo":"bar"}' })
        .reply(200, { count: 12 });

      const query = new Query();
      query.equalTo('foo', 'bar');

      const collection = this.store().collection('myCollection');
      collection.remove(query)
        .then((result) => {
          result.should.containDeep({ count: 12 });
          done();
        });
    });
  });

  describe('removeById', () => {
    beforeEach(() => {
      this.store = dataStore(this.appMetadata, this.requestContext, this.taskMetadata);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should return a Promise', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/appdata/${environmentId}/myCollection/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 1 });

      const collection = this.store().collection('myCollection');
      (collection.removeById(1234)).should.be.a.Promise(); // eslint-disable-line new-cap
      done();
    });

    it('should remove a single entity', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/appdata/${environmentId}/myCollection/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 1 });

      const collection = this.store().collection('myCollection');
      collection.removeById(1234, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 1 });
        done();
      });
    });

    it('should resolve if a callback isn\'t passed', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/appdata/${environmentId}/myCollection/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 1 });

      const collection = this.store().collection('myCollection');
      collection.removeById(1234)
        .then((result) => {
          result.should.containDeep({ count: 1 });
          done();
        });
    });

    it('should remove a single entity record using user context', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('authorization', authorization)
        .delete(`/appdata/${environmentId}/myCollection/1234`)
        .reply(200, { count: 1 });

      const collection = this.store({ useUserContext: true }).collection('myCollection');
      collection.removeById(1234, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 1 });
        done();
      });
    });

    it('should remove a single entity and use bl', (done) => {
      nock('https://baas.kinvey.com', { badheaders: ['x-kinvey-skip-business-logic'] })
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .delete(`/appdata/${environmentId}/myCollection/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 1 });

      const collection = this.store({ useBl: true }).collection('myCollection');
      collection.removeById('1234', (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 1 });
        done();
      });
    });

    it('should remove a single entity with overriden API version', (done) => {
      const API_VERSION = 4;

      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', `${API_VERSION}`)
        .delete(`/appdata/${environmentId}/myCollection/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 1 });

      const collection = this.store({ apiVersion: API_VERSION }).collection('myCollection');
      collection.removeById('1234', (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 1 });
        done();
      });
    });

    it('should prevent recursive requests to the same object that use bl', (done) => {
      const collection = this.store({ useBl: true }).collection(this.taskMetadata.objectName);
      collection.removeById(1234, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      const collection = this.store({ useUserContext: true }).collection(this.taskMetadata.objectName);
      collection.removeById(1234, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      const collection = this.store({ useUserContext: true, useBl: true }).collection(this.taskMetadata.objectName);
      collection.removeById(1234, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .delete(`/appdata/${environmentId}/${this.taskMetadata.objectName}/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 1 });

      const collection = this.store().collection(this.taskMetadata.objectName);
      collection.removeById(1234, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 1 });
        done();
      });
    });

    it('should return an error if missing entityId', (done) => {
      const collection = this.store().collection('myCollection');
      collection.removeById((err, result) => {
        should.not.exist(result);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('entityId is required');
        done();
      });
    });

    it('should return an error if null entityId', (done) => {
      const collection = this.store().collection('myCollection');
      collection.removeById(null, (err, result) => {
        should.not.exist(result);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('entityId is required');
        done();
      });
    });

    it('should return an error if blank entityId', (done) => {
      const collection = this.store().collection('myCollection');
      collection.removeById('', (err, result) => {
        should.not.exist(result);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('entityId is required');
        done();
      });
    });

    it('should reject if missing entityId and no callback is passed', (done) => {
      const collection = this.store().collection('myCollection');
      collection.removeById()
        .catch((err) => {
          err.message.should.eql('DataStoreError');
          err.description.should.eql('Bad Request');
          err.debug.should.eql('entityId is required');
          done();
        });
    });

    it('should reject if an error occurs and a callback isn\'t passed', (done) => {
      const collection = this.store({ useBl: true }).collection(this.taskMetadata.objectName);
      collection.removeById(1234)
        .catch((err) => {
          should.exist(err);
          err.message.should.eql('DataStoreError');
          err.description.should.eql('Not Allowed');
          err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
          done();
        });
    });
  });

  describe('count', () => {
    beforeEach(() => {
      this.store = dataStore(this.appMetadata, this.requestContext, this.taskMetadata);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should return a promise', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .get(`/appdata/${environmentId}/myCollection/_count/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 30 });

      const collection = this.store().collection('myCollection');
      (collection.count()).should.be.a.Promise(); // eslint-disable-line new-cap
      done();
    });

    it('should get a count of all records', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .get(`/appdata/${environmentId}/myCollection/_count/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 30 });

      const collection = this.store().collection('myCollection');
      collection.count((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        done();
      });
    });

    it('resolve if a callback isn\'t passed', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .get(`/appdata/${environmentId}/myCollection/_count/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 30 });

      const collection = this.store().collection('myCollection');
      collection.count()
        .then((result) => {
          result.should.containDeep({ count: 30 });
          done();
        });
    });

    it('should get a count of all records using user context', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .matchHeader('content-type', 'application/json')
        .matchHeader('authorization', authorization)
        .matchHeader('x-kinvey-api-version', '5')
        .get(`/appdata/${environmentId}/myCollection/_count/`)
        .reply(200, { count: 30 });

      const collection = this.store({ useUserContext: true }).collection('myCollection');
      collection.count((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        done();
      });
    });

    it('should get a count of all records and use bl', (done) => {
      nock('https://baas.kinvey.com', { badheaders: ['x-kinvey-skip-business-logic'] })
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .get(`/appdata/${environmentId}/myCollection/_count/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 30 });

      const collection = this.store({ useBl: true }).collection('myCollection');
      collection.count((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        done();
      });
    });

    it('should get a count of all records with overriden API version', (done) => {
      const API_VERSION = 4;

      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', `${API_VERSION}`)
        .get(`/appdata/${environmentId}/myCollection/_count/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 30 });

      const collection = this.store({ apiVersion: API_VERSION }).collection('myCollection');
      collection.count((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        done();
      });
    });

    it('should prevent recursive requests to the same object that use bl', (done) => {
      const collection = this.store({ useBl: true }).collection(this.taskMetadata.objectName);
      collection.count((err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        done();
      });
    });

    it('should prevent recursive requests to the same object that use user context', (done) => {
      const collection = this.store({ useUserContext: true }).collection(this.taskMetadata.objectName);
      collection.count((err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        done();
      });
    });

    it('should prevent recursive requests to the same object that use user context and bl', (done) => {
      const collection = this.store({ useUserContext: true, useBl: true }).collection(this.taskMetadata.objectName);
      collection.count((err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
        done();
      });
    });

    it('should allow recursive requests to the same object that use mastersecret and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/appdata/${environmentId}/${this.taskMetadata.objectName}/_count/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 30 });

      const collection = this.store().collection(this.taskMetadata.objectName);
      collection.count((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        done();
      });
    });

    it('should reject if an error occurs and a callback isn\'t passed', (done) => {
      const collection = this.store({ useBl: true }).collection(this.taskMetadata.objectName);
      collection.count()
        .catch((err) => {
          should.exist(err);
          err.message.should.eql('DataStoreError');
          err.description.should.eql('Not Allowed');
          err.debug.should.eql('Recursive data operations to the same collection cannot use user context or use BL.');
          done();
        });
    });

    it('should get a count of records with a query object', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/appdata/${environmentId}/myCollection/_count/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .query({ query: '{"foo":"bar"}' })
        .reply(200, { count: 12 });

      const query = new Query();
      query.equalTo('foo', 'bar');

      const collection = this.store().collection('myCollection');
      collection.count(query, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 12 });
        done();
      });
    });

    it('should resolve with a query object if a callback isn\'t passed', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '5')
        .matchHeader('x-kinvey-skip-business-logic', 'true')
        .get(`/appdata/${environmentId}/myCollection/_count/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .query({ query: '{"foo":"bar"}' })
        .reply(200, { count: 12 });

      const query = new Query();
      query.equalTo('foo', 'bar');

      const collection = this.store().collection('myCollection');
      collection.count(query)
        .then((result) => {
          result.should.containDeep({ count: 12 });
          done();
        });
    });
  });
});
