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

const should = require('should');
const moment = require('moment');
const kinveyDate = require('../../../../lib/service/modules/kinveyDate');

describe('date string conversion', () => {
  describe('to Kinvey (ISO) date string', () => {
    it('returns null if no parameter is passed in', (done) => {
      should.not.exist(kinveyDate.toKinveyDateString());
      return done();
    });
    it('returns null if parameter is not a string, a Date, or a Moment', (done) => {
      should.not.exist(kinveyDate.toKinveyDateString(1));
      should.not.exist(kinveyDate.toKinveyDateString(true));
      should.not.exist(kinveyDate.toKinveyDateString({}));
      should.not.exist(kinveyDate.toKinveyDateString([]));
      should.not.exist(kinveyDate.toKinveyDateString(null));
      return done();
    });
    it('returns null if parameter is an invalid Moment', (done) => {
      should.not.exist(kinveyDate.toKinveyDateString(moment(new Date('abc'))));
      return done();
    });
    it('returns the original string if it is already a Mongo ISODate string', (done) => {
      const isoDateString = `ISODate("${new Date().toISOString()}")`;
      kinveyDate.toKinveyDateString(isoDateString).should.eql(isoDateString);
      return done();
    });
    it('returns \'Invalid date\' if the incoming string is not parsable by Moment', (done) => {
      kinveyDate.toKinveyDateString('not a date').should.eql('Invalid date');
      return done();
    });
    it('returns a correct Mongo ISODate string when a valid date string is passed in', (done) => {
      const date = new Date();
      kinveyDate.toKinveyDateString(date.toISOString()).should.eql(`ISODate("${date.toISOString()}")`);
      return done();
    });
    it('returns a correct Mongo ISODate string when a valid date object is passed in', (done) => {
      const date = new Date();
      kinveyDate.toKinveyDateString(date).should.eql(`ISODate("${date.toISOString()}")`);
      return done();
    });
    return it('returns a correct Mongo ISODate string when a valid Moment is passed in', (done) => {
      const date = new Date();
      kinveyDate.toKinveyDateString(moment(date)).should.eql(`ISODate("${date.toISOString()}")`);
      return done();
    });
  });
  return describe('from Kinvey (ISO) date string', () => {
    it("returns 'Invalid date' if no parameter is passed in", (done) => {
      kinveyDate.fromKinveyDateString().should.eql('Invalid date');
      return done();
    });
    it("returns 'Invalid date' if a non Mongo ISODate string is passed in", (done) => {
      kinveyDate.fromKinveyDateString('abcd').should.eql('Invalid date');
      kinveyDate.fromKinveyDateString(new Date().toISOString()).should.eql('Invalid date');
      kinveyDate.fromKinveyDateString({}).should.eql('Invalid date');
      return done();
    });
    it('returns an error if the Mongo ISODate string contains an invalid date', (done) => {
      kinveyDate.fromKinveyDateString('ISODate("').should.eql('Invalid date');
      kinveyDate.fromKinveyDateString('ISODate("abc').should.eql('Invalid date');
      return done();
    });
    it('defaults to returning a Date if no format is specified', (done) => {
      const dateString = new Date().toISOString();
      const convertedDate = kinveyDate.fromKinveyDateString(`ISODate("${dateString}")`);
      Object.prototype.toString.call(convertedDate).should.eql('[object Date]');
      convertedDate.toISOString().should.eql(dateString);
      return done();
    });
    it("returns 'Invalid Format.' if format is not 'string', 'date', 'moment' or undefined", (done) => {
      const dateString = new Date().toISOString();
      kinveyDate.fromKinveyDateString(`ISODate("${dateString}")`, 'invalid').should.eql('Invalid Format.');
      return done();
    });
    it("returns a Date if format is 'date'", (done) => {
      const dateString = new Date().toISOString();
      const convertedDate = kinveyDate.fromKinveyDateString(`ISODate("${dateString}")`, 'date');
      Object.prototype.toString.call(convertedDate).should.eql('[object Date]');
      convertedDate.toISOString().should.eql(dateString);
      return done();
    });
    it("returns a string if format is 'string'", (done) => {
      const dateString = new Date().toISOString();
      const convertedDate = kinveyDate.fromKinveyDateString(`ISODate("${dateString}")`, 'string');
      'string'.should.eql(typeof convertedDate);
      convertedDate.should.eql(dateString);
      return done();
    });
    return it("returns a Moment if format is 'moment'", (done) => {
      const dateString = new Date().toISOString();
      const convertedDate = kinveyDate.fromKinveyDateString(`ISODate("${dateString}")`, 'moment');
      moment.isMoment(convertedDate).should.be.true;
      convertedDate.isValid().should.be.true;
      convertedDate.toISOString().should.eql(dateString);
      return done();
    });
  });
});
