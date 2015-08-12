# Copyright (c) 2015, Kinvey, Inc. All rights reserved.
#
# This software is licensed to you under the Kinvey terms of service located at
# http://www.kinvey.com/terms-of-use. By downloading, accessing and/or using this
# software, you hereby accept such terms of service  (and any agreement referenced
# therein) and agree that you have read, understand and agree to be bound by such
# terms of service and are of legal age to agree to such terms with Kinvey.
#
# This software contains valuable confidential and proprietary information of
# KINVEY, INC and is subject to applicable licensing agreements.
# Unauthorized reproduction, transmission or distribution of this file and its
# contents is a violation of applicable laws.

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
      collectionName: task.collectionName
      target: task.target
      taskId: task.taskId
      containerId: task.containerId

    appMetadata.securityContext = getSecurityContextString task.request.headers?.authorization, appMetadata

    useBSONObjectId = (task.appMetadata.maintenance?.objectid_migration?.status isnt 'done')

    api =
      backendContext: backendContext appMetadata
      email: email proxyURL, taskMetadata, proxyTaskEmitter
      entity: entity appMetadata._id, useBSONObjectId
      kinveyDate: kinveyDate()
      logger: logger proxyURL, taskMetadata, proxyTaskEmitter
      push: push proxyURL, taskMetadata, proxyTaskEmitter
      requestContext: requestContext requestMetadata
      tempObjectStore: tempObjectStore task.request.tempObjectStore
      validation: validation

    return api

  methods =
    generate: generateModules

  return methods
