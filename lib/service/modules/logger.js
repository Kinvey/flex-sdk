/**
 * Copyright (c) 2016 Kinvey Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

'use strict';

const request = require('request');
const req = request.defaults({});

module.exports = (proxyURL, taskMetadata, proxyTaskEmitter) => {
  const _log = (level, message, callback) => {
    if (typeof callback === 'undefined' || callback === null) proxyTaskEmitter.emit('proxyTaskStarted');
    if (message instanceof Error) message = message.toString();

    const requestCallback = (typeof callback !== 'undefined' && callback !== null).toString() || 'false';

    req.post({
      url: `${proxyURL}/log`,
      headers: {
        'x-kinvey-container-id': taskMetadata.containerId,
        'x-kinvey-task-id': taskMetadata.taskId,
        'x-kinvey-wait-for-confirmation': requestCallback
      },
      json: {
        level,
        message: typeof message !== 'undefined' && message !== null ? message : null
      }
    }, (err, res, body) => {
      if (typeof callback !== 'undefined' && callback !== null) {
        if (err) return callback(err);
        if (res.statusCode >= 400) return callback(body);
        callback(null, { success: true });
      } else {
        proxyTaskEmitter.emit('proxyTaskCompleted');
      }
    });
  };

  const _info = (message, callback) => _log('info', message, callback);
  const _warn = (message, callback) => _log('warning', message, callback);
  const _error = (message, callback) => _log('error', message, callback);
  const _fatal = (message, callback) => _log('fatal', message, callback);

  return {
    info: _info,
    warn: _warn,
    error: _error,
    fatal: _fatal
  };
};
