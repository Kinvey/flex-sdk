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

should = require 'should'

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
  serviceObjectName: 'quick'
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
    serviceObjectName: 'quick'

  response:
    status: 0
    headers: {}
    body: {}

describe 'modules creation', () ->
  moduleGenerator = null

  before (done) ->
    moduleGenerator = require '../../lib/service/moduleGenerator'
    done()

  it 'can generate modules', (done) ->
    modules = moduleGenerator.generate sampleTaskInfo
    should.exist modules.backendContext
    should.exist modules.email
    should.exist modules.entity
    should.exist modules.kinveyDate
    should.exist modules.logger
    should.exist modules.push
    should.exist modules.requestContext
    should.exist modules.tempObjectStore
    should.exist modules.validation
    done()
