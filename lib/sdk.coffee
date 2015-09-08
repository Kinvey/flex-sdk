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

util = require 'util'
receiver = require 'kinvey-code-task-runner'
moduleGenerator = require './service/modules'

module.exports = do ->

  class Service
    constructor: (callback) ->

      @dataLink = require './service/dataLink'
      @businessLogic = require './service/businessLogic'
      @moduleGenerator = require './service/modules'

      taskReceivedCallback = (task, completionCallback) ->
        console.log "Task received"

        if task.taskType is 'dataLink'
          console.log "Datalink received"
          @dataLink.process task, @moduleGenerator task, completionCallback
        else if task.taskType is 'businessLogic'
          console.log "businessLogic received"
          @businessLogic.process task, @moduleGenerator task, completionCallback

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