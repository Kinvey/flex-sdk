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

data = require '../../lib/service/dataLink'
should = require 'should'

serviceObjectName = 'myServiceObject'

sampleTask = () ->
  sampleTaskInfo =
# this is actually the environment ID; leftover (for now) for backward compatibility
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
    taskType: 'dataLink'
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
      serviceObjectName: serviceObjectName

    response:
      status: 0
      headers: {}
      body: {}

describe 'dataLink', () ->
  describe 'data registration', () ->
    it 'can register an insert', (done) ->
      data.serviceObject(serviceObjectName).onInsert () ->
        done()

      fn = data.serviceObject(serviceObjectName).resolve 'onInsert'
      fn()

    it 'can register a deleteAll', (done) ->
      data.serviceObject(serviceObjectName).onDeleteAll () ->
        done()

      fn = data.serviceObject(serviceObjectName).resolve 'onDeleteAll'
      fn()

    it 'can register a deleteById', (done) ->
      data.serviceObject(serviceObjectName).onDeleteById () ->
        done()

      fn = data.serviceObject(serviceObjectName).resolve 'onDeleteById'
      fn()

    it 'can register a deleteByQuery', (done) ->
      data.serviceObject(serviceObjectName).onDeleteByQuery () ->
        done()

      fn = data.serviceObject(serviceObjectName).resolve 'onDeleteByQuery'
      fn()

    it 'can register an update', (done) ->
      data.serviceObject(serviceObjectName).onUpdate () ->
        done()

      fn = data.serviceObject(serviceObjectName).resolve 'onUpdate'
      fn()

    it 'can register a getAll', (done) ->
      data.serviceObject(serviceObjectName).onGetAll () ->
        done()

      fn = data.serviceObject(serviceObjectName).resolve 'onGetAll'
      fn()

    it 'can register a getById', (done) ->
      data.serviceObject(serviceObjectName).onGetById () ->
        done()

      fn = data.serviceObject(serviceObjectName).resolve 'onGetById'
      fn()

    it 'can register a getByQuery', (done) ->
      data.serviceObject(serviceObjectName).onGetByQuery () ->
        done()

      fn = data.serviceObject(serviceObjectName).resolve 'onGetByQuery'
      fn()

    it 'can register a getCount', (done) ->
      data.serviceObject(serviceObjectName).onGetCount () ->
        done()

      fn = data.serviceObject(serviceObjectName).resolve 'onGetCount'
      fn()

    it 'can register a getCount by query', (done) ->
      data.serviceObject(serviceObjectName).onGetCount () ->
        done()

      fn = data.serviceObject(serviceObjectName).resolve 'onGetCount'
      fn()

  describe 'processing', () ->

    afterEach (done) ->
      data.clearAll()
      done()

    it 'can process an insert', (done) ->
      task = sampleTask()

      data.serviceObject(serviceObjectName).onInsert (request, complete) ->
        request.entityId = task.request.entityId
        done()

      data.process task, {}, () ->

    it 'can process an update', (done) ->
      task = sampleTask()
      task.method = 'PUT'

      data.serviceObject(serviceObjectName).onUpdate (request, complete) ->
        task = sampleTask()
        request.entityId = task.request.entityId
        done()

      data.process task, {}, () ->

    it 'can process a get all', (done) ->
      task = sampleTask()
      task.method = 'GET'
      delete task.entityId
      delete task.request.entityId
      delete task.query
      delete task.request.query

      data.serviceObject(serviceObjectName).onGetAll (request, complete) ->
        task = sampleTask()
        request.entityId = task.request.entityId
        done()

      data.process task, {}, () ->

    it 'can process a get by Id', (done) ->
      task = sampleTask()
      task.method = 'GET'
      delete task.query
      delete task.request.query

      data.serviceObject(serviceObjectName).onGetById (request, complete) ->
        task = sampleTask()
        request.entityId = task.request.entityId
        done()

      data.process task, {}, () ->

    it 'can process a get by query', (done) ->
      task = sampleTask()
      task.method = 'GET'
      delete task.entityId
      delete task.request.entityId
      task.request.query = {}
      task.query = {}

      data.serviceObject(serviceObjectName).onGetByQuery (request, complete) ->
        task = sampleTask()
        request.entityId = task.request.entityId
        done()

      data.process task, {}, () ->

    it 'can process a delete all', (done) ->
      task = sampleTask()
      task.method = 'DELETE'
      delete task.entityId
      delete task.request.entityId
      delete task.query
      delete task.request.query

      data.serviceObject(serviceObjectName).onDeleteAll (request, complete) ->
        task = sampleTask()
        request.entityId = task.request.entityId
        done()

      data.process task, {}, () ->

    it 'can process a delete by Id', (done) ->
      task = sampleTask()
      task.method = 'DELETE'
      delete task.query
      delete task.request.query

      data.serviceObject(serviceObjectName).onDeleteById (request, complete) ->
        task = sampleTask()
        request.entityId = task.request.entityId
        done()

      data.process task, {}, () ->

    it 'can process a delete by query', (done) ->
      task = sampleTask()
      task.method = 'DELETE'
      delete task.entityId
      delete task.request.entityId
      task.request.query = {}
      task.query = {}

      data.serviceObject(serviceObjectName).onDeleteByQuery (request, complete) ->
        task = sampleTask()
        request.entityId = task.request.entityId
        done()

      data.process task, {}, () ->

    it 'can process a count all', (done) ->
      task = sampleTask()
      task.method = 'GET'
      task.endpoint = '_count'
      delete task.entityId
      delete task.request.entityId
      delete task.query
      delete task.request.query

      data.serviceObject(serviceObjectName).onGetCount (request, complete) ->
        task = sampleTask()
        request.entityId = task.request.entityId
        done()

      data.process task, {}, () ->

    it 'can process a count by query', (done) ->
      task = sampleTask()
      task.method = 'GET'
      task.endpoint = '_count'
      delete task.entityId
      delete task.request.entityId
      task.request.query = {}
      task.query = {}

      data.serviceObject(serviceObjectName).onGetCountWithQuery (request, complete) ->
        task = sampleTask()
        request.entityId = task.request.entityId
        done()

      data.process task, {}, () ->

    it 'will return an error if the handler isn\'t registered', (done) ->
      task = sampleTask()
      task.method = 'GET'

      data.serviceObject(serviceObjectName).onGetAll (request, complete) ->

      data.process task, {}, (err, result) ->
        err.taskId.should.eql task.taskId
        err.response.body.debug.should.eql 'This data operation is not registered'
        done()

    it 'will return an error if the request body isn\'t JSON', (done) ->
      task = sampleTask()
      task.method = 'POST'
      task.request.body = "this is some string"

      data.serviceObject(serviceObjectName).onInsert (request, complete) ->

      data.process task, {}, (err, result) ->
        err.response.body.debug.should.eql 'Request body is not JSON'
        done()

    it 'will return an error if the method isn\'t set', (done) ->
      task = sampleTask()
      delete task.method

      data.serviceObject(serviceObjectName).onInsert (request, complete) ->

      data.process task, {}, (err, result) ->
        err.response.body.debug.should.eql 'Cannot determine data operation'
        done()
        
  describe 'completion handlers', () ->

    afterEach (done) ->
      data.clearAll()
      done()

    it 'should return a successful response', (done) ->
      task = sampleTask()

      data.serviceObject(serviceObjectName).onInsert (request, complete) ->
        complete().ok().next()

      data.process task, {}, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 200
        result.response.body.should.eql '{}'
        done()

    it 'should include a body', (done) ->
      task = sampleTask()

      data.serviceObject(serviceObjectName).onInsert (request, complete) ->
        complete({"foo":"bar"}).ok().next()

      data.process task, {}, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 200
        result.response.body.should.eql JSON.stringify {"foo":"bar"}
        done()

    it 'should return a 201 created', (done) ->
      task = sampleTask()

      data.serviceObject(serviceObjectName).onInsert (request, complete) ->
        complete({"foo":"bar"}).created().next()

      data.process task, {}, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 201
        result.response.body.should.eql JSON.stringify {"foo":"bar"}
        done()

    it 'should return a 202 accepted', (done) ->
      task = sampleTask()

      data.serviceObject(serviceObjectName).onInsert (request, complete) ->
        complete({"foo":"bar"}).accepted().next()

      data.process task, {}, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 202
        result.response.body.should.eql JSON.stringify {"foo":"bar"}
        done()

    it 'should return a 400 bad request', (done) ->
      task = sampleTask()

      data.serviceObject(serviceObjectName).onInsert (request, complete) ->
        complete("This is a bad request").badRequest().next()

      data.process task, {}, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 400
        result.response.body = JSON.parse result.response.body
        result.response.body.error.should.eql 'BadRequest'
        result.response.body.description.should.eql "Unable to understand request"
        result.response.body.debug.should.eql 'This is a bad request'
        done()

    it 'should return a 401 unauthorized', (done) ->
      task = sampleTask()

      data.serviceObject(serviceObjectName).onInsert (request, complete) ->
        complete("You are not authorized!").unauthorized().next()

      data.process task, {}, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 401
        result.response.body = JSON.parse result.response.body
        result.response.body.error.should.eql 'InvalidCredentials'
        result.response.body.description.should.eql "Invalid credentials. Please retry your request with correct credentials"
        result.response.body.debug.should.eql 'You are not authorized!'
        done()

    it 'should return a 403 forbidden', (done) ->
      task = sampleTask()

      data.serviceObject(serviceObjectName).onInsert (request, complete) ->
        complete("Forbidden!").forbidden().next()

      data.process task, {}, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 403
        result.response.body = JSON.parse result.response.body
        result.response.body.error.should.eql 'Forbidden'
        result.response.body.description.should.eql "The request is forbidden"
        result.response.body.debug.should.eql 'Forbidden!'
        done()

    it 'should return a 404 not found', (done) ->
      task = sampleTask()

      data.serviceObject(serviceObjectName).onInsert (request, complete) ->
        complete("The request is not found!").notFound().next()

      data.process task, {}, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 404
        result.response.body = JSON.parse result.response.body
        result.response.body.error.should.eql 'NotFound'
        result.response.body.description.should.eql "The requested entity or entities were not found in the serviceObject"
        result.response.body.debug.should.eql 'The request is not found!'
        done()

    it 'should return a 405 not allowed', (done) ->
      task = sampleTask()

      data.serviceObject(serviceObjectName).onInsert (request, complete) ->
        complete("The request is not allowed!").notAllowed().next()

      data.process task, {}, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 405
        result.response.body = JSON.parse result.response.body
        result.response.body.error.should.eql 'NotAllowed'
        result.response.body.description.should.eql "The request is not allowed"
        result.response.body.debug.should.eql 'The request is not allowed!'
        done()

    it 'should return a 501 not implemented', (done) ->
      task = sampleTask()

      data.serviceObject(serviceObjectName).onInsert (request, complete) ->
        complete("This isn't implemented").notImplemented().next()

      data.process task, {}, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 501
        result.response.body = JSON.parse result.response.body
        result.response.body.error.should.eql 'NotImplemented'
        result.response.body.description.should.eql "The request invoked a method that is not implemented"
        result.response.body.debug.should.eql 'This isn\'t implemented'
        done()

    it 'should return a 550 runtime error', (done) ->
      task = sampleTask()

      data.serviceObject(serviceObjectName).onInsert (request, complete) ->
        complete("There was some error in the app!").runtimeError().next()

      data.process task, {}, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 550
        result.response.body = JSON.parse result.response.body
        result.response.body.error.should.eql 'DataLinkRuntimeError'
        result.response.body.description.should.eql "The Datalink had a runtime error.  See debug message for details"
        result.response.body.debug.should.eql 'There was some error in the app!'
        done()

    it 'should process a next (continuation) handler', (done) ->
      task = sampleTask()

      data.serviceObject(serviceObjectName).onInsert (request, complete) ->
        complete({"foo":"bar"}).ok().next()

      data.process task, {}, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 200
        result.response.body.should.eql JSON.stringify {"foo":"bar"}
        result.response.continue is true
        done()

    it 'should process a done (completion) handler', (done) ->
      task = sampleTask()

      data.serviceObject(serviceObjectName).onInsert (request, complete) ->
        complete({"foo":"bar"}).ok().done()

      data.process task, {}, (err, result) ->
        should.not.exist err
        result.response.statusCode.should.eql 200
        result.response.body.should.eql JSON.stringify {"foo":"bar"}
        result.response.continue is false
        done()










