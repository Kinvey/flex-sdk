/**
 * Copyright (c) 2016 Kinvey Inc.
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

const isNil = require('lodash.isnil');
const receiver = require('kinvey-code-task-runner');

class Service {
  constructor(options, callback) {
    if (!callback && typeof options === 'function') {
      callback = options;
    }

    options = options || {};

    options.type = process.env.SDK_RECEIVER === 'tcp' ? 'tcp' : 'http';

    if (options.type === 'tcp') {
      delete options.host;
      delete options.port;
    }

    this.dataLink = require('./service/dataLink');
    this.businessLogic = require('./service/businessLogic');
    this.moduleGenerator = require('./service/moduleGenerator');

    const taskReceivedCallback = (task, completionCallback) => {
      if (task.taskType === 'dataLink') {
        return this.dataLink.process(task, this.moduleGenerator.generate(task), completionCallback);
      } else if (task.taskType === 'serviceDiscovery') {
        task.discoveryObjects = {
          dataLink: {
            serviceObjects: this.dataLink.getServiceObjects()
          },
          businessLogic: {
            handlers: this.businessLogic.getHandlers()
          }
        };
        return completionCallback(null, task);
      } else if (task.taskType === 'businessLogic') {
        return this.businessLogic.process(task, this.moduleGenerator.generate(task), completionCallback);
      }
    };

    receiver.start(options, taskReceivedCallback, (err) => {
      if (!isNil(err)) {
        return callback(new Error(`Could not start task receiver: ${err}`));
      }
      return callback(null, this);
    });
  }
}

function generateService(options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = null;
  }

  return new Service(options, (err, service) => {
    callback(err, service);
  });
}

exports.service = generateService;
