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
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const loggerMock = require('./mocks/loggerMock');

const auth = proxyquire('../../../lib/service/auth', { './logger': loggerMock });

function quickRandom() {
  return Math.floor((Math.random() * (1000 - 1)) + 1);
}

function sampleTask(taskName) {
  return {
    taskType: 'auth',
    taskName,
    method: 'POST',
    endpoint: null,
    request: {
      body: {
        username: 'foo',
        password: 'bar',
        options: { foobar: 'barfoo' }
      }
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

describe('FlexAuth', () => {
  describe('auth registration', () => {
    afterEach((done) => {
      auth.clearAll();
      done();
    });
    it('can register an auth handler', (done) => {
      auth.register('someHandler', () => done());
      const fn = auth.resolve('someHandler');
      fn.should.be.a.Function();
      fn();
    });
  });
  describe('discovery', () => {
    afterEach((done) => {
      auth.clearAll();
      done();
    });
    it('returns an array of all registered auth handlers', (done) => {
      const testHandlerName = 'testUath';
      auth.register(testHandlerName, () => {});
      const discoveredHandlers = auth.getHandlers();
      should.exist(discoveredHandlers[0]);
      discoveredHandlers.length.should.eql(1);
      discoveredHandlers[0].should.eql(testHandlerName);
      done();
    });

    it('returns an empty array if no auth handlers have been registered', (done) => {
      const discoveredHandlers = auth.getHandlers();
      Array.isArray(discoveredHandlers).should.eql(true);
      discoveredHandlers.length.should.eql(0);
      done();
    });
  });
  describe('auth processing', () => {
    afterEach((done) => {
      auth.clearAll();
      done();
    });
    it('can process an auth task', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      auth.register(task.taskName, () => done());
      auth.process(task, {}, () => {});
    });

    it('includes context, completion, and module handlers in a logic task', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      auth.register(taskName, (context, complete, modules) => {
        context.should.be.an.Object();
        complete.should.be.a.Function();
        modules.should.be.an.Object();
        done();
      });
      auth.process(task, {}, () => {});
    });

    it('passes username, password, and options to the context object', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      auth.register(taskName, (context, complete, modules) => {
        context.should.be.an.Object();
        complete.should.be.a.Function();
        modules.should.be.an.Object();
        context.body.username.should.eql('foo');
        context.body.password.should.eql('bar');
        context.body.options.foobar.should.eql('barfoo');
        done();
      });
      auth.process(task, {}, () => {});
    });
  });
  describe('completion handlers', () => {
    afterEach((done) => {
      loggerMock.error.resetHistory();
      auth.clearAll();
      done();
    });
    it("should return a 'server_error' response with a null task name", (done) => {
      const task = sampleTask(null);
      auth.process(task, null, (err) => {
        err.response.statusCode.should.eql(401);
        err.response.body.error_description.should.eql('No task name to execute');
        done();
      });
    });
    it("should return a 'server_error' response with a non-JSON task", (done) => {
      const task = sampleBadTask(null);
      auth.process(task, null, (err) => {
        err.response.statusCode.should.eql(401);
        err.response.body.error.should.eql('server_error');
        err.response.body.error_description.should.eql('Request body is not JSON');
        done();
      });
    });
    it('should return a successful response', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      auth.register(taskName, (context, complete) => complete().ok().done());
      auth.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({ token: {}, authenticated: true });
        done();
      });
    });
    it('should include a body with a minimum of token and authenticated properties', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      auth.register(taskName, (context, complete) => complete({ foo: 'bar' }).ok().next());
      auth.process(task, null, (err, result) => {
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({ token: { foo: 'bar' }, authenticated: true });
        done();
      });
    });
    it('should allow for custom properties', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      auth.register(taskName, (context, complete) => complete({ foo: 'bar' })
        .addAttribute('attr', 'value')
        .ok()
        .next());
      auth.process(task, null, (err, result) => {
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({ token: { foo: 'bar' }, authenticated: true, attr: 'value' });
        done();
      });
    });
    it('should return a 401 server_error', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      auth.register(taskName, (context, complete) => complete('This is a bad request').serverError().next());
      auth.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(401);
        result.response.body.error.should.eql('server_error');
        result.response.body.error_description.should.eql('This is a bad request');
        done();
      });
    });
    it('should return a 401 access denied', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      auth.register(taskName, (context, complete) => complete('You are not authorized!').accessDenied().next());
      auth.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(401);
        result.response.body.error.should.eql('access_denied');
        result.response.body.error_description.should.eql('You are not authorized!');
        done();
      });
    });
    it('should return a 401 temporarily unavailable', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      auth.register(taskName, (context, complete) =>
        complete('The auth server is temporarily unavailable!').temporarilyUnavailable().next());
      auth.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(401);
        result.response.body.error.should.eql('temporarily_unavailable');
        result.response.body.error_description.should.eql('The auth server is temporarily unavailable!');
        done();
      });
    });
    it('should return a 401 not implemented', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      auth.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(401);
        result.response.body.error.should.eql('server_error');
        result.response.body.error_description.should.eql('The request invoked a method that is not implemented');
        done();
      });
    });
    it('should process a next (continuation) handler', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      auth.register(taskName, (context, complete) => complete({ foo: 'bar' }).ok().next());
      auth.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({ token: { foo: 'bar' }, authenticated: true });
        result.response.continue = true;
        done();
      });
    });
    it('should process a done (completion) handler', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      auth.register(taskName, (context, complete) => complete({ foo: 'bar' }).ok().done());
      auth.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({ token: { foo: 'bar' }, authenticated: true });
        result.response.continue = false;
        done();
      });
    });
    ['next', 'done'].forEach((method1) => {
      ['next', 'done'].forEach((method2) => {
        it(`should log a message when attempting to respond more than once, by calling ${method1}() and then ${method2}()`, (done) => {
          const taskName = quickRandom();
          const task = sampleTask(taskName);

          auth.register(taskName, (context, complete) => {
            complete({ foo: 'bar' }).ok()[method1]();
            setTimeout(() => {
              complete({ foo: 'not bar' }).ok()[method2]();
            }, 0);
          });

          const processCallbackSpy = sinon.spy((err, result) => {
            should.not.exist(err);
            result.response.statusCode.should.eql(200);
            result.response.body.should.eql({ token: { foo: 'bar' }, authenticated: true });
            result.response.continue.should.eql(false);
          });

          loggerMock.error = sinon.spy((message) => {
            message.should.eql(`Invoked done() or next() more than once to the same FlexAuth request in handler "${taskName}"`);
            processCallbackSpy.calledOnce.should.eql(true);
            done();
          });

          auth.process(task, null, processCallbackSpy);
        });
      });
    });
  });
});
