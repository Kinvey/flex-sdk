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

logic = require '../../lib/service/businesslogic'
should = require 'should'

testTaskName = 'myTaskName'

quickRandom = () ->
  return Math.floor(Math.random() * (1000 - 1) + 1);

sampleTask = (name) ->
  return {
    taskId: 123456
    appId: 12345
    appMetadata:
      _id: '12345'
      appsecret: 'appsecret'
      mastersecret: 'mastersecret'
      pushService: undefined
      restrictions:
        level: 'starter'
      API_version: 3
      name: 'DevApp'
      platform: null
    authKey: "abc123"
    requestId: 'ea85600029b04a18a754d57629cff62d'
    taskType: 'businessLogic'
    taskName: name
    containerMappingId: "abc:123"
    method: 'POST'
    endpoint: null
    request:
      method: 'POST'
      headers:
        host: 'localhost:7007'
        'X-Kinvey-Custom-Request-Properties': '{"foo":"bar"}'
        'x-kinvey-include-headers-in-response': 'Connection;Content-Length;Content-Type;Date;Location;X-Kinvey-API-Version;X-Kinvey-Request-Id;X-Powered-By;Server'
        authorization: 'Basic a2lkX1oxQkVoeDJDczpkYmNiNTUwMWZlOGM0MWQ3YTFmOTkyYjhkNTdiOGEzOA=='
        'accept-encoding': 'gzip, deflate'
        'accept-language': 'en-us'
        'x-kinvey-responsewrapper': 'true'
        accept: '*/*'
        origin: 'http://0.0.0.0:4200'
        'content-length': '0'
        connection: 'keep-alive'
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10) AppleWebKit/600.1.25 (KHTML, like Gecko) Version/8.0 Safari/600.1.25'
        referer: 'http://0.0.0.0:4200/environments/kid_Z1BEhx2Cs/business-logic/endpoint/quick/editor'
      username: 'kid_Z1BEhx2Cs'
      userId: 'kid_Z1BEhx2Cs'
      entityId: '12345'
      serviceObjectName: null
    response:
      status: 0
      headers: {}
      body: {}
  }

describe 'business logic', () ->
  describe 'logic registration', () ->
    it 'can register a logic task', (done) ->
      logic.register testTaskName, (request, complete) ->
        done()

      fn = logic.resolve testTaskName
      fn()

  describe 'completion handlers', () ->

    afterEach (done) ->
      logic.clearAll()
      done()

    it 'should return a successful response', (done) ->
      taskName = quickRandom()
      task = sampleTask taskName

      logic.register taskName, (request, complete) ->
        complete().ok().next()

      logic.process task, null, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 200
        result.response.body.should.eql '{}'
        done()

    it 'should include a body', (done) ->
      taskName = quickRandom()
      task = sampleTask taskName

      logic.register taskName, (request, complete) ->
        complete({"foo":"bar"}).ok().next()

      logic.process task, null, (err, result) ->
        #should.not.exist err
        result.response.statusCode.should.eql 200
        result.response.body.should.eql JSON.stringify {"foo":"bar"}
        done()

    it 'should return a 201 created', (done) ->
      taskName = quickRandom()
      task = sampleTask taskName

      logic.register taskName, (request, complete) ->
        complete({"foo":"bar"}).created().next()

      logic.process task, null, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 201
        result.response.body.should.eql JSON.stringify {"foo":"bar"}
        done()

    it 'should return a 202 accepted', (done) ->
      taskName = quickRandom()
      task = sampleTask taskName

      logic.register taskName, (request, complete) ->
        complete({"foo":"bar"}).accepted().next()

      logic.process task, null, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 202
        result.response.body.should.eql JSON.stringify {"foo":"bar"}
        done()

    it 'should return a 400 bad request', (done) ->
      taskName = quickRandom()
      task = sampleTask taskName

      logic.register taskName, (request, complete) ->
        complete("This is a bad request").badRequest().next()

      logic.process task, null, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 400
        result.response.body = JSON.parse result.response.body
        result.response.body.error.should.eql 'BadRequest'
        result.response.body.description.should.eql "Unable to understand request"
        result.response.body.debug.should.eql 'This is a bad request'
        done()

    it 'should return a 401 unauthorized', (done) ->
      taskName = quickRandom()
      task = sampleTask taskName

      logic.register taskName, (request, complete) ->
        complete("You are not authorized!").unauthorized().next()

      logic.process task, null, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 401
        result.response.body = JSON.parse result.response.body
        result.response.body.error.should.eql 'InvalidCredentials'
        result.response.body.description.should.eql "Invalid credentials. Please retry your request with correct credentials"
        result.response.body.debug.should.eql 'You are not authorized!'
        done()

    it 'should return a 403 forbidden', (done) ->
      taskName = quickRandom()
      task = sampleTask taskName

      logic.register taskName, (request, complete) ->
        complete("Forbidden!").forbidden().next()

      logic.process task, null, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 403
        result.response.body = JSON.parse result.response.body
        result.response.body.error.should.eql 'Forbidden'
        result.response.body.description.should.eql "The request is forbidden"
        result.response.body.debug.should.eql 'Forbidden!'
        done()

    it 'should return a 404 not found', (done) ->
      taskName = quickRandom()
      task = sampleTask taskName

      logic.register taskName, (request, complete) ->
        complete("The request is not found!").notFound().next()

      logic.process task, null, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 404
        result.response.body = JSON.parse result.response.body
        result.response.body.error.should.eql 'NotFound'
        result.response.body.description.should.eql "The requested entity or entities were not found in the serviceObject"
        result.response.body.debug.should.eql 'The request is not found!'
        done()

    it 'should return a 405 not allowed', (done) ->
      taskName = quickRandom()
      task = sampleTask taskName

      logic.register taskName, (request, complete) ->
        complete("The request is not allowed!").notAllowed().next()

      logic.process task, null, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 405
        result.response.body = JSON.parse result.response.body
        result.response.body.error.should.eql 'NotAllowed'
        result.response.body.description.should.eql "The request is not allowed"
        result.response.body.debug.should.eql 'The request is not allowed!'
        done()

    it 'should return a 501 not implemented', (done) ->
      taskName = quickRandom()
      task = sampleTask taskName

      logic.register taskName, (request, complete) ->
        complete("This isn't implemented").notImplemented().next()

      logic.process task, null, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 501
        result.response.body = JSON.parse result.response.body
        result.response.body.error.should.eql 'NotImplemented'
        result.response.body.description.should.eql "The request invoked a method that is not implemented"
        result.response.body.debug.should.eql 'This isn\'t implemented'
        done()

    it 'should return a 550 runtime error', (done) ->
      taskName = quickRandom()
      task = sampleTask taskName

      logic.register taskName, (request, complete) ->
        complete("There was some error in the app!").runtimeError().next()

      logic.process task, null, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 550
        result.response.body = JSON.parse result.response.body
        result.response.body.error.should.eql 'DataLinkRuntimeError'
        result.response.body.description.should.eql "The Datalink had a runtime error.  See debug message for details"
        result.response.body.debug.should.eql 'There was some error in the app!'
        done()

    it 'should process a next (continuation) handler', (done) ->
      taskName = quickRandom()
      task = sampleTask taskName

      logic.register taskName, (request, complete) ->
        complete({"foo":"bar"}).ok().next()

      logic.process task, null, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 200
        result.response.body.should.eql JSON.stringify {"foo":"bar"}
        result.response.continue is true
        done()

    it 'should process a done (completion) handler', (done) ->
      taskName = quickRandom()
      task = sampleTask taskName

      logic.register taskName, (request, complete) ->
        complete({"foo":"bar"}).ok().done()

      logic.process task, null, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 200
        result.response.body.should.eql JSON.stringify {"foo":"bar"}
        result.response.continue is false
        done()
