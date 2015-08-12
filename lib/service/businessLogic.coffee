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

    logicHandler task.request, task.response. (err, result) ->
      if err?
        return callback err

      callback null, result

  obj =
    register: register
    resolve: resolve
    process: process

  return obj
