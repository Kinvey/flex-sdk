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

should = require 'should'
kinveyModule = require '../../../lib/service/modules/entity'



testEnvironmentId = "test environment ID"


describe 'modules / kinvey', () ->

  kinveyInstance = null
  BSONUtilsInstance = null

  stubEntityProperties = ['_id', '_acl', '_kmd']
  stubEntityACLProperties = ['creator']
  stubEntityKMDProperties = ['lmt', 'ect']


  before (done) ->
    kinveyInstance = kinveyModule testEnvironmentId
    done()

  describe 'isKinveyEntity function', (done) ->

    it 'returns false when null is passed in', (done) ->
      kinveyInstance.isKinveyEntity(null).should.be.false
      done()

    it 'returns false when undefined is passed in', (done) ->
      kinveyInstance.isKinveyEntity(undefined).should.be.false
      done()

    it 'returns false when an empty object is passed in', (done) ->
      kinveyInstance.isKinveyEntity({}).should.be.false
      done()

    it 'returns false when a populated object is passed in', (done) ->
      kinveyInstance.isKinveyEntity({prop:1}).should.be.false
      done()

    it 'returns false when a string is passed in', (done) ->
      kinveyInstance.isKinveyEntity("hello").should.be.false
      done()

    it 'returns false when a number is passed in', (done) ->
      kinveyInstance.isKinveyEntity(1).should.be.false
      done()

    it 'returns false when a function is passed in', (done) ->
      kinveyInstance.isKinveyEntity(() -> true).should.be.false
      done()

    it 'returns false when an error is passed in', (done) ->
      kinveyInstance.isKinveyEntity(new Error 'error').should.be.false
      done()

    it 'returns true when a kinvey entity is passed in', (done) ->
      kinveyInstance.isKinveyEntity(kinveyInstance.entity()).should.be.true
      done()

    it 'returns false if _acl methods are not available', (done) ->
      entity = kinveyInstance.entity()
      entity._acl = {}
      kinveyInstance.isKinveyEntity(entity).should.be.false
      done()

  describe 'entity creation', (done) ->

    it 'returns an kinveyized JS object of type Object', (done) ->
      ke = kinveyInstance.entity()
      kinveyInstance.isKinveyEntity(ke).should.be.true
      done()

    it 'creates a stub kinvey entity when nothing is passed in', (done) ->
      ke = kinveyInstance.entity()
      ke.should.have.properties stubEntityProperties
      ke._acl.should.have.properties stubEntityACLProperties
      ke._kmd.should.have.properties stubEntityKMDProperties
      done()

    it 'creates a stub kinvey entity when an empty object is passed in', (done) ->
      ke = kinveyInstance.entity({})
      ke.should.have.properties stubEntityProperties
      ke._acl.should.have.properties stubEntityACLProperties
      ke._kmd.should.have.properties stubEntityKMDProperties
      done()

    it 'fills in missing kinvey metadata when object with _acl is passed in', (done) ->
      ke = kinveyInstance.entity({_acl:{r:[1, 2, 3], w:[1, 2, 3]}})
      ke.should.have.properties stubEntityProperties
      ke._acl.should.have.properties stubEntityACLProperties
      ke._kmd.should.have.properties stubEntityKMDProperties
      done()

    it 'adds KinveyEntity properties when object with values is passed in', (done) ->
      ke = kinveyInstance.entity({key:'value'})
      ke.should.have.properties stubEntityProperties
      ke._acl.should.have.properties stubEntityACLProperties
      ke._kmd.should.have.properties stubEntityKMDProperties
      ke.key.should.eql 'value'
      done()

    it 'retains all existing kinvey metadata when a kinveyEntity is passed in', (done) ->
      ke1 = kinveyInstance.entity({key:'value'})
      ke2 = kinveyInstance.entity(ke1)
      ke1.should.eql ke2
      done()

    it 'returns the passed in object', (done) ->
      testObject =
        first: 1
      ke = kinveyInstance.entity(testObject)
      should.strictEqual ke, testObject
      done()

    it 'The _acl convenience functions are not enumerable', (done) ->
      testObject =
        first: 1
      aclFunctionSignatures = ['getCreator', 'getReaders', 'addReader', 'removeReader',
                               'getWriters', 'addWriter', 'removeWriter', 'getReaderGroups', 'addReaderGroup',
                               'removeReaderGroup', 'getWriterGroups', 'addWriterGroup', 'removeWriterGroup',
                               'getGloballyReadable', 'getGloballyWritable', 'setGloballyReadable', 'setGloballyWritable']
      kinveyInstance.entity(testObject)
      keys = Object.keys(testObject._acl)
      for aclFunctionSignature in aclFunctionSignatures
        console.log aclFunctionSignature
        (typeof testObject._acl[aclFunctionSignature]).should.eql 'function'
        keys.indexOf(aclFunctionSignature).should.eql -1
      done()

    describe 'ACL', (done) ->

      describe 'getCreator', (done) ->

        it 'returns envId for stub entity', (done) ->
          ke = kinveyInstance.entity()
          ke._acl.getCreator().should.eql testEnvironmentId
          done()

        it 'returns correct value when creator is set on creation of entity', (done) ->
          ke = kinveyInstance.entity({_acl:{creator:'ME'}})
          ke._acl.getCreator().should.eql 'ME'
          done()

      describe 'getReaders', (done) ->

        it 'returns empty array for stub entity with no readers', (done) ->
          ke = kinveyInstance.entity()
          ke._acl.getReaders().should.eql []
          done()

        it 'returns correct value for entity with readers', (done) ->
          ke = kinveyInstance.entity({_acl:{r:[1, 2, 3]}})
          ke._acl.getReaders().should.eql [1, 2, 3]
          done()

      describe 'addReader', (done) ->

        it 'adds a reader for stub entity with no readers', (done) ->
          ke = kinveyInstance.entity()
          ke._acl.addReader("12345")
          ke._acl.getReaders().should.eql ["12345"]
          done()

        it 'adds a reader for stub entity with existing readers', (done) ->
          ke = kinveyInstance.entity({_acl:{r:[1, 2, 3]}})
          ke._acl.addReader(12345)
          ke._acl.getReaders().should.eql [1, 2, 3, 12345]
          done()

        it 'wont add an existing reader id', (done) ->
          ke = kinveyInstance.entity({_acl:{r:[1, 2, 3]}})
          ke._acl.addReader(1)
          ke._acl.getReaders().should.eql [1, 2, 3]
          done()

        it 'returns entity acls for method chaining', (done) ->
          ke = kinveyInstance.entity({_acl:{r:[1, 2, 3]}})
          ke._acl.addReader(1).getReaders().should.eql [1, 2, 3]
          done()

      describe 'removeReader', (done) ->

        it 'removes a reader when a match is found', (done) ->
          ke = kinveyInstance.entity({_acl:{r:[1, 2, 3]}})
          ke._acl.removeReader(1)
          ke._acl.getReaders().should.eql [2, 3]
          done()

        it 'does nothing when a match is not found', (done) ->
          ke = kinveyInstance.entity({_acl:{r:[1, 2, 3]}})
          ke._acl.removeReader(4)
          ke._acl.getReaders().should.eql [1, 2, 3]
          done()

        it 'will remove all instances of an id', (done) ->
          ke = kinveyInstance.entity({_acl:{r:[1, 2, 3, 1]}})
          ke._acl.removeReader(1)
          ke._acl.getReaders().should.eql [2, 3]
          done()

        it 'returns entity acls for method chaining', (done) ->
          ke = kinveyInstance.entity({_acl:{r:[1, 2, 3, 1]}})
          ke._acl.removeReader(1).getReaders().should.eql [2, 3]
          done()

      describe 'getWriters', (done) ->

        it 'returns empty for stub entity with no writers', (done) ->
          ke = kinveyInstance.entity()
          ke._acl.getWriters().should.eql []
          done()

        it 'returns array for entity with readers', (done) ->
          ke = kinveyInstance.entity({_acl:{w:[1, 2, 3]}})
          ke._acl.getWriters().should.eql [1, 2, 3]
          done()

      describe 'addWriters', (done) ->

        it 'adds a writers for stub entity with no writers', (done) ->
          ke = kinveyInstance.entity()
          ke._acl.addWriter("12345")
          ke._acl.getWriters().should.eql ["12345"]
          done()

        it 'adds a reader for stub entity with existing readers', (done) ->
          ke = kinveyInstance.entity({_acl:{w:[1, 2, 3]}})
          ke._acl.addWriter(12345)
          ke._acl.getWriters().should.eql [1, 2, 3, 12345]
          done()

        it 'wont add an existing reader id', (done) ->
          ke = kinveyInstance.entity({_acl:{r:[1, 2, 3]}})
          ke._acl.addReader(1)
          ke._acl.getReaders().should.eql [1, 2, 3]
          done()

          it 'returns entity acls for method chaining', (done) ->
            ke = kinveyInstance.entity({_acl:{w:[1, 2, 3]}})
            ke._acl.addWriter(12345).getWriters().should.eql [1, 2, 3, 12345]
            done()

        describe 'removeWriter', (done) ->

          it 'removes a writer when a match is found', (done) ->
            ke = kinveyInstance.entity({_acl:{w:[1, 2, 3]}})
            ke._acl.removeWriter(1)
            ke._acl.getWriters().should.eql [2, 3]
            done()

          it 'does nothing when a match is not found', (done) ->
            ke = kinveyInstance.entity({_acl:{w:[1, 2, 3]}})
            ke._acl.removeWriter(4)
            ke._acl.getWriters().should.eql [1, 2, 3]
            done()

          it 'will remove all instances of an id', (done) ->
            ke = kinveyInstance.entity({_acl:{w:[1, 2, 3, 1]}})
            ke._acl.removeWriter(1)
            ke._acl.getWriters().should.eql [2, 3]
            done()

          it 'returns entity acls for method chaining', (done) ->
            ke = kinveyInstance.entity({_acl:{w:[1, 2, 3, 1]}})
            ke._acl.removeWriter(1).getWriters().should.eql [2, 3]
            done()

      describe 'getReaderGroups', (done) ->

        it 'returns empty array when no group readers', (done) ->
          ke = kinveyInstance.entity()
          ke._acl.getReaderGroups().should.eql []
          done()

        it 'returns correct value for entity with readers', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{r:[1, 2, 3]}}})
          ke._acl.getReaderGroups().should.eql [1, 2, 3]
          done()

      describe 'addReaderGroup', (done) ->

        it 'Adds a reader to an stub entity', (done) ->
          ke = kinveyInstance.entity()
          ke._acl.addReaderGroup('1')
          ke._acl.getReaderGroups().should.eql ['1']
          done()

        it 'wont add an existing reader id', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{r:[1, 2, 3]}}})
          ke._acl.addReaderGroup(1)
          ke._acl.getReaderGroups().should.eql [1, 2, 3]
          done()

        it 'appends a group ID to existing list', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{r:[1, 2, 3]}}})
          ke._acl.addReaderGroup(4)
          ke._acl.getReaderGroups().should.eql [1, 2, 3, 4]
          done()

        it 'returns entity acls for method chaining', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{r:[1, 2, 3]}}})
          ke._acl.addReaderGroup(4).getReaderGroups().should.eql [1, 2, 3, 4]
          done()

      describe 'removeReaderGroup', (done) ->

        it 'removes a reader group when a match is found', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{r:[1, 2, 3]}}})
          ke._acl.removeReaderGroup(1)
          ke._acl.getReaderGroups().should.eql [2, 3]
          done()

        it 'does nothing when a match is not found', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{r:[1, 2, 3]}}})
          ke._acl.removeReaderGroup(4)
          ke._acl.getReaderGroups().should.eql [1, 2, 3]
          done()

        it 'does nothing when no reader groups are defined', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{}}})
          ke._acl.removeReaderGroup(1)
          ke._acl.getReaderGroups().should.eql []
          done()

        it 'will remove all instances of a group id', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{r:[1, 2, 3, 1]}}})
          ke._acl.removeReaderGroup(1)
          ke._acl.getReaderGroups().should.eql [2, 3]
          done()

        it 'returns entity acls for method chaining', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{r:[1, 2, 3, 1]}}})
          ke._acl.removeReaderGroup(1).getReaderGroups().should.eql [2, 3]
          done()

      describe 'getWriterGroups', (done) ->

        it 'returns empty array when no group writers', (done) ->
          ke = kinveyInstance.entity()
          ke._acl.getWriterGroups().should.eql []
          done()

        it 'returns correct value for entity with readers', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{w:[1, 2, 3]}}})
          ke._acl.getWriterGroups().should.eql [1, 2, 3]
          done()


      describe 'addWriterGroup', (done) ->

        it 'Adds a reader to an stub entity with no existing reader groups', (done) ->
          ke = kinveyInstance.entity()
          ke._acl.addWriterGroup('1')
          ke._acl.getWriterGroups().should.eql ['1']
          done()

        it 'wont add an existing reader id', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{w:[1, 2, 3]}}})
          ke._acl.addWriterGroup(1)
          ke._acl.getWriterGroups().should.eql [1, 2, 3]
          done()

        it 'appends a group ID to existing list', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{w:[1, 2, 3]}}})
          ke._acl.addWriterGroup(4)
          ke._acl.getWriterGroups().should.eql [1, 2, 3, 4]
          done()

        it 'returns entity acls for method chaining', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{w:[1, 2, 3]}}})
          ke._acl.addWriterGroup(4).getWriterGroups().should.eql [1, 2, 3, 4]
          done()

      describe 'removeWriterGroup', (done) ->

        it 'Returns the acl of the kinvey entity for method chaining', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{w:[1, 2, 3]}}})
          ke._acl.removeWriterGroup(1).getWriterGroups().should.eql [2, 3]
          done()

        it 'removes a writer group when a match is found', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{w:[1, 2, 3]}}})
          ke._acl.removeWriterGroup(1)
          ke._acl.getWriterGroups().should.eql [2, 3]
          done()

        it 'does nothing when a match is not found', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{w:[1, 2, 3]}}})
          ke._acl.removeWriterGroup(4)
          ke._acl.getWriterGroups().should.eql [1, 2, 3]
          done()

        it 'does nothing when no writer groups are defined', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{}}})
          ke._acl.removeWriterGroup(1)
          ke._acl.getWriterGroups().should.eql []
          done()

        it 'will remove all instances of a group id', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{w:[1, 2, 3, 1]}}})
          ke._acl.removeWriterGroup(1)
          ke._acl.getWriterGroups().should.eql [2, 3]
          done()

        it 'returns entity acls for method chaining', (done) ->
          ke = kinveyInstance.entity({_acl:{groups:{w:[1, 2, 3, 1]}}})
          ke._acl.removeWriterGroup(1).getWriterGroups().should.eql [2, 3]
          done()


      describe 'get global readability', (done) ->

        it 'will return null when globally readable is not set', (done) ->
          ke = kinveyInstance.entity()
          (ke._acl.getGloballyReadable() is null).should.be.true
          done()

        it 'will return true when globally readable is true', (done) ->
          ke = kinveyInstance.entity({_acl:{gr:true}})
          ke._acl.getGloballyReadable().should.be.true
          done()

        it 'will return false when globally readable is false', (done) ->
          ke = kinveyInstance.entity({_acl:{gr:false}})
          ke._acl.getGloballyReadable().should.be.false
          done()

        it 'will return null when globally readable is undefined', (done) ->
          ke = kinveyInstance.entity({_acl:{gr:undefined}})
          (ke._acl.getGloballyReadable() is null).should.be.true
          done()

      describe 'get global writability', (done) ->

        it 'will return null when not set', (done) ->
          ke = kinveyInstance.entity()
          (ke._acl.getGloballyWritable() is null).should.be.true
          done()

        it 'will return true when true', (done) ->
          ke = kinveyInstance.entity({_acl:{gw:true}})
          ke._acl.getGloballyWritable().should.be.true
          done()

        it 'will return false when false', (done) ->
          ke = kinveyInstance.entity({_acl:{gw:false}})
          ke._acl.getGloballyWritable().should.be.false
          done()

        it 'will return null when undefined', (done) ->
          ke = kinveyInstance.entity({_acl:{gw:undefined}})
          (ke._acl.getGloballyWritable() is null).should.be.true
          done()

      describe 'set global readability', (done) ->

        it 'will set to true when passed in', (done) ->
          ke = kinveyInstance.entity()
          ke._acl.setGloballyReadable(true)
          ke._acl.getGloballyReadable().should.be.true
          done()

        it 'will set to false when passed in', (done) ->
          ke = kinveyInstance.entity()
          ke._acl.setGloballyReadable(false)
          ke._acl.getGloballyReadable().should.be.false
          done()

        it 'will return entity acls for method chaining', (done) ->
          ke = kinveyInstance.entity()
          ke._acl.setGloballyReadable(true).getGloballyReadable().should.be.true
          done()

      describe 'set global writability', (done) ->

        it 'will set to true when passed in', (done) ->
          ke = kinveyInstance.entity()
          ke._acl.setGloballyWritable(true)
          ke._acl.getGloballyWritable().should.be.true
          done()

        it 'will set to false when passed in', (done) ->
          ke = kinveyInstance.entity()
          ke._acl.setGloballyWritable(false)
          ke._acl.getGloballyWritable().should.be.false
          done()

        it 'will return entity acls for method chaining', (done) ->
          ke = kinveyInstance.entity()
          ke._acl.setGloballyWritable(true).getGloballyWritable().should.be.true
          done()

