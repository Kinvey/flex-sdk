/**
 * Copyright (c) 2018 Kinvey Inc.
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

function _log(level, message) {
  if (message == null) return null;
  const messageString = message instanceof Error ? message.toString() : message;

  // Log message must end with '\n' in order to be captured by the docker log driver
  let logMessage = {
    message: messageString,
    level
  };

  logMessage = `${JSON.stringify(logMessage)}\n`;

  process.stdout.write(logMessage);
  return logMessage;
}

// Info logger
function _info(message) {
  return _log('info', message);
}

// Warning logger
function _warn(message) {
  return _log('warning', message);
}

// Error logger
function _error(message) {
  return _log('error', message);
}

// Fatal logger
function _fatal(message) {
  return _log('fatal', message);
}

exports.info = _info;
exports.warn = _warn;
exports.error = _error;
exports.fatal = _fatal;
