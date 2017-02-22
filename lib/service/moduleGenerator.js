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
const dataStore = require('./modules/dataStore');
const email = require('./modules/email');
const groupStore = require('./modules/groupStore');
const entity = require('./modules/kinveyEntity');
const kinveyDate = require('./modules/kinveyDate');
const push = require('./modules/push');
const Query = require('./modules/query');
const requestContext = require('./modules/requestContext');
const tempObjectStore = require('./modules/tempObjectStore');
const userStore = require('./modules/userStore');

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
      } catch (e) {
        customRequestProperties = {};
      }
    }
  }

  const proxyURL = task.proxyURL;
  const appMetadata = {
    _id: task.appMetadata._id,
    blFlags: task.appMetadata.blFlags,
    appsecret: task.appMetadata.appsecret,
    mastersecret: task.appMetadata.mastersecret,
    baasUrl: task.appMetadata.baasUrl || `${task.request.headers['x-forwarded-proto'] || 'https'}://${task.request.headers.host}`
  };
  const requestMetadata = {
    authenticatedUsername: task.request.username,
    authenticatedUserId: task.request.userId,
    apiVersion: task.request.headers['x-kinvey-api-version'] || '1',
    authorization: task.request.headers.authorization,
    clientAppVersion,
    customRequestProperties
  };
  const taskMetadata = {
    taskType: task.taskType,
    objectName: task.request.serviceObjectName || task.request.objectName || task.request.collectionName,
    hookType: task.hookType,
    target: task.target,
    taskId: task.taskId,
    containerId: task.containerId
  };

  requestMetadata.securityContext = getSecurityContextString(
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
    dataStore: dataStore(appMetadata, requestMetadata, taskMetadata),
    email: email(proxyURL, taskMetadata, proxyTaskEmitter),
    groupStore: groupStore(appMetadata, requestMetadata, taskMetadata),
    kinveyEntity: entity(appMetadata._id, useBSONObjectId),
    kinveyDate,
    push: push(proxyURL, taskMetadata, proxyTaskEmitter),
    Query,
    requestContext: requestContext(requestMetadata),
    tempObjectStore: tempObjectStore(task.request.tempObjectStore),
    userStore: userStore(appMetadata, requestMetadata, taskMetadata)
  };
}

exports.generate = generateModules;
