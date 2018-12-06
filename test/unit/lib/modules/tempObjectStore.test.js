/**
 * Copyright (c) 2018 Kinvey Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

const objectStoreModule = require('../../../../lib/service/modules/tempObjectStore');

const testTempObjectStore = {};
const tempObjectStore = objectStoreModule(testTempObjectStore);

describe('tempObjectStore', () => {
  describe('when passing in an object during initialization', () => {
    afterEach((done) => {
      const keys = Object.keys(testTempObjectStore);
      keys.forEach(key => delete testTempObjectStore[key]);
      return done();
    });
    it('can set values', (done) => {
      tempObjectStore.set('test', 'testValue');
      testTempObjectStore.should.have.property('test');
      testTempObjectStore.test.should.eql('testValue');
      return done();
    });
    it('can retrieve values', (done) => {
      tempObjectStore.set('test', 'testValue');
      tempObjectStore.get('test').should.eql('testValue');
      return done();
    });
    return it('can retrieve entire object store', (done) => {
      tempObjectStore.set('test', 'testValue');
      tempObjectStore.set('test2', 'testValue2');
      tempObjectStore.set('test3', 'testValue3');
      tempObjectStore.getAll().should.eql({
        test: 'testValue',
        test2: 'testValue2',
        test3: 'testValue3'
      });
      return done();
    });
  });
  return describe('when no object is passed in during initialization', () => {
    let undefinedTempObjectStore = null;
    beforeEach((done) => {
      undefinedTempObjectStore = objectStoreModule();
      return done();
    });
    afterEach((done) => {
      undefinedTempObjectStore = null;
      return done();
    });
    it('can set and retrieve values', (done) => {
      undefinedTempObjectStore.set('test', 'testValue');
      undefinedTempObjectStore.get('test').should.eql('testValue');
      return done();
    });
    return it('can retrieve entire object store', (done) => {
      undefinedTempObjectStore.set('test', 'testValue');
      undefinedTempObjectStore.set('test2', 'testValue2');
      undefinedTempObjectStore.set('test3', 'testValue3');
      undefinedTempObjectStore.getAll().should.eql({
        test: 'testValue',
        test2: 'testValue2',
        test3: 'testValue3'
      });
      return done();
    });
  });
});
