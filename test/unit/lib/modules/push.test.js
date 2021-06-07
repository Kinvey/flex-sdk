/**
 * Copyright (c) 2018 Kinvey Inc.
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

const FAKE_BAAS_URL = 'http://baas.baas';

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

  const appMetadata = {
    _id: 'kid_abcd1234',
    applicationId: 'abc123',
    mastersecret: '12345',
    baasUrl: FAKE_BAAS_URL
  };

  const taskMetadata = {
    taskId: 'abcd1234'
  };

  const requestMetadata = {
    requestId: 'ea85600029b04a18a754d57629cff62d'
  };

  before((done) => {
    requestStub = {
      post: sinon.stub()
    };
    const requestDefaultsStub = sinon.stub();
    requestDefaultsStub.returns(requestStub);
    delete require.cache[require.resolve('../../../../lib/service/modules/push')];
    require.cache[require.resolve('request')].exports.defaults = requestDefaultsStub;
    pushModule = require('../../../../lib/service/modules/push'); // eslint-disable-line global-require
    pushInstance = pushModule(appMetadata, taskMetadata, requestMetadata, emitter);
    done();
  });

  afterEach((done) => {
    requestStub.post.reset();
    done();
  });

  it('\'send\' and \'sendMessage\' point to the same method', (done) => {
    pushInstance.send.should.eql(pushInstance.sendMessage);
    done();
  });

  it('\'broadcast\' and \'broadcastMessage\' point to the same method', (done) => {
    pushInstance.broadcast.should.eql(pushInstance.broadcastMessage);
    done();
  });

  describe('methods / send', () => {
    it('should return a Promise', (done) => {
      requestStub.post.callsArg(1);
      (pushInstance.send(recipients, 'hello')).should.be.a.Promise(); // eslint-disable-line new-cap
      done();
    });

    it('should invoke the callback if specified', (done) => {
      requestStub.post.callsArg(1);
      pushInstance.send(recipients, 'hello', (err) => {
        should.not.exist(err);
        done();
      });
    });

    it('should invoke the promise handlers if no callback specified', (done) => {
      requestStub.post.callsArg(1);
      const promise = pushInstance.send(recipients, 'hello');
      promise.then(() => done());
    });

    it('appends authorization header details to the request object', (done) => {
      requestStub.post.callsArg(1);
      (() => pushInstance.send(recipients, 'hello')).should.not.throw();
      requestStub.post.args[0][0].auth.user.should.eql(appMetadata._id);
      requestStub.post.args[0][0].auth.pass.should.eql(appMetadata.mastersecret);
      done();
    });

    it('calls back an error if one has occurred while communicating with the server', (done) => {
      requestStub.post.callsArgWith(1, 'error!');
      pushInstance.send(recipients, 'hello', (err, result) => {
        should.exist(err);
        err.should.eql('error!');
        should.not.exist(result);
        done();
      });
    });

    it('invokes rejection handler if an error has occurred while communicating with the server', () => {
      requestStub.post.callsArgWith(1, 'error!');
      pushInstance.send(recipients, 'hello')
        .catch((err) => {
          should.exist(err);
          err.should.eql('error!');
        });
    });

    it('calls back an error if the server returned a status code greater than or equal to 400', (done) => {
      requestStub.post.callsArgWith(1, null, {
        statusCode: 401
      }, 'error!');
      pushInstance.send(recipients, 'hello', (err, result) => {
        should.exist(err);
        err.should.eql('error!');
        should.not.exist(result);
        done();
      });
    });

    it('invokes rejection handler if the server returned a status code greater than or equal to 400', () => {
      requestStub.post.callsArgWith(1, null, {
        statusCode: 401
      }, 'error!');
      pushInstance.send(recipients, 'hello')
        .catch((err) => {
          should.exist(err);
          err.should.eql('error!');
        });
    });

    it('POSTs to the server\'s /push/sendMessage URL', (done) => {
      requestStub.post.callsArgWith(1, {});
      pushInstance.send(recipients, 'hello', () => {
        requestStub.post.args[0][0].url.should.eql(`${FAKE_BAAS_URL}/push/${appMetadata._id}/sendMessage`);
        done();
      });
    });

    it('rejects if no receipents are specified', (done) => {
      requestStub.post.callsArgWith(1, {});
      (pushInstance.send(null, 'hello')).should.be.rejectedWith(/.*users.*/);
      (pushInstance.send()).should.be.rejectedWith(/.*users.*/);
      done();
    });

    it('rejects if no message is specified', (done) => {
      requestStub.post.callsArgWith(1, {});
      (pushInstance.send(recipients, null)).should.be.rejectedWith(/.*message.*/);
      done();
    });

    it('send the appropriate arguments to the server', (done) => {
      requestStub.post.callsArgWith(1, {});
      pushInstance.send(recipients, 'hello', () => {
        const requestBody = requestStub.post.args[0][0].json;
        requestBody.recipients.should.eql(recipients);
        requestBody.messageContent.should.eql('hello');
        done();
      });
    });

    it('converts a user single object to an array', (done) => {
      requestStub.post.callsArgWith(1, {});
      pushInstance.send(recipient, 'hello', () => {
        const requestBody = requestStub.post.args[0][0].json;
        requestBody.recipients.constructor.should.eql(Array);
        requestBody.recipients.should.eql([recipient]);
        requestBody.messageContent.should.eql('hello');
        done();
      });
    });
  });

  describe('methods / broadcast', () => {
    it('should return a Promise', (done) => {
      requestStub.post.callsArg(1);
      (pushInstance.broadcast('hello')).should.be.a.Promise(); // eslint-disable-line new-cap
      done();
    });

    it('should invoke the callback if specified', (done) => {
      requestStub.post.callsArg(1);
      pushInstance.broadcast('hello', (err) => {
        should.not.exist(err);
        done();
      });
    });

    it('should invoke the promise handlers if no callback specified', (done) => {
      requestStub.post.callsArg(1);
      const promise = pushInstance.broadcast('hello');
      promise.then(() => done());
    });

    it('calls back an error if one has occurred while communicating with the server', (done) => {
      requestStub.post.callsArgWith(1, 'error!');
      pushInstance.broadcast('hello', (err, result) => {
        should.exist(err);
        err.should.eql('error!');
        should.not.exist(result);
        done();
      });
    });

    it('invokes rejection handler if an error has occurred while communicating with the server', () => {
      requestStub.post.callsArgWith(1, 'error!');
      pushInstance.broadcast('hello')
        .catch((err) => {
          should.exist(err);
          err.should.eql('error!');
        });
    });

    it('calls back an error if the server returned a status code greater than or equal to 400', (done) => {
      requestStub.post.callsArgWith(1, null, {
        statusCode: 401
      }, 'error!');
      pushInstance.broadcast('hello', (err, result) => {
        should.exist(err);
        err.should.eql('error!');
        should.not.exist(result);
        done();
      });
    });

    it('invokes the rejection handler if the server returned a status code greater than or equal to 400', () => {
      requestStub.post.callsArgWith(1, null, {
        statusCode: 401
      }, 'error!');
      pushInstance.broadcast('hello')
        .catch((err) => {
          should.exist(err);
          err.should.eql('error!');
        });
    });

    it('POSTs to the server\'s /push/sendBroadcast URL', (done) => {
      requestStub.post.callsArgWith(1, {});
      pushInstance.broadcast('hello', () => {
        requestStub.post.args[0][0].url.should.eql(`${FAKE_BAAS_URL}/push/${appMetadata._id}/sendBroadcast`);
        done();
      });
    });

    it('rejects if no message is specified', (done) => {
      requestStub.post.callsArgWith(1, {});
      (pushInstance.broadcast()).should.be.rejectedWith(/.*message.*/);
      (pushInstance.broadcast(null)).should.be.rejectedWith(/.*message.*/);
      done();
    });

    it('sends the appropriate arguments to the server', (done) => {
      requestStub.post.callsArgWith(1, {});
      pushInstance.broadcast('hello', () => {
        const requestBody = requestStub.post.args[0][0].json;
        requestBody.messageContent.should.eql('hello');
        const outgoingRequestHeaders = requestStub.post.args[0][0].headers;
        outgoingRequestHeaders.should.have.property('x-kinvey-api-version');
        outgoingRequestHeaders['x-kinvey-api-version'].should.equal('3');
        done();
      });
    });
  });

  describe('methods / sendPayload', () => {
    const iOSAps = 'iOS APs';
    const iOSExtras = 'iOS extras';
    const androidPayload = 'android payload';

    it('should return a Promise', (done) => {
      requestStub.post.callsArg(1);
      // eslint-disable-next-line new-cap
      (pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload)).should.be.a.Promise();
      done();
    });

    it('should invoke the callback if specified', (done) => {
      requestStub.post.callsArg(1);
      pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload, (err) => {
        should.not.exist(err);
        done();
      });
    });

    it('should invoke the promise handlers if no callback specified', (done) => {
      requestStub.post.callsArg(1);
      const promise = pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload);
      promise.then(() => done());
    });

    it('calls back an error if one has occurred while communicating with the server', (done) => {
      requestStub.post.callsArgWith(1, 'error!');
      pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload, (err, result) => {
        should.exist(err);
        err.should.eql('error!');
        should.not.exist(result);
        done();
      });
    });

    it('invokes the rejection handler if an error has occurred while communicating with the server', () => {
      requestStub.post.callsArgWith(1, 'error!');
      pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload)
        .catch((err) => {
          should.exist(err);
          err.should.eql('error!');
        });
    });

    it('calls back an error if the server returned a status code greater than or equal to 400', (done) => {
      requestStub.post.callsArgWith(1, null, {
        statusCode: 401
      }, 'error!');
      pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload, (err, result) => {
        should.exist(err);
        err.should.eql('error!');
        should.not.exist(result);
        done();
      });
    });

    it('invokes the rejection handler if the server returned a status code greater than or equal to 400', () => {
      requestStub.post.callsArgWith(1, null, {
        statusCode: 401
      }, 'error!');
      pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload)
        .catch((err) => {
          should.exist(err);
          err.should.eql('error!');
        });
    });

    it('POSTs to the server\'s /push/sendMessage URL', (done) => {
      requestStub.post.callsArgWith(1, {});
      pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload, () => {
        requestStub.post.args[0][0].url.should.eql(`${FAKE_BAAS_URL}/push/${appMetadata._id}/sendMessage`);
        done();
      });
    });

    it('rejects if no receipents are specified', (done) => {
      requestStub.post.callsArgWith(1, {});
      (pushInstance.sendPayload(null, iOSAps, iOSExtras, androidPayload)).should.be.rejectedWith(/.*users.*/);
      (pushInstance.sendPayload()).should.be.rejectedWith(/.*users.*/);
      done();
    });

    it('sends the appropriate arguments to the server', (done) => {
      requestStub.post.callsArgWith(1, {});
      pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload, () => {
        const requestBody = requestStub.post.args[0][0].json;
        requestBody.recipients.should.eql(recipients);
        requestBody.messageContent.should.eql({
          iOSAps,
          iOSExtras,
          androidPayload
        });
        const outgoingRequestHeaders = requestStub.post.args[0][0].headers;
        outgoingRequestHeaders.should.have.property('x-kinvey-api-version');
        outgoingRequestHeaders['x-kinvey-api-version'].should.equal('3');
        done();
      });
    });
  });

  describe('methods / broadcastPayload', () => {
    const iOSAps = 'iOS APs';
    const iOSExtras = 'iOS extras';
    const androidPayload = 'android payload';

    it('should return a Promise', (done) => {
      requestStub.post.callsArg(1);
      // eslint-disable-next-line new-cap
      (pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload)).should.be.a.Promise();
      done();
    });

    it('should invoke the callback if specified', (done) => {
      requestStub.post.callsArg(1);
      pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload, (err) => {
        should.not.exist(err);
        done();
      });
    });

    it('should invoke the promise handlers if no callback specified', (done) => {
      requestStub.post.callsArg(1);
      const promise = pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload);
      promise.then(() => done());
    });

    it('calls back an error if one has occurred while communicating with the server', (done) => {
      requestStub.post.callsArgWith(1, 'error!');
      pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload, (err, result) => {
        should.exist(err);
        err.should.eql('error!');
        should.not.exist(result);
        done();
      });
    });

    it('invokes the rejection handler if an error has occurred while communicating with the server', () => {
      requestStub.post.callsArgWith(1, 'error!');
      pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload)
        .catch((err) => {
          should.exist(err);
          err.should.eql('error!');
        });
    });

    it('calls back an error if the server returned a status code greater than or equal to 400', (done) => {
      requestStub.post.callsArgWith(1, null, {
        statusCode: 401
      }, 'error!');
      pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload, (err, result) => {
        should.exist(err);
        err.should.eql('error!');
        should.not.exist(result);
        done();
      });
    });

    it('invokes the rejection handler if the server returned a status code greater than or equal to 400', () => {
      requestStub.post.callsArgWith(1, null, {
        statusCode: 401
      }, 'error!');
      pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload)
        .catch((err) => {
          should.exist(err);
          err.should.eql('error!');
        });
    });

    it('POSTs to the server\'s /push/sendBroadcast URL', (done) => {
      requestStub.post.callsArgWith(1, {});
      pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload, () => {
        requestStub.post.args[0][0].url.should.eql(`${FAKE_BAAS_URL}/push/${appMetadata._id}/sendBroadcast`);
        done();
      });
    });

    it('sends the appropriate arguments to the server', (done) => {
      requestStub.post.callsArgWith(1, {});
      pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload, () => {
        const requestBody = requestStub.post.args[0][0].json;
        requestBody.messageContent.should.eql({
          iOSAps,
          iOSExtras,
          androidPayload
        });
        const outgoingRequestHeaders = requestStub.post.args[0][0].headers;
        outgoingRequestHeaders.should.have.property('x-kinvey-api-version');
        outgoingRequestHeaders['x-kinvey-api-version'].should.equal('3');
        done();
      });
    });
  });
});
