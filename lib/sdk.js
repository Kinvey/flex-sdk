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

'use strict';

const receiver = require('kinvey-code-task-runner');

class Service {
  constructor(callback) {
    this.dataLink = require('./service/dataLink');
    this.businessLogic = require('./service/businessLogic');
    this.moduleGenerator = require('./service/moduleGenerator');

    const taskReceivedCallback = (task, completionCallback) => {
      if (task.taskType === 'dataLink') {
        return this.dataLink.process(task, this.moduleGenerator.generate(task), completionCallback);
      } else if (task.taskType === 'dataLinkDiscovery') {
        return this.dataLink.getServiceObjects(task, completionCallback);
      } else if (task.taskType === 'businessLogic') {
        return this.businessLogic.process(task, this.moduleGenerator.generate(task), completionCallback);
      }
    };

    receiver.start(taskReceivedCallback, (err) => {
      if (typeof err !== 'undefined' && err !== null) {
        return callback(new Error(`Could not start task receiver: ${err}`));
      }
      return callback(null, this);
    });
  }
}

function generateService(callback) {
  return new Service((err, service) => {
    callback(err, service);
  });
}

exports.service = (callback) => { generateService((err, service) => { callback(err, service); }); };
