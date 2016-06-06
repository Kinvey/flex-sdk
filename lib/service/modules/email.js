/**
 * Copyright (c) 2016 Kinvey Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

const request = require('request');
const req = request.defaults({});

function emailModule(proxyURL, taskMetadata, proxyTaskEmitter) {
  function send(from, to, subject, textBody, replyTo, htmlBody, cc, bcc, callback) {
    // Abort if required email field params are not specified
    if (!to || !from || !subject || !textBody) {
      throw new Error("To send an email, you must specify the 'to', 'from', " +
        "'subject' and 'body' parameters");
    }

    // Default values
    if (!replyTo) replyTo = null;
    if (!htmlBody) htmlBody = null;
    if (!cc) cc = null;
    if (!bcc) bcc = null;

    // Initialize callback
    if (bcc && !callback && typeof bcc === 'function') {
      callback = bcc;
      bcc = null;
    }
    if (cc && !callback && typeof cc === 'function') {
      callback = cc;
      cc = null;
    }
    if (htmlBody && !callback && typeof htmlBody === 'function') {
      callback = htmlBody;
      htmlBody = null;
    }
    if (replyTo && !callback && typeof replyTo === 'function') {
      callback = replyTo;
      replyTo = null;
    }
    if (!callback) {
      proxyTaskEmitter.emit('proxyTaskStarted');
    }

    const proxyShouldWaitForConfirmation = callback ? 'true' : 'false';

    return req.post({
      url: `${proxyURL}/email/send`,
      headers: {
        'x-kinvey-container-id': taskMetadata.containerId,
        'x-kinvey-task-id': taskMetadata.taskId,
        'x-kinvey-wait-for-confirmation': proxyShouldWaitForConfirmation
      },
      json: {
        from,
        to,
        cc,
        bcc,
        subject,
        replyTo,
        body: textBody,
        html: htmlBody
      }
    }, (err, res, body) => {
      if (callback) {
        if (err) return callback(err);
        if (res.statusCode >= 400) return callback(body);
        if (body && body.hasOwnProperty('mailServerResponse')) {
          return callback(null, body.mailServerResponse);
        }
        return callback(null, {
          success: true
        });
      }

      return proxyTaskEmitter.emit('proxyTaskCompleted');
    });
  }

  return {
    send
  };
}

module.exports = emailModule;
