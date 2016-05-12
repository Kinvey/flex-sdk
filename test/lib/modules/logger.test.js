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

describe 'modules / logger', () ->
  loggerModule = null
  loggerInstance = null
  requestStub = null
  emitter = new EventEmitter()

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

    loggerModule = require '../../../lib/service/modules/logger'
    loggerInstance = loggerModule fakeProxyURL, taskMetadata, emitter

    done()

  afterEach (done) ->
    requestStub.post.reset()
    done()

  it 'does not require a callback', (done) ->
    requestStub.post.callsArg 1
    (-> loggerInstance.warn('hello')).should.not.throw()
    done()

  it 'should include x-kinvey-wait-for-confirmation = false if no callback is specified', (done) ->
    requestStub.post.callsArg 1
    (-> loggerInstance.warn('hello')).should.not.throw()
    requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql 'false'
    done()

  it 'should include x-kinvey-wait-for-confirmation = true if a callback is specified', (done) ->
    requestStub.post.callsArgWith 1, 'error!'
    loggerInstance.warn 'hello', (err) ->
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
    loggerInstance.warn 'hello'
    requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql 'false'

  it 'returns an error if one has occurred while communicating with the proxy', (done) ->
    requestStub.post.callsArgWith 1, 'error!'
    loggerInstance.warn 'hello', (err) ->
      should.exist err
      err.should.eql 'error!'
      done()

  it 'returns an error if the proxy returned a status code greater than or equal to 400', (done) ->
    requestStub.post.callsArgWith 1, null, { statusCode: 401 }, 'error!'
    loggerInstance.warn 'hello', (err) ->
      should.exist err
      err.should.eql 'error!'
      done()

  it "POSTs to the proxy's /log URL", (done) ->
    requestStub.post.callsArgWith 1, {}
    loggerInstance.warn 'hello', (err) ->
      requestStub.post.args[0][0].url.should.eql "#{fakeProxyURL}/log"
      done()

  it 'sends a null message if no message is specified', (done) ->
    requestStub.post.callsArgWith 1, {}
    loggerInstance.warn null, (err) ->
      requestBody = requestStub.post.args[0][0].json
      (requestBody.message is null).should.be.true
      done()

  it 'when called with an Error as the message, sends the results of error.toString()', (done) ->
    requestStub.post.callsArgWith 1, {}
    loggerInstance.warn new Error("hello"), (err) ->
      requestBody = requestStub.post.args[0][0].json
      requestBody.message.should.eql 'Error: hello'
      done()

  it 'sends the appropriate arguments to the proxy when .info is called', (done) ->
    requestStub.post.callsArgWith 1, {}
    loggerInstance.info 'hello', (err) ->
      requestBody = requestStub.post.args[0][0].json
      requestBody.level.should.eql 'info'
      requestBody.message.should.eql 'hello'

      outgoingRequestHeaders = requestStub.post.args[0][0].headers
      outgoingRequestHeaders.should.have.property 'x-kinvey-task-id'
      outgoingRequestHeaders.should.have.property 'x-kinvey-container-id'
      outgoingRequestHeaders['x-kinvey-task-id'].should.equal taskMetadata.taskId
      outgoingRequestHeaders['x-kinvey-container-id'].should.equal taskMetadata.containerId

      done()

  it 'sends the appropriate arguments to the proxy when .warn is called', (done) ->
    requestStub.post.callsArgWith 1, {}
    loggerInstance.warn 'hello', (err) ->
      requestBody = requestStub.post.args[0][0].json
      requestBody.level.should.eql 'warning'
      requestBody.message.should.eql 'hello'

      outgoingRequestHeaders = requestStub.post.args[0][0].headers
      outgoingRequestHeaders.should.have.property 'x-kinvey-task-id'
      outgoingRequestHeaders.should.have.property 'x-kinvey-container-id'
      outgoingRequestHeaders['x-kinvey-task-id'].should.equal taskMetadata.taskId
      outgoingRequestHeaders['x-kinvey-container-id'].should.equal taskMetadata.containerId

      done()

  it 'sends the appropriate arguments to the proxy when .error is called', (done) ->
    requestStub.post.callsArgWith 1, {}
    loggerInstance.error 'hello', (err) ->
      requestBody = requestStub.post.args[0][0].json
      requestBody.level.should.eql 'error'
      requestBody.message.should.eql 'hello'

      outgoingRequestHeaders = requestStub.post.args[0][0].headers
      outgoingRequestHeaders.should.have.property 'x-kinvey-task-id'
      outgoingRequestHeaders.should.have.property 'x-kinvey-container-id'
      outgoingRequestHeaders['x-kinvey-task-id'].should.equal taskMetadata.taskId
      outgoingRequestHeaders['x-kinvey-container-id'].should.equal taskMetadata.containerId

      done()

  it 'sends the appropriate arguments to the proxy when .fatal is called', (done) ->
    requestStub.post.callsArgWith 1, {}
    loggerInstance.fatal 'hello', (err) ->
      requestBody = requestStub.post.args[0][0].json
      requestBody.level.should.eql 'fatal'
      requestBody.message.should.eql 'hello'

      outgoingRequestHeaders = requestStub.post.args[0][0].headers
      outgoingRequestHeaders.should.have.property 'x-kinvey-task-id'
      outgoingRequestHeaders.should.have.property 'x-kinvey-container-id'
      outgoingRequestHeaders['x-kinvey-task-id'].should.equal taskMetadata.taskId
      outgoingRequestHeaders['x-kinvey-container-id'].should.equal taskMetadata.containerId

      done()
