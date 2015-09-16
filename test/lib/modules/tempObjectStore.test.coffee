should = require 'should'

testTempObjectStore = {}
testEnvironmentId = "test environment ID"
objectStoreModule  = require '../../../lib/service/modules/tempObjectStore'
tempObjectStore = objectStoreModule testTempObjectStore

describe 'tempObjectStore', () ->
  describe 'when passing in an object during initialization', () ->
    afterEach (done) ->
      for own property of testTempObjectStore
        delete testTempObjectStore[property]
      done()

    it 'can set values', (done) ->
      tempObjectStore.set 'test', 'testValue'
      testTempObjectStore.should.have.property 'test'
      testTempObjectStore.test.should.eql 'testValue'
      done()

    it 'can retrieve values', (done) ->
      tempObjectStore.set 'test', 'testValue'
      tempObjectStore.get('test').should.eql 'testValue'
      done()

    it 'can retrieve entire object store', (done) ->
      tempObjectStore.set 'test', 'testValue'
      tempObjectStore.set 'test2', 'testValue2'
      tempObjectStore.set 'test3', 'testValue3'

      tempObjectStore.getAll().should.eql { test: 'testValue', test2: 'testValue2', test3: 'testValue3' }
      done()

  describe 'when no object is passed in during initialization', () ->
    undefinedTempObjectStore = null

    beforeEach (done) ->
      undefinedTempObjectStore = objectStoreModule()
      done()

    afterEach (done) ->
      undefinedTempObjectStore = null
      done()

    it 'can set and retrieve values', (done) ->
      undefinedTempObjectStore.set 'test', 'testValue'
      undefinedTempObjectStore.get('test').should.eql 'testValue'
      done()

    it 'can retrieve entire object store', (done) ->
      undefinedTempObjectStore.set 'test', 'testValue'
      undefinedTempObjectStore.set 'test2', 'testValue2'
      undefinedTempObjectStore.set 'test3', 'testValue3'

      undefinedTempObjectStore.getAll().should.eql { test: 'testValue', test2: 'testValue2', test3: 'testValue3' }
      done()
