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
requestContextModule = require '../../../lib/service/modules/requestContext'

describe 'modules / requestContext', () ->
  requestContext = null

  metadata =
    _id: "test ID"
    authenticatedUsername: "test authenticated username"
    authenticatedUserId: "12345"
    customRequestProperties:
      first: 1

  before (done) ->
    requestContext = requestContextModule metadata
    done()

  it 'exposes the authenticated username through the getAuthenticatedUsername method', (done) ->
    requestContext.getAuthenticatedUsername().should.eql metadata.authenticatedUsername
    done()

  it 'exposes the authenticated id through the getAuthenticatedUserId method', (done) ->
    requestContext.getAuthenticatedUserId().should.eql metadata.authenticatedUserId
    done()

  it 'exposes the custom properties through the getCustomRequestProperty method', (done) ->
    requestContext.getCustomRequestProperty('first').should.eql metadata.customRequestProperties['first']
    done()

  it 'allows setting the custom properties through the setCustomRequestProperty method', (done) ->
    requestContext.setCustomRequestProperty('second', 2)
    requestContext.getCustomRequestProperty('second').should.eql 2
    done()

  describe 'getCustomRequestProperty return value', (done) ->

    it 'should be undefined when nothing is passed', (done) ->
      requestContext = requestContextModule metadata
      (requestContext.getCustomRequestProperty() is undefined).should.be.true
      done()

    describe 'when property does not exist', (done) ->

      it 'returns undefined', (done) ->
        (requestContext.getCustomRequestProperty('doesntexist') is undefined).should.be.true
        done()


    describe 'when getting a property whose value is an empty string', (done) ->

      it 'returns an empty string', (done) ->
        requestContext.setCustomRequestProperty('emptyString', "")
        requestContext.getCustomRequestProperty('emptyString').should.eql ''
        done()

    describe 'when getting a property whose value is false', (done) ->

      it 'returns false', (done) ->
        requestContext.setCustomRequestProperty('shouldBeFalse', false)
        requestContext.getCustomRequestProperty('shouldBeFalse').should.eql false
        done()

    describe 'when getting a property whose value is an object', (done) ->

      it 'returns the object', (done) ->
        requestContext.setCustomRequestProperty('prop', {a:1})
        prop = requestContext.getCustomRequestProperty('prop')
        prop.should.be instanceof Object
        prop.a.should.eql 1
        done()

  describe 'setCustomProperty special cases', (done) ->

    describe 'when passing undefined as a value', (done) ->

      it 'sets the value to undefined', (done) ->
        requestContext.setCustomRequestProperty('newprop')
        (requestContext.getCustomRequestProperty('newprop') is undefined).should.be.true
        done()

    describe 'when overwriting a value', (done) ->

      it 'the value is overwritten', (done) ->
        metadata.customRequestProperties.first = 1
        requestContext.getCustomRequestProperty('first').should.eql 1
        requestContext.setCustomRequestProperty('first', 2)
        requestContext.getCustomRequestProperty('first').should.eql 2
        done()

    describe 'when passing null as a value', (done) ->

      it 'the value is set to null', (done) ->
        requestContext.setCustomRequestProperty('shouldbenull', null)
        (requestContext.getCustomRequestProperty('shouldbenull') is null).should.be.true
        done()

    describe 'when passing undefined as a property name', (done) ->

      it 'the value is set to null', (done) ->
        requestContext.setCustomRequestProperty('undefined', 1)
        (requestContext.getCustomRequestProperty('undefined') is 1).should.be.true
        done()

    describe 'when passing a special characater in the value', (done) ->

      it 'the value is set properly', (done) ->
        requestContext.setCustomRequestProperty('foo', 'bár')
        requestContext.getCustomRequestProperty('foo').should.eql 'bár'
        done()

    describe 'when passing an object property value', (done) ->

      it 'the value is set properly', (done) ->
        requestContext.setCustomRequestProperty('foo', {"prop":1})
        requestContext.getCustomRequestProperty('foo').prop.should.eql 1
        done()

  describe 'Client App Version API', (done) ->

    describe 'stringValue()', (done) ->

      it 'should return the current client version for the request', (done) ->
        metadata.clientAppVersion = "1.0.1"
        requestContext = requestContextModule metadata
        requestContext.clientAppVersion.stringValue().should.eql metadata.clientAppVersion
        done()


      it 'should return null when metadata value is null', (done) ->
        metadata.clientAppVersion = null
        requestContext = requestContextModule metadata
        (requestContext.clientAppVersion.stringValue() is null).should.be.true
        done()


      it 'returns null when no customer app version is passed in', (done) ->
        requestContext = requestContextModule metadata
        (requestContext.clientAppVersion.stringValue() is null).should.be.true
        done()


      it 'should return null when metadata value is ""', (done) ->
        metadata.clientAppVersion = ""
        requestContext = requestContextModule metadata
        (requestContext.clientAppVersion.stringValue() is null).should.be.true
        done()

      it 'should return null when metadata value is undefined', (done) ->
        metadata.clientAppVersion = undefined
        requestContext = requestContextModule metadata
        (requestContext.clientAppVersion.stringValue() is null).should.be.true
        done()


    describe 'majorVersion()', (done) ->

      it 'should return correct value when only one number passed in', (done) ->
        metadata.clientAppVersion = "1"
        requestContext = requestContextModule metadata
        requestContext.clientAppVersion.majorVersion().should.eql 1
        done()

      it 'should return correct value when major and minor are passed in', (done) ->
        metadata.clientAppVersion = "1.0"
        requestContext = requestContextModule metadata
        requestContext.clientAppVersion.majorVersion().should.eql 1
        done()


      it 'should return correct value when major, minor and patch are passed in', (done) ->
        metadata.clientAppVersion = "1.2.3"
        requestContext = requestContextModule metadata
        requestContext.clientAppVersion.majorVersion().should.eql 1
        done()

      it 'should return correct value when major, minor and patch AND MORE are passed in', (done) ->
        metadata.clientAppVersion = "1.2.3.4"
        requestContext = requestContextModule metadata
        requestContext.clientAppVersion.majorVersion().should.eql 1
        done()

      it 'should return correct value when major ver is more than 1 digit', (done) ->
        metadata.clientAppVersion = "12.2.3"
        requestContext = requestContextModule metadata
        requestContext.clientAppVersion.majorVersion().should.eql 12
        done()

      it 'returns NaN when no customer app version is passed in', (done) ->
        metadata.clientAppVersion = ""
        requestContext = requestContextModule metadata
        (isNaN(requestContext.clientAppVersion.majorVersion())).should.be.true
        done()

      it 'should return NaN major component contains a string', (done) ->
        metadata.clientAppVersion = "1a.1.2"
        requestContext = requestContextModule metadata
        (isNaN(requestContext.clientAppVersion.majorVersion())).should.be.true
        done()


      it 'should return number value minor or patch contain non-digit characters', (done) ->
        metadata.clientAppVersion = "1.2a.3-beta"
        requestContext = requestContextModule metadata
        requestContext.clientAppVersion.majorVersion().should.eql 1
        done()




    describe 'minorVersion()', (done) ->

      it 'should return correct value when major and minor are passed in', (done) ->
        metadata.clientAppVersion = "1.0"
        requestContext = requestContextModule metadata
        requestContext.clientAppVersion.minorVersion().should.eql 0
        done()


      it 'should return correct value when major, minor and patch are passed in', (done) ->
        metadata.clientAppVersion = "1.2.3"
        requestContext = requestContextModule metadata
        requestContext.clientAppVersion.minorVersion().should.eql 2
        done()

      it 'should return correct value when major ver is more than 1 digit', (done) ->
        metadata.clientAppVersion = "12.34.56"
        requestContext = requestContextModule metadata
        requestContext.clientAppVersion.minorVersion().should.eql 34
        done()

      it 'returns NaN when no customer app version is passed in', (done) ->
        metadata.clientAppVersion = ""
        requestContext = requestContextModule metadata
        (isNaN(requestContext.clientAppVersion.minorVersion())).should.be.true
        done()

      it 'should return NaN when minor component contains a string', (done) ->
        metadata.clientAppVersion = "1.1a.2"
        requestContext = requestContextModule metadata
        (isNaN(requestContext.clientAppVersion.minorVersion())).should.be.true
        done()


      it 'should return correct value when major or patch contains a string', (done) ->
        metadata.clientAppVersion = "1a.2.3-beta"
        requestContext = requestContextModule metadata
        requestContext.clientAppVersion.minorVersion().should.eql 2
        done()


    describe 'patchVersion()', (done) ->

      it 'should return correct value when major, minor and patch are passed in', (done) ->
        metadata.clientAppVersion = "1.2.3"
        requestContext = requestContextModule metadata
        requestContext.clientAppVersion.patchVersion().should.eql 3
        done()

      it 'should return correct value when major ver is more than 1 digit', (done) ->
        metadata.clientAppVersion = "12.34.56"
        requestContext = requestContextModule metadata
        requestContext.clientAppVersion.patchVersion().should.eql 56
        done()

      it 'returns NaN when no customer app version is passed in', (done) ->
        metadata.clientAppVersion = ""
        requestContext = requestContextModule metadata
        (isNaN(requestContext.clientAppVersion.patchVersion())).should.be.true
        done()

      it 'should return NaN when patch component contains a string', (done) ->
        metadata.clientAppVersion = "1.2.3-beta"
        requestContext = requestContextModule metadata
        (isNaN(requestContext.clientAppVersion.patchVersion())).should.be.true
        done()


      it 'should return correct value when major or minor contain string characters', (done) ->
        metadata.clientAppVersion = "1a.2-beta.3"
        requestContext = requestContextModule metadata
        requestContext.clientAppVersion.patchVersion().should.eql 3
        done()






