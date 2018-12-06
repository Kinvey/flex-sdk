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

const should = require('should');
const kinveyModule = require('../../../../lib/service/modules/kinveyEntity');

const testEnvironmentId = 'test environment ID';

describe('modules / kinvey', () => {
  let kinveyInstance = null;
  const stubEntityProperties = ['_id', '_acl', '_kmd'];
  const stubEntityACLProperties = ['creator'];
  const stubEntityKMDProperties = ['lmt', 'ect'];
  before((done) => {
    kinveyInstance = kinveyModule(testEnvironmentId);
    return done();
  });
  describe('isKinveyEntity function', () => {
    it('returns false when null is passed in', (done) => {
      kinveyInstance.isKinveyEntity(null).should.be.false();
      return done();
    });
    it('returns false when undefined is passed in', (done) => {
      kinveyInstance.isKinveyEntity(undefined).should.be.false();
      return done();
    });
    it('returns false when an empty object is passed in', (done) => {
      kinveyInstance.isKinveyEntity({}).should.be.false();
      return done();
    });
    it('returns false when a populated object is passed in', (done) => {
      kinveyInstance.isKinveyEntity({ prop: 1 }).should.be.false();
      return done();
    });
    it('returns false when a string is passed in', (done) => {
      kinveyInstance.isKinveyEntity('hello').should.be.false();
      return done();
    });
    it('returns false when a number is passed in', (done) => {
      kinveyInstance.isKinveyEntity(1).should.be.false();
      return done();
    });
    it('returns false when a function is passed in', (done) => {
      kinveyInstance.isKinveyEntity(() => true).should.be.false();
      return done();
    });
    it('returns false when an error is passed in', (done) => {
      kinveyInstance.isKinveyEntity(new Error('error')).should.be.false();
      return done();
    });
    it('returns true when a kinvey entity is passed in', (done) => {
      kinveyInstance.isKinveyEntity(kinveyInstance.entity()).should.be.true();
      return done();
    });
    return it('returns false if _acl methods are not available', (done) => {
      const entity = kinveyInstance.entity();
      entity._acl = {};
      kinveyInstance.isKinveyEntity(entity).should.be.false();
      return done();
    });
  });

  describe('entity creation', () => {
    it('returns an kinveyized JS object of type Object', (done) => {
      const ke = kinveyInstance.entity();
      kinveyInstance.isKinveyEntity(ke).should.be.true();
      return done();
    });
    it('creates a stub kinvey entity when nothing is passed in', (done) => {
      const ke = kinveyInstance.entity();
      ke.should.have.properties(stubEntityProperties);
      ke._acl.should.have.properties(stubEntityACLProperties);
      ke._kmd.should.have.properties(stubEntityKMDProperties);
      return done();
    });
    it('creates a stub kinvey entity when an empty object is passed in', (done) => {
      const ke = kinveyInstance.entity({});
      ke.should.have.properties(stubEntityProperties);
      ke._acl.should.have.properties(stubEntityACLProperties);
      ke._kmd.should.have.properties(stubEntityKMDProperties);
      return done();
    });
    it('fills in missing kinvey metadata when object with _acl is passed in', (done) => {
      const ke = kinveyInstance.entity({
        _acl: {
          r: [1, 2, 3],
          w: [1, 2, 3]
        }
      });
      ke.should.have.properties(stubEntityProperties);
      ke._acl.should.have.properties(stubEntityACLProperties);
      ke._kmd.should.have.properties(stubEntityKMDProperties);
      return done();
    });
    it('adds KinveyEntity properties when object with values is passed in', (done) => {
      const ke = kinveyInstance.entity({
        key: 'value'
      });
      ke.should.have.properties(stubEntityProperties);
      ke._acl.should.have.properties(stubEntityACLProperties);
      ke._kmd.should.have.properties(stubEntityKMDProperties);
      ke.key.should.eql('value');
      return done();
    });
    it('retains all existing kinvey metadata when a kinveyEntity is passed in', (done) => {
      const ke1 = kinveyInstance.entity({
        key: 'value'
      });
      const ke2 = kinveyInstance.entity(ke1);
      ke1.should.eql(ke2);
      return done();
    });
    it('retains existing _id when a kinveyEntity with existing _id is passed in', (done) => {
      const existingId = 'existing_id';
      const testObject = {
        _id: existingId,
        key: 'value'
      };
      const ke = kinveyInstance.entity(testObject);
      ke._id.should.eql(existingId);
      return done();
    });
    it('returns the passed in object', (done) => {
      const testObject = {
        first: 1
      };
      const ke = kinveyInstance.entity(testObject);
      should.strictEqual(ke, testObject);
      return done();
    });
    it('The _acl convenience functions are not enumerable', (done) => {
      const testObject = {
        first: 1
      };
      const aclFunctionSignatures =
        ['getCreator',
          'getReaders',
          'addReader',
          'removeReader',
          'getWriters',
          'addWriter',
          'removeWriter',
          'getReaderGroups',
          'addReaderGroup',
          'removeReaderGroup',
          'getWriterGroups',
          'addWriterGroup',
          'removeWriterGroup',
          'getGloballyReadable',
          'getGloballyWritable',
          'setGloballyReadable',
          'setGloballyWritable',
          'getReaderRoles',
          'getUpdateRoles',
          'getDeleteRoles',
          'addReaderRole',
          'addUpdateRole',
          'addDeleteRole',
          'removeReaderRole',
          'removeUpdateRole',
          'removeDeleteRole'
        ];
      kinveyInstance.entity(testObject);
      const keys = Object.keys(testObject._acl);
      for (let i = 0, len = aclFunctionSignatures.length; i < len; i++) { // eslint-disable-line no-plusplus
        const aclFunctionSignature = aclFunctionSignatures[i];
        (typeof testObject._acl[aclFunctionSignature]).should.eql('function');
        keys.indexOf(aclFunctionSignature).should.eql(-1);
      }
      return done();
    });
    describe('ACL', () => {
      describe('getCreator', () => {
        it('returns envId for stub entity', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.getCreator().should.eql(testEnvironmentId);
          return done();
        });
        return it('returns correct value when creator is set on creation of entity', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              creator: 'ME'
            }
          });
          ke._acl.getCreator().should.eql('ME');
          return done();
        });
      });
      describe('getReaders', () => {
        it('returns empty array for stub entity with no readers', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.getReaders().should.eql([]);
          return done();
        });
        return it('returns correct value for entity with readers', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              r: [1, 2, 3]
            }
          });
          ke._acl.getReaders().should.eql([1, 2, 3]);
          return done();
        });
      });
      describe('addReader', () => {
        it('adds a reader for stub entity with no readers', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.addReader('12345');
          ke._acl.getReaders().should.eql(['12345']);
          return done();
        });
        it('adds a reader for stub entity with existing readers', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              r: [1, 2, 3]
            }
          });
          ke._acl.addReader(12345);
          ke._acl.getReaders().should.eql([1, 2, 3, 12345]);
          return done();
        });
        it('wont add an existing reader id', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              r: [1, 2, 3]
            }
          });
          ke._acl.addReader(1);
          ke._acl.getReaders().should.eql([1, 2, 3]);
          return done();
        });
        return it('returns entity acls for method chaining', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              r: [1, 2, 3]
            }
          });
          ke._acl.addReader(1).getReaders().should.eql([1, 2, 3]);
          return done();
        });
      });
      describe('removeReader', () => {
        it('removes a reader when a match is found', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              r: [1, 2, 3]
            }
          });
          ke._acl.removeReader(1);
          ke._acl.getReaders().should.eql([2, 3]);
          return done();
        });
        it('does nothing when a match is not found', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              r: [1, 2, 3]
            }
          });
          ke._acl.removeReader(4);
          ke._acl.getReaders().should.eql([1, 2, 3]);
          return done();
        });
        it('will remove all instances of an id', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              r: [1, 2, 3, 1]
            }
          });
          ke._acl.removeReader(1);
          ke._acl.getReaders().should.eql([2, 3]);
          return done();
        });
        return it('returns entity acls for method chaining', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              r: [1, 2, 3, 1]
            }
          });
          ke._acl.removeReader(1).getReaders().should.eql([2, 3]);
          return done();
        });
      });
      describe('getWriters', () => {
        it('returns empty for stub entity with no writers', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.getWriters().should.eql([]);
          return done();
        });
        return it('returns array for entity with readers', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              w: [1, 2, 3]
            }
          });
          ke._acl.getWriters().should.eql([1, 2, 3]);
          return done();
        });
      });
      describe('addWriters', () => {
        it('adds a writers for stub entity with no writers', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.addWriter('12345');
          ke._acl.getWriters().should.eql(['12345']);
          return done();
        });
        it('adds a reader for stub entity with existing readers', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              w: [1, 2, 3]
            }
          });
          ke._acl.addWriter(12345);
          ke._acl.getWriters().should.eql([1, 2, 3, 12345]);
          return done();
        });
        it('wont add an existing reader id', (done) => {
          let ke = kinveyInstance.entity({
            _acl: {
              r: [1, 2, 3]
            }
          });
          ke._acl.addReader(1);
          ke._acl.getReaders().should.eql([1, 2, 3]);
          done();
          return it('returns entity acls for method chaining', (done) => {
            ke = kinveyInstance.entity({
              _acl: {
                w: [1, 2, 3]
              }
            });
            ke._acl.addWriter(12345).getWriters().should.eql([1, 2, 3, 12345]);
            return done();
          });
        });
        describe('removeWriter', () => {
          it('removes a writer when a match is found', (done) => {
            const ke = kinveyInstance.entity({
              _acl: {
                w: [1, 2, 3]
              }
            });
            ke._acl.removeWriter(1);
            ke._acl.getWriters().should.eql([2, 3]);
            return done();
          });
          it('does nothing when a match is not found', (done) => {
            const ke = kinveyInstance.entity({
              _acl: {
                w: [1, 2, 3]
              }
            });
            ke._acl.removeWriter(4);
            ke._acl.getWriters().should.eql([1, 2, 3]);
            return done();
          });
          it('will remove all instances of an id', (done) => {
            const ke = kinveyInstance.entity({
              _acl: {
                w: [1, 2, 3, 1]
              }
            });
            ke._acl.removeWriter(1);
            ke._acl.getWriters().should.eql([2, 3]);
            return done();
          });
          return it('returns entity acls for method chaining', (done) => {
            const ke = kinveyInstance.entity({
              _acl: {
                w: [1, 2, 3, 1]
              }
            });
            ke._acl.removeWriter(1).getWriters().should.eql([2, 3]);
            return done();
          });
        });
      });
      describe('getReaderGroups', () => {
        it('returns empty array when no group readers', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.getReaderGroups().should.eql([]);
          return done();
        });
        return it('returns correct value for entity with readers', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {
                r: [1, 2, 3]
              }
            }
          });
          ke._acl.getReaderGroups().should.eql([1, 2, 3]);
          return done();
        });
      });
      describe('addReaderGroup', () => {
        it('Adds a reader to an stub entity', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.addReaderGroup('1');
          ke._acl.getReaderGroups().should.eql(['1']);
          return done();
        });
        it('wont add an existing reader id', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {
                r: [1, 2, 3]
              }
            }
          });
          ke._acl.addReaderGroup(1);
          ke._acl.getReaderGroups().should.eql([1, 2, 3]);
          return done();
        });
        it('appends a group ID to existing list', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {
                r: [1, 2, 3]
              }
            }
          });
          ke._acl.addReaderGroup(4);
          ke._acl.getReaderGroups().should.eql([1, 2, 3, 4]);
          return done();
        });
        return it('returns entity acls for method chaining', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {
                r: [1, 2, 3]
              }
            }
          });
          ke._acl.addReaderGroup(4).getReaderGroups().should.eql([1, 2, 3, 4]);
          return done();
        });
      });
      describe('removeReaderGroup', () => {
        it('removes a reader group when a match is found', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {
                r: [1, 2, 3]
              }
            }
          });
          ke._acl.removeReaderGroup(1);
          ke._acl.getReaderGroups().should.eql([2, 3]);
          return done();
        });
        it('does nothing when a match is not found', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {
                r: [1, 2, 3]
              }
            }
          });
          ke._acl.removeReaderGroup(4);
          ke._acl.getReaderGroups().should.eql([1, 2, 3]);
          return done();
        });
        it('does nothing when no reader groups are defined', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {}
            }
          });
          ke._acl.removeReaderGroup(1);
          ke._acl.getReaderGroups().should.eql([]);
          return done();
        });
        it('will remove all instances of a group id', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {
                r: [1, 2, 3, 1]
              }
            }
          });
          ke._acl.removeReaderGroup(1);
          ke._acl.getReaderGroups().should.eql([2, 3]);
          return done();
        });
        return it('returns entity acls for method chaining', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {
                r: [1, 2, 3, 1]
              }
            }
          });
          ke._acl.removeReaderGroup(1).getReaderGroups().should.eql([2, 3]);
          return done();
        });
      });
      describe('getWriterGroups', () => {
        it('returns empty array when no group writers', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.getWriterGroups().should.eql([]);
          return done();
        });
        return it('returns correct value for entity with readers', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {
                w: [1, 2, 3]
              }
            }
          });
          ke._acl.getWriterGroups().should.eql([1, 2, 3]);
          return done();
        });
      });
      describe('addWriterGroup', () => {
        it('Adds a reader to an stub entity with no existing reader groups', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.addWriterGroup('1');
          ke._acl.getWriterGroups().should.eql(['1']);
          return done();
        });
        it('wont add an existing reader id', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {
                w: [1, 2, 3]
              }
            }
          });
          ke._acl.addWriterGroup(1);
          ke._acl.getWriterGroups().should.eql([1, 2, 3]);
          return done();
        });
        it('appends a group ID to existing list', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {
                w: [1, 2, 3]
              }
            }
          });
          ke._acl.addWriterGroup(4);
          ke._acl.getWriterGroups().should.eql([1, 2, 3, 4]);
          return done();
        });
        return it('returns entity acls for method chaining', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {
                w: [1, 2, 3]
              }
            }
          });
          ke._acl.addWriterGroup(4).getWriterGroups().should.eql([1, 2, 3, 4]);
          return done();
        });
      });
      describe('removeWriterGroup', () => {
        it('Returns the acl of the kinvey entity for method chaining', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {
                w: [1, 2, 3]
              }
            }
          });
          ke._acl.removeWriterGroup(1).getWriterGroups().should.eql([2, 3]);
          return done();
        });
        it('removes a writer group when a match is found', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {
                w: [1, 2, 3]
              }
            }
          });
          ke._acl.removeWriterGroup(1);
          ke._acl.getWriterGroups().should.eql([2, 3]);
          return done();
        });
        it('does nothing when a match is not found', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {
                w: [1, 2, 3]
              }
            }
          });
          ke._acl.removeWriterGroup(4);
          ke._acl.getWriterGroups().should.eql([1, 2, 3]);
          return done();
        });
        it('does nothing when no writer groups are defined', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {}
            }
          });
          ke._acl.removeWriterGroup(1);
          ke._acl.getWriterGroups().should.eql([]);
          return done();
        });
        it('will remove all instances of a group id', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {
                w: [1, 2, 3, 1]
              }
            }
          });
          ke._acl.removeWriterGroup(1);
          ke._acl.getWriterGroups().should.eql([2, 3]);
          return done();
        });
        it('returns entity acls for method chaining', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              groups: {
                w: [1, 2, 3, 1]
              }
            }
          });
          ke._acl.removeWriterGroup(1).getWriterGroups().should.eql([2, 3]);
          return done();
        });
      });
      describe('getReaderRoles', () => {
        it('returns empty array when no role readers', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.getReaderRoles().should.eql([]);
          return done();
        });
        return it('returns correct value for entity with readers', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                r: [1, 2, 3]
              }
            }
          });
          ke._acl.getReaderRoles().should.eql([1, 2, 3]);
          return done();
        });
      });
      describe('addReaderRole', () => {
        it('Adds a reader to an stub entity', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.addReaderRole('1');
          ke._acl.getReaderRoles().should.eql(['1']);
          return done();
        });
        it('wont add an existing reader id', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                r: [1, 2, 3]
              }
            }
          });
          ke._acl.addReaderRole(1);
          ke._acl.getReaderRoles().should.eql([1, 2, 3]);
          return done();
        });
        it('appends a role ID to existing list', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                r: [1, 2, 3]
              }
            }
          });
          ke._acl.addReaderRole(4);
          ke._acl.getReaderRoles().should.eql([1, 2, 3, 4]);
          return done();
        });
        return it('returns entity acls for method chaining', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                r: [1, 2, 3]
              }
            }
          });
          ke._acl.addReaderRole(4).getReaderRoles().should.eql([1, 2, 3, 4]);
          return done();
        });
      });
      describe('removeReaderRole', () => {
        it('removes a reader role when a match is found', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                r: [1, 2, 3]
              }
            }
          });
          ke._acl.removeReaderRole(1);
          ke._acl.getReaderRoles().should.eql([2, 3]);
          return done();
        });
        it('does nothing when a match is not found', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                r: [1, 2, 3]
              }
            }
          });
          ke._acl.removeReaderRole(4);
          ke._acl.getReaderRoles().should.eql([1, 2, 3]);
          return done();
        });
        it('does nothing when no reader roles are defined', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {}
            }
          });
          ke._acl.removeReaderRole(1);
          ke._acl.getReaderRoles().should.eql([]);
          return done();
        });
        it('will remove all instances of a role id', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                r: [1, 2, 3, 1]
              }
            }
          });
          ke._acl.removeReaderRole(1);
          ke._acl.getReaderRoles().should.eql([2, 3]);
          return done();
        });
        return it('returns entity acls for method chaining', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                r: [1, 2, 3, 1]
              }
            }
          });
          ke._acl.removeReaderRole(1).getReaderRoles().should.eql([2, 3]);
          return done();
        });
      });
      describe('getUpdateRoles', () => {
        it('returns empty array when no role updates', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.getUpdateRoles().should.eql([]);
          return done();
        });
        return it('returns correct value for entity with updates', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                u: [1, 2, 3]
              }
            }
          });
          ke._acl.getUpdateRoles().should.eql([1, 2, 3]);
          return done();
        });
      });
      describe('addUpdateRole', () => {
        it('Adds a update to an stub entity', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.addUpdateRole('1');
          ke._acl.getUpdateRoles().should.eql(['1']);
          return done();
        });
        it('wont add an existing update id', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                u: [1, 2, 3]
              }
            }
          });
          ke._acl.addUpdateRole(1);
          ke._acl.getUpdateRoles().should.eql([1, 2, 3]);
          return done();
        });
        it('appends a role ID to existing list', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                u: [1, 2, 3]
              }
            }
          });
          ke._acl.addUpdateRole(4);
          ke._acl.getUpdateRoles().should.eql([1, 2, 3, 4]);
          return done();
        });
        return it('returns entity acls for method chaining', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                u: [1, 2, 3]
              }
            }
          });
          ke._acl.addUpdateRole(4).getUpdateRoles().should.eql([1, 2, 3, 4]);
          return done();
        });
      });
      describe('removeUpdateRole', () => {
        it('removes a update role when a match is found', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                u: [1, 2, 3]
              }
            }
          });
          ke._acl.removeUpdateRole(1);
          ke._acl.getUpdateRoles().should.eql([2, 3]);
          return done();
        });
        it('does nothing when a match is not found', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                u: [1, 2, 3]
              }
            }
          });
          ke._acl.removeUpdateRole(4);
          ke._acl.getUpdateRoles().should.eql([1, 2, 3]);
          return done();
        });
        it('does nothing when no update roles are defined', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {}
            }
          });
          ke._acl.removeUpdateRole(1);
          ke._acl.getUpdateRoles().should.eql([]);
          return done();
        });
        it('will remove all instances of a role id', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                u: [1, 2, 3, 1]
              }
            }
          });
          ke._acl.removeUpdateRole(1);
          ke._acl.getUpdateRoles().should.eql([2, 3]);
          return done();
        });
        return it('returns entity acls for method chaining', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                u: [1, 2, 3, 1]
              }
            }
          });
          ke._acl.removeUpdateRole(1).getUpdateRoles().should.eql([2, 3]);
          return done();
        });
      });
      describe('getDeleteRoles', () => {
        it('returns empty array when no role deletes', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.getDeleteRoles().should.eql([]);
          return done();
        });
        return it('returns correct value for entity with deletes', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                d: [1, 2, 3]
              }
            }
          });
          ke._acl.getDeleteRoles().should.eql([1, 2, 3]);
          return done();
        });
      });
      describe('addDeleteRole', () => {
        it('Adds a delete to an stub entity', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.addDeleteRole('1');
          ke._acl.getDeleteRoles().should.eql(['1']);
          return done();
        });
        it('wont add an existing delete id', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                d: [1, 2, 3]
              }
            }
          });
          ke._acl.addDeleteRole(1);
          ke._acl.getDeleteRoles().should.eql([1, 2, 3]);
          return done();
        });
        it('appends a role ID to existing list', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                d: [1, 2, 3]
              }
            }
          });
          ke._acl.addDeleteRole(4);
          ke._acl.getDeleteRoles().should.eql([1, 2, 3, 4]);
          return done();
        });
        return it('returns entity acls for method chaining', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                d: [1, 2, 3]
              }
            }
          });
          ke._acl.addDeleteRole(4).getDeleteRoles().should.eql([1, 2, 3, 4]);
          return done();
        });
      });
      describe('removeDeleteRole', () => {
        it('removes a delete role when a match is found', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                d: [1, 2, 3]
              }
            }
          });
          ke._acl.removeDeleteRole(1);
          ke._acl.getDeleteRoles().should.eql([2, 3]);
          return done();
        });
        it('does nothing when a match is not found', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                d: [1, 2, 3]
              }
            }
          });
          ke._acl.removeDeleteRole(4);
          ke._acl.getDeleteRoles().should.eql([1, 2, 3]);
          return done();
        });
        it('does nothing when no delete roles are defined', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {}
            }
          });
          ke._acl.removeDeleteRole(1);
          ke._acl.getDeleteRoles().should.eql([]);
          return done();
        });
        it('will remove all instances of a role id', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                d: [1, 2, 3, 1]
              }
            }
          });
          ke._acl.removeDeleteRole(1);
          ke._acl.getDeleteRoles().should.eql([2, 3]);
          return done();
        });
        return it('returns entity acls for method chaining', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              roles: {
                d: [1, 2, 3, 1]
              }
            }
          });
          ke._acl.removeDeleteRole(1).getDeleteRoles().should.eql([2, 3]);
          return done();
        });
      });
      describe('get global readability', () => {
        it('will return null when globally readable is not set', (done) => {
          const ke = kinveyInstance.entity();
          (ke._acl.getGloballyReadable() === null).should.be.true();
          return done();
        });
        it('will return true when globally readable is true', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              gr: true
            }
          });
          ke._acl.getGloballyReadable().should.be.true();
          return done();
        });
        it('will return false when globally readable is false', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              gr: false
            }
          });
          ke._acl.getGloballyReadable().should.be.false();
          return done();
        });
        return it('will return null when globally readable is undefined', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              gr: undefined
            }
          });
          (ke._acl.getGloballyReadable() === null).should.be.true();
          return done();
        });
      });
      describe('get global writability', () => {
        it('will return null when not set', (done) => {
          const ke = kinveyInstance.entity();
          (ke._acl.getGloballyWritable() === null).should.be.true();
          return done();
        });
        it('will return true when true', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              gw: true
            }
          });
          ke._acl.getGloballyWritable().should.be.true();
          return done();
        });
        it('will return false when false', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              gw: false
            }
          });
          ke._acl.getGloballyWritable().should.be.false();
          return done();
        });
        return it('will return null when undefined', (done) => {
          const ke = kinveyInstance.entity({
            _acl: {
              gw: undefined
            }
          });
          (ke._acl.getGloballyWritable() === null).should.be.true();
          return done();
        });
      });
      describe('set global readability', () => {
        it('will set to true when passed in', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.setGloballyReadable(true);
          ke._acl.getGloballyReadable().should.be.true();
          return done();
        });
        it('will set to false when passed in', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.setGloballyReadable(false);
          ke._acl.getGloballyReadable().should.be.false();
          return done();
        });
        return it('will return entity acls for method chaining', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.setGloballyReadable(true).getGloballyReadable().should.be.true();
          return done();
        });
      });
      return describe('set global writability', () => {
        it('will set to true when passed in', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.setGloballyWritable(true);
          ke._acl.getGloballyWritable().should.be.true();
          return done();
        });
        it('will set to false when passed in', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.setGloballyWritable(false);
          ke._acl.getGloballyWritable().should.be.false();
          return done();
        });
        return it('will return entity acls for method chaining', (done) => {
          const ke = kinveyInstance.entity();
          ke._acl.setGloballyWritable(true).getGloballyWritable().should.be.true();
          return done();
        });
      });
    });
  });
});
