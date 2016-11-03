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
const dataStore = require('../../../lib/service/modules/dataStore');
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

describe('dataStore', () => {
  beforeEach(() => {
    this.appMetadata = _generateAppMetadata();
    this.requestContext = _generateRequestContext();
  });

  it('should initialize datastore', () => {
    const store = dataStore(this.appMetadata, this.requestContext);
    store.should.be.a.Function();
    store.name.should.eql('generateDataStore');
  });

  describe('datastore object', () => {
    beforeEach(() => {
      this.store = dataStore(this.appMetadata, this.requestContext);
    });

    afterEach(() => {
      this.store = null;
    });

    it('should create a datastore object', () => {
      const myStore = this.store();
      should.exist(myStore.collection);
      myStore.collection.should.be.a.Function();
      myStore.collection.name.should.eql('collection');
      myStore._useMasterSecret.should.be.false();
      myStore._skipBl.should.be.false();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
    });

    it('should create a datastore object that uses mastersecret', () => {
      const myStore = this.store({ useMasterSecret: true });
      should.exist(myStore.collection);
      myStore.collection.should.be.a.Function();
      myStore.collection.name.should.eql('collection');
      myStore._useMasterSecret.should.be.true();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
    });

    it('should create a datastore object that skips BL', () => {
      const myStore = this.store({ skipBl: true });
      should.exist(myStore.collection);
      myStore.collection.should.be.a.Function();
      myStore.collection.name.should.eql('collection');
      myStore._skipBl.should.be.true();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
    });

    it('should be able to create two datastore objects with different settings', () => {
      const myStore = this.store();
      const myStore2 = this.store({ useMasterSecret: true });

      should.exist(myStore.collection);
      myStore.collection.should.be.a.Function();
      myStore.collection.name.should.eql('collection');
      myStore._useMasterSecret.should.be.false();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);

      should.exist(myStore2.collection);
      myStore2.collection.should.be.a.Function();
      myStore2.collection.name.should.eql('collection');
      myStore2._useMasterSecret.should.be.true();
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
      myCollection._useMasterSecret.should.be.false();
      myCollection._appMetadata.should.containDeep(this.appMetadata);
      myCollection._requestContext.should.containDeep(this.requestContext);
      myCollection._skipBl.should.be.false();
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
      this.store = dataStore(this.appMetadata, this.requestContext);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should find all records', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .get(`/appdata/${environmentId}/myCollection/`)
        .reply(200, [{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);

      const collection = this.store().collection('myCollection');
      collection.find((err, result) => {
        should.not.exist(err);
        result.should.containDeep([{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);
        return done();
      });
    });

    it('should find all records using mastersecret', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .get(`/appdata/${environmentId}/myCollection/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, [{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);

      const collection = this.store({ useMasterSecret: true }).collection('myCollection');
      collection.find((err, result) => {
        should.not.exist(err);
        result.should.containDeep([{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);
        return done();
      });
    });

    it('should find all records and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('x-kinvey-skip-business-logic', true)
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .get(`/appdata/${environmentId}/myCollection/`)
        .reply(200, [{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);

      const collection = this.store({ skipBl: true }).collection('myCollection');
      collection.find((err, result) => {
        should.not.exist(err);
        result.should.containDeep([{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);
        return done();
      });
    });

    it('should find records with a query object', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .get(`/appdata/${environmentId}/myCollection/`)
        .query({ query: '{"foo":"bar"}' })
        .reply(200, [{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);

      const query = new Query();
      query.equalTo('foo', 'bar');

      const collection = this.store().collection('myCollection');
      collection.find(query, (err, result) => {
        should.not.exist(err);
        result.should.containDeep([{ _id: 123, someData: 'abc' }, { _id: 456, someData: 'xyz' }]);
        return done();
      });
    });
  });

  describe('findById', () => {
    beforeEach(() => {
      this.store = dataStore(this.appMetadata, this.requestContext);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should find a single entity', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .get(`/appdata/${environmentId}/myCollection/1234`)
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store().collection('myCollection');
      collection.findById(1234, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        return done();
      });
    });

    it('should find a single entity records using mastersecret', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .get(`/appdata/${environmentId}/myCollection/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store({ useMasterSecret: true }).collection('myCollection');
      collection.findById(1234, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        return done();
      });
    });

    it('should find a single entity and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('x-kinvey-skip-business-logic', true)
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .get(`/appdata/${environmentId}/myCollection/1234`)
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store({ skipBl: true }).collection('myCollection');
      collection.findById('1234', (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        return done();
      });
    });

    it('should return an error if missing entityId', (done) => {
      const collection = this.store().collection('myCollection');
      collection.findById((err, result) => {
        should.not.exist(result);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('entityId is required');
        return done();
      });
    });
  });
  describe('save', () => {
    beforeEach(() => {
      this.store = dataStore(this.appMetadata, this.requestContext);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should save a new entity', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .post(`/appdata/${environmentId}/myCollection/`, {
          someData: 'abc'
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store().collection('myCollection');
      collection.save({ someData: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        return done();
      });
    });

    it('should save a new entity using mastersecret', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .post(`/appdata/${environmentId}/myCollection/`, {
          someData: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store({ useMasterSecret: true }).collection('myCollection');
      collection.save({ someData: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        return done();
      });
    });

    it('should save a new entity and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('x-kinvey-skip-business-logic', true)
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .post(`/appdata/${environmentId}/myCollection/`, {
          someData: 'abc'
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store({ skipBl: true }).collection('myCollection');
      collection.save({ someData: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        return done();
      });
    });

    it('should save an existing entity', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .put(`/appdata/${environmentId}/myCollection/1234`, {
          _id: 1234,
          someData: 'abc'
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store().collection('myCollection');
      collection.save({ _id: 1234, someData: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        return done();
      });
    });

    it('should save an existing entity using mastersecret', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .put(`/appdata/${environmentId}/myCollection/1234`, {
          _id: 1234,
          someData: 'abc'
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store({ useMasterSecret: true }).collection('myCollection');
      collection.save({ _id: 1234, someData: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        return done();
      });
    });

    it('should save an existing entity and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('x-kinvey-skip-business-logic', true)
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .put(`/appdata/${environmentId}/myCollection/1234`, {
          _id: 1234,
          someData: 'abc'
        })
        .reply(200, { _id: 1234, someData: 'abc' });

      const collection = this.store({ skipBl: true }).collection('myCollection');
      collection.save({ _id: 1234, someData: 'abc' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, someData: 'abc' });
        return done();
      });
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      this.store = dataStore(this.appMetadata, this.requestContext);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should remove all records', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .delete(`/appdata/${environmentId}/myCollection/`)
        .reply(200, { count: 30 });

      const collection = this.store().collection('myCollection');
      collection.remove((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        return done();
      });
    });

    it('should remove all records using mastersecret', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .delete(`/appdata/${environmentId}/myCollection/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 30 });

      const collection = this.store({ useMasterSecret: true }).collection('myCollection');
      collection.remove((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        return done();
      });
    });

    it('should remove all records and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('x-kinvey-skip-business-logic', true)
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .delete(`/appdata/${environmentId}/myCollection/`)
        .reply(200, { count: 30 });

      const collection = this.store({ skipBl: true }).collection('myCollection');
      collection.remove((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        return done();
      });
    });

    it('should remove records with a query object', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .delete(`/appdata/${environmentId}/myCollection/`)
        .query({ query: '{"foo":"bar"}' })
        .reply(200, { count: 12 });

      const query = new Query();
      query.equalTo('foo', 'bar');

      const collection = this.store().collection('myCollection');
      collection.remove(query, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 12 });
        return done();
      });
    });
  });

  describe('removeById', () => {
    beforeEach(() => {
      this.store = dataStore(this.appMetadata, this.requestContext);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should remove a single entity', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .delete(`/appdata/${environmentId}/myCollection/1234`)
        .reply(200, { count: 1 });

      const collection = this.store().collection('myCollection');
      collection.removeById(1234, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 1 });
        return done();
      });
    });

    it('should remove a single entity records using mastersecret', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .delete(`/appdata/${environmentId}/myCollection/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 1 });

      const collection = this.store({ useMasterSecret: true }).collection('myCollection');
      collection.removeById(1234, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 1 });
        return done();
      });
    });

    it('should remove a single entity and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('x-kinvey-skip-business-logic', true)
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .delete(`/appdata/${environmentId}/myCollection/1234`)
        .reply(200, { count: 1 });

      const collection = this.store({ skipBl: true }).collection('myCollection');
      collection.removeById('1234', (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 1 });
        return done();
      });
    });
  });

  describe('count', () => {
    beforeEach(() => {
      this.store = dataStore(this.appMetadata, this.requestContext);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should get a count of all records', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .get(`/appdata/${environmentId}/myCollection/_count/`)
        .reply(200, { count: 30 });

      const collection = this.store().collection('myCollection');
      collection.count((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        return done();
      });
    });

    it('should get a count of all records using mastersecret', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .get(`/appdata/${environmentId}/myCollection/_count/`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { count: 30 });

      const collection = this.store({ useMasterSecret: true }).collection('myCollection');
      collection.count((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        return done();
      });
    });

    it('should find all records and skip bl', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('x-kinvey-skip-business-logic', true)
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .get(`/appdata/${environmentId}/myCollection/_count/`)
        .reply(200, { count: 30 });

      const collection = this.store({ skipBl: true }).collection('myCollection');
      collection.count((err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 30 });
        return done();
      });
    });

    it('should find records with a query object', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .get(`/appdata/${environmentId}/myCollection/_count/`)
        .query({ query: '{"foo":"bar"}' })
        .reply(200, { count: 12 });

      const query = new Query();
      query.equalTo('foo', 'bar');

      const collection = this.store().collection('myCollection');
      collection.count(query, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ count: 12 });
        return done();
      });
    });

    it('should return an error if missing entityId', (done) => {
      const collection = this.store().collection('myCollection');
      collection.removeById((err, result) => {
        should.not.exist(result);
        err.message.should.eql('DataStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('entityId is required');
        return done();
      });
    });
  });
});
