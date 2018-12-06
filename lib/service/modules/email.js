/**
 * Copyright (c) 2018 Kinvey Inc.
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

function emailModule(appMetadata) {
  function send(from, to, subject, textBody, replyTo = null, htmlBody = null, cc = null, bcc = null, cb) {
    let callback = cb;
    // Abort if required email field params are not specified
    if (!to || !from || !subject || !textBody) {
      // find the callback function, if it exists
      if (!cb || (cb && typeof callback !== 'function')) {
        if (typeof bcc === 'function') callback = bcc;
        else if (typeof cc === 'function') callback = cc;
        else if (typeof htmlBody === 'function') callback = htmlBody;
        else if (typeof replyTo === 'function') callback = replyTo;
        else if (typeof textBody === 'function') callback = textBody;
        else if (typeof subject === 'function') callback = subject;
        else if (typeof to === 'function') callback = to;
        else if (typeof from === 'function') callback = from;
        else callback = undefined;
      }

      const err = new Error('EmailError');
      err.description = 'Invalid Arguments';
      err.debug = "To send an email, you must specify the 'to', 'from', 'subject' and 'body' parameters";
      return callback ? setImmediate(() => callback(err)) : Promise.reject(err);
    }

    // Initialize callback
    if (bcc && !cb && typeof bcc === 'function') {
      callback = bcc;
      bcc = null; // eslint-disable-line no-param-reassign
    }
    if (cc && !callback && typeof cc === 'function') {
      callback = cc;
      cc = null; // eslint-disable-line no-param-reassign
    }
    if (htmlBody && !callback && typeof htmlBody === 'function') {
      callback = htmlBody;
      htmlBody = null; // eslint-disable-line no-param-reassign
    }
    if (replyTo && !callback && typeof replyTo === 'function') {
      callback = replyTo;
      replyTo = null; // eslint-disable-line no-param-reassign
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
        else if (body && Object.prototype.hasOwnProperty.call(body, 'mailServerResponse')) {
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
