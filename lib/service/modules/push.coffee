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

MISSING_USER_PARAM_ERROR = "You must specify the 'users' parameter to send a push notification"
MISSING_MESSAGE_PARAM_ERROR = "You must specify the 'message' parameter to send a push notification"

module.exports = (proxyURL, taskMetadata, proxyTaskEmitter) ->
  _sendMessage = (userEntities, message, callback) ->
    unless callback?
      proxyTaskEmitter.emit 'proxyTaskStarted'

    unless userEntities?
      throw new TypeError MISSING_USER_PARAM_ERROR

    unless message?
      throw new TypeError MISSING_MESSAGE_PARAM_ERROR

    if userEntities.constructor isnt Array and typeof userEntities is 'object'
      userEntities = [userEntities]

    proxyShouldWaitForConfirmation = (callback?).toString() or 'false'

    req.post
      url: proxyURL + "/push/sendMessage"
      headers:
        'x-kinvey-container-id': taskMetadata.containerId
        'x-kinvey-task-id': taskMetadata.taskId
        'x-kinvey-wait-for-confirmation': proxyShouldWaitForConfirmation
      json:
        destination: userEntities
        messageContent: message
      (err, res, body) ->
        if callback?
          if err then return callback err
          if res.statusCode >= 400 then return callback body

          callback null, body
        else
          proxyTaskEmitter.emit 'proxyTaskCompleted'

  _broadcastMessage = (message, callback) ->
    unless callback?
      proxyTaskEmitter.emit 'proxyTaskStarted'

    unless message?
      throw new TypeError MISSING_MESSAGE_PARAM_ERROR

    proxyShouldWaitForConfirmation = (callback?).toString() or 'false'

    req.post
      url: proxyURL + "/push/sendBroadcast"
      headers:
        'x-kinvey-container-id': taskMetadata.containerId
        'x-kinvey-task-id': taskMetadata.taskId
        'x-kinvey-wait-for-confirmation': proxyShouldWaitForConfirmation
      json:
        messageContent: message
      (err, res, body) ->
        if callback?
          if err then return callback err
          if res.statusCode >= 400 then return callback body

          callback null, body
        else
          proxyTaskEmitter.emit 'proxyTaskCompleted'

  return {
  send: _sendMessage
  sendMessage: _sendMessage

  broadcast: _broadcastMessage
  broadcastMessage: _broadcastMessage

  sendPayload: (userEntities, iOSAps, iOSExtras, androidPayload, callback) ->
    _sendMessage userEntities, { iOSAps: iOSAps, iOSExtras: iOSExtras, androidPayload: androidPayload }, callback

  broadcastPayload: (iOSAps, iOSExtras, androidPayload, callback) ->
    _broadcastMessage { iOSAps: iOSAps, iOSExtras: iOSExtras, androidPayload: androidPayload }, callback
  }
