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