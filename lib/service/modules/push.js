/**
 * Copyright (c) 2018 Kinvey Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

const request = require('request');

const req = request.defaults({});

const MISSING_USER_PARAM_ERROR = "You must specify the 'users' parameter to send a push notification";
const MISSING_MESSAGE_PARAM_ERROR = "You must specify the 'message' parameter to send a push notification";

function kinveyPushModule(appMetadata) {
  const authHeader = {
    user: appMetadata._id,
    pass: appMetadata.mastersecret
  };

  function sendMessage(users, message, cb) {
    let callback = cb;
    let userEntities = users;

    if (userEntities == null) {
      if (!callback && typeof message === 'function') callback = message;
      const err = new TypeError(MISSING_USER_PARAM_ERROR);
      return callback ? setImmediate(() => callback(err)) : Promise.reject(err);
    }

    if (message == null) {
      if (!callback && typeof userEntities === 'function') callback = userEntities;
      const err = new TypeError(MISSING_MESSAGE_PARAM_ERROR);
      return callback ? setImmediate(() => callback(err)) : Promise.reject(err);
    }

    if (userEntities.constructor !== Array && typeof userEntities === 'object') userEntities = [userEntities];

    return new Promise((resolve, reject) => {
      req.post({
        url: `${appMetadata.baasUrl}/push/${appMetadata._id}/sendMessage`,
        auth: authHeader,
        headers: {
          'x-kinvey-api-version': '3'
        },
        json: {
          recipients: userEntities,
          messageContent: message
        },
        proxy: false
      }, (err, res, body) => {
        if (err) return callback ? callback(err) : reject(err);
        if (res && res.statusCode >= 400) return callback ? callback(body) : reject(body);
        return callback ? callback(null, body) : resolve(body);
      });
    });
  }

  function broadcastMessage(message, callback) {
    if (message == null) {
      const err = new TypeError(MISSING_MESSAGE_PARAM_ERROR);
      return callback ? setImmediate(() => callback(err)) : Promise.reject(err);
    }

    return new Promise((resolve, reject) => {
      req.post({
        url: `${appMetadata.baasUrl}/push/${appMetadata._id}/sendBroadcast`,
        auth: authHeader,
        headers: {
          'x-kinvey-api-version': '3'
        },
        json: {
          messageContent: message
        }
      }, (err, res, body) => {
        if (err) return callback ? callback(err) : reject(err);
        if (res && res.statusCode >= 400) return callback ? callback(body) : reject(body);
        return callback ? callback(null, body) : resolve(body);
      });
    });
  }

  function sendPayload(userEntities, iOSAps, iOSExtras, androidPayload, callback) {
    return sendMessage(userEntities, { iOSAps, iOSExtras, androidPayload }, callback);
  }

  function broadcastPayload(iOSAps, iOSExtras, androidPayload, callback) {
    return broadcastMessage({ iOSAps, iOSExtras, androidPayload }, callback);
  }

  return {
    send: sendMessage,
    sendMessage,
    broadcast: broadcastMessage,
    broadcastMessage,
    sendPayload,
    broadcastPayload
  };
}

module.exports = kinveyPushModule;
