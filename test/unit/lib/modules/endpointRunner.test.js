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
const endpointRunner = require('../../../../lib/service/modules/endpointRunner');

const ENVIRONMENT_ID = 'kid1234';
const APP_SECRET = '123456';
const MASTER_SECRET = '789012';
const AUTHENTICATED_USERNAME = 'test@test.com';
const BAAS_URL = 'https://baas.kinvey.com';
const AUTHENTICATED_USERID = '1234abcd';
const API_VERSION = 3;
const AUTHORIZATION = 'Kinvey adfjkldsafjdsalkfjds90fd8sfd=';

const clientAppVersion = {};
const customRequestProperties = {};
const blFlags = {};

function _generateAppMetadata() {
  return {
    _id: ENVIRONMENT_ID,
    blFlags,
    appsecret: APP_SECRET,
    mastersecret: MASTER_SECRET,
    authenticatedUsername: AUTHENTICATED_USERNAME,
    baasUrl: BAAS_URL
  };
}

function _generateRequestContext() {
  return {
    authenticatedUsername: AUTHENTICATED_USERNAME,
    authenticatedUserId: AUTHENTICATED_USERID,
    apiVersion: API_VERSION,
    authorization: AUTHORIZATION,
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

describe('endpointRunner', () => {
  beforeEach(() => {
    this.appMetadata = _generateAppMetadata();
    this.requestContext = _generateRequestContext();
    this.taskMetadata = _generateTaskMetadata();
  });

  it('should initialize endpointRunner', () => {
    const runner = endpointRunner(this.appMetadata, this.requestContext, this.taskMetadata);
    runner.should.be.a.Function();
    runner.name.should.eql('generateEndpointRunner');
  });

  describe('EndpointRunner object', () => {
    beforeEach(() => {
      this.runner = endpointRunner(this.appMetadata, this.requestContext, this.taskMetadata);
    });

    afterEach(() => {
      this.runner = null;
    });

    it('should create an EndpointRunner object', () => {
      const myRunner = this.runner();
      should.exist(myRunner.endpoint);
      myRunner.endpoint.should.be.a.Function();
      myRunner.endpoint.name.should.eql('endpoint');
      myRunner._useUserContext.should.be.false();
      myRunner._useBl.should.be.true();
      myRunner._appMetadata.should.containDeep(this.appMetadata);
      myRunner._requestContext.should.containDeep(this.requestContext);
    });

    it('should create a datastore object that uses userContext', () => {
      const myRunner = this.runner({ useUserContext: true });
      should.exist(myRunner.endpoint);
      myRunner.endpoint.should.be.a.Function();
      myRunner.endpoint.name.should.eql('endpoint');
      myRunner._useUserContext.should.be.true();
      myRunner._appMetadata.should.containDeep(this.appMetadata);
      myRunner._requestContext.should.containDeep(this.requestContext);
    });

    it('should always use bl, even if set to false', () => {
      const myRunner = this.runner({ useBl: true });
      should.exist(myRunner.endpoint);
      myRunner.endpoint.should.be.a.Function();
      myRunner.endpoint.name.should.eql('endpoint');
      myRunner._useBl.should.be.true();
      myRunner._appMetadata.should.containDeep(this.appMetadata);
      myRunner._requestContext.should.containDeep(this.requestContext);
    });

    it('should be able to create two endpointRunner objects with different settings', () => {
      const myRunner = this.runner();
      const myRunner2 = this.runner({ useUserContext: true });

      should.exist(myRunner.endpoint);
      myRunner.endpoint.should.be.a.Function();
      myRunner.endpoint.name.should.eql('endpoint');
      myRunner._useUserContext.should.be.false();
      myRunner._appMetadata.should.containDeep(this.appMetadata);
      myRunner._requestContext.should.containDeep(this.requestContext);

      should.exist(myRunner2.endpoint);
      myRunner2.endpoint.should.be.a.Function();
      myRunner2.endpoint.name.should.eql('endpoint');
      myRunner2._useUserContext.should.be.true();
      myRunner2._appMetadata.should.containDeep(this.appMetadata);
      myRunner2._requestContext.should.containDeep(this.requestContext);
    });

    it('should create multiple data stores for two different apps', () => {
      const secondAppMetadata = _generateAppMetadata();
      secondAppMetadata._id = 'abcd';

      const myRunner = this.runner();
      const myRunner2 = endpointRunner(secondAppMetadata, this.requestContext)();

      myRunner._appMetadata._id.should.eql(this.appMetadata._id);
      myRunner2._appMetadata._id.should.eql(secondAppMetadata._id);
    });

    it('should create multiple data stores for two different requests', () => {
      const secondRequestContext = _generateRequestContext();
      secondRequestContext.authenticatedUserId = 'foo';

      const myRunner = this.runner();
      const myRunner2 = endpointRunner(this.appMetadata, secondRequestContext)();

      myRunner._requestContext.authenticatedUserId.should.eql(this.requestContext.authenticatedUserId);
      myRunner2._requestContext.authenticatedUserId.should.eql(secondRequestContext.authenticatedUserId);
    });
  });

  describe('endpoint object', () => {
    beforeEach(() => {
      this.runner = endpointRunner(this.appMetadata, this.requestContext);
    });

    afterEach(() => {
      this.runner = null;
    });

    it('should create a endpoint object', () => {
      const myEndpoint = this.runner().endpoint('myEndpoint');
      myEndpoint.endpointName.should.eql('myEndpoint');
      should.exist(myEndpoint.execute);
      myEndpoint.execute.should.be.a.Function();
      myEndpoint.execute.name.should.eql('execute');
      myEndpoint._useUserContext.should.be.false();
      myEndpoint._appMetadata.should.containDeep(this.appMetadata);
      myEndpoint._requestContext.should.containDeep(this.requestContext);
      myEndpoint._useBl.should.be.true();
    });

    it('should allow creation of multiple endpoint objects', () => {
      const endpoint = this.runner().endpoint('myEndpoint');
      const endpoint2 = this.runner().endpoint('mySecondEndpoint');
      endpoint.endpointName.should.eql('myEndpoint');
      endpoint2.endpointName.should.eql('mySecondEndpoint');
    });
  });

  describe('execute', () => {
    beforeEach(() => {
      this.runner = endpointRunner(this.appMetadata, this.requestContext, this.taskMetadata);
      this.payload = [
        { _id: uuid(), someData: uuid() },
        { _id: uuid(), someData: uuid() }
      ];
    });

    afterEach(() => {
      nock.cleanAll();
      this.runner = null;
    });

    it('should return a promise', (done) => {
      nock(BAAS_URL)
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .post(`/rpc/${ENVIRONMENT_ID}/custom/myEndpoint`)
        .basicAuth({
          user: ENVIRONMENT_ID,
          pass: MASTER_SECRET
        })
        .reply(200, this.payload);

      const endpoint = this.runner().endpoint('myEndpoint');
      (endpoint.execute({})).should.be.a.Promise(); // eslint-disable-line new-cap
      return done();
    });

    it('should execute an endpoint', (done) => {
      nock(BAAS_URL)
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .post(`/rpc/${ENVIRONMENT_ID}/custom/myEndpoint`)
        .basicAuth({
          user: ENVIRONMENT_ID,
          pass: MASTER_SECRET
        })
        .reply(200, this.payload);

      const endpoint = this.runner().endpoint('myEndpoint');
      endpoint.execute({}, (err, result) => {
        should.not.exist(err);
        result.should.containDeep(this.payload);
        return done();
      });
    });

    it('should include a body', (done) => {
      nock(BAAS_URL)
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .post(`/rpc/${ENVIRONMENT_ID}/custom/myEndpoint`, { foo: 'bar' })
        .basicAuth({
          user: ENVIRONMENT_ID,
          pass: MASTER_SECRET
        })
        .reply(200, this.payload);

      const endpoint = this.runner().endpoint('myEndpoint');
      endpoint.execute({ foo: 'bar' }, (err, result) => {
        should.not.exist(err);
        result.should.containDeep(this.payload);
        return done();
      });
    });

    it('should include empty object as body if null body passed', (done) => {
      nock(BAAS_URL)
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .post(`/rpc/${ENVIRONMENT_ID}/custom/myEndpoint`, {})
        .basicAuth({
          user: ENVIRONMENT_ID,
          pass: MASTER_SECRET
        })
        .reply(200, this.payload);

      const endpoint = this.runner().endpoint('myEndpoint');
      endpoint.execute(null, (err, result) => {
        should.not.exist(err);
        result.should.containDeep(this.payload);
        return done();
      });
    });

    it('should include empty object as body if no body passed', (done) => {
      nock(BAAS_URL)
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .post(`/rpc/${ENVIRONMENT_ID}/custom/myEndpoint`, {})
        .basicAuth({
          user: ENVIRONMENT_ID,
          pass: MASTER_SECRET
        })
        .reply(200, this.payload);

      const endpoint = this.runner().endpoint('myEndpoint');
      endpoint.execute((err, result) => {
        should.not.exist(err);
        result.should.containDeep(this.payload);
        return done();
      });
    });

    it('should resolve endpoint if callback isn\'t passed', (done) => {
      nock(BAAS_URL)
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .post(`/rpc/${ENVIRONMENT_ID}/custom/myEndpoint`)
        .basicAuth({
          user: ENVIRONMENT_ID,
          pass: MASTER_SECRET
        })
        .reply(200, this.payload);

      const endpoint = this.runner().endpoint('myEndpoint');
      endpoint.execute()
        .then((result) => {
          result.should.containDeep(this.payload);
          return done();
        });
    });

    it('should execute using userContext', (done) => {
      nock(BAAS_URL)
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-kinvey-api-version', '3')
        .matchHeader('AUTHORIZATION', AUTHORIZATION)
        .post(`/rpc/${ENVIRONMENT_ID}/custom/myEndpoint`)
        .reply(200, this.payload);

      const endpoint = this.runner({ useUserContext: true }).endpoint('myEndpoint');
      endpoint.execute({}, (err, result) => {
        should.not.exist(err);
        result.should.containDeep(this.payload);
        return done();
      });
    });

    it('should prevent recursive requests to the same endpoint', (done) => {
      this.taskMetadata.hookType = 'customEndpoint';
      const endpoint = this.runner().endpoint(this.taskMetadata.objectName);
      endpoint.execute({}, (err, result) => {
        should.not.exist(result);
        should.exist(err);
        err.message.should.eql('EndpointRunnerError');
        err.description.should.eql('Not Allowed');
        err.debug.should.eql('Recursive requests to the same endpoint are prohibited.');
        return done();
      });
    });

    it('should invoke rejection handler if there is an error and callback isn\'t passed', (done) => {
      this.taskMetadata.hookType = 'customEndpoint';
      const endpoint = this.runner().endpoint(this.taskMetadata.objectName);
      endpoint.execute({})
        .catch((err) => {
          should.exist(err);
          err.message.should.eql('EndpointRunnerError');
          err.description.should.eql('Not Allowed');
          err.debug.should.eql('Recursive requests to the same endpoint are prohibited.');
          return done();
        });
    });
  });
});
