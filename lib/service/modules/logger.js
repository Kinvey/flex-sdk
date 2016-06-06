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

const isNil = require('lodash.isnil');
const request = require('request');
const req = request.defaults({});

function kinveyLoggerModule(proxyURL, taskMetadata, proxyTaskEmitter) {
  function _log(level, message, callback) {
    const callbackExists = !isNil(callback);
    if (!callbackExists) proxyTaskEmitter.emit('proxyTaskStarted');
    if (message instanceof Error) message = message.toString();

    const requestCallback = callbackExists ? 'true' : 'false';

    req.post({
      url: `${proxyURL}/log`,
      headers: {
        'x-kinvey-container-id': taskMetadata.containerId,
        'x-kinvey-task-id': taskMetadata.taskId,
        'x-kinvey-wait-for-confirmation': requestCallback
      },
      json: {
        level,
        message: typeof !isNil(message) ? message : null
      }
    }, (err, res, body) => {
      if (!isNil(callback)) {
        if (err) return callback(err);
        if (res.statusCode >= 400) return callback(body);
        callback(null, { success: true });
      } else {
        proxyTaskEmitter.emit('proxyTaskCompleted');
      }
    });
  }

  // Info logger
  function _info(message, callback) {
    return _log('info', message, callback);
  }

  // Warning logger
  function _warn(message, callback) {
    return _log('warning', message, callback);
  }

  // Error logger
  function _error(message, callback) {
    return _log('error', message, callback);
  }

  // Fatal logger
  function _fatal(message, callback) {
    return _log('fatal', message, callback);
  }

  // Return logger API
  return {
    info: _info,
    warn: _warn,
    error: _error,
    fatal: _fatal
  };
}

module.exports = kinveyLoggerModule;
