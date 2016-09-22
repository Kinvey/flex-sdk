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

const logic = require('../../lib/service/businesslogic');
const should = require('should');
const testTaskName = 'myTaskName';

function quickRandom() {
  return Math.floor(Math.random() * (1000 - 1) + 1);
}

function sampleTask(name) {
  return {
    taskType: 'businessLogic',
    taskName: name,
    method: 'POST',
    endpoint: null,
    request: {
      method: 'POST',
      headers: {},
      entityId: '12345',
      serviceObjectName: null
    },
    response: {
      status: 0,
      headers: {},
      body: {}
    }
  };
}

function sampleBadTask() {
  return {
    request: {
      body: 'abc'
    },
    response: {
      status: 0,
      headers: {},
      body: {}
    }
  };
}

describe('business logic', () => {
  describe('logic registration', () => {
    afterEach((done) => {
      logic.clearAll();
      return done();
    });
    it('can register a logic task', (done) => {
      logic.register(testTaskName, () => done());
      const fn = logic.resolve(testTaskName);
      return fn();
    });
  });
  describe('discovery', () => {
    afterEach((done) => {
      logic.clearAll();
      return done();
    });
    it('returns an array of all registered business logic handlers', (done) => {
      const testHandlerName = 'testObj';
      logic.register(testHandlerName, () => {});
      const discoveredHandlers = logic.getHandlers();
      should.exist(discoveredHandlers[0]);
      discoveredHandlers.length.should.eql(1);
      discoveredHandlers[0].should.eql(testHandlerName);
      done();
    });
  });
  describe('completion handlers', () => {
    afterEach((done) => {
      logic.clearAll();
      return done();
    });
    it("should return a 'BadRequest' response with a null task name", (done) => {
      const task = sampleTask(null);
      return logic.process(task, null, (err) => {
        err.response.statusCode.should.eql(400);
        err.response.body.debug.should.eql('No task name to execute');
        return done();
      });
    });
    it("should return a 'BadRequest' response with a non-JSON task", (done) => {
      const task = sampleBadTask(null);
      return logic.process(task, null, (err) => {
        err.response.statusCode.should.eql(400);
        err.response.body.debug.should.eql('Request body is not JSON');
        return done();
      });
    });
    it('should return a successful response', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => complete().ok().next());
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql('{}');
        return done();
      });
    });
    it('should include a body', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => complete({ foo: 'bar' }).ok().next());
      return logic.process(task, null, (err, result) => {
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql(JSON.stringify({
          foo: 'bar'
        }));
        return done();
      });
    });
    it('should return a 201 created', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => complete({ foo: 'bar' }).created().next());
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(201);
        result.response.body.should.eql(JSON.stringify({
          foo: 'bar'
        }));
        return done();
      });
    });
    it('should return a 202 accepted', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => complete({ foo: 'bar' }).accepted().next());
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(202);
        result.response.body.should.eql(JSON.stringify({
          foo: 'bar'
        }));
        return done();
      });
    });
    it('should return a 400 bad request', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => complete('This is a bad request').badRequest().next());
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(400);
        result.response.body = JSON.parse(result.response.body);
        result.response.body.error.should.eql('BadRequest');
        result.response.body.description.should.eql('Unable to understand request');
        result.response.body.debug.should.eql('This is a bad request');
        return done();
      });
    });
    it('should return a 401 unauthorized', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => complete('You are not authorized!').unauthorized().next());
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(401);
        result.response.body = JSON.parse(result.response.body);
        result.response.body.error.should.eql('InvalidCredentials');
        result.response.body.description.should.eql(
          'Invalid credentials. Please retry your request with correct credentials');
        result.response.body.debug.should.eql('You are not authorized!');
        return done();
      });
    });
    it('should return a 403 forbidden', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => complete('Forbidden!').forbidden().next());
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(403);
        result.response.body = JSON.parse(result.response.body);
        result.response.body.error.should.eql('Forbidden');
        result.response.body.description.should.eql('The request is forbidden');
        result.response.body.debug.should.eql('Forbidden!');
        return done();
      });
    });
    it('should return a 404 not found', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => complete('The request is not found!').notFound().next());
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(404);
        result.response.body = JSON.parse(result.response.body);
        result.response.body.error.should.eql('NotFound');
        result.response.body.description.should.eql(
          'The requested entity or entities were not found in the serviceObject');
        result.response.body.debug.should.eql('The request is not found!');
        return done();
      });
    });
    it('should return a 405 not allowed', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => complete('The request is not allowed!').notAllowed().next());
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(405);
        result.response.body = JSON.parse(result.response.body);
        result.response.body.error.should.eql('NotAllowed');
        result.response.body.description.should.eql('The request is not allowed');
        result.response.body.debug.should.eql('The request is not allowed!');
        return done();
      });
    });
    it('should return a 501 not implemented', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => complete('This isn\'t implemented').notImplemented().next());
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(501);
        result.response.body = JSON.parse(result.response.body);
        result.response.body.error.should.eql('NotImplemented');
        result.response.body.description.should.eql('The request invoked a method that is not implemented');
        result.response.body.debug.should.eql('This isn\'t implemented');
        return done();
      });
    });
    it('should return a 550 runtime error', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => complete('There was some error in the app!')
        .runtimeError().next());
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(550);
        result.response.body = JSON.parse(result.response.body);
        result.response.body.error.should.eql('DataLinkRuntimeError');
        result.response.body.description.should.eql('The Datalink had a runtime error.  See debug message for details');
        result.response.body.debug.should.eql('There was some error in the app!');
        return done();
      });
    });
    it('should process a next (continuation) handler', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => complete({ foo: 'bar' }).ok().next());
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql(JSON.stringify({
          foo: 'bar'
        }));
        result.response.continue = true;
        return done();
      });
    });
    it('should process a done (completion) handler', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      logic.register(taskName, (request, complete) => complete({ foo: 'bar' }).ok().done());
      return logic.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql(JSON.stringify({
          foo: 'bar'
        }));
        result.response.continue = false;
        return done();
      });
    });
  });
});
