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

const should = require('should');
const sinon = require('sinon');
const uuid = require('node-uuid');

const logger = require('../../lib/service/logger');

describe('sdk logging', () => {
  let logString = '';
  let backingServerId = '';
  beforeEach(() => {
    logString = uuid.v4();
    backingServerId = process.env.BACKING_SERVER_ID = uuid.v4();
  });
  describe('log levels', () => {
    it('info', (done) => {
      const result = `{"message":"${logString}","level":"info","backingServerId":"${backingServerId}"}`;
      const spy = sinon.spy(logger, 'info');
      logger.info(logString);
      spy.getCall(0).args[0].should.eql(logString);
      spy.returnValues[0].should.eql(result);
      logger.info.restore();
      done();
    });
    it('warn', (done) => {
      const result = `{"message":"${logString}","level":"warning","backingServerId":"${backingServerId}"}`;
      const spy = sinon.spy(logger, 'warn');
      logger.warn(logString);
      spy.getCall(0).args[0].should.eql(logString);
      spy.returnValues[0].should.eql(result);
      logger.warn.restore();
      done();
    });
    it('error', (done) => {
      const result = `{"message":"${logString}","level":"error","backingServerId":"${backingServerId}"}`;
      const spy = sinon.spy(logger, 'error');
      logger.error(logString);
      spy.getCall(0).args[0].should.eql(logString);
      spy.returnValues[0].should.eql(result);
      logger.error.restore();
      done();
    });
    it('fatal', (done) => {
      const result = `{"message":"${logString}","level":"fatal","backingServerId":"${backingServerId}"}`;
      const spy = sinon.spy(logger, 'fatal');
      logger.fatal(logString);
      spy.getCall(0).args[0].should.eql(logString);
      spy.returnValues[0].should.eql(result);
      logger.fatal.restore();
      done();
    });
  });
});
