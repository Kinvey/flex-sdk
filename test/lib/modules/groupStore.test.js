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
const groupStore = require('../../../lib/service/modules/groupStore');
const environmentId = 'kid1234';
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

describe('groupStore', () => {
  beforeEach(() => {
    this.appMetadata = _generateAppMetadata();
    this.requestContext = _generateRequestContext();
  });

  it('should initialize groupstore', () => {
    const store = groupStore(this.appMetadata, this.requestContext);
    store.should.be.a.Function();
    store.name.should.eql('generateGroupStore');
  });

  describe('groupstore object', () => {
    beforeEach(() => {
      this.store = groupStore(this.appMetadata, this.requestContext);
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
      myStore.remove.should.be.a.Function();
      myStore.remove.name.should.eql('remove');
      myStore._useMasterSecret.should.be.false();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
    });

    it('should create a GroupStore object that uses mastersecret', () => {
      const myStore = this.store({ useMasterSecret: true });
      myStore._useMasterSecret.should.be.true();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
    });

    it('should be able to create two GroupStore objects with different settings', () => {
      const myStore = this.store();
      const myStore2 = this.store({ useMasterSecret: true });
      myStore._useMasterSecret.should.be.false();
      myStore._appMetadata.should.containDeep(this.appMetadata);
      myStore._requestContext.should.containDeep(this.requestContext);
      myStore2._useMasterSecret.should.be.true();
      myStore2._appMetadata.should.containDeep(this.appMetadata);
      myStore2._requestContext.should.containDeep(this.requestContext);
    });

    it('should create multiple group stores for two different apps', () => {
      const secondAppMetadata = _generateAppMetadata();
      secondAppMetadata._id = 'abcd';

      const myStore = this.store();
      const myStore2 = groupStore(secondAppMetadata, this.requestContext)();

      myStore._appMetadata._id.should.eql(this.appMetadata._id);
      myStore2._appMetadata._id.should.eql(secondAppMetadata._id);
    });

    it('should create multiple group stores for two different requests', () => {
      const secondRequestContext = _generateRequestContext();
      secondRequestContext.authenticatedUserId = 'foo';

      const myStore = this.store();
      const myStore2 = groupStore(this.appMetadata, secondRequestContext)();

      myStore._requestContext.authenticatedUserId.should.eql(this.requestContext.authenticatedUserId);
      myStore2._requestContext.authenticatedUserId.should.eql(secondRequestContext.authenticatedUserId);
    });
  });

  describe('findById', () => {
    beforeEach(() => {
      this.store = groupStore(this.appMetadata, this.requestContext);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should find a group', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .get(`/group/${environmentId}/1234`)
        .reply(200, { _id: 1234, users: { all: true }, groups: [] });

      this.store().findById(1234, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, users: { all: true }, groups: [] });
        return done();
      });
    });

    it('should find a single group records using mastersecret', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .get(`/group/${environmentId}/1234`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, users: { all: true }, groups: [] });

      this.store({ useMasterSecret: true }).findById(1234, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, users: { all: true }, groups: [] });
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
  });

  describe('create', () => {
    beforeEach(() => {
      this.store = groupStore(this.appMetadata, this.requestContext);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should create a new entity', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .post(`/group/${environmentId}/`, {
          users: { all: true }, groups: []
        })
        .reply(200, { _id: 1234, users: { all: true }, groups: [] });

      this.store().create({ users: { all: true }, groups: [] }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, users: { all: true }, groups: [] });
        return done();
      });
    });

    it('should create a new entity using appsecret, even if mastersecret is specified for the store', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .post(`/group/${environmentId}/`, {
          users: { all: true }, groups: []
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, users: { all: true }, groups: [] });

      this.store({ useMasterSecret: true }).create({ users: { all: true }, groups: [] }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, users: { all: true }, groups: [] });
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
  });

  describe('update', () => {
    beforeEach(() => {
      this.store = groupStore(this.appMetadata, this.requestContext);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should update an existing group', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .put(`/group/${environmentId}/1234`, {
          _id: 1234,
          users: { all: true }, groups: []
        })
        .reply(200, { _id: 1234, users: { all: true }, groups: [] });

      this.store().update({ _id: 1234, users: { all: true }, groups: [] }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, users: { all: true }, groups: [] });
        return done();
      });
    });

    it('should update an existing group using mastersecret', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .put(`/group/${environmentId}/1234`, {
          _id: 1234,
          users: { all: true }, groups: []
        })
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200, { _id: 1234, users: { all: true }, groups: [] });

      this.store({ useMasterSecret: true }).update({ _id: 1234, users: { all: true }, groups: [] }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep({ _id: 1234, users: { all: true }, groups: [] });
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

    it('should return an error if an entity is supplied without a valid _id', (done) => {
      this.store().update({ groups: [] }, (err, result) => {
        should.not.exist(result);
        err.message.should.eql('GroupStoreError');
        err.description.should.eql('Bad Request');
        err.debug.should.eql('A group entity must be supplied containing at least an _id');
        return done();
      });
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      this.store = groupStore(this.appMetadata, this.requestContext);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should remove a single group', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .delete(`/group/${environmentId}/1234?hard=true`)
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
        .matchHeader('x-kinvey-api-version', 1)
        .delete(`/group/${environmentId}/1234`)
        .reply(200);

      const myStore = this.store();

      myStore._requestContext.apiVersion = 1;
      this.store().remove(1234, (err, result) => {
        should.not.exist(err);
        should.not.exist(result);
        return done();
      });
    });

    it('should remove a single group record using mastersecret', (done) => {
      nock('https://baas.kinvey.com')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', 3)
        .delete(`/group/${environmentId}/1234?hard=true`)
        .basicAuth({
          user: environmentId,
          pass: mastersecret
        })
        .reply(200);

      this.store({ useMasterSecret: true }).remove(1234, (err, result) => {
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
  });
});
