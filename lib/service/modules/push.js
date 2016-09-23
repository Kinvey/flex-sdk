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

const isNil = require('lodash.isnil');
const request = require('request');
const req = request.defaults({});

const MISSING_USER_PARAM_ERROR = "You must specify the 'users' parameter to send a push notification";
const MISSING_MESSAGE_PARAM_ERROR = "You must specify the 'message' parameter to send a push notification";

function kinveyPushModule(proxyURL, taskMetadata, proxyTaskEmitter) {
  function sendMessage(userEntities, message, callback) {
    let proxyShouldWaitForConfirmation = 'true';

    if (isNil(callback)) {
      proxyTaskEmitter.emit('proxyTaskStarted');
      proxyShouldWaitForConfirmation = 'false';
    }
    if (isNil(userEntities)) throw new TypeError(MISSING_USER_PARAM_ERROR);
    if (isNil(message)) throw new TypeError(MISSING_MESSAGE_PARAM_ERROR);
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
      if (!isNil(callback)) {
        if (err) return callback(err);
        if (res.statusCode >= 400) return callback(body);
        return callback(null, body);
      }
      return proxyTaskEmitter.emit('proxyTaskCompleted');
    });
  }

  function broadcastMessage(message, callback) {
    let proxyShouldWaitForConfirmation = 'true';

    if (isNil(callback)) {
      proxyTaskEmitter.emit('proxyTaskStarted');
      proxyShouldWaitForConfirmation = 'false';
    }

    if (isNil(message)) {
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
      if (!isNil(callback)) {
        if (err) return callback(err);
        if (res.statusCode >= 400) return callback(body);
        return callback(null, body);
      }
      return proxyTaskEmitter.emit('proxyTaskCompleted');
    });
  }

  function sendPayload(userEntities, iOSAps, iOSExtras, androidPayload, callback) {
    sendMessage(userEntities, { iOSAps, iOSExtras, androidPayload }, callback);
  }

  function broadcastPayload(iOSAps, iOSExtras, androidPayload, callback) {
    broadcastMessage({ iOSAps, iOSExtras, androidPayload }, callback);
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
