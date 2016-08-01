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
const stdout = require("test-console").stdout;

const logger = require('../../lib/service/logger');

/**
 * Helper function to generate sample logging output
 */
function generateLogOutput(message, logThreshold, dlcId, backingServerId) {
  return `{"message":"${message}","level":"${logThreshold}","dlcId":"${dlcId}","backingServerId":"${backingServerId}"}`
}

describe('sdk logging', () => {
  let logString = '';
  let dlcId = '';
  let backingServerId = '';
  let sampleMessage = '';
  describe('log levels', () => {
    beforeEach(() => {
      logString = uuid.v4();
      dlcId = process.env.DLC_ID = uuid.v4();
      backingServerId = process.env.BACKING_SERVER_ID = uuid.v4();
    });
    describe('info', () => {
      it('successfully logs an \'info\' message', (done) => {
        sampleMessage = generateLogOutput(logString, 'info', dlcId, backingServerId);
        const spy = sinon.spy(logger, 'info');
        logger.info(logString);
        spy.getCall(0).args[0].should.eql(logString);
        spy.returnValues[0].should.eql(sampleMessage);
        logger.info.restore();
        done();
      });
      it('writes the correct output to stdout', (done) => {
        sampleMessage = generateLogOutput(logString, 'info', dlcId, backingServerId);
        const inspect = stdout.inspect();
        logger.info(logString);
        inspect.restore();
        inspect.output.should.eql([`${sampleMessage}`]);
        done()
      });
    });
    describe('warn', () => {
      it('successfully logs an \'warning\' message', (done) => {
        sampleMessage = generateLogOutput(logString, 'warning', dlcId, backingServerId);
        const spy = sinon.spy(logger, 'warn');
        logger.warn(logString);
        spy.getCall(0).args[0].should.eql(logString);
        spy.returnValues[0].should.eql(sampleMessage);
        logger.warn.restore();
        done();
      });
      it('writes the correct output to stdout', (done) => {
        sampleMessage = generateLogOutput(logString, 'warning', dlcId, backingServerId);
        const inspect = stdout.inspect();
        logger.warn(logString);
        inspect.restore();
        inspect.output.should.eql([`${sampleMessage}`]);
        done()
      });
    });
    describe('error', (done) => {
      it('successfully logs an \'error\' message', (done) => {
        sampleMessage = generateLogOutput(logString, 'error', dlcId, backingServerId);
        const spy = sinon.spy(logger, 'error');
        logger.error(logString);
        spy.getCall(0).args[0].should.eql(logString);
        spy.returnValues[0].should.eql(sampleMessage);
        logger.error.restore();
        done();
      });
      it('writes the correct output to stdout', (done) => {
        sampleMessage = generateLogOutput(logString, 'error', dlcId, backingServerId);
        const inspect = stdout.inspect();
        logger.error(logString);
        inspect.restore();
        inspect.output.should.eql([`${sampleMessage}`]);
        done()
      });
    });
    describe('fatal', (done) => {
      it('successfully logs an \'fatal\' message', (done) => {
        sampleMessage = generateLogOutput(logString, 'fatal', dlcId, backingServerId);
        const spy = sinon.spy(logger, 'fatal');
        logger.fatal(logString);
        spy.getCall(0).args[0].should.eql(logString);
        spy.returnValues[0].should.eql(sampleMessage);
        logger.fatal.restore();
        done();
      });
      it('writes the correct output to stdout', (done) => {
        sampleMessage = generateLogOutput(logString, 'fatal', dlcId, backingServerId);
        const inspect = stdout.inspect();
        logger.fatal(logString);
        inspect.restore();
        inspect.output.should.eql([`${sampleMessage}`]);
        done()
      });
    });
  });
});
