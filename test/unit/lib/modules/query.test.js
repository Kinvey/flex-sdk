/* eslint prefer-arrow-callback: 0 */ // turning off because should.throws breaks with =>

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
const randomString = require('uuid').v4;
const Query = require('../../../../lib/service/modules/query');

describe('Query', () => {
  describe('constructor', () => {
    it('should throw error when fields is not an array', () => {
      should.throws(() => {
        const query = new Query();
        query.fields = {};
        return query;
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'fields must be an Array';
      });
    });

    it('should parse a limit from string', () => {
      const query = new Query();
      query.limit = '3';
      query.toPlainObject().limit.should.eql(3);
    });

    it('should parse a skip from string', () => {
      const query = new Query();
      query.skip = '10';
      query.toPlainObject().skip.should.eql(10);
    });
  });

  describe('fields', () => {
    it('should throw an error on invalid arguments', () => {
      should.throws(() => {
        const query = new Query();
        query.fields = {};
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'fields must be an Array';
      });
    });

    it('should set the fields', () => {
      const fields = [randomString(), randomString()];
      const query = new Query();
      query.fields = fields;
      query.toPlainObject().fields.should.eql(fields);
    });

    it('should reset the fields', () => {
      const query = new Query();
      query.fields = [];
      query.toPlainObject().fields.should.deepEqual([]);
    });
  });

  describe('limit', () => {
    it('should throw an error on invalid arguments', () => {
      should.throws(() => {
        const query = new Query();
        query.limit = {};
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'limit must be a number';
      });
    });

    it('should set the limit', () => {
      const limit = 10;
      const query = new Query();
      query.limit = limit;
      query.toPlainObject().limit.should.eql(limit);
    });

    it('should unset the limit', () => {
      const query = new Query();
      query.limit = null;
      should.equal(query.toPlainObject().limit, null);
    });
  });

  describe('skip', () => {
    it('should throw an error on invalid arguments', () => {
      should.throws(() => {
        const query = new Query();
        query.skip = {};
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'skip must be a number';
      });
    });

    it('should set the skip', () => {
      const skip = 10;
      const query = new Query();
      query.skip = skip;
      query.toPlainObject().skip.should.eql(skip);
    });

    it('should unset the skip', () => {
      const query = new Query();
      query.skip = 0;
      query.toPlainObject().skip.should.eql(0);
    });
  });

  describe('sort', () => {
    it('should set the sort', () => {
      const sort = {};
      sort[randomString()] = 1;
      const query = new Query();
      query.sort = sort;
      query.toPlainObject().sort.should.eql(sort);
    });

    it('should reset the sort.', () => {
      const query = new Query();
      query.sort = {};
      query.toPlainObject().sort.should.deepEqual({});
    });
  });

  describe('equalTo()', () => {
    it('should add an equal to filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.equalTo(field, value);
      query.toPlainObject().filter[field].should.eql(value);
    });

    it('should add an equal to filter for = 0', () => {
      const field = randomString();
      const value = 0;
      const query = new Query();
      query.equalTo(field, value);
      query.toPlainObject().filter[field].should.eql(0);
    });

    it('should add an equal to filter for = null', () => {
      const field = randomString();
      const value = null;
      const query = new Query();
      query.equalTo(field, value);
      should.equal(query.toPlainObject().filter[field], null);
    });

    it('should add an equal to filter for = false', () => {
      const field = randomString();
      const value = false;
      const query = new Query();
      query.equalTo(field, value);
      query.toPlainObject().filter[field].should.eql(false);
    });

    it('should add an equal to filter for = empty string', () => {
      const field = randomString();
      const value = '';
      const query = new Query();
      query.equalTo(field, value);
      query.toPlainObject().filter[field].should.eql('');
    });

    it('should add an equal to filter for = NaN', () => {
      const field = randomString();
      const value = NaN;
      const query = new Query();
      query.equalTo(field, value);
      query.toPlainObject().filter[field].should.eql(NaN);
    });

    it('should add an equal to filter for = empty object', () => {
      const field = randomString();
      const value = {};
      const query = new Query();
      query.equalTo(field, value);
      query.toPlainObject().filter[field].should.eql({});
    });

    it('should discard any existing filters on the same field', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.equalTo(field, randomString()); // Should be discarded
      query.equalTo(field, value);
      query.toPlainObject().filter[field].should.eql(value);
    });

    it('should return the query', () => {
      const query = new Query().equalTo(randomString(), randomString());
      query.should.be.an.instanceOf(Query);
    });
  });

  describe('contains()', () => {
    it('should accept a single value', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.contains(field, value);
      query.filter[field].should.deepEqual({ $in: [value] });
    });

    it('should accept an array of values', () => {
      const field = randomString();
      const value = [randomString(), randomString()];
      const query = new Query();
      query.contains(field, value);
      query.toPlainObject().filter[field].should.deepEqual({ $in: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.greaterThan(field, randomString());
      query.contains(field, [randomString()]);
      query.toPlainObject().filter[field].should.have.property('$gt');
    });

    it('should return the query', () => {
      const query = new Query().contains(randomString(), [randomString()]);
      query.should.be.an.instanceOf(Query);
    });
  });

  describe('containsAll()', () => {
    it('should accept a single value and add a contains all filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.containsAll(field, value);
      query.toPlainObject().filter[field].should.deepEqual({ $all: [value] });
    });

    it('should accept an array of values and add a contains all filter', () => {
      const field = randomString();
      const value = [randomString(), randomString()];
      const query = new Query();
      query.containsAll(field, value);
      query.toPlainObject().filter[field].should.deepEqual({ $all: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.greaterThan(field, randomString());
      query.containsAll(field, [randomString()]);
      query.toPlainObject().filter[field].should.have.property('$gt');
    });

    it('should return the query', () => {
      const query = new Query().containsAll(randomString(), [randomString()]);
      query.should.be.an.instanceOf(Query);
    });
  });

  describe('greaterThan()', () => {
    it('should throw an error with invalid arguments', () => {
      should.throws(() => {
        const query = new Query();
        query.greaterThan(randomString(), null);
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'You must supply a number or string.';
      });
    });

    it('should add a greater than filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.greaterThan(field, value);
      query.toPlainObject().filter[field].should.deepEqual({ $gt: value });
    });

    it('should add a greater than filter > 0', () => {
      const field = randomString();
      const value = 0;
      const query = new Query();
      query.greaterThan(field, value);
      query.toPlainObject().filter[field].should.deepEqual({ $gt: 0 });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.greaterThan(field, randomString());
      query.containsAll(field, [randomString()]);
      query.toPlainObject().filter[field].should.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().greaterThan(randomString(), randomString());
      query.should.be.an.instanceOf(Query);
    });
  });

  describe('greaterThanOrEqualTo()', () => {
    it('should throw an error with invalid arguments', () => {
      should.throws(() => {
        const query = new Query();
        query.greaterThanOrEqualTo(randomString(), null);
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'You must supply a number or string.';
      });
    });

    it('should add a greater than or equal filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.greaterThanOrEqualTo(field, value);
      query.toPlainObject().filter[field].should.deepEqual({ $gte: value });
    });

    it('should add a greater than or equal filter for >= 0', () => {
      const field = randomString();
      const value = 0;
      const query = new Query();
      query.greaterThanOrEqualTo(field, value);
      query.toPlainObject().filter[field].should.deepEqual({ $gte: 0 });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.greaterThanOrEqualTo(field, randomString());
      query.containsAll(field, [randomString()]);
      query.toPlainObject().filter[field].should.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().greaterThanOrEqualTo(randomString(), randomString());
      query.should.be.an.instanceOf(Query);
    });
  });

  describe('lessThan()', () => {
    it('should throw an error with invalid arguments', () => {
      should.throws(() => {
        const query = new Query();
        query.lessThan(randomString(), null);
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'You must supply a number or string.';
      });
    });

    it('should add a less than filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.lessThan(field, value);
      query.toPlainObject().filter[field].should.deepEqual({ $lt: value });
    });

    it('should add a less than filter for < 0', () => {
      const field = randomString();
      const value = 0;
      const query = new Query();
      query.lessThan(field, value);
      query.toPlainObject().filter[field].should.deepEqual({ $lt: 0 });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.lessThan(field, randomString());
      query.containsAll(field, [randomString()]);
      query.toPlainObject().filter[field].should.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().lessThan(randomString(), randomString());
      query.should.be.an.instanceOf(Query);
    });
  });

  describe('lessThanOrEqualTo()', () => {
    it('should throw an error with invalid arguments', () => {
      should.throws(() => {
        const query = new Query();
        query.lessThanOrEqualTo(randomString(), null);
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'You must supply a number or string.';
      });
    });

    it('should add a less than or equal filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.lessThanOrEqualTo(field, value);
      query.toPlainObject().filter[field].should.deepEqual({ $lte: value });
    });

    it('should add a less than or equal filter for <= 0', () => {
      const field = randomString();
      const value = 0;
      const query = new Query();
      query.lessThanOrEqualTo(field, value);
      query.toPlainObject().filter[field].should.deepEqual({ $lte: 0 });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.lessThanOrEqualTo(field, randomString());
      query.containsAll(field, [randomString()]);
      query.toPlainObject().filter[field].should.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().lessThanOrEqualTo(randomString(), randomString());
      query.should.be.an.instanceOf(Query);
    });
  });

  describe('notEqualTo()', () => {
    it('should add a not equal to filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.notEqualTo(field, value);
      query.toPlainObject().filter[field].should.deepEqual({ $ne: value });
    });

    it('should add an equal to filter for = 0', () => {
      const field = randomString();
      const value = 0;
      const query = new Query();
      query.notEqualTo(field, value);
      query.toPlainObject().filter[field].should.containEql({ $ne: 0 });
    });

    it('should add an equal to filter for = null', () => {
      const field = randomString();
      const value = null;
      const query = new Query();
      query.notEqualTo(field, value);
      query.toPlainObject().filter[field].should.containEql({ $ne: null });
    });

    it('should add an equal to filter for = false', () => {
      const field = randomString();
      const value = false;
      const query = new Query();
      query.notEqualTo(field, value);
      query.toPlainObject().filter[field].should.containEql({ $ne: false });
    });

    it('should add an equal to filter for = empty string', () => {
      const field = randomString();
      const value = '';
      const query = new Query();
      query.notEqualTo(field, value);
      query.toPlainObject().filter[field].should.containEql({ $ne: '' });
    });

    it('should add an equal to filter for = NaN', () => {
      const field = randomString();
      const value = NaN;
      const query = new Query();
      query.notEqualTo(field, value);
      query.toPlainObject().filter[field].should.containEql({ $ne: NaN });
    });

    it('should add an equal to filter for = empty object', () => {
      const field = randomString();
      const value = {};
      const query = new Query();
      query.notEqualTo(field, value);
      query.toPlainObject().filter[field].should.containEql({ $ne: {} });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.notEqualTo(field, randomString());
      query.containsAll(field, [randomString()]);
      query.toPlainObject().filter[field].should.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().notEqualTo(randomString(), randomString());
      query.should.be.an.instanceof(Query);
    });

    it('should filter out fields not equal to null', () => {
      const entity1 = { customProperty: null };
      const entity2 = { customProperty: randomString() };
      const query = new Query().notEqualTo('customProperty', null);
      const result = query.process([entity1, entity2]);
      result.length.should.eql(1);
      result[0].should.deepEqual(entity2);
    });
  });

  describe('notContainedIn()', () => {
    it('should accept a single value and add a not contained in filter', () => {
      const field = randomString();
      const value = randomString();
      const query = new Query();
      query.notContainedIn(field, value);
      query.toPlainObject().filter[field].should.deepEqual({ $nin: [value] });
    });

    it('should accept an array of values and add a not contained in filter', () => {
      const field = randomString();
      const value = [randomString(), randomString()];
      const query = new Query();
      query.notContainedIn(field, value);
      query.toPlainObject().filter[field].should.deepEqual({ $nin: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.notContainedIn(field, randomString());
      query.containsAll(field, [randomString()]);
      query.toPlainObject().filter[field].should.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().notContainedIn(randomString(), randomString());
      query.should.be.an.instanceof(Query);
    });
  });

  describe('and()', () => {
    describe('when called with arguments', () => {
      it('should throw an error with invalid arguments', () => {
        should.throws(() => {
          const query = new Query();
          query.and(randomString(), null);
        }, function error(err) {
          return err.toString() === 'Error: QueryError'
            && err.debug === 'query argument must be of type: Kinvey.Query[] or Object[].';
        });
      });

      it('should join a query', () => {
        const query = new Query();
        query.and(new Query());
        query.toPlainObject().filter.should.have.property('$and');
        query.toPlainObject().filter.$and.length.should.equal(2);
      });

      it('should join a query object', () => {
        const query = new Query();
        query.and({ filter: {} });
        query.toPlainObject().filter.should.have.property('$and');
        query.toPlainObject().filter.$and.length.should.eql(2);
      });

      it('should join multiple queries at once', () => {
        const query = new Query();
        query.and(new Query(), new Query());
        query.toPlainObject().filter.should.have.property('$and');
        query.toPlainObject().filter.$and.length.should.eql(3);
      });

      it('should return the query', () => {
        const query = new Query().and(new Query());
        query.should.be.an.instanceOf(Query);
      });
    });

    describe('when called without arguments', () => {
      it('should return a subquery', () => {
        const query1 = new Query();
        const query2 = query1.and();
        query2.should.be.an.instanceOf(Query);
        query2._parent.should.deepEqual(query1);
      });

      it('should update the original query', () => {
        const field = randomString();
        const value = randomString();
        const query = new Query();
        query.and().greaterThan(field, value);
        query.toPlainObject().filter.should.have.property('$and');
        query.toPlainObject().filter.$and[1][field].should.deepEqual({ $gt: value });
      });
    });
  });

  describe('nor()', () => {
    describe('when called with arguments', () => {
      it('should throw an error with invalid arguments', () => {
        should.throws(() => {
          const query = new Query();
          query.nor(randomString(), null);
        }, function error(err) {
          return err.toString() === 'Error: QueryError'
            && err.debug === 'query argument must be of type: Kinvey.Query[] or Object[].';
        });
      });

      it('should join a query', () => {
        const query = new Query();
        query.nor(new Query());
        query.toPlainObject().filter.should.have.property('$nor');
        query.toPlainObject().filter.$nor.length.should.eql(2);
      });

      it('should join a query object', () => {
        const query = new Query();
        query.nor({ filter: {} });
        query.toPlainObject().filter.should.have.property('$nor');
        query.toPlainObject().filter.$nor.length.should.eql(2);
      });

      it('should join multiple queries at once', () => {
        const query = new Query();
        query.nor(new Query(), new Query());
        query.toPlainObject().filter.should.have.property('$nor');
        query.toPlainObject().filter.$nor.length.should.equal(3);
      });

      it('should return the query', () => {
        const query = new Query().nor(new Query());
        query.should.be.an.instanceOf(Query);
      });
    });

    describe('when called without arguments', () => {
      it('should return a subquery', () => {
        const query1 = new Query();
        const query2 = query1.nor();
        query2.should.be.an.instanceOf(Query);
        query2._parent.should.deepEqual(query1);
      });

      it('should update the original query', () => {
        const field = randomString();
        const value = randomString();
        const query = new Query();
        query.nor().greaterThan(field, value);
        query.toPlainObject().filter.should.have.property('$nor');
        query.toPlainObject().filter.$nor[1][field].should.deepEqual({ $gt: value });
      });
    });
  });

  describe('or()', () => {
    describe('when called with arguments', () => {
      it('should throw an error with invalid arguments', () => {
        should.throws(() => {
          const query = new Query();
          query.or(randomString(), null);
        }, function error(err) {
          return err.toString() === 'Error: QueryError'
            && err.debug === 'query argument must be of type: Kinvey.Query[] or Object[].';
        });
      });

      it('should join a query', () => {
        const query = new Query();
        query.or(new Query());
        query.toPlainObject().filter.should.have.property('$or');
        query.toPlainObject().filter.$or.length.should.eql(2);
      });

      it('should join a query object', () => {
        const query = new Query();
        query.or({ filter: {} });
        query.toPlainObject().filter.should.have.property('$or');
        query.toPlainObject().filter.$or.length.should.eql(2);
      });

      it('should join multiple queries at once', () => {
        const query = new Query();
        query.or(new Query(), new Query());
        query.toPlainObject().filter.should.have.property('$or');
        query.toPlainObject().filter.$or.length.should.eql(3);
      });

      it('should return the query', () => {
        const query = new Query().or(new Query());
        query.should.be.an.instanceOf(Query);
      });
    });

    describe('when called without arguments', () => {
      it('should return a subquery', () => {
        const query1 = new Query();
        const query2 = query1.or();
        query2.should.be.an.instanceOf(Query);
        query2._parent.should.deepEqual(query1);
      });

      it('should update the original query', () => {
        const field = randomString();
        const value = randomString();
        const query = new Query();
        query.or().greaterThan(field, value);
        query.toPlainObject().filter.should.have.property('$or');
        query.toPlainObject().filter.$or[1][field].should.deepEqual({ $gt: value });
      });
    });
  });

  describe('the exists method', () => {
    it('should add an exists filter', () => {
      const field = randomString();
      const query = new Query();
      query.exists(field);
      query.toPlainObject().filter[field].should.deepEqual({ $exists: true });
    });

    it('should add an exists filter with flag set to false', () => {
      const field = randomString();
      const query = new Query();
      query.exists(field, false);
      query.toPlainObject().filter[field].should.deepEqual({ $exists: false });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.exists(field);
      query.containsAll(field, [randomString()]);
      query.toPlainObject().filter[field].should.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().exists(randomString());
      query.should.be.an.instanceOf(Query);
    });
  });

  describe('mod()', () => {
    it('should throw an error for invalid arguments divisor', () => {
      should.throws(() => {
        const query = new Query();
        query.mod(randomString(), null);
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'divisor must be a number';
      });
    });

    it('should throw an error for invalid arguments remainder', () => {
      should.throws(() => {
        const query = new Query();
        query.mod(randomString(), 5, null);
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'remainder must be a number';
      });
    });

    it('should add a mod filter', () => {
      const field = randomString();
      const divisor = 5;
      const remainder = 0;
      const query = new Query();
      query.mod(field, divisor, remainder);
      query.toPlainObject().filter[field].should.deepEqual({ $mod: [divisor, remainder] });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.mod(field, 5);
      query.containsAll(field, [randomString()]);
      query.toPlainObject().filter[field].should.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().mod(randomString(), 5);
      query.should.be.an.instanceOf(Query);
    });
  });

  describe('matches()', () => {
    it('throw an error for unsupported ignoreCase option', () => {
      should.throws(() => {
        const field = randomString();
        const query = new Query();
        return query.matches(field, /^abc/, { ignoreCase: true });
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'ignoreCase is not supported.';
      });
    });

    it('should throw an error for unanchored expression', () => {
      const debugErr = 'regExp must have `^` at the beginning of the expression to make it an anchored expression.';
      should.throws(() => {
        const field = randomString();
        const query = new Query();
        return query.matches(field, '/abc/');
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === debugErr;
      });
    });

    it('should add a match filter by string', () => {
      const field = randomString();
      const value = `^${randomString()}`;
      const query = new Query();
      query.matches(field, value);
      query.toPlainObject().filter.should.have.property(field);
      query.toPlainObject().filter[field].should.deepEqual({ $regex: value });
    });

    it('should add a match filter by RegExp literal', () => {
      const field = randomString();
      const value = /^foo/;
      const query = new Query();
      query.matches(field, value);
      query.toPlainObject().filter.should.have.property(field);
      query.toPlainObject().filter[field].should.deepEqual({ $regex: value.source });
    });

    it('should add a match filter by RegExp object.', () => {
      const field = randomString();
      const value = new RegExp('^foo');
      const query = new Query();
      query.matches(field, value);
      query.toPlainObject().filter.should.have.property(field);
      query.toPlainObject().filter[field].should.deepEqual({ $regex: value.source });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.matches(field, `^${randomString()}`);
      query.greaterThan(field, randomString());
      query.toPlainObject().filter.should.have.property(field);
      query.toPlainObject().filter[field].should.have.property(['$gt']);
    });

    it('should return the query', () => {
      const field = randomString();
      const query = new Query();
      const value = query.matches(field, /^foo/);
      value.should.deepEqual(query);
    });

    describe('with options', () => {
      it('should throw if the ignoreCase flag is part of the RegExp.', () => {
        should.throws(() => {
          const field = randomString();
          const query = new Query();
          return query.matches(field, /^foo/i);
        }, function error(err) {
          return err.toString() === 'Error: QueryError' && err.debug === 'ignoreCase is not supported.';
        });
      });

      it('should unset the ignoreCase flag if `options.ignoreCase` is `false`', () => {
        const field = randomString();
        const value = /^foo/i;
        const query = new Query();
        query.matches(field, value, { ignoreCase: false });
        query.toPlainObject().filter.should.have.property(field);
        query.toPlainObject().filter[field].should.not.have.property('$options');
      });

      it('should set the multiline flag if part of the RegExp', () => {
        const field = randomString();
        const value = /^foo/m;
        const query = new Query();
        query.matches(field, value);
        query.toPlainObject().filter.should.have.property(field);
        query.toPlainObject().filter[field].should.containEql({ $options: 'm' });
      });

      it('should set the multiline flag if `options.multiline`', () => {
        const field = randomString();
        const value = /^foo/;
        const query = new Query();
        query.matches(field, value, { multiline: true });
        query.toPlainObject().filter.should.have.property(field);
        query.toPlainObject().filter[field].should.containEql({ $options: 'm' });
      });

      it('should unset the multiline flag if `options.multiline` is `false`', () => {
        const field = randomString();
        const value = /^foo/m;
        const query = new Query();
        query.matches(field, value, { multiline: false });
        query.toPlainObject().filter.should.have.property(field);
        query.toPlainObject().filter[field].should.not.have.property('$options');
      });

      it('should set the extended flag if `options.extended`', () => {
        const field = randomString();
        const value = `^${randomString()}`;
        const query = new Query();
        query.matches(field, value, { extended: true });
        query.toPlainObject().filter.should.have.property(field);
        query.toPlainObject().filter[field].should.containEql({ $options: 'x' });
      });

      it('should not set the multiline flag if `options.extended` is `false`', () => {
        const field = randomString();
        const value = `^${randomString()}`;
        const query = new Query();
        query.matches(field, value, { extended: false });
        query.toPlainObject().filter.should.have.property(field);
        query.toPlainObject().filter[field].should.not.have.property('$options');
      });

      it('should set the dotMatchesAll flag if `options.dotMatchesAll`', () => {
        const field = randomString();
        const value = `^${randomString()}`;
        const query = new Query();
        query.matches(field, value, { dotMatchesAll: true });
        query.toPlainObject().filter.should.have.property(field);
        query.toPlainObject().filter[field].should.containEql({ $options: 's' });
      });

      it('should not set the dotMatchesAll flag if `options.dotMatchesAll` is `false`', () => {
        const field = randomString();
        const value = `^${randomString()}`;
        const query = new Query();
        query.matches(field, value, { dotMatchesAll: false });
        query.toPlainObject().filter.should.have.property(field);
        query.toPlainObject().filter[field].should.not.have.property('$options');
      });

      it('should set multiple flags.', () => {
        const field = randomString();
        const value = /^foo/im;
        const query = new Query();
        query.matches(field, value, {
          ignoreCase: false,
          extended: true,
          dotMatchesAll: true
        });
        query.toPlainObject().filter.should.have.property(field);
        query.toPlainObject().filter[field].should.containEql({ $options: 'mxs' });
      });
    });
  });

  describe('near()', () => {
    it('should throw an error on invalid arguments', () => {
      should.throws(() => {
        const query = new Query();
        query.near(randomString(), []);
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'coord must be a [number, number]';
      });
    });

    it('should add a near filter', () => {
      const field = randomString();
      const coord = [-1, 1];
      const query = new Query();
      query.near(field, coord);
      query.toPlainObject().filter[field].should.deepEqual({ $nearSphere: coord });
    });

    it('should add a near filter, with $maxDistance', () => {
      const field = randomString();
      const coord = [-1, 1];
      const maxDistance = 10;
      const query = new Query();
      query.near(field, coord, maxDistance);
      query.toPlainObject().filter[field].should.deepEqual({ $nearSphere: coord, $maxDistance: maxDistance });
    });

    it('should return the query', () => {
      const query = new Query().near(randomString(), [-1, 1]);
      query.should.be.an.instanceOf(Query);
    });
  });

  describe('withinBox()', () => {
    it('should throw an error on invalid arguments: bottomLeftCoord', () => {
      should.throws(() => {
        const query = new Query();
        query.withinBox(randomString(), [], [1, 1]);
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'bottomLeftCoord must be a [number, number]';
      });
    });

    it('should throw an error on invalid arguments: upperRightCoord', () => {
      should.throws(() => {
        const query = new Query();
        query.withinBox(randomString(), [1, 1], []);
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'upperRightCoord must be a [number, number]';
      });
    });

    it('should add a within box filter', () => {
      const field = randomString();
      const box = [[-1, -1], [1, 1]];
      const query = new Query();
      query.withinBox(field, box[0], box[1]);
      query.toPlainObject().filter[field].should.deepEqual({ $within: { $box: box } });
    });

    it('should return the query', () => {
      const query = new Query().withinBox(randomString(), [-1, -1], [1, 1]);
      query.should.be.an.instanceOf(Query);
    });
  });

  describe('withinPolygon()', () => {
    it('should throw an error on invalid arguments: coord', () => {
      should.throws(() => {
        const query = new Query();
        query.withinPolygon(randomString(), []);
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'coords must be [[number, number]]';
      });
    });

    it('should add a within polygon filter', () => {
      const field = randomString();
      const polygon = [[-1, -1], [-1, 1], [1, 1]];
      const query = new Query();
      query.withinPolygon(field, polygon);
      query.toPlainObject().filter[field].should.deepEqual({ $within: { $polygon: polygon } });
    });

    it('should return the query', () => {
      const query = new Query().withinPolygon(randomString(), [[-1, -1], [-1, 1], [1, 1]]);
      query.should.be.an.instanceOf(Query);
    });
  });

  describe('size()', () => {
    it('should throw an error on invalid arguments', () => {
      should.throws(() => {
        const query = new Query();
        query.size(randomString(), null);
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'size must be a number';
      });
    });

    it('should add a size filter', () => {
      const field = randomString();
      const value = 10;
      const query = new Query();
      query.size(field, value);
      query.toPlainObject().filter[field].should.deepEqual({ $size: value });
    });

    it('should respect any existing filters on the same field', () => {
      const field = randomString();
      const query = new Query();
      query.size(field, 10);
      query.containsAll(field, [randomString()]);
      query.toPlainObject().filter[field].should.have.property('$all');
    });

    it('should return the query', () => {
      const query = new Query().size(randomString(), 10);
      query.should.be.an.instanceOf(Query);
    });
  });

  describe('ascending()', () => {
    it('should set the field', () => {
      const field = randomString();
      const query = new Query();
      query.ascending(field);
      query.toPlainObject().sort[field].should.eql(1);
    });

    it('should append a field', () => {
      const field1 = randomString();
      const field2 = randomString();
      const query = new Query();
      query.ascending(field1);
      query.ascending(field2);
      query.toPlainObject().sort[field1].should.eql(1);
      query.toPlainObject().sort[field2].should.eql(1);
    });

    it('should append a descending field', () => {
      const field1 = randomString();
      const field2 = randomString();
      const query = new Query();
      query.ascending(field1);
      query.descending(field2);
      query.toPlainObject().sort[field1].should.eql(1);
      query.toPlainObject().sort[field2].should.eql(-1);
    });

    it('should sort the data in ascending order', () => {
      const entity1 = { _id: 1, customProperty: randomString() };
      const entity2 = { _id: 2, customProperty: randomString() };
      const query = new Query().ascending('_id');
      query.fields = ['customProperty'];
      const result = query.process([entity2, entity1]);
      result[0].customProperty.should.eql(entity1.customProperty);
      result[1].customProperty.should.eql(entity2.customProperty);
    });

    it('should put docs with null or undefined values for sort field at the beginning of the list', () => {
      const entity1 = { _id: 1, customProperty: randomString() };
      const entity2 = { _id: null, customProperty: randomString() };
      const entity3 = { _id: 2, customProperty: randomString() };
      const entity4 = { customProperty: randomString() };
      const entity5 = { _id: null, customProperty: randomString() };
      const query = new Query().ascending('_id');
      query.fields = ['customProperty'];
      const result = query.process([entity5, entity4, entity1, entity3, entity2]);
      result[0].customProperty.should.eql(entity5.customProperty);
      result[1].customProperty.should.eql(entity4.customProperty);
      result[2].customProperty.should.eql(entity2.customProperty);
      result[3].customProperty.should.eql(entity1.customProperty);
      result[4].customProperty.should.eql(entity3.customProperty);
    });
  });

  describe('descending()', () => {
    it('should set the field', () => {
      const field = randomString();
      const query = new Query();
      query.descending(field);
      query.toPlainObject().sort[field].should.eql(-1);
    });

    it('should append a field', () => {
      const field1 = randomString();
      const field2 = randomString();
      const query = new Query();
      query.descending(field1);
      query.descending(field2);
      query.toPlainObject().sort[field1].should.eql(-1);
      query.toPlainObject().sort[field2].should.eql(-1);
    });

    it('should append a ascending field', () => {
      const field1 = randomString();
      const field2 = randomString();
      const query = new Query();
      query.descending(field1);
      query.ascending(field2);
      query.toPlainObject().sort[field1].should.eql(-1);
      query.toPlainObject().sort[field2].should.eql(1);
    });

    it('should sort the data in descending order', () => {
      const entity1 = { _id: 1, customProperty: randomString() };
      const entity2 = { _id: 2, customProperty: randomString() };
      const query = new Query().descending('_id');
      query.fields = ['customProperty'];
      const result = query.process([entity1, entity2]);
      result[0].customProperty.should.equal(entity2.customProperty);
      result[1].customProperty.should.equal(entity1.customProperty);
    });

    it('should put docs with null or undefined values for sort field at the end of the list', () => {
      const entity1 = { _id: 1, customProperty: randomString() };
      const entity2 = { _id: null, customProperty: randomString() };
      const entity3 = { _id: 2, customProperty: randomString() };
      const entity4 = { customProperty: randomString() };
      const entity5 = { _id: null, customProperty: randomString() };
      const query = new Query().descending('_id');
      query.fields = ['customProperty'];
      const result = query.process([entity5, entity4, entity1, entity3, entity2]);
      result[0].customProperty.should.eql(entity3.customProperty);
      result[1].customProperty.should.eql(entity1.customProperty);
      result[2].customProperty.should.eql(entity5.customProperty);
      result[3].customProperty.should.eql(entity4.customProperty);
      result[4].customProperty.should.eql(entity2.customProperty);
    });
  });

  describe('when chained', () => {
    it('should respect AND-NOR precedence.', () => {
      // A & B ^ C -> ((A & B) ^ C) -> nor(and(A, B), C).
      const a = 'A';
      const b = 'B';
      const c = 'C';
      const query = new Query();
      query.exists(a)
        .and()
        .exists(b)
        .nor()
        .exists(c);
      query.toPlainObject().filter.$nor[0].$and.length.should.eql(2);
      query.toPlainObject().filter.$nor[0].$and[0].should.have.property(a);
      query.toPlainObject().filter.$nor[0].$and[1].should.have.property(b);
      query.toPlainObject().filter.$nor[1].should.have.property(c);
    });

    it('should respect AND-NOR-AND precedence.', () => {
      // A & B ^ C & D -> ((A & B) ^ (C & D) -> nor(and(A, B), and(C, D)).
      const a = 'A';
      const b = 'B';
      const c = 'C';
      const d = 'D';
      const query = new Query();
      query.exists(a)
        .and()
        .exists(b)
        .nor()
        .exists(c)
        .and()
        .exists(d);
      query.toPlainObject().filter.$nor[0].$and.length.should.eql(2);
      query.toPlainObject().filter.$nor[0].$and[0].should.have.property(a);
      query.toPlainObject().filter.$nor[0].$and[1].should.have.property(b);
      query.toPlainObject().filter.$nor[1].$and.length.should.eql(2);
      query.toPlainObject().filter.$nor[1].$and[0].should.have.property(c);
      query.toPlainObject().filter.$nor[1].$and[1].should.have.property(d);
    });

    it('should respect AND-OR precedence.', () => {
      // A & B | C -> ((A & B) | C) -> or(and(A, B), C).
      const a = 'A';
      const b = 'B';
      const c = 'C';
      const query = new Query();
      query.exists(a)
        .and()
        .exists(b)
        .or()
        .exists(c);
      query.toPlainObject().filter.$or[0].$and.length.should.eql(2);
      query.toPlainObject().filter.$or[0].$and[0].should.have.property(a);
      query.toPlainObject().filter.$or[0].$and[1].should.have.property(b);
      query.toPlainObject().filter.$or[1].should.have.property(c);
    });

    it('should respect AND-OR-AND precedence.', () => {
      // A & B | C & D -> ((A & B) | (C & D) -> or(and(A, B), and(C, D)).
      const a = 'A';
      const b = 'B';
      const c = 'C';
      const d = 'D';
      const query = new Query();
      query.exists(a)
        .and()
        .exists(b)
        .or()
        .exists(c)
        .and()
        .exists(d);
      query.toPlainObject().filter.$or[0].$and.length.should.eql(2);
      query.toPlainObject().filter.$or[0].$and[0].should.have.property(a);
      query.toPlainObject().filter.$or[0].$and[1].should.have.property(b);
      query.toPlainObject().filter.$or[1].$and.length.should.eql(2);
      query.toPlainObject().filter.$or[1].$and[0].should.have.property(c);
      query.toPlainObject().filter.$or[1].$and[1].should.have.property(d);
    });

    it('should respect NOR-OR precedence.', () => {
      // A ^ B | C -> ((A ^ B) | C) -> or(nor(A, B), C).
      const a = 'A';
      const b = 'B';
      const c = 'C';
      const query = new Query();
      query.exists(a)
        .nor()
        .exists(b)
        .or()
        .exists(c);
      query.toPlainObject().filter.$or[0].$nor.length.should.eql(2);
      query.toPlainObject().filter.$or[0].$nor[0].should.have.property(a);
      query.toPlainObject().filter.$or[0].$nor[1].should.have.property(b);
      query.toPlainObject().filter.$or[1].should.have.property(c);
    });

    it('should respect OR-NOR-AND precedence.', () => {
      // A | B ^ C & D -> (A | (B ^ (C & D))) -> or(nor(B, and(C, D)), A).
      const a = 'A';
      const b = 'B';
      const c = 'C';
      const d = 'D';
      const query = new Query();
      query.exists(a)
        .or()
        .exists(b)
        .nor()
        .exists(c)
        .and()
        .exists(d);
      query.toPlainObject().filter.$or[0].should.have.property(a);
      query.toPlainObject().filter.$or[1].$nor[0].should.have.property(b);
      query.toPlainObject().filter.$or[1].$nor[1].$and[0].should.have.property(c);
      query.toPlainObject().filter.$or[1].$nor[1].$and[1].should.have.property(d);
    });

    it('should respect (AND-OR)-NOR-AND precedence.', () => {
      // (A & B | C) ^ D & E -> (((A & B) | C) ^ (D & E)) ->
      // nor(or(and(A, B), C), and(D, E));
      const a = 'A';
      const b = 'B';
      const c = 'C';
      const d = 'D';
      const e = 'E';
      const query = new Query();
      query.exists(a)
        .and()
        .exists(b)
        .or()
        .exists(c);
      query.nor()
        .exists(d)
        .and()
        .exists(e);
      query.toPlainObject().filter.$nor[0].$or[0].$and[0].should.have.property(a);
      query.toPlainObject().filter.$nor[0].$or[0].$and[1].should.have.property(b);
      query.toPlainObject().filter.$nor[0].$or[1].should.have.property(c);
      query.toPlainObject().filter.$nor[1].$and[0].should.have.property(d);
      query.toPlainObject().filter.$nor[1].$and[1].should.have.property(e);
    });

    it('should set the limit on the top-level query.', () => {
      const value = 10;
      const query = new Query();
      query.and().limit = value;
      query.toPlainObject().limit.should.eql(value);
    });

    it('should set the skip on the top-level query.', () => {
      const value = 10;
      const query = new Query();
      query.and().skip = value;
      query.toPlainObject().skip.should.eql(value);
    });

    it('should set the ascending sort on the top-level query.', () => {
      const field = randomString();
      const query = new Query();
      query.and().ascending(field);
      query.toPlainObject().sort[field].should.eql(1);
    });

    it('should set the descending sort on the top-level query.', () => {
      const field = randomString();
      const query = new Query();
      query.and().descending(field);
      query.toPlainObject().sort[field].should.eql(-1);
    });

    it('should set the sort on the top-level query.', () => {
      const value = {};
      value[randomString()] = 1;
      const query = new Query();
      query.and().sort = value;
      query.toPlainObject().sort.should.eql(value);
    });
  });

  describe('comparators', () => {
    it('should add a $gt filter', () => {
      const query = new Query();
      query.greaterThan('field', 1);
      const queryString = query.toQueryString();
      queryString.should.containEql({ query: '{"field":{"$gt":1}}' });
    });

    it('throw an error when $gt comparator is not a string or number', () => {
      should.throws(() => {
        const query = new Query();
        query.greaterThan('field', {});
        return query.process([]);
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'You must supply a number or string.';
      });
    });

    it('should add a $gte filter', () => {
      const query = new Query();
      query.greaterThanOrEqualTo('field', 1);
      const queryString = query.toQueryString();
      queryString.should.containEql({ query: '{"field":{"$gte":1}}' });
    });

    it('throw an error when $gte comparator is not a string or number', () => {
      should.throws(() => {
        const query = new Query();
        query.greaterThanOrEqualTo('field', {});
        return query.process([]);
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'You must supply a number or string.';
      });
    });

    it('should add a $lt filter', () => {
      const query = new Query();
      query.lessThan('field', 1);
      const queryString = query.toQueryString();
      queryString.should.containEql({ query: '{"field":{"$lt":1}}' });
    });

    it('throw an error when $lt comparator is not a string or number', () => {
      should.throws(() => {
        const query = new Query();
        query.lessThan('field', {});
        return query.process([]);
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'You must supply a number or string.';
      });
    });

    it('should add a $lte filter', () => {
      const query = new Query();
      query.lessThanOrEqualTo('field', 1);
      const queryString = query.toQueryString();
      queryString.should.containEql({ query: '{"field":{"$lte":1}}' });
    });

    it('throw an error when $lte comparator is not a string or number', () => {
      should.throws(() => {
        const query = new Query();
        query.lessThanOrEqualTo('field', {});
        return query.process([]);
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'You must supply a number or string.';
      });
    });

    it('should add a $ne filter', () => {
      const query = new Query();
      query.notEqualTo('field', 1);
      const queryString = query.toQueryString();
      queryString.should.containEql({ query: '{"field":{"$ne":1}}' });
    });
  });

  describe('logical operators', () => {
    it('should add a $and filter', () => {
      const query1 = new Query();
      query1.equalTo('field1', 'value1');

      const query2 = new Query();
      query2.equalTo('field2', 'value2');

      const queryString = query1.and(query2).toQueryString();
      queryString.should.containEql({ query: '{"$and":[{"field1":"value1"},{"field2":"value2"}]}' });
    });

    it('should add a $or filter', () => {
      const query1 = new Query();
      query1.equalTo('field1', 'value1');

      const query2 = new Query();
      query2.equalTo('field2', 'value2');

      const queryString = query1.or(query2).toQueryString();
      queryString.should.containEql({ query: '{"$or":[{"field1":"value1"},{"field2":"value2"}]}' });
    });

    it('should add a $nor filter', () => {
      const query1 = new Query();
      query1.equalTo('field1', 'value1');

      const query2 = new Query();
      query2.equalTo('field2', 'value2');

      const queryString = query1.nor(query2).toQueryString();
      queryString.should.containEql({ query: '{"$nor":[{"field1":"value1"},{"field2":"value2"}]}' });
    });
  });


  describe('process()', () => {
    it('throw an error when a data is not an array', () => {
      should.throws(() => {
        const query = new Query();
        return query.process({});
      }, function error(err) {
        return err.toString() === 'Error: QueryError' && err.debug === 'data argument must be of type: Array.';
      });
    });

    it('should process a fields query', () => {
      const entities = [
        { name: 'Name1', desc: 'Desc1' },
        { name: 'Name2', desc: 'Desc2' }
      ];
      const query = new Query();
      query.fields = ['desc'];
      query.process(entities).should.deepEqual([{ desc: 'Desc1' }, { desc: 'Desc2' }]);
    });

    it('should not remove protected fields when fields are specified', () => {
      const entities = [
        { _id: '0', _acl: 'acl1', _kmd: 'kmd1', name: 'Name1', desc: 'Desc1' },
        { _id: '1', _acl: 'acl2', _kmd: 'kmd2', name: 'Name2', desc: 'Desc2' }
      ];
      const query = new Query();
      query.fields = ['desc'];
      query.process(entities).should.deepEqual([
        { _id: '0', _acl: 'acl1', desc: 'Desc1' },
        { _id: '1', _acl: 'acl2', desc: 'Desc2' }
      ]);
    });
  });

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
      queryString.should.containDeep({ limit: '10' });
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
      queryString.should.containDeep({ skip: '10' });
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
