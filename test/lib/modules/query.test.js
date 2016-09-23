/**
 * Copyright (c) 2016 Kinvey Inc.
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

const Query = require('../../../lib/service/modules/query');

describe('Query', () => {
  describe('toQueryString()', () => {
    it('should have a query property', () => {
      const query = new Query();
      query.equalTo('name', 'tests');
      const queryString = query.toQueryString();
      queryString.should.containDeep({ query: '{"name":"tests"}' });
    });

    it('should not have a query property', () => {
      const query = new Query();
      const queryString = query.toQueryString();
      queryString.should.not.have.ownProperty('query');
    });

    it('should have a fields property', () => {
      const query = new Query();
      query.fields = ['foo', 'bar'];
      const queryString = query.toQueryString();
      queryString.should.containDeep({ fields: 'foo,bar' });
    });

    it('should not have a fields property', () => {
      const query = new Query();
      const queryString = query.toQueryString();
      queryString.should.not.have.ownProperty('fields');
    });

    it('should have a limit property', () => {
      const query = new Query();
      query.limit = 10;
      const queryString = query.toQueryString();
      queryString.should.containDeep({ limit: 10 });
    });

    it('should not have a limit property', () => {
      const query = new Query();
      const queryString = query.toQueryString();
      queryString.should.not.have.ownProperty('limit');
    });

    it('should have a skip property', () => {
      const query = new Query();
      query.skip = 10;
      const queryString = query.toQueryString();
      queryString.should.containDeep({ skip: 10 });
    });

    it('should not have a skip property', () => {
      const query = new Query();
      query.skip = 0;
      const queryString = query.toQueryString();
      queryString.should.not.have.ownProperty('skip');
    });

    it('should have a sort property', () => {
      const query = new Query();
      query.ascending('foo');
      const queryString = query.toQueryString();
      queryString.should.containDeep({ sort: '{"foo":1}' });
    });

    it('should not have a sort property', () => {
      const query = new Query();
      const queryString = query.toQueryString();
      queryString.should.not.have.ownProperty('sort');
    });
  });
});
