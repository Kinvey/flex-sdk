# Copyright (c) 2015, Kinvey, Inc. All rights reserved.
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

data = require '../../lib/service/dataLink'
should = require 'should'

collectionName = 'myCollection'
collectionName2 = 'myCollection2'

sampleTask = () ->
  sampleTaskInfo =
# this is actually the environment ID; leftover (for now) for backward compatibility
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
  collectionName: collectionName
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
    collectionName: 'quick'

  response:
    status: 0
    headers: {}
    body: {}

describe 'dataLink', () ->
  describe 'data registration', () ->
    it 'can register an insert', (done) ->
      data.collection(collectionName).onInsert () ->
        done()

      fn = data.collection(collectionName).resolve 'onInsert'
      fn()

    it 'can register a deleteAll', (done) ->
      data.collection(collectionName).onDeleteAll () ->
        done()

      fn = data.collection(collectionName).resolve 'onDeleteAll'
      fn()

    it 'can register a deleteById', (done) ->
      data.collection(collectionName).onDeleteById () ->
        done()

      fn = data.collection(collectionName).resolve 'onDeleteById'
      fn()

    it 'can register a deleteByQuery', (done) ->
      data.collection(collectionName).onDeleteByQuery () ->
        done()

      fn = data.collection(collectionName).resolve 'onDeleteByQuery'
      fn()

    it 'can register an update', (done) ->
      data.collection(collectionName).onUpdate () ->
        done()

      fn = data.collection(collectionName).resolve 'onUpdate'
      fn()

    it 'can register a getAll', (done) ->
      data.collection(collectionName).onGetAll () ->
        done()

      fn = data.collection(collectionName).resolve 'onGetAll'
      fn()

    it 'can register a getById', (done) ->
      data.collection(collectionName).onGetById () ->
        done()

      fn = data.collection(collectionName).resolve 'onGetById'
      fn()

    it 'can register a getByQuery', (done) ->
      data.collection(collectionName).onGetByQuery () ->
        done()

      fn = data.collection(collectionName).resolve 'onGetByQuery'
      fn()

    it 'can register a getCount', (done) ->
      data.collection(collectionName).onGetCount () ->
        done()

      fn = data.collection(collectionName).resolve 'onGetCount'
      fn()

    it 'can register a getCount by query', (done) ->
      data.collection(collectionName).onGetCount () ->
        done()

      fn = data.collection(collectionName).resolve 'onGetCount'
      fn()

  describe 'processing', () ->

    afterEach (done) ->
      data.clearAll()
      done()

    it 'can process an insert', (done) ->
      task = sampleTask()

      data.collection(collectionName).onInsert (request, competion) ->
        request.entityId = task.request.entityId
        done()

      data.process task, {}, () ->

    it 'can process an update', (done) ->
      task = sampleTask()
      task.method = 'PUT'

      data.collection(collectionName).onUpdate (request, competion) ->
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

      data.collection(collectionName).onGetAll (request, competion) ->
        task = sampleTask()
        request.entityId = task.request.entityId
        done()

      data.process task, {}, () ->

    it 'can process a get by Id', (done) ->
      task = sampleTask()
      task.method = 'GET'
      delete task.query
      delete task.request.query

      data.collection(collectionName).onGetById (request, competion) ->
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

      data.collection(collectionName).onGetByQuery (request, competion) ->
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

      data.collection(collectionName).onDeleteAll (request, competion) ->
        task = sampleTask()
        request.entityId = task.request.entityId
        done()

      data.process task, {}, () ->

    it 'can process a delete by Id', (done) ->
      task = sampleTask()
      task.method = 'DELETE'
      delete task.query
      delete task.request.query

      data.collection(collectionName).onDeleteById (request, competion) ->
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

      data.collection(collectionName).onDeleteByQuery (request, competion) ->
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

      data.collection(collectionName).onGetCount (request, competion) ->
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

      data.collection(collectionName).onGetCountWithQuery (request, competion) ->
        task = sampleTask()
        request.entityId = task.request.entityId
        done()

      data.process task, {}, () ->

    it 'will return an error if the handler isn\'t registered', (done) ->
      task = sampleTask()
      task.method = 'GET'

      data.collection(collectionName).onGetAll (request, competion) ->

      data.process task, {}, (err, result) ->
        err.toString().should.eql 'Error: This data operation is not registered'
        done()

    it 'will return an error if the request body isn\'t JSON', (done) ->
      task = sampleTask()
      task.method = 'POST'
      task.request.body = "this is some string"

      data.collection(collectionName).onInsert (request, competion) ->

      data.process task, {}, (err, result) ->
        err.toString().should.eql 'Error: Requst body is not JSON'
        done()

    it 'will return an error if the method isn\'t set', (done) ->
      task = sampleTask()
      delete task.method

      data.collection(collectionName).onInsert (request, competion) ->

      data.process task, {}, (err, result) ->
        err.toString().should.eql 'Error: Cannot determine data operation'
        done()

    it.only 'will return an error if an exception is thrown', (done) ->
      task = sampleTask()

      data.collection(collectionName).onInsert (request, competion) ->
        foo.bar()

      data.process task, {}, (err, result) ->
        err.toString().should.eql 'Error: Cannot determine data operation'
        done()





