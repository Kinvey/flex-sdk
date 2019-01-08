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

const backendContext = require('./modules/backendContext');
const dataStore = require('./modules/dataStore');
const email = require('./modules/email');
const endpointRunner = require('./modules/endpointRunner');
const groupStore = require('./modules/groupStore');
const entity = require('./modules/kinveyEntity');
const kinveyDate = require('./modules/kinveyDate');
const push = require('./modules/push');
const Query = require('./modules/query');
const requestContext = require('./modules/requestContext');
const roleStore = require('./modules/roleStore');
const tempObjectStore = require('./modules/tempObjectStore');
const userStore = require('./modules/userStore');

const util = require('util');

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
    if (credentials[0] === appMetadata._id && credentials[1] != null) {
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
  const baasUrl = task.baasUrl
    || task.appMetadata.baasUrl
    || `${task.request.headers['x-forwarded-proto']
    || 'https'}://${task.request.headers.host}`;

  Object.keys(task.request.headers).forEach((header) => {
    if (header.toLowerCase() === 'x-kinvey-client-app-version') {
      clientAppVersion = task.request.headers[header];
    }
    if (header.toLowerCase() === 'x-kinvey-custom-request-properties') {
      try {
        customRequestProperties = JSON.parse(task.request.headers[header]);
      } catch (e) {
        customRequestProperties = {};
      }
    }
  });

  const appMetadata = {
    _id: task.appMetadata._id,
    applicationId: task.appMetadata.applicationId,
    blFlags: task.appMetadata.blFlags,
    appsecret: task.appMetadata.appsecret,
    mastersecret: task.appMetadata.mastersecret,
    baasUrl
  };
  const requestMetadata = {
    authenticatedUsername: task.request.username,
    authenticatedUserId: task.request.userId,
    apiVersion: task.response.headers['x-kinvey-api-version'] || '3',
    authorization: task.request.headers.authorization,
    clientAppVersion,
    customRequestProperties,
    requestId: task.requestId
  };
  const taskMetadata = {
    taskType: task.taskType,
    objectName: task.request.serviceObjectName || task.request.objectName || task.request.collectionName,
    hookType: task.hookType,
    target: task.target,
    taskId: task.taskId,
    containerId: task.containerId
  };

  requestMetadata.securityContext = getSecurityContextString(task.request.headers.authorization, appMetadata);

  let useBSONObjectId = false;

  if (task.appMetadata.maintenance && task.appMetadata.maintenance.objectid_migration) {
    useBSONObjectId = (task.appMetadata.maintenance.objectid_migration.status !== 'done');
  }

  return {
    backendContext: backendContext(appMetadata),
    dataStore: dataStore(appMetadata, requestMetadata, taskMetadata),
    email: email(appMetadata),
    endpointRunner: endpointRunner(appMetadata, requestMetadata, taskMetadata),
    groupStore: groupStore(appMetadata, requestMetadata, taskMetadata),
    kinveyEntity: entity(appMetadata._id, useBSONObjectId),
    kinveyDate,
    push: push(appMetadata),
    Query,
    requestContext: requestContext(requestMetadata),
    roleStore: roleStore(appMetadata, requestMetadata, taskMetadata),
    tempObjectStore: tempObjectStore(task.request.tempObjectStore),
    userStore: userStore(appMetadata, requestMetadata, taskMetadata)
  };
}

exports.generate = generateModules;
