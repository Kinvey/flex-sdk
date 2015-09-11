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
