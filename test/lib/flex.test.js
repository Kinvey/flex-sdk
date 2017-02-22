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

const flexPackageJson = require('../../package.json');
const should = require('should');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const uuid = require('uuid');

const mockTaskReceiver = require('./mocks/mockTaskReceiver.js');

describe('service creation', () => {
  let sdk = null;
  before((done) => {
    sdk = proxyquire('../../lib/flex', { 'kinvey-code-task-runner': mockTaskReceiver });
    return done();
  });
  it('can create a new service', (done) =>
    sdk.service((err, flex) => {
      should.not.exist(err);
      should.exist(flex.data);
      should.exist(flex.functions);
      should.exist(flex.moduleGenerator);
      should.exist(flex.logger);
      should.exist(flex.version);
      should.exist(flex.auth);
      flex.version.should.eql(flexPackageJson.version);
      return done();
    }));

  it('should set the type to http by default', (done) => {
    const spy = sinon.spy(mockTaskReceiver, 'start');
    sdk.service(() => {
      spy.args[0][0].type.should.eql('http');
      mockTaskReceiver.start.restore();
      done();
    });
  });

  it('should accept an optional host and port', (done) => {
    const spy = sinon.spy(mockTaskReceiver, 'start');
    const host = 'localhost';
    const port = '7777';
    sdk.service({ host, port }, () => {
      spy.args[0][0].type.should.eql('http');
      spy.args[0][0].host.should.eql(host);
      spy.args[0][0].port.should.eql(port);
      mockTaskReceiver.start.restore();
      done();
    });
  });

  it('should set the type to tcp if the SDK_RECEIVER environment variable is set', (done) => {
    const spy = sinon.spy(mockTaskReceiver, 'start');
    process.env.SDK_RECEIVER = 'tcp';
    sdk.service(() => {
      spy.args[0][0].type.should.eql('tcp');
      delete process.env.SDK_RECEIVER;
      mockTaskReceiver.start.restore();
      done();
    });
  });

  it('should process a data task', (done) => {
    sdk.service((err, sdk) => {
      const task = {
        appMetadata: {
          _id: '12345',
          appsecret: 'appsecret',
          mastersecret: 'mastersecret',
          pushService: void 0,
          restrictions: {
            level: 'starter'
          },
          API_version: 3,
          name: 'DevApp',
          platform: null
        },
        taskType: 'data',
        method: 'GET',
        request: {
          method: 'GET',
          headers: {},
          body: {},
          serviceObjectName: 'foo'
        },
        response: {}
      };

      sdk.data.serviceObject('foo').onGetAll(() => {
        done();
      });

      mockTaskReceiver.taskReceived()(task, (err, result) => {
      });
    });
  });

  it('should process a function task', (done) => {
    sdk.service((err, sdk) => {
      const task = {
        appMetadata: {
          _id: '12345',
          appsecret: 'appsecret',
          mastersecret: 'mastersecret',
          pushService: void 0,
          restrictions: {
            level: 'starter'
          },
          API_version: 3,
          name: 'DevApp',
          platform: null
        },
        taskType: 'functions',
        taskName: 'foo',
        hookType: 'customEndpoint',
        method: 'GET',
        request: {
          method: 'GET',
          headers: {},
          body: {}
        },
        response: {}
      };

      sdk.functions.register('foo', () => done());

      mockTaskReceiver.taskReceived()(task, (err, result) => {
      });
    });
  });

  it('should process an auth function task', (done) => {
    sdk.service((err, sdk) => {
      const task = {
        appMetadata: {
          _id: '12345',
          appsecret: 'appsecret',
          mastersecret: 'mastersecret',
          pushService: void 0,
          restrictions: {
            level: 'starter'
          },
          API_version: 3,
          name: 'DevApp',
          platform: null
        },
        taskType: 'auth',
        taskName: 'foo',
        method: 'GET',
        request: {
          method: 'GET',
          headers: {},
          body: {
            username: 'foo',
            password: 'bar',
            options: {}
          }
        },
        response: {}
      };

      sdk.auth.register('foo', () => done());

      mockTaskReceiver.taskReceived()(task, (err, result) => {
      });
    });
  });

  it('should process a discovery task', (done) => {
    sdk.service(() => {
      const task = {
        taskType: 'serviceDiscovery'
      };

      mockTaskReceiver.taskReceived()(task, (err, result) => {
        should.not.exist(err);
        should.exist(result.discoveryObjects);
        result.discoveryObjects.dataLink.should.be.an.Object();
        result.discoveryObjects.businessLogic.should.be.an.Object();
        result.discoveryObjects.auth.should.be.an.Object();
        done();
      });
    });
  });

  it('should reject a task if shared secret auth is enabled and the authKey is not included', (done) => {
    sdk.service({ sharedSecret: uuid.v4() }, (err, flex) => {
      const task = {
        appMetadata: {
          _id: '12345',
          appsecret: 'appsecret',
          mastersecret: 'mastersecret',
          pushService: void 0,
          restrictions: {
            level: 'starter'
          },
          API_version: 3,
          name: 'DevApp',
          platform: null
        },
        taskType: 'data',
        method: 'GET',
        request: {
          method: 'GET',
          headers: {},
          body: {},
          serviceObjectName: 'foo'
        },
        response: {}
      };

      flex.data.serviceObject('foo').onGetAll((context, complete) => {
        const body = { foo: 'bar' };
        complete().setBody(body).ok().done();
      });

      mockTaskReceiver.taskReceived()(task, (err, result) => {
        err.response.body.message.should.eql('InvalidCredentials');
        err.response.body.description.should.eql('Invalid credentials.  Please retry your request with correct credentials.');
        err.response.statusCode.should.eql(401);
        err.response.body.debug.should.eql('The Authorization Key was not valid or missing.');
        should.not.exist(result);
        should.not.exist(err.response.body.foo);
        done();
      });
    });
  });

  it('should reject a task if shared secret auth is enabled and the authKey does not match', (done) => {
    sdk.service({ sharedSecret: uuid.v4() }, (err, flex) => {
      const task = {
        appMetadata: {
          _id: '12345',
          appsecret: 'appsecret',
          mastersecret: 'mastersecret',
          pushService: void 0,
          restrictions: {
            level: 'starter'
          },
          API_version: 3,
          name: 'DevApp',
          platform: null
        },
        authKey: uuid.v4(),
        taskType: 'data',
        method: 'GET',
        request: {
          method: 'GET',
          headers: {},
          body: {},
          serviceObjectName: 'foo'
        },
        response: {}
      };

      flex.data.serviceObject('foo').onGetAll((context, complete) => {
        const body = { foo: 'bar' };
        complete().setBody(body).ok().done();
      });

      mockTaskReceiver.taskReceived()(task, (err, result) => {
        err.response.body.message.should.eql('InvalidCredentials');
        err.response.body.description.should.eql('Invalid credentials.  Please retry your request with correct credentials.');
        err.response.statusCode.should.eql(401);
        err.response.body.debug.should.eql('The Authorization Key was not valid or missing.');
        should.not.exist(result);
        should.not.exist(err.response.body.foo);
        done();
      });
    });
  });

  it('should process a task if shared secret auth is enabled and the authKey is included', (done) => {
    const authKey = uuid.v4();

    sdk.service({ sharedSecret: authKey }, (err, flex) => {
      const task = {
        appMetadata: {
          _id: '12345',
          appsecret: 'appsecret',
          mastersecret: 'mastersecret',
          pushService: void 0,
          restrictions: {
            level: 'starter'
          },
          API_version: 3,
          name: 'DevApp',
          platform: null
        },
        authKey,
        taskType: 'data',
        method: 'GET',
        request: {
          method: 'GET',
          headers: {},
          body: {},
          serviceObjectName: 'foo'
        },
        response: {}
      };

      flex.data.serviceObject('foo').onGetAll((context, complete) => {
        const body = { foo: 'bar' };
        complete().setBody(body).ok().done();
      });

      mockTaskReceiver.taskReceived()(task, (err, result) => {
        should.not.exist(err);
        result.response.body.foo.should.eql('bar');
        result.response.statusCode.should.eql(200);
        should.not.exist(result.response.body.message);
        should.not.exist(result.response.body.description);
        should.not.exist(result.response.body.debug);
        done();
      });
    });
  });
});
