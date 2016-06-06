/**
 * Copyright (c) 2016 Kinvey Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

const EventEmitter = require('events').EventEmitter;
const should = require('should');
const sinon = require('sinon');
const request = require('request');

describe('modules / logger', () => {
  let loggerModule = null;
  let loggerInstance = null;
  let requestStub = null;
  const emitter = new EventEmitter();
  const fakeProxyURL = 'http://proxy.proxy';
  const taskMetadata = {
    taskId: 'abcd1234',
    containerId: 'wxyz9876'
  };
  before((done) => {
    requestStub = {
      post: sinon.stub()
    };
    const requestDefaultsStub = sinon.stub();
    requestDefaultsStub.returns(requestStub);
    require.cache[require.resolve('request')].exports.defaults = requestDefaultsStub;
    loggerModule = require('../../../lib/service/modules/logger');
    loggerInstance = loggerModule(fakeProxyURL, taskMetadata, emitter);
    return done();
  });
  afterEach((done) => {
    requestStub.post.reset();
    return done();
  });
  it('does not require a callback', (done) => {
    requestStub.post.callsArg(1);
    (() => {
      return loggerInstance.warn('hello');
    }).should.not.throw();
    return done();
  });
  it('should include x-kinvey-wait-for-confirmation = false if no callback is specified', (done) => {
    requestStub.post.callsArg(1);
    (() => {
      return loggerInstance.warn('hello');
    }).should.not.throw();
    requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql('false');
    return done();
  });
  it('should include x-kinvey-wait-for-confirmation = true if a callback is specified', (done) => {
    requestStub.post.callsArgWith(1, 'error!');
    return loggerInstance.warn('hello', (err) => {
      should.exist(err);
      err.should.eql('error!');
      requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql('true');
      return done();
    });
  });
  it('should register the proxy task if a callback isn\'t included', (done) => {
    let emittersCalled = 0;
    emitter.once('proxyTaskStarted', () => {
      return emittersCalled += 1;
    });
    emitter.once('proxyTaskCompleted', () => {
      emittersCalled += 1;
      emittersCalled.should.eql(2);
      return done();
    });
    requestStub.post.callsArg(1);
    loggerInstance.warn('hello');
    return requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql('false');
  });
  it('returns an error if one has occurred while communicating with the proxy', (done) => {
    requestStub.post.callsArgWith(1, 'error!');
    return loggerInstance.warn('hello', (err) => {
      should.exist(err);
      err.should.eql('error!');
      return done();
    });
  });
  it('returns an error if the proxy returned a status code greater than or equal to 400', (done) => {
    requestStub.post.callsArgWith(1, null, {
      statusCode: 401
    }, 'error!');
    return loggerInstance.warn('hello', (err) => {
      should.exist(err);
      err.should.eql('error!');
      return done();
    });
  });
  it('POSTs to the proxy\'s /log URL', (done) => {
    requestStub.post.callsArgWith(1, {});
    return loggerInstance.warn('hello', (err) => {
      requestStub.post.args[0][0].url.should.eql(`${fakeProxyURL}/log`);
      return done();
    });
  });
  it('sends a null message if no message is specified', (done) => {
    requestStub.post.callsArgWith(1, {});
    return loggerInstance.warn(null, (err) => {
      const requestBody = requestStub.post.args[0][0].json;
      (requestBody.message === null).should.be.true;
      return done();
    });
  });
  it('when called with an Error as the message, sends the results of error.toString()', (done) => {
    requestStub.post.callsArgWith(1, {});
    return loggerInstance.warn(new Error('hello'), (err) => {
      const requestBody = requestStub.post.args[0][0].json;
      requestBody.message.should.eql('Error: hello');
      return done();
    });
  });
  it('sends the appropriate arguments to the proxy when .info is called', (done) => {
    requestStub.post.callsArgWith(1, {});
    return loggerInstance.info('hello', (err) => {
      const requestBody = requestStub.post.args[0][0].json;
      requestBody.level.should.eql('info');
      requestBody.message.should.eql('hello');
      const outgoingRequestHeaders = requestStub.post.args[0][0].headers;
      outgoingRequestHeaders.should.have.property('x-kinvey-task-id');
      outgoingRequestHeaders.should.have.property('x-kinvey-container-id');
      outgoingRequestHeaders['x-kinvey-task-id'].should.equal(taskMetadata.taskId);
      outgoingRequestHeaders['x-kinvey-container-id'].should.equal(taskMetadata.containerId);
      return done();
    });
  });
  it('sends the appropriate arguments to the proxy when .warn is called', (done) => {
    requestStub.post.callsArgWith(1, {});
    return loggerInstance.warn('hello', (err) => {
      const requestBody = requestStub.post.args[0][0].json;
      requestBody.level.should.eql('warning');
      requestBody.message.should.eql('hello');
      const outgoingRequestHeaders = requestStub.post.args[0][0].headers;
      outgoingRequestHeaders.should.have.property('x-kinvey-task-id');
      outgoingRequestHeaders.should.have.property('x-kinvey-container-id');
      outgoingRequestHeaders['x-kinvey-task-id'].should.equal(taskMetadata.taskId);
      outgoingRequestHeaders['x-kinvey-container-id'].should.equal(taskMetadata.containerId);
      return done();
    });
  });
  it('sends the appropriate arguments to the proxy when .error is called', (done) => {
    requestStub.post.callsArgWith(1, {});
    return loggerInstance.error('hello', (err) => {
      const requestBody = requestStub.post.args[0][0].json;
      requestBody.level.should.eql('error');
      requestBody.message.should.eql('hello');
      const outgoingRequestHeaders = requestStub.post.args[0][0].headers;
      outgoingRequestHeaders.should.have.property('x-kinvey-task-id');
      outgoingRequestHeaders.should.have.property('x-kinvey-container-id');
      outgoingRequestHeaders['x-kinvey-task-id'].should.equal(taskMetadata.taskId);
      outgoingRequestHeaders['x-kinvey-container-id'].should.equal(taskMetadata.containerId);
      return done();
    });
  });
  return it('sends the appropriate arguments to the proxy when .fatal is called', (done) => {
    requestStub.post.callsArgWith(1, {});
    return loggerInstance.fatal('hello', (err) => {
      const requestBody = requestStub.post.args[0][0].json;
      requestBody.level.should.eql('fatal');
      requestBody.message.should.eql('hello');
      const outgoingRequestHeaders = requestStub.post.args[0][0].headers;
      outgoingRequestHeaders.should.have.property('x-kinvey-task-id');
      outgoingRequestHeaders.should.have.property('x-kinvey-container-id');
      outgoingRequestHeaders['x-kinvey-task-id'].should.equal(taskMetadata.taskId);
      outgoingRequestHeaders['x-kinvey-container-id'].should.equal(taskMetadata.containerId);
      return done();
    });
  });
});
