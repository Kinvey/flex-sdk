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

kinveyCompletionHandler = require('./kinveyCompletionHandler')
kinveyErrors = require 'kinvey-datalink-errors'
domain = require 'domain'

module.exports = do ->
  registeredFunctions = {}

  register = (taskName, functionToExecute) ->
    registeredFunctions[taskName] = functionToExecute

  resolve = (taskName) ->
    unless registeredFunctions[taskName]
      return new Error 'No such task registered'

    return registeredFunctions[taskName]

  process = (task, modules, callback) ->
    unless task.taskName?
      return callback new Error "No taskname to execute"

    businessLogicCompletionHandler = kinveyCompletionHandler task, callback

    try
      task.request.body = JSON.parse task.request.body
    catch e
      if task.request.body? and typeof task.request.body isnt 'object'
        result = task.response
        result.body = kinveyErrors.generateKinveyError 'BadRequest', 'Requst body is not JSON'
        result.statusCode = result.body.statusCode
        delete result.body.statusCode
        return callback task

    logicHandler = resolve task.taskName

    if logicHandler instanceof Error
      result = task.response
      result.body = kinveyErrors.generateKinveyError 'BadRequest', logicHandler
      result.statusCode = result.body.statusCode
      delete result.body.statusCode
      return callback task

    taskDomain = domain.create()

    taskDomain.on 'error', (err) ->
      err.metadata = {}
      err.metadata.unhandled = true
      err.taskId = task.taskId
      err.requestId = task.requestId
      return callback err

    domainBoundOperationHandler = taskDomain.bind logicHandler

    domainBoundOperationHandler task.request, (err, result) ->
      taskDomain.dispose()
      businessLogicCompletionHandler err, result

  clearAll = () ->
    registeredFunctions = {}

  obj =
    clearAll: clearAll
    register: register
    resolve: resolve
    process: process

  return obj
