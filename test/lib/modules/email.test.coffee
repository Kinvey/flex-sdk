# Copyright (c) 2014, Kinvey, Inc. All rights reserved.
#
# This software is licensed to you under the Kinvey terms of service located at
# http://www.kinvey.com/terms-of-use. By downloading, accessing and/or using this
# software, you hereby accept such terms of service  (and any agreement referenced
# therein) and agree that you have read, understand and agree to be bound by such
# terms of service and are of legal age to agree to such terms with Kinvey.
#
# This software contains valuable confidential and proprietary information of
# KINVEY, INC and is subject to applicable licensing agreements.
# Unauthorized reproduction, transmission or distribution of this file and its
# contents is a violation of applicable laws.

should = require 'should'
EventEmitter = require('events').EventEmitter
sinon = require 'sinon'
request = require 'request'

describe 'modules / email', () ->
  emailModule = null
  emailInstance = null
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

    emailModule = require '../../../lib/service/modules/email'
    emailInstance = emailModule fakeProxyURL, taskMetadata, emitter

    done()

  afterEach (done) ->
    requestStub.post.reset()
    done()

  it 'does not require a callback', (done) ->
    requestStub.post.callsArg 1
    (-> emailInstance.send('from', 'to', 'subject', 'textBody')).should.not.throw()
    done()

  it 'should include x-kinvey-wait-for-confirmation = false if no callback is specified', (done) ->
    requestStub.post.callsArg 1
    (-> emailInstance.send('from', 'to', 'subject', 'textBody')).should.not.throw()
    requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql 'false'
    done()

  it 'should include x-kinvey-wait-for-confirmation = true if a callback is specified', (done) ->
    requestStub.post.callsArgWith 1, 'error!'
    emailInstance.send 'from', 'to', 'subject', 'textBody', (err) ->
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
    emailInstance.send 'from', 'to', 'subject', 'textBody'
    requestStub.post.args[0][0].headers['x-kinvey-wait-for-confirmation'].should.eql 'false'

  it "throws if 'from', 'to', 'subject' and 'textBody' are not all specified", (done) ->
    (-> emailInstance.send()).should.throw()
    (-> emailInstance.send('from')).should.throw()
    (-> emailInstance.send('from', 'to')).should.throw()
    (-> emailInstance.send('from', 'to', 'subject')).should.throw()
    (-> emailInstance.send(null, 'to', 'subject', 'textBody')).should.throw()
    (-> emailInstance.send('from', null, 'subject', 'textBody')).should.throw()
    (-> emailInstance.send('from', 'to', null, 'textBody')).should.throw()
    done()

  it 'can pass a callback instead of replyTo argument', (done) ->
    requestStub.post.callsArgWith 1, 'error!'
    emailInstance.send 'from', 'to', 'subject', 'textBody', (err) ->
      should.exist err
      err.should.eql 'error!'
      done()

  it 'can pass a callback instead of htmlBody argument', (done) ->
    requestStub.post.callsArgWith 1, 'error!'
    emailInstance.send 'from', 'to', 'subject', 'textBody', 'replyTo', (err) ->
      should.exist err
      err.should.eql 'error!'
      done()

  it 'can pass a callback instead of cc argument', (done) ->
    requestStub.post.callsArgWith 1, 'error!'
    emailInstance.send 'from', 'to', 'subject', 'textBody', 'replyTo', 'htmlBody', (err) ->
      should.exist err
      err.should.eql 'error!'
      done()

  it 'can pass a callback instead of bcc argument', (done) ->
    requestStub.post.callsArgWith 1, 'error!'
    emailInstance.send 'from', 'to', 'subject', 'textBody', 'replyTo', 'htmlBody', 'cc', (err) ->
      should.exist err
      err.should.eql 'error!'
      done()

  it 'can pass a callback as the last argument', (done) ->
    requestStub.post.callsArgWith 1, 'error!'
    emailInstance.send 'from', 'to', 'subject', 'textBody', 'replyTo', 'htmlBody', 'cc', 'bcc', (err) ->
      should.exist err
      err.should.eql 'error!'
      done()

  it 'returns an error if one has occurred while communicating with the proxy', (done) ->
    requestStub.post.callsArgWith 1, 'error!'
    emailInstance.send 'from', 'to', 'subject', 'textBody', (err) ->
      should.exist err
      err.should.eql 'error!'
      done()

  it 'returns an error if the proxy returned a status code greater than or equal to 400', (done) ->
    requestStub.post.callsArgWith 1, null, { statusCode: 401 }, 'error!'
    emailInstance.send 'from', 'to', 'subject', 'textBody', (err) ->
      should.exist err
      err.should.eql 'error!'
      done()

  it "POSTs to the proxy's /email/send URL", (done) ->
    requestStub.post.callsArgWith 1, {}
    emailInstance.send 'from', 'to', 'subject', 'textBody', (err) ->
      requestStub.post.args[0][0].url.should.eql "#{fakeProxyURL}/email/send"
      done()

  it 'sends a null replyTo parameter if no replyTo argument is specified', (done) ->
    requestStub.post.callsArgWith 1, {}
    emailInstance.send 'from', 'to', 'subject', 'textBody', (err) ->
      requestBody = requestStub.post.args[0][0].json
      (requestBody.replyTo is null).should.be.true
      done()

  it 'sends a null html parameter if no htmlBody argument is specified', (done) ->
    requestStub.post.callsArgWith 1, {}
    emailInstance.send 'from', 'to', 'subject', 'textBody', (err) ->
      requestBody = requestStub.post.args[0][0].json
      (requestBody.html is null).should.be.true
      done()

  it 'sends a null cc parameter if no cc argument is specified', (done) ->
    requestStub.post.callsArgWith 1, {}
    emailInstance.send 'from', 'to', 'subject', 'textBody', 'htmlBody', (err) ->
      requestBody = requestStub.post.args[0][0].json
      (requestBody.cc is null).should.be.true
      done()

  it 'sends a null bcc parameter if no bcc argument is specified', (done) ->
    requestStub.post.callsArgWith 1, {}
    emailInstance.send 'from', 'to', 'subject', 'textBody', 'htmlBody', 'cc', (err) ->
      requestBody = requestStub.post.args[0][0].json
      (requestBody.bcc is null).should.be.true
      done()

  it 'sends the appropriate arguments to the proxy', (done) ->
    requestStub.post.callsArgWith 1, {}
    emailInstance.send 'fromTest', 'toTest', 'subjectTest', 'textBodyTest', 'replyToTest', 'htmlBodyTest', 'ccTest', 'bccTest', (err) ->
      requestBody = requestStub.post.args[0][0].json
      requestBody.from.should.eql 'fromTest'
      requestBody.to.should.eql 'toTest'
      requestBody.subject.should.eql 'subjectTest'
      requestBody.body.should.eql 'textBodyTest'
      requestBody.replyTo.should.eql 'replyToTest'
      requestBody.html.should.eql 'htmlBodyTest'
      requestBody.cc.should.eql 'ccTest'
      requestBody.bcc.should.eql 'bccTest'

      outgoingRequestHeaders = requestStub.post.args[0][0].headers
      outgoingRequestHeaders.should.have.property 'x-kinvey-task-id'
      outgoingRequestHeaders.should.have.property 'x-kinvey-container-id'
      outgoingRequestHeaders['x-kinvey-task-id'].should.equal taskMetadata.taskId
      outgoingRequestHeaders['x-kinvey-container-id'].should.equal taskMetadata.containerId

      done()

  it 'returns the response from the mail server if one is returned', (done) ->
    requestStub.post.callsArgWith 1, null, {}, { mailServerResponse: 'response!' }
    emailInstance.send 'from', 'to', 'subject', 'textBody', (err, response) ->
      should.not.exist err
      should.exist response
      response.should.eql 'response!'
      done()
