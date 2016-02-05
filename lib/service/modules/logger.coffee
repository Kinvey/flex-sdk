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
