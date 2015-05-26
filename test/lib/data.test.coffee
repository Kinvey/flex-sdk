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
    data.collection(collectionName).onInsert () ->
      done()

    fn = data.collection(collectionName).resolve 'onInsert'
    fn()

  it 'can register a deleteAll', (done) ->
    data.collection(collectionName).onDeleteAll () ->
      done()

    fn = data.collection(collectionName).resolve 'onDeleteAll'
    fn()

  it 'can register a deleteById', (done) ->
    data.collection(collectionName).onDeleteById () ->
      done()

    fn = data.collection(collectionName).resolve 'onDeleteById'
    fn()

  it 'can register a deleteByQuery', (done) ->
    data.collection(collectionName).onDeleteByQuery () ->
      done()

    fn = data.collection(collectionName).resolve 'onDeleteByQuery'
    fn()

  it 'can register an update', (done) ->
    data.collection(collectionName).onUpdate () ->
      done()

    fn = data.collection(collectionName).resolve 'onUpdate'
    fn()

  it 'can register a getAll', (done) ->
    data.collection(collectionName).onGetAll () ->
      done()

    fn = data.collection(collectionName).resolve 'onGetAll'
    fn()

  it 'can register a getById', (done) ->
    data.collection(collectionName).onGetById () ->
      done()

    fn = data.collection(collectionName).resolve 'onGetById'
    fn()

  it 'can register a getByQuery', (done) ->
    data.collection(collectionName).onGetByQuery () ->
      done()

    fn = data.collection(collectionName).resolve 'onGetByQuery'
    fn()

  it 'can register a getCount', (done) ->
    data.collection(collectionName).onGetCount () ->
      done()

    fn = data.collection(collectionName).resolve 'onGetCount'
    fn()