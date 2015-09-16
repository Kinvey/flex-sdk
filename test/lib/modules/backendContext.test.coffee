# Copyright (c) 2014, Kinvey, Inc. All rights reserved.
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

should = require 'should'
backendContextModule = require '../../../lib/service/modules/backendContext'

describe 'modules / backendContext', () ->
  backendContext = null

  metadata =
    _id: "test ID"
    appsecret: "test app secret"
    mastersecret: "test master secret"
    securityContext: "test security context"
    authenticatedUsername: "test authenticated username"
    authenticatedUserId: "12345"

  before (done) ->
    backendContext = backendContextModule metadata
    done()

  it 'exposes the environment ID through the getAppKey method', (done) ->
    backendContext.getAppKey().should.eql metadata._id
    done()

  it 'exposes the app secret through the getAppSecret method', (done) ->
    backendContext.getAppSecret().should.eql metadata.appsecret
    done()

  it 'exposes the master secret through the getMasterSecret method', (done) ->
    backendContext.getMasterSecret().should.eql metadata.mastersecret
    done()

  it 'exposes the security context through the getSecurityContext method', (done) ->
    backendContext.getSecurityContext().should.eql metadata.securityContext
    done()

  it 'exposes the authenticated username through the getAuthenticatedUsername method', (done) ->
    backendContext.getAuthenticatedUsername().should.eql metadata.authenticatedUsername
    done()





