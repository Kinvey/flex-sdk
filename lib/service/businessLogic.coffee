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

module.exports = do ->
  registeredFunctions = {}

  register = (taskName, functionToExecute) ->
    registeredFunctions[taskName] = functionToExecute

  resolve = (taskName) ->
    unless registeredFunctions[taskName]
      return new Error 'No such task registered'

    return registeredFunctions[taskName]

  process = (task, callback) ->
    unless task.taskName?
      return callback new Error "No taskname to execute"

    logicHandler = resolve task.taskName

    if logicHandler instanceof Error
      return callback logicHandler

    logicHandler task.request, task.response, (err, result) ->
      if err?
        return callback err

      callback null, result

  obj =
    register: register
    resolve: resolve
    process: process

  return obj
