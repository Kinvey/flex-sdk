# Copyright (c) 2016 Kinvey Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

EventEmitter = require('events').EventEmitter
should = require 'should'
sinon = require 'sinon'
request = require 'request'

describe 'modules / push', () ->
  pushModule = null
  pushInstance = null
  requestStub = null
  emitter = new EventEmitter()
  recipients = [{ _id: 'id1'}, { _id: 'id2'}]
  recipient = {_id: 'id1'}

  fakeProxyURL = 'http://proxy.proxy'

  taskMetadata =
    taskId: 'abcd1234'
    containerId: 'wxyz9876'

  before (done) ->
# setup spies
    requestStub =
      post: sinon.stub()
    requestDefaultsStub = sinon.stub()
    requestDefaultsStub.returns requestStub

    # change the require cache for request to include a fake defaults method that returns a sinon spy
    require.cache[require.resolve('request')].exports.defaults = requestDefaultsStub

    pushModule = require '../../../lib/service/modules/push'
    pushInstance = pushModule fakeProxyURL, taskMetadata, emitter

    done()

  afterEach (done) ->
    requestStub.post.reset()
    done()

  it "'send' and 'sendMessage' point to the same method", (done) ->
    pushInstance.send.should.eql pushInstance.sendMessage
    done()

  it "'broadcast' and 'broadcastMessage' point to the same method", (done) ->
    pushInstance.broadcast.should.eql pushInstance.broadcastMessage
    done()

  describe 'methods / send', () ->
    it 'does not require a callback', (done) ->
      requestStub.post.callsArg 1
      (-> pushInstance.send(recipients, 'hello')).should.not.throw()
      done()

    it 'should include x-kinvey-wait-for-confirmation = false if no callback is specified', (done) ->
      requestStub.post.callsArg 1
      (-> pushInstance.send(recipients, 'hello')).should.not.throw()
      requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql 'false'
      done()

    it 'should include x-kinvey-wait-for-confirmation = true if a callback is specified', (done) ->
      requestStub.post.callsArgWith 1, 'error!'
      pushInstance.send recipients, 'hello', (err) ->
        should.exist err
        err.should.eql 'error!'
        requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql 'true'
        done()

    it 'should register the proxy task if a callback isn\'t included', (done) ->
      emittersCalled = 0
      emitter.once 'proxyTaskStarted', () ->
        emittersCalled += 1

      emitter.once 'proxyTaskCompleted', () ->
        emittersCalled += 1
        emittersCalled.should.eql 2
        done()

      requestStub.post.callsArg 1
      pushInstance.send recipients, 'hello'
      requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql 'false'

    it 'returns an error if one has occurred while communicating with the proxy', (done) ->
      requestStub.post.callsArgWith 1, 'error!'
      pushInstance.send recipients, 'hello', (err, result) ->
        should.exist err
        err.should.eql 'error!'
        should.not.exist result
        done()

    it 'returns an error if the proxy returned a status code greater than or equal to 400', (done) ->
      requestStub.post.callsArgWith 1, null, { statusCode: 401 }, 'error!'
      pushInstance.send recipients, 'hello', (err, result) ->
        should.exist err
        err.should.eql 'error!'
        should.not.exist result
        done()

    it "POSTs to the proxy's /push/sendMessage URL", (done) ->
      requestStub.post.callsArgWith 1, {}
      pushInstance.send recipients, 'hello', (err, result) ->
        requestStub.post.args[0][0].url.should.eql "#{fakeProxyURL}/push/sendMessage"
        done()

    it 'throws an error if no receipents are specified', (done) ->
      requestStub.post.callsArgWith 1, {}
      # verify that the method throws an error, and that the error includes the name of the missing parameter
      (-> pushInstance.send(null, 'hello')).should.throw(/.*users.*/)
      (-> pushInstance.send()).should.throw(/.*users.*/)
      done()

    it 'throws an error if no message is specified', (done) ->
      requestStub.post.callsArgWith 1, {}
      # verify that the method throws an error, and that the error includes the name of the missing parameter
      (-> pushInstance.send(recipients, null)).should.throw(/.*message.*/)
      done()

    it 'send the appropriate arguments to the proxy', (done) ->
      requestStub.post.callsArgWith 1, {}
      pushInstance.send recipients, 'hello', (err, result) ->
        requestBody = requestStub.post.args[0][0].json
        requestBody.destination.should.eql recipients
        requestBody.messageContent.should.eql 'hello'
        done()

    it 'converts a user single object to an array', (done) ->
      requestStub.post.callsArgWith 1, {}
      pushInstance.send recipient, 'hello', (err, result) ->
        requestBody = requestStub.post.args[0][0].json
        requestBody.destination.constructor.should.eql Array
        requestBody.destination.should.eql [recipient]
        requestBody.messageContent.should.eql 'hello'
        done()

  describe 'methods / broadcast', () ->
    it 'does not require a callback', (done) ->
      requestStub.post.callsArg 1
      (-> pushInstance.broadcast('hello')).should.not.throw()
      done()

    it 'should include x-kinvey-wait-for-confirmation = false if no callback is specified', (done) ->
      requestStub.post.callsArg 1
      (-> pushInstance.broadcast('hello')).should.not.throw()
      requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql 'false'
      done()

    it 'should include x-kinvey-wait-for-confirmation = true if a callback is specified', (done) ->
      requestStub.post.callsArgWith 1, 'error!'
      pushInstance.broadcast 'hello', (err) ->
        should.exist err
        err.should.eql 'error!'
        requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql 'true'
        done()

    it 'should register the proxy task if a callback isn\'t included', (done) ->
      emittersCalled = 0
      emitter.once 'proxyTaskStarted', () ->
        emittersCalled += 1

      emitter.once 'proxyTaskCompleted', () ->
        emittersCalled += 1
        emittersCalled.should.eql 2
        done()

      requestStub.post.callsArg 1
      pushInstance.broadcast 'hello'
      requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql 'false'


    it 'returns an error if one has occurred while communicating with the proxy', (done) ->
      requestStub.post.callsArgWith 1, 'error!'
      pushInstance.broadcast 'hello', (err, result) ->
        should.exist err
        err.should.eql 'error!'
        should.not.exist result
        done()

    it 'returns an error if the proxy returned a status code greater than or equal to 400', (done) ->
      requestStub.post.callsArgWith 1, null, { statusCode: 401 }, 'error!'
      pushInstance.broadcast 'hello', (err, result) ->
        should.exist err
        err.should.eql 'error!'
        should.not.exist result
        done()

    it "POSTs to the proxy's /push/sendBroadcast URL", (done) ->
      requestStub.post.callsArgWith 1, {}
      pushInstance.broadcast 'hello', (err, result) ->
        requestStub.post.args[0][0].url.should.eql "#{fakeProxyURL}/push/sendBroadcast"
        done()

    it 'throws an error if no message is specified', (done) ->
      requestStub.post.callsArgWith 1, {}
      # verify that the method throws an error, and that the error includes the name of the missing parameter
      (-> pushInstance.broadcast()).should.throw(/.*message.*/)
      (-> pushInstance.broadcast(null)).should.throw(/.*message.*/)
      done()

    it 'sends the appropriate arguments to the proxy', (done) ->
      requestStub.post.callsArgWith 1, {}
      pushInstance.broadcast 'hello', (err, result) ->
        requestBody = requestStub.post.args[0][0].json
        requestBody.messageContent.should.eql 'hello'

        outgoingRequestHeaders = requestStub.post.args[0][0].headers
        outgoingRequestHeaders.should.have.property 'x-kinvey-task-id'
        outgoingRequestHeaders.should.have.property 'x-kinvey-container-id'
        outgoingRequestHeaders['x-kinvey-task-id'].should.equal taskMetadata.taskId
        outgoingRequestHeaders['x-kinvey-container-id'].should.equal taskMetadata.containerId

        done()

  describe 'methods / sendPayload', () ->
    iOSAps = 'iOS APs'
    iOSExtras = 'iOS extras'
    androidPayload = 'android payload'

    it 'does not require a callback', (done) ->
      requestStub.post.callsArg 1
      (-> pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload)).should.not.throw()
      done()

    it 'should include x-kinvey-wait-for-confirmation = false if no callback is specified', (done) ->
      requestStub.post.callsArg 1
      (-> pushInstance.sendPayload(recipients, iOSAps, iOSExtras, androidPayload)).should.not.throw()
      requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql 'false'
      done()

    it 'should include x-kinvey-wait-for-confirmation = true if a callback is specified', (done) ->
      requestStub.post.callsArgWith 1, 'error!'
      pushInstance.sendPayload recipients, iOSAps, iOSExtras, androidPayload, (err) ->
        should.exist err
        err.should.eql 'error!'
        requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql 'true'
        done()

    it 'should register the proxy task if a callback isn\'t included', (done) ->
      emittersCalled = 0
      emitter.once 'proxyTaskStarted', () ->
        emittersCalled += 1

      emitter.once 'proxyTaskCompleted', () ->
        emittersCalled += 1
        emittersCalled.should.eql 2
        done()

      requestStub.post.callsArg 1
      pushInstance.sendPayload recipients, iOSAps, iOSExtras, androidPayload
      requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql 'false'

    it 'returns an error if one has occurred while communicating with the proxy', (done) ->
      requestStub.post.callsArgWith 1, 'error!'
      pushInstance.sendPayload recipients, iOSAps, iOSExtras, androidPayload, (err, result) ->
        should.exist err
        err.should.eql 'error!'
        should.not.exist result
        done()

    it 'returns an error if the proxy returned a status code greater than or equal to 400', (done) ->
      requestStub.post.callsArgWith 1, null, { statusCode: 401 }, 'error!'
      pushInstance.sendPayload recipients, iOSAps, iOSExtras, androidPayload, (err, result) ->
        should.exist err
        err.should.eql 'error!'
        should.not.exist result
        done()

    it "POSTs to the proxy's /push/sendMessage URL", (done) ->
      requestStub.post.callsArgWith 1, {}
      pushInstance.sendPayload recipients, iOSAps, iOSExtras, androidPayload, (err, result) ->
        requestStub.post.args[0][0].url.should.eql "#{fakeProxyURL}/push/sendMessage"
        done()

    it 'throws an error if no receipents are specified', (done) ->
      requestStub.post.callsArgWith 1, {}
      # verify that the method throws an error, and that the error includes the name of the missing parameter
      (-> pushInstance.sendPayload(null, iOSAps, iOSExtras, androidPayload)).should.throw(/.*users.*/)
      (-> pushInstance.sendPayload()).should.throw(/.*users.*/)
      done()

    it 'sends the appropriate arguments to the proxy', (done) ->
      requestStub.post.callsArgWith 1, {}
      pushInstance.sendPayload recipients, iOSAps, iOSExtras, androidPayload, (err, result) ->
        requestBody = requestStub.post.args[0][0].json
        requestBody.destination.should.eql recipients
        requestBody.messageContent.should.eql { iOSAps: iOSAps, iOSExtras: iOSExtras, androidPayload: androidPayload }

        outgoingRequestHeaders = requestStub.post.args[0][0].headers
        outgoingRequestHeaders.should.have.property 'x-kinvey-task-id'
        outgoingRequestHeaders.should.have.property 'x-kinvey-container-id'
        outgoingRequestHeaders['x-kinvey-task-id'].should.equal taskMetadata.taskId
        outgoingRequestHeaders['x-kinvey-container-id'].should.equal taskMetadata.containerId

        done()

  describe 'methods / broadcastPayload', () ->
    iOSAps = 'iOS APs'
    iOSExtras = 'iOS extras'
    androidPayload = 'android payload'

    it 'does not require a callback', (done) ->
      requestStub.post.callsArg 1
      (-> pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload)).should.not.throw()
      done()

    it 'should include x-kinvey-wait-for-confirmation = false if no callback is specified', (done) ->
      requestStub.post.callsArg 1
      (-> pushInstance.broadcastPayload(iOSAps, iOSExtras, androidPayload)).should.not.throw()
      requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql 'false'
      done()

    it 'should include x-kinvey-wait-for-confirmation = true if a callback is specified', (done) ->
      requestStub.post.callsArgWith 1, 'error!'
      pushInstance.broadcastPayload iOSAps, iOSExtras, androidPayload, (err) ->
        should.exist err
        err.should.eql 'error!'
        requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql 'true'
        done()

    it 'should register the proxy task if a callback isn\'t included', (done) ->
      emittersCalled = 0
      emitter.once 'proxyTaskStarted', () ->
        emittersCalled += 1

      emitter.once 'proxyTaskCompleted', () ->
        emittersCalled += 1
        emittersCalled.should.eql 2
        done()

      requestStub.post.callsArg 1
      pushInstance.broadcastPayload iOSAps, iOSExtras, androidPayload
      requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql 'false'

    it 'returns an error if one has occurred while communicating with the proxy', (done) ->
      requestStub.post.callsArgWith 1, 'error!'
      pushInstance.broadcastPayload iOSAps, iOSExtras, androidPayload, (err, result) ->
        should.exist err
        err.should.eql 'error!'
        should.not.exist result
        done()

    it 'returns an error if the proxy returned a status code greater than or equal to 400', (done) ->
      requestStub.post.callsArgWith 1, null, { statusCode: 401 }, 'error!'
      pushInstance.broadcastPayload iOSAps, iOSExtras, androidPayload, (err, result) ->
        should.exist err
        err.should.eql 'error!'
        should.not.exist result
        done()

    it "POSTs to the proxy's /push/sendBroadcast URL", (done) ->
      requestStub.post.callsArgWith 1, {}
      pushInstance.broadcastPayload iOSAps, iOSExtras, androidPayload, (err, result) ->
        requestStub.post.args[0][0].url.should.eql "#{fakeProxyURL}/push/sendBroadcast"
        done()

    it 'sends the appropriate arguments to the proxy', (done) ->
      requestStub.post.callsArgWith 1, {}
      pushInstance.broadcastPayload iOSAps, iOSExtras, androidPayload, (err, result) ->
        requestBody = requestStub.post.args[0][0].json
        requestBody.messageContent.should.eql { iOSAps: iOSAps, iOSExtras: iOSExtras, androidPayload: androidPayload }

        outgoingRequestHeaders = requestStub.post.args[0][0].headers
        outgoingRequestHeaders.should.have.property 'x-kinvey-task-id'
        outgoingRequestHeaders.should.have.property 'x-kinvey-container-id'
        outgoingRequestHeaders['x-kinvey-task-id'].should.equal taskMetadata.taskId
        outgoingRequestHeaders['x-kinvey-container-id'].should.equal taskMetadata.containerId

        done()
