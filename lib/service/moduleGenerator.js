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
const getProp = require('lodash.get');

const backendContext = require('./modules/backendContext');
const email = require('./modules/email');
const entity = require('./modules/entity');
const kinveyDate = require('./modules/kinveyDate');
const logger = require('./modules/logger');
const push = require('./modules/push');
const requestContext = require('./modules/requestContext');
const tempObjectStore = require('./modules/tempObjectStore');
const validation = require('./modules/validation');

const EventEmitter = require('events').EventEmitter;
const util = require('util');

const proxyTaskEmitter = new EventEmitter();
let pendingProxyTasks = 0;

proxyTaskEmitter.on('proxyTaskStarted', () => { pendingProxyTasks += 1; });
proxyTaskEmitter.on('proxyTaskCompleted', () => { pendingProxyTasks -= 1; });

function getSecurityContextString(authorizationHeader, appMetadata) {
  let credentials = null;
  try {
    const encodedCredentials = authorizationHeader.split(' ')[1];
    credentials = new Buffer(encodedCredentials, 'base64').toString('ascii').split(':');
  } catch (e) {
    return 'unknown';
  }

  if (util.isArray(credentials)) {
    if (credentials[0] !== appMetadata._id) {
      return 'user';
    }
    if (credentials[0] === appMetadata._id && !isNil(credentials[1])) {
      if (credentials[1] === appMetadata.appsecret) {
        return 'app';
      }
      if (credentials[1] === appMetadata.mastersecret) {
        return 'master';
      }
    }
  }

  return 'unknown';
}

function generateModules(task) {
  let clientAppVersion = null;
  let customRequestProperties = {};

  for (const header in task.request.headers) {
    if (header.toLowerCase() === 'x-kinvey-client-app-version') {
      clientAppVersion = task.request.headers[header];
    }
    if (header.toLowerCase() === 'x-kinvey-custom-request-properties') {
      try {
        const customRequestPropertiesString = task.request.headers[header];
        customRequestProperties = JSON.parse(customRequestPropertiesString);
      } catch (error) {
        console.log('Error parsing customRequestProperties header value: ');
        console.log(error.stack);
      }
    }
  }

  const proxyURL = task.proxyURL;
  const appMetadata = {
    _id: task.appMetadata._id,
    blFlags: task.appMetadata.blFlags,
    appsecret: task.appMetadata.appsecret,
    mastersecret: task.appMetadata.mastersecret,
    authenticatedUsername: task.request.username
  };
  const requestMetadata = {
    authenticatedUsername: task.request.username,
    authenticatedUserId: task.request.userId,
    clientAppVersion,
    customRequestProperties
  };
  const taskMetadata = {
    taskType: task.taskType,
    serviceObjectName: task.serviceObjectName,
    target: task.target,
    taskId: task.taskId,
    containerId: task.containerId
  };

  appMetadata.securityContext = getSecurityContextString(
    getProp(task.request.headers, ['authorization'], []),
    appMetadata
  );

  let useBSONObjectId = false;
  const migrated = getProp(task, ['appMetadata', 'appMetadata', 'objectid_migration', 'status']);
  if (!isNil(migrated) && migrated === 'done') {
    useBSONObjectId = true;
  }

  return {
    backendContext: backendContext(appMetadata),
    email: email(proxyURL, taskMetadata, proxyTaskEmitter),
    entity: entity(appMetadata._id, useBSONObjectId),
    kinveyDate,
    logger: logger(proxyURL, taskMetadata, proxyTaskEmitter),
    push: push(proxyURL, taskMetadata, proxyTaskEmitter),
    requestContext: requestContext(requestMetadata),
    tempObjectStore: tempObjectStore(task.request.tempObjectStore),
    validation
  };
}

exports.generate = generateModules;
