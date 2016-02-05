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

should = require 'should'
proxyquire = require 'proxyquire'
mockTaskReceiver = require './mocks/mockTaskReceiver.coffee'

describe 'service creation', () ->
  sdk = null

  before (done) ->
    sdk = proxyquire '../../lib/sdk', {'code-task-receiver': mockTaskReceiver}
    done()

  it 'can create a new service', (done) ->
    sdk.service (err, service) ->
      should.not.exist err
      should.exist service.dataLink
      should.exist service.businessLogic
      should.exist service.moduleGenerator
      done()

