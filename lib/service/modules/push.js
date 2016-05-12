/**
 * Copyright (c) 2016 Kinvey Inc.
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

'use strict';

const request = require('request');
const req = request.defaults({});

const MISSING_USER_PARAM_ERROR = 'You must specify the \'users\' parameter to send a push notification';
const MISSING_MESSAGE_PARAM_ERROR = 'You must specify the \'message\' parameter to send a push notification';

module.exports = (proxyURL, taskMetadata, proxyTaskEmitter) => {
  const _sendMessage = (userEntities, message, callback) => {
    let proxyShouldWaitForConfirmation = 'true';

    if (typeof callback === 'undefined' || callback === null) {
      proxyTaskEmitter.emit('proxyTaskStarted');
      proxyShouldWaitForConfirmation = 'false';
    }
    if (typeof userEntities === 'undefined' || userEntities === null) throw new TypeError(MISSING_USER_PARAM_ERROR);
    if (typeof message === 'undefined' || message === null) throw new TypeError(MISSING_MESSAGE_PARAM_ERROR);
    if (userEntities.constructor !== Array && typeof userEntities === 'object') userEntities = [userEntities];

    req.post({
      url: `${proxyURL}/push/sendMessage`,
      headers: {
        'x-kinvey-container-id': taskMetadata.containerId,
        'x-kinvey-task-id': taskMetadata.taskId,
        'x-kinvey-wait-for-confirmation': proxyShouldWaitForConfirmation
      },
      json: {
        destination: userEntities,
        messageContent: message
      }
    }, (err, res, body) => {
      if (typeof callback !== 'undefined' && callback !== null) {
        if (err) return callback(err);
        if (res.statusCode >= 400) return callback(body);
        callback(null, body);
      } else {
        proxyTaskEmitter.emit('proxyTaskCompleted');
      }
    });
  };

  const _broadcastMessage = (message, callback) => {
    let proxyShouldWaitForConfirmation = 'true';

    if (typeof callback === 'undefined' || callback === null) {
      proxyTaskEmitter.emit('proxyTaskStarted');
      proxyShouldWaitForConfirmation = 'false';
    }

    if (typeof message === 'undefined' || message === null) {
      throw new TypeError(MISSING_MESSAGE_PARAM_ERROR);
    }

    req.post({
      url: `${proxyURL}/push/sendBroadcast`,
      headers: {
        'x-kinvey-container-id': taskMetadata.containerId,
        'x-kinvey-task-id': taskMetadata.taskId,
        'x-kinvey-wait-for-confirmation': proxyShouldWaitForConfirmation
      },
      json: {
        messageContent: message
      }
    }, (err, res, body) => {
      if (typeof callback !== 'undefined' && callback !== null) {
        if (err) return callback(err);
        if (res.statusCode >= 400) return callback(body);
        callback(null, body);
      } else {
        proxyTaskEmitter.emit('proxyTaskCompleted');
      }
    });
  };

  return {
    send: _sendMessage,
    sendMessage: _sendMessage,

    broadcast: _broadcastMessage,
    broadcastMessage: _broadcastMessage,

    sendPayload: (userEntities, iOSAps, iOSExtras, androidPayload, callback) => {
      _sendMessage(userEntities, { iOSAps, iOSExtras, androidPayload }, callback);
    },

    broadcastPayload: (iOSAps, iOSExtras, androidPayload, callback) => {
      _broadcastMessage({ iOSAps, iOSExtras, androidPayload }, callback);
    }
  };
};
