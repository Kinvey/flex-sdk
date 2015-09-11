# Copyright (c) 2015 Kinvey Inc.
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

util = require 'util'
receiver = require 'kinvey-code-task-runner'
moduleGenerator = require './service/modules'

module.exports = do ->

  class Service
    constructor: (callback) ->

      @dataLink = require './service/dataLink'
      @businessLogic = require './service/businessLogic'
      @moduleGenerator = require './service/modules'

      taskReceivedCallback = (task, completionCallback) =>
        console.log "Task received"

        if task.taskType is 'dataLink'
          console.log "Datalink received"
          console.log @dataLink
          console.log @moduleGenerator
          @dataLink.process task, @moduleGenerator.generate(task), completionCallback
        else if task.taskType is 'businessLogic'
          console.log "businessLogic received"
          @businessLogic.process task, @moduleGenerator.generate(task), completionCallback

      receiver.start taskReceivedCallback, (err, result) =>
        if err?
          return callback new Error "Could not start task receiver: #{err}"
        console.log "Started runner"
        callback null, this


  generateService = (callback) ->
    new Service (err, service) ->
      callback err, service

  obj =
    service: generateService

  return obj