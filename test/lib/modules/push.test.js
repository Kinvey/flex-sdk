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

describe('modules / push', () => {
  let pushModule = null;
  let pushInstance = null;
  let requestStub = null;
  const emitter = new EventEmitter();
  const recipients = [
    {
      _id: 'id1'
    }, {
      _id: 'id2'
    }
  ];
  const recipient = {
    _id: 'id1'
  };
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
    pushModule = require('../../../lib/service/modules/push');
    pushInstance = pushModule(fakeProxyURL, taskMetadata, emitter);
    return done();
  });
  afterEach((done) => {
    requestStub.post.reset();
    return done();
  });
  it('\'send\' and \'sendMessage\' point to the same method', (done) => {
    pushInstance.send.should.eql(pushInstance.sendMessage);
    return done();
  });
  it('\'broadcast\' and \'broadcastMessage\' point to the same method', (done) => {
    pushInstance.broadcast.should.eql(pushInstance.broadcastMessage);
    return done();
  });
  describe('methods / send', () => {
    it('does not require a callback', (done) => {
      requestStub.post.callsArg(1);
      (() => pushInstance.send(recipients, 'hello')).should.not.throw();
      return done();
    });
    it('should include x-kinvey-wait-for-confirmation = false if no callback is specified', (done) => {
      requestStub.post.callsArg(1);
      (() => pushInstance.send(recipients, 'hello')).should.not.throw();
      requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql('false');
      return done();
    });
    it('should include x-kinvey-wait-for-confirmation = true if a callback is specified', (done) => {
      requestStub.post.callsArgWith(1, 'error!');
      return pushInstance.send(recipients, 'hello', (err) => {
        should.exist(err);
        err.should.eql('error!');
        requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql('true');
        return done();
      });
    });
    it('should register the proxy task if a callback isn\'t included', (done) => {
      let emittersCalled = 0;
      emitter.once('proxyTaskStarted', () => {
        emittersCalled += 1;
      });
      emitter.once('proxyTaskCompleted', () => {
        emittersCalled += 1;
        emittersCalled.should.eql(2);
        return done();
      });
      requestStub.post.callsArg(1);
      pushInstance.send(recipients, 'hello');
      return requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql('false');
    });
    it('returns an error if one has occurred while communicating with the proxy', (done) => {
      requestStub.post.callsArgWith(1, 'error!');
      return pushInstance.send(recipients, 'hello', (err, result) => {
        should.exist(err);
        err.should.eql('error!');
        should.not.exist(result);
        return done();
      });
    });
    it('returns an error if the proxy returned a status code greater than or equal to 400', (done) => {
      requestStub.post.callsArgWith(1, null, {
        statusCode: 401
      }, 'error!');
      return pushInstance.send(recipients, 'hello', (err, result) => {
        should.exist(err);
        err.should.eql('error!');
        should.not.exist(result);
        return done();
      });
    });
    it('POSTs to the proxy\'s /push/sendMessage URL', (done) => {
      requestStub.post.callsArgWith(1, {});
      return pushInstance.send(recipients, 'hello', () => {
        requestStub.post.args[0][0].url.should.eql(`${fakeProxyURL}/push/sendMessage`);
        return done();
      });
    });
    it('throws an error if no receipents are specified', (done) => {
      requestStub.post.callsArgWith(1, {});
      (() => pushInstance.send(null, 'hello')).should.throw(/.*users.*/);
      (() => pushInstance.send()).should.throw(/.*users.*/);
      return done();
    });
    it('throws an error if no message is specified', (done) => {
      requestStub.post.callsArgWith(1, {});
      (() => pushInstance.send(recipients, null)).should.throw(/.*message.*/);
      return done();
    });
    it('send the appropriate arguments to the proxy', (done) => {
      requestStub.post.callsArgWith(1, {});
      return pushInstance.send(recipients, 'hello', () => {
        const requestBody = requestStub.post.args[0][0].json;
        requestBody.destination.should.eql(recipients);
        requestBody.messageContent.should.eql('hello');
        return done();
      });
    });
    return it('converts a user single object to an array', (done) => {
      requestStub.post.callsArgWith(1, {});
      return pushInstance.send(recipient, 'hello', () => {
        const requestBody = requestStub.post.args[0][0].json;
        requestBody.destination.constructor.should.eql(Array);
        requestBody.destination.should.eql([recipient]);
        requestBody.messageContent.should.eql('hello');
        return done();
      });
    });
  });
  describe('methods / broadcast', () => {
    it('does not require a callback', (done) => {
      requestStub.post.callsArg(1);
      (() => pushInstance.broadcast('hello')).should.not.throw();
      return done();
    });
    it('should include x-kinvey-wait-for-confirmation = false if no callback is specified', (done) => {
      requestStub.post.callsArg(1);
      (() => pushInstance.broadcast('hello')).should.not.throw();
      requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql('false');
      return done();
    });
    it('should include x-kinvey-wait-for-confirmation = true if a callback is specified', (done) => {
      requestStub.post.callsArgWith(1, 'error!');
      return pushInstance.broadcast('hello', (err) => {
        should.exist(err);
        err.should.eql('error!');
        requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql('true');
        return done();
      });
    });
    it('should register the proxy task if a callback isn\'t included', (done) => {
      let emittersCalled = 0;
      emitter.once('proxyTaskStarted', () => {
        emittersCalled += 1;
      });
      emitter.once('proxyTaskCompleted', () => {
        emittersCalled += 1;
        emittersCalled.should.eql(2);
        return done();
      });
      requestStub.post.callsArg(1);
      pushInstance.broadcast('hello');
      return requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql('false');
    });
    it('returns an error if one has occurred while communicating with the proxy', (done) => {
      requestStub.post.callsArgWith(1, 'error!');
      return pushInstance.broadcast('hello', (err, result) => {
        should.exist(err);
        err.should.eql('error!');
        should.not.exist(result);
        return done();
      });
    });
    it('returns an error if the proxy returned a status code greater than or equal to 400', (done) => {
      requestStub.post.callsArgWith(1, null, {
        statusCode: 401
      }, 'error!');
      return pushInstance.broadcast('hello', (err, result) => {
        should.exist(err);
        err.should.eql('error!');
        should.not.exist(result);
        return done();
      });
    });
    it('POSTs to the proxy\'s /push/sendBroadcast URL', (done) => {
      requestStub.post.callsArgWith(1, {});
      return pushInstance.broadcast('hello', () => {
        requestStub.post.args[0][0].url.should.eql(`${fakeProxyURL}/push/sendBroadcast`);
        return done();
      });
    });
    it('throws an error if no message is specified', (done) => {
      requestStub.post.callsArgWith(1, {});
      (() => pushInstance.broadcast()).should.throw(/.*message.*/);
      (() => pushInstance.broadcast(null)).should.throw(/.*message.*/);
      return done();
    });
    return it('sends the appropriate arguments to the proxy', (done) => {
      requestStub.post.callsArgWith(1, {});
      return pushInstance.broadcast('hello', () => {
        const requestBody = requestStub.post.args[0][0].json;
        requestBody.messageContent.should.eql('hello');
        const outgoingRequestHeaders = requestStub.post.args[0][0].headers;
        outgoingRequestHeaders.should.have.property('x-kinvey-task-id');
        outgoingRequestHeaders.should.have.property('x-kinvey-container-id');
        outgoingRequestHeaders['x-kinvey-task-id'].should.equal(taskMetadata.taskId);
        outgoingRequestHeaders['x-kinvey-container-id'].should.equal(taskMetadata.containerId);
        return done();
      });
    });
  });
  describe('methods / sendPayload', () => {
    const iOSAps = 'iOS APs';
    const iOSExtras = 'iOS extras';
    const androidPayload = 'android payload';
    it('does not require a callback', (done) => {
      requestStub.post.callsArg(1);
      (() => pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload)).should.not.throw();
      return done();
    });
    it('should include x-kinvey-wait-for-confirmation = false if no callback is specified', (done) => {
      requestStub.post.callsArg(1);
      (() => pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload)).should.not.throw();
      requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql('false');
      return done();
    });
    it('should include x-kinvey-wait-for-confirmation = true if a callback is specified', (done) => {
      requestStub.post.callsArgWith(1, 'error!');
      return pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload, (err) => {
        should.exist(err);
        err.should.eql('error!');
        requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql('true');
        return done();
      });
    });
    it('should register the proxy task if a callback isn\'t included', (done) => {
      let emittersCalled = 0;
      emitter.once('proxyTaskStarted', () => {
        emittersCalled += 1;
      });
      emitter.once('proxyTaskCompleted', () => {
        emittersCalled += 1;
        emittersCalled.should.eql(2);
        return done();
      });
      requestStub.post.callsArg(1);
      pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload);
      return requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql('false');
    });
    it('returns an error if one has occurred while communicating with the proxy', (done) => {
      requestStub.post.callsArgWith(1, 'error!');
      return pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload, (err, result) => {
        should.exist(err);
        err.should.eql('error!');
        should.not.exist(result);
        return done();
      });
    });
    it('returns an error if the proxy returned a status code greater than or equal to 400', (done) => {
      requestStub.post.callsArgWith(1, null, {
        statusCode: 401
      }, 'error!');
      return pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload, (err, result) => {
        should.exist(err);
        err.should.eql('error!');
        should.not.exist(result);
        return done();
      });
    });
    it('POSTs to the proxy\'s /push/sendMessage URL', (done) => {
      requestStub.post.callsArgWith(1, {});
      return pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload, () => {
        requestStub.post.args[0][0].url.should.eql(`${fakeProxyURL}/push/sendMessage`);
        return done();
      });
    });
    it('throws an error if no receipents are specified', (done) => {
      requestStub.post.callsArgWith(1, {});
      (() => pushInstance.sendPayload(null, iOSAps, iOSExtras, androidPayload)).should.throw(/.*users.*/);
      (() => pushInstance.sendPayload()).should.throw(/.*users.*/);
      return done();
    });
    return it('sends the appropriate arguments to the proxy', (done) => {
      requestStub.post.callsArgWith(1, {});
      return pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload, () => {
        const requestBody = requestStub.post.args[0][0].json;
        requestBody.destination.should.eql(recipients);
        requestBody.messageContent.should.eql({
          iOSAps,
          iOSExtras,
          androidPayload
        });
        const outgoingRequestHeaders = requestStub.post.args[0][0].headers;
        outgoingRequestHeaders.should.have.property('x-kinvey-task-id');
        outgoingRequestHeaders.should.have.property('x-kinvey-container-id');
        outgoingRequestHeaders['x-kinvey-task-id'].should.equal(taskMetadata.taskId);
        outgoingRequestHeaders['x-kinvey-container-id'].should.equal(taskMetadata.containerId);
        return done();
      });
    });
  });
  return describe('methods / broadcastPayload', () => {
    const iOSAps = 'iOS APs';
    const iOSExtras = 'iOS extras';
    const androidPayload = 'android payload';
    it('does not require a callback', (done) => {
      requestStub.post.callsArg(1);
      (() => pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload)).should.not.throw();
      return done();
    });
    it('should include x-kinvey-wait-for-confirmation = false if no callback is specified', (done) => {
      requestStub.post.callsArg(1);
      (() => pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload)).should.not.throw();
      requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql('false');
      return done();
    });
    it('should include x-kinvey-wait-for-confirmation = true if a callback is specified', (done) => {
      requestStub.post.callsArgWith(1, 'error!');
      return pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload, (err) => {
        should.exist(err);
        err.should.eql('error!');
        requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql('true');
        return done();
      });
    });
    it('should register the proxy task if a callback isn\'t included', (done) => {
      let emittersCalled = 0;
      emitter.once('proxyTaskStarted', () => {
        emittersCalled += 1;
      });
      emitter.once('proxyTaskCompleted', () => {
        emittersCalled += 1;
        emittersCalled.should.eql(2);
        return done();
      });
      requestStub.post.callsArg(1);
      pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload);
      return requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql('false');
    });
    it('returns an error if one has occurred while communicating with the proxy', (done) => {
      requestStub.post.callsArgWith(1, 'error!');
      return pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload, (err, result) => {
        should.exist(err);
        err.should.eql('error!');
        should.not.exist(result);
        return done();
      });
    });
    it('returns an error if the proxy returned a status code greater than or equal to 400', (done) => {
      requestStub.post.callsArgWith(1, null, {
        statusCode: 401
      }, 'error!');
      return pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload, (err, result) => {
        should.exist(err);
        err.should.eql('error!');
        should.not.exist(result);
        return done();
      });
    });
    it('POSTs to the proxy\'s /push/sendBroadcast URL', (done) => {
      requestStub.post.callsArgWith(1, {});
      return pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload, () => {
        requestStub.post.args[0][0].url.should.eql(`${fakeProxyURL}/push/sendBroadcast`);
        return done();
      });
    });
    return it('sends the appropriate arguments to the proxy', (done) => {
      requestStub.post.callsArgWith(1, {});
      return pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload, () => {
        const requestBody = requestStub.post.args[0][0].json;
        requestBody.messageContent.should.eql({
          iOSAps,
          iOSExtras,
          androidPayload
        });
        const outgoingRequestHeaders = requestStub.post.args[0][0].headers;
        outgoingRequestHeaders.should.have.property('x-kinvey-task-id');
        outgoingRequestHeaders.should.have.property('x-kinvey-container-id');
        outgoingRequestHeaders['x-kinvey-task-id'].should.equal(taskMetadata.taskId);
        outgoingRequestHeaders['x-kinvey-container-id'].should.equal(taskMetadata.containerId);
        return done();
      });
    });
  });
});
