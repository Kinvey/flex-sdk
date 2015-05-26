# Copyright (c) 2014, Kinvey, Inc. All rights reserved.
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

request = require 'request'
req = request.defaults {}

module.exports = (proxyURL, taskMetadata, proxyTaskEmitter) ->
  _log = (message, callback) ->
    unless callback?
      proxyTaskEmitter.emit 'proxyTaskStarted'

    if message instanceof Error
      message = message.toString()

    requestCallback = (callback?).toString() or 'false'

    req.post
      url: proxyURL + '/log'
      headers:
        'x-kinvey-container-id': taskMetadata.containerId
        'x-kinvey-task-id': taskMetadata.taskId
        'x-kinvey-wait-for-confirmation': requestCallback
      json:
        level: @level
        message: message ? null
      (err, res, body) ->
        if callback?
          if err then return callback err

          if res.statusCode >= 400
            return callback body

          callback null, {success: true}
        else
          proxyTaskEmitter.emit 'proxyTaskCompleted'

  return {
  info: _log.bind  { level: 'info' }
  warn: _log.bind  { level: 'warning' }
  error: _log.bind { level: 'error' }
  fatal: _log.bind { level: 'fatal' }
  }
