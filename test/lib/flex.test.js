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

const should = require('should');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

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
});
