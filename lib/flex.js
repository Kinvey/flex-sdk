/**
 * Copyright (c) 2018 Kinvey Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

const http = require('http');
const https = require('https');
const data = require('./service/data');
const flex = require('../package.json');
const functions = require('./service/functions');
const auth = require('./service/auth');
const moduleGenerator = require('./service/moduleGenerator');
const logger = require('./service/logger');
const receiver = require('kinvey-code-task-runner');
const kinveyErrors = require('kinvey-datalink-errors');

let terminated = false;

http.globalAgent.maxSockets = 100;
https.globalAgent.maxSockets = 100;

class Flex {
  constructor(opt, cb) {
    const callback = !cb && typeof opt === 'function' ? opt : cb;
    const options = typeof opt === 'function' || opt == null ? {} : opt;
    let gracefulShutdownTimeout;

    options.type = process.env.SDK_RECEIVER === 'tcp' ? 'tcp' : 'http';

    if (options.type === 'tcp') {
      delete options.host;
      delete options.port;
    }

    this.data = this.dataLink = data;
    this.functions = this.businessLogic = functions;
    this.auth = auth;
    this.logger = logger;
    this.moduleGenerator = moduleGenerator;
    this.version = flex.version;

    if (options.sharedSecret) {
      this.sharedSecret = options.sharedSecret;
    }

    function terminate(err) {
      clearTimeout(gracefulShutdownTimeout);

      if (err) {
        // eslint-disable-next-line no-console
        console.log(`Shutdown Error: ${err}`);
        process.exit(-1);
      }
      process.exit();
    }

    function shutdown() {
      if (terminated) {
        // non-graceful shutdown, requires two successive signals
        // eslint-disable-next-line no-console
        console.log('\nForced quit!\n');
        return terminate('Force quit!');
      }

      terminated = true;
      // eslint-disable-next-line no-console
      console.log(
        'Signal received, initiating graceful shutdown.  Press ctrl-c or send SIGTERM/SIGINT to force-quit immediately.'
      );
      gracefulShutdownTimeout = setTimeout(terminate, 50000);
      return receiver.stop(err => terminate(err));
    }

    // TODO Remove legacy taskType values
    const taskReceivedCallback = ((task, completionCallback) => {
      task.sdkVersion = this.version;

      if (this.sharedSecret != null
        && task.taskType !== 'serviceDiscovery'
        && task.taskType !== 'logger'
        && task.taskType !== 'moduleGenerator'
        && this.sharedSecret !== task.authKey
      ) {
        task.response = task.response || {};
        const result = task.response;
        result.body = kinveyErrors.generateKinveyError(
          'Unauthorized', 'The Authorization Key was not valid or missing.'
        ).toJSON();
        result.statusCode = result.body.statusCode;
        delete result.body.statusCode;
        task.response.continue = false;
        return completionCallback(null, task);
      }

      if ((!this[task.taskType]
        && task.taskType !== 'serviceDiscovery')
        || task.taskType === 'logger'
        || task.taskType === 'moduleGenerator'
      ) {
        task.response = task.response || {};
        const result = task.response;
        result.body = kinveyErrors.generateKinveyError('BadRequest', 'Invalid task Type').toJSON();
        result.statusCode = result.body.statusCode;
        delete result.body.statusCode;
        task.response.continue = false;
        return completionCallback(null, task);
      }

      if (task.taskType === 'serviceDiscovery') {
        task.discoveryObjects = {
          dataLink: {
            serviceObjects: this.data.getServiceObjects()
          },
          businessLogic: {
            handlers: this.functions.getHandlers()
          },
          auth: {
            handlers: this.auth.getHandlers()
          }
        };
        return completionCallback(null, task);
      }

      return this[task.taskType].process(task, this.moduleGenerator.generate(task), (taskWithError, task) => {
        completionCallback(null, taskWithError || task);
      });
    });

    receiver.start(options, taskReceivedCallback, (err) => {
      if (err != null) {
        return callback(new Error(`Could not start task receiver: ${err}`));
      }
      return callback(null, this);
    });

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }
}

function generateFlexService(opt, cb) {
  const callback = !cb && typeof opt === 'function' ? opt : cb;
  const options = typeof opt === 'function' ? {} : opt;

  return new Flex(options, (err, service) => {
    callback(err, service);
  });
}

exports.service = generateFlexService;
