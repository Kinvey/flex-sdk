# Copyright (c) 2016 Kinvey Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

backendContext = require './modules/backendContext'
email = require './modules/email'
entity = require './modules/entity'
kinveyDate = require './modules/kinveyDate'
logger = require './modules/logger'
push = require './modules/push'
requestContext = require './modules/requestContext'
tempObjectStore = require './modules/tempObjectStore'
validation = require './modules/validation'
EventEmitter = require('events').EventEmitter

module.exports = do ->

  pendingProxyTasks = 0
  proxyTaskEmitter = new EventEmitter()
  proxyWaitRetries = 5

  proxyTaskEmitter.on 'proxyTaskStarted', () ->
    pendingProxyTasks += 1

  proxyTaskEmitter.on 'proxyTaskCompleted', () ->
    pendingProxyTasks -= 1

  generateModules = (task) ->

    getSecurityContextString = (authorizationHeader, appMetadata) ->
      try
        encodedCredentials = authorizationHeader.split(" ")[1]
        credentials = new Buffer(encodedCredentials, 'base64').toString('ascii').split ':'

      # no need for a 'catch' -- if an error occurs while parsing the credentials, just return 'unknown'

      if credentials?.length > 0
        if credentials[0] isnt appMetadata._id then return 'user'

        if credentials[0] is appMetadata._id
          if credentials[1] is appMetadata.appsecret then return 'app'
          if credentials[1] is appMetadata.mastersecret then return 'master'

      return 'unknown'

    clientAppVersion = null
    customRequestProperties = {}

    for header of task.request.headers
      if header.toLowerCase() == 'x-kinvey-client-app-version'
        clientAppVersion = task.request.headers[header]
      if header.toLowerCase() == 'x-kinvey-custom-request-properties'
        try
          customRequestPropertiesString = task.request.headers[header]
          customRequestProperties = JSON.parse(customRequestPropertiesString)
        catch _syntaxError
          console.log "Error parsing customRequestProperties header value: "
          console.log _syntaxError.stack

    proxyURL = task.proxyURL

    appMetadata =
      _id: task.appMetadata._id
      blFlags: task.appMetadata.blFlags
      appsecret: task.appMetadata.appsecret
      mastersecret: task.appMetadata.mastersecret
      authenticatedUsername: task.request.username


    requestMetadata =
      authenticatedUsername: task.request.username
      authenticatedUserId: task.request.userId
      clientAppVersion: clientAppVersion
      customRequestProperties: customRequestProperties

    taskMetadata =
      taskType: task.taskType
      serviceObjectName: task.serviceObjectName
      target: task.target
      taskId: task.taskId
      containerId: task.containerId

    appMetadata.securityContext = getSecurityContextString task.request.headers?.authorization, appMetadata

    useBSONObjectId = (task.appMetadata.maintenance?.objectid_migration?.status isnt 'done')

    api =
      backendContext: backendContext appMetadata
      email: email proxyURL, taskMetadata, proxyTaskEmitter
      entity: entity appMetadata._id, useBSONObjectId
      kinveyDate: kinveyDate
      logger: logger proxyURL, taskMetadata, proxyTaskEmitter
      push: push proxyURL, taskMetadata, proxyTaskEmitter
      requestContext: requestContext requestMetadata
      tempObjectStore: tempObjectStore task.request.tempObjectStore
      validation: validation

    return api

  methods =
    generate: generateModules

  return methods
