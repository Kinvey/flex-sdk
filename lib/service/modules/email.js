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

function emailModule(appMetadata, taskMetadata, requestMetadata) {
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

    return new Promise((resolve, reject) => {
      req.post({
        url: `${appMetadata.baasUrl}/rpc/${appMetadata._id}/send-email`,
        auth: {
          user: appMetadata._id,
          pass: appMetadata.mastersecret
        },
        headers: {
          'x-kinvey-api-version': '3'
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
        },
        proxy: false
      }, (err, res, body) => {
        if (err) return callback ? callback(err) : reject(err);
        else if (res && res.statusCode >= 400) return callback ? callback(body) : reject(body);
        else if (body && body.hasOwnProperty('mailServerResponse')) {
          return callback ? callback(null, body.mailServerResponse) : resolve(body.mailServerResponse);
        }

        const resBody = {
          success: true
        };
        return callback ? callback(null, resBody) : resolve(resBody);
      });
    });
  }

  return {
    send
  };
}

module.exports = emailModule;
