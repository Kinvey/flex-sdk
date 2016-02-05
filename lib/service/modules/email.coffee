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
  return {
  send: (from, to, subject, textBody, replyTo = null, htmlBody = null, cc = null, bcc = null, callback ) ->
    unless to? and from? and subject? and textBody?
      throw new Error "To send an email, you must specify the 'to', 'from', 'subject' and 'body' parameters"

    # support passing a callback instead of htmlBody, or instead of both replyTo and htmlBody
    if bcc? and not callback? and typeof bcc is 'function'
      callback = bcc
      bcc = null

    if cc? and not callback? and typeof cc is 'function'
      callback = cc
      cc = null

    if htmlBody? and not callback? and typeof htmlBody is 'function'
      callback = htmlBody
      htmlBody = null

    if replyTo? and not callback? and typeof replyTo is 'function'
      callback = replyTo
      replyTo = null

    unless callback?
      proxyTaskEmitter.emit 'proxyTaskStarted'

    body = {}

    proxyShouldWaitForConfirmation = (callback?).toString() or 'false'

    req.post
      url: proxyURL + "/email/send"
      headers:
        'x-kinvey-container-id': taskMetadata.containerId
        'x-kinvey-task-id': taskMetadata.taskId
        'x-kinvey-wait-for-confirmation': proxyShouldWaitForConfirmation
      json:
        from: from
        to: to
        cc: cc
        bcc: bcc
        subject: subject
        body: textBody
        html: htmlBody
        replyTo: replyTo
      (err, res, body) ->
        if callback?
          if err then return callback err

          if res.statusCode >= 400
            return callback body

          if body?.mailServerResponse?
            return callback null, body.mailServerResponse

          callback null, {success: true}
        else
          proxyTaskEmitter.emit 'proxyTaskCompleted'
  }