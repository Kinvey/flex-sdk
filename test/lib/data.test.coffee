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

data = require '../../lib/service/data'
should = require 'should'

collectionName = 'myCollection'
collectionName2 = 'myCollection2'

describe 'data registration', () ->
  it 'can register an insert', (done) ->
    data.insert collectionName, () ->
      done()

    fn = data.resolve collectionName, 'insert'
    fn()

  it 'can register a deleteAll', (done) ->
    data.deleteAll collectionName, () ->
      done()

    fn = data.resolve collectionName, 'deleteAll'
    fn()

  it 'can register a deleteEntity', (done) ->
    data.deleteEntity collectionName, () ->
      done()

    fn = data.resolve collectionName, 'deleteEntity'
    fn()

  it 'can register a deleteWithQuery', (done) ->
    data.deleteWithQuery collectionName, () ->
      done()

    fn = data.resolve collectionName, 'deleteWithQuery'
    fn()

  it 'can register an update', (done) ->
    data.update collectionName, () ->
      done()

    fn = data.resolve collectionName, 'update'
    fn()

  it 'can register a getAll', (done) ->
    data.getAll collectionName, () ->
      done()

    fn = data.resolve collectionName, 'getAll'
    fn()

  it 'can register a getEntity', (done) ->
    data.getEntity collectionName, () ->
      done()

    fn = data.resolve collectionName, 'getEntity'
    fn()

  it 'can register a getWithQuery', (done) ->
    data.getWithQuery collectionName, () ->
      done()

    fn = data.resolve collectionName, 'getWithQuery'
    fn()

  it 'can register a getCount', (done) ->
    data.getCount collectionName, () ->
      done()

    fn = data.resolve collectionName, 'getCount'
    fn()