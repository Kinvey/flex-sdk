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

const functions = require('../../../lib/service/functions');
const should = require('should');

const testTaskName = 'myTaskName';

function quickRandom() {
  return Math.floor((Math.random() * (1000 - 1)) + 1);
}

function sampleTask(name) {
  return {
    taskType: 'functions',
    taskName: name,
    method: 'POST',
    endpoint: null,
    hookType: 'pre',
    request: {
      method: 'POST',
      headers: { },
      entityId: '12345',
      objectName: null
    },
    response: {
      status: 0,
      headers: {},
      body: {}
    }
  };
}

function samplePostTask(name) {
  return {
    taskType: 'functions',
    taskName: name,
    method: 'POST',
    endpoint: null,
    hookType: 'post',
    request: {
      method: 'POST',
      headers: { requestHeader: 'foo' },
      entityId: '12345',
      objectName: null,
      body: { bar: 'foo' }
    },
    response: {
      status: 0,
      headers: { responseHeader: 'bar' },
      body: [{ id: quickRandom() }, { id: quickRandom() }, { id: quickRandom() }]
    }
  };
}

function samplePreTask(name) {
  return {
    taskType: 'functions',
    taskName: name,
    method: 'POST',
    endpoint: null,
    hookType: 'pre',
    request: {
      method: 'POST',
      headers: { requestHeader: 'foo' },
      entityId: '12345',
      objectName: null,
      body: { bar: 'foo' }
    },
    response: {
      status: 0,
      headers: { responseHeader: 'bar' },
      body: [{ id: quickRandom() }, { id: quickRandom() }, { id: quickRandom() }]
    }
  };
}

function sampleCustomEndpoint(name) {
  return {
    taskType: 'functions',
    taskName: name,
    method: 'POST',
    endpoint: null,
    hookType: 'customEndpoint',
    request: {
      method: 'POST',
      headers: { requestHeader: 'foo' },
      entityId: '12345',
      objectName: null,
      body: { bar: 'foo' }
    },
    response: {
      status: 0,
      headers: { responseHeader: 'bar' },
      body: [{ id: quickRandom() }, { id: quickRandom() }, { id: quickRandom() }]
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

describe('FlexFunctions', () => {
  describe('function registration', () => {
    afterEach((done) => {
      functions.clearAll();
      return done();
    });
    it('can register a functions task', (done) => {
      functions.register(testTaskName, () => done());
      const fn = functions.resolve(testTaskName);
      return fn();
    });
  });
  describe('discovery', () => {
    afterEach((done) => {
      functions.clearAll();
      return done();
    });
    it('returns an array of all registered function handlers', (done) => {
      const testHandlerName = 'testObj';
      functions.register(testHandlerName, () => {});
      const discoveredHandlers = functions.getHandlers();
      should.exist(discoveredHandlers[0]);
      discoveredHandlers.length.should.eql(1);
      discoveredHandlers[0].should.eql(testHandlerName);
      done();
    });

    it('returns an empty array if no function handlers have been registered', (done) => {
      const discoveredHandlers = functions.getHandlers();
      Array.isArray(discoveredHandlers).should.eql(true);
      discoveredHandlers.length.should.eql(0);
      done();
    });
  });
  describe('functions processing', () => {
    afterEach((done) => {
      functions.clearAll();
      return done();
    });
    it('can process a functions task', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      functions.register(taskName, () => done());
      functions.process(task, {}, () => {});
    });

    it('includes context, completion, and module handlers in a functions task', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      functions.register(taskName, (context, complete, modules) => {
        context.should.be.an.Object();
        complete.should.be.a.Function();
        modules.should.be.an.Object();
        return done();
      });
      functions.process(task, {}, () => {});
    });

    it('includes objectName if passed in request.objectName', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      task.request.objectName = 'foo';
      functions.register(taskName, (context, complete, modules) => {
        context.should.be.an.Object();
        complete.should.be.a.Function();
        modules.should.be.an.Object();
        context.objectName.should.eql('foo');
        return done();
      });
      functions.process(task, {}, () => {});
    });

    it('includes objectName if passed in request.collectionName', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      task.request.collectionName = 'foo';
      functions.register(taskName, (context, complete, modules) => {
        context.should.be.an.Object();
        complete.should.be.a.Function();
        modules.should.be.an.Object();
        context.objectName.should.eql('foo');
        return done();
      });
      functions.process(task, {}, () => {});
    });
  });
  describe('completion handlers', () => {
    afterEach((done) => {
      functions.clearAll();
      return done();
    });
    it("should return a 'BadRequest' response with a null task name", (done) => {
      const task = sampleTask(null);
      return functions.process(task, null, (err) => {
        err.response.statusCode.should.eql(400);
        err.response.body.debug.should.eql('No task name to execute');
        return done();
      });
    });
    it("should return a 'BadRequest' response with a non-JSON task", (done) => {
      const task = sampleBadTask(null);
      return functions.process(task, null, (err) => {
        err.response.statusCode.should.eql(400);
        err.response.body.debug.should.eql('Request body is not JSON');
        return done();
      });
    });
    it('should return a successful response', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      functions.register(taskName, (context, complete) => complete().ok().next());
      return functions.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({});
        return done();
      });
    });
    it('should include a body', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      functions.register(taskName, (context, complete) => complete({ foo: 'bar' }).ok().done());
      return functions.process(task, null, (err, result) => {
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({
          foo: 'bar'
        });
        return done();
      });
    });
    it('should explicitly set a body', (done) => {
      const taskName = quickRandom();
      const task = samplePreTask(taskName);
      functions.register(taskName, (context, complete) => complete()
        .setBody({ foo: 'bar' })
        .ok()
        .done());
      return functions.process(task, null, (err, result) => {
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({
          foo: 'bar'
        });
        return done();
      });
    });
    it('should explicitly set a query', (done) => {
      const taskName = quickRandom();
      const task = samplePreTask(taskName);
      const query = { foo: 'bar' };
      const sort = { foo: 1 };
      functions.register(taskName, (context, complete) => complete()
        .setQuery({ query, sort })
        .ok()
        .next());
      return functions.process(task, null, (err, result) => {
        result.response.statusCode.should.eql(200);
        result.request.query.should.eql({ query: JSON.stringify(query), sort: JSON.stringify(sort) });
        result.request.params.should.eql({ query: JSON.stringify(query), sort: JSON.stringify(sort) });
        return done();
      });
    });
    it('should include the response body and headers when task is a post task', (done) => {
      const taskName = quickRandom();
      const task = samplePostTask(taskName);
      functions.register(taskName, (context, complete) => {
        context.body.should.eql(task.response.body);
        context.body.should.not.eql(task.request.body);
        context.headers.should.eql(task.response.headers);
        context.headers.should.not.eql(task.request.headers);
        return complete(task.response.body).ok().next();
      });
      return functions.process(task, null, () => done());
    });

    it('should include the request body and headers when task is a pre task', (done) => {
      const taskName = quickRandom();
      const task = samplePreTask(taskName);
      functions.register(taskName, (context, complete) => {
        context.body.should.eql(task.request.body);
        context.body.should.not.eql(task.response.body);
        context.headers.should.eql(task.request.headers);
        context.headers.should.not.eql(task.response.headers);
        return complete(task.response.body).ok().next();
      });
      return functions.process(task, null, () => done());
    });

    it('should include the request body and headers when task is a custom endpoint task', (done) => {
      const taskName = quickRandom();
      const task = sampleCustomEndpoint(taskName);
      functions.register(taskName, (context, complete) => {
        context.body.should.eql(task.request.body);
        context.body.should.not.eql(task.response.body);
        context.headers.should.eql(task.request.headers);
        context.headers.should.not.eql(task.response.headers);
        return complete(task.response.body).ok().next();
      });
      return functions.process(task, null, () => done());
    });

    it('should set the response body when task is a post task and the request is ended', (done) => {
      const taskName = quickRandom();
      const task = samplePostTask(taskName);
      functions.register(taskName, (context, complete) => complete({ foo: 'bar' }).ok().done());
      return functions.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({
          foo: 'bar'
        });
        return done();
      });
    });

    it('should set the response body when task is a post task and the request is continued', (done) => {
      const taskName = quickRandom();
      const task = samplePostTask(taskName);
      functions.register(taskName, (context, complete) => complete({ foo: 'bar' }).ok().next());
      return functions.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({
          foo: 'bar'
        });
        return done();
      });
    });

    it('should keep existing response body when task is a post task and no body is set and the request is ended',
      (done) => {
        const taskName = quickRandom();
        const task = samplePostTask(taskName);
        functions.register(taskName, (context, complete) => complete({ foo: 'bar' }).ok().done());
        return functions.process(task, null, (err, result) => {
          should.not.exist(err);
          result.response.statusCode.should.eql(200);
          result.response.body.should.eql(task.response.body);
          return done();
        });
      });

    it('should keep existing response body when task is a post task and no body is set and the request is continued',
      (done) => {
        const taskName = quickRandom();
        const task = samplePostTask(taskName);
        functions.register(taskName, (context, complete) => complete({ foo: 'bar' }).ok().next());
        return functions.process(task, null, (err, result) => {
          should.not.exist(err);
          result.response.statusCode.should.eql(200);
          result.response.body.should.eql(task.response.body);
          return done();
        });
      });

    it('should include the request body and headers when task is a pre task', (done) => {
      const taskName = quickRandom();
      const task = samplePreTask(taskName);
      functions.register(taskName, (context, complete) => {
        context.body.should.eql(task.request.body);
        context.body.should.not.eql(task.response.body);
        context.headers.should.eql(task.request.headers);
        context.headers.should.not.eql(task.response.headers);
        return complete(task.response.body).ok().next();
      });
      return functions.process(task, null, () => done());
    });

    it('should set the response body when task is a pre task and the request is ended', (done) => {
      const taskName = quickRandom();
      const task = samplePreTask(taskName);
      functions.register(taskName, (context, complete) => complete({ foo: 'bar' }).ok().done());
      return functions.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({
          foo: 'bar'
        });
        result.response.body.should.not.eql(result.request.body);
        return done();
      });
    });

    it('should set the request body when task is a pre task and the request is continued', (done) => {
      const taskName = quickRandom();
      const task = samplePreTask(taskName);
      functions.register(taskName, (context, complete) => complete({ foo: 'bar' }).ok().next());
      return functions.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.request.body.should.eql({
          foo: 'bar'
        });
        result.request.body.should.not.eql(result.response.body);
        return done();
      });
    });

    it('should keep empty response body when task is a pre task and no body is set and the request is ended',
      (done) => {
        const taskName = quickRandom();
        const task = samplePreTask(taskName);
        functions.register(taskName, (context, complete) => complete({ foo: 'bar' }).ok().done());
        return functions.process(task, null, (err, result) => {
          should.not.exist(err);
          result.response.statusCode.should.eql(200);
          result.response.body.should.eql(task.response.body);
          return done();
        });
      });

    it('should keep existing response body when task is a pre task and no body is set and the request is continued',
      (done) => {
        const taskName = quickRandom();
        const task = samplePreTask(taskName);
        functions.register(taskName, (context, complete) => complete({ foo: 'bar' }).ok().next());
        return functions.process(task, null, (err, result) => {
          should.not.exist(err);
          result.response.statusCode.should.eql(200);
          result.request.body.should.eql({
            foo: 'bar'
          });
          result.request.body.should.not.eql(result.response.body);
          return done();
        });
      });

    it('should include the request body and headers when task is a custom endpoint task', (done) => {
      const taskName = quickRandom();
      const task = sampleCustomEndpoint(taskName);
      functions.register(taskName, (context, complete) => {
        context.body.should.eql(task.request.body);
        context.body.should.not.eql(task.response.body);
        context.headers.should.eql(task.request.headers);
        context.headers.should.not.eql(task.response.headers);
        return complete(task.response.body).ok().next();
      });
      return functions.process(task, null, () => done());
    });

    it('should set the response body when task is a custom endpoint task and the request is ended', (done) => {
      const taskName = quickRandom();
      const task = sampleCustomEndpoint(taskName);
      functions.register(taskName, (context, complete) => complete({ foo: 'bar' }).ok().done());
      return functions.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({
          foo: 'bar'
        });
        result.response.body.should.not.eql(result.request.body);
        return done();
      });
    });

    it('should set the response body when task is a custom endpoint task and the request is continued', (done) => {
      const taskName = quickRandom();
      const task = sampleCustomEndpoint(taskName);
      functions.register(taskName, (context, complete) => complete({ foo: 'bar' }).ok().next());
      return functions.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({
          foo: 'bar'
        });
        result.response.body.should.not.eql(result.request.body);
        return done();
      });
    });

    it('should keep empty response body when task is a custom endpoint and no body is set and the request is ended',
      (done) => {
        const taskName = quickRandom();
        const task = sampleCustomEndpoint(taskName);
        functions.register(taskName, (context, complete) => complete({ foo: 'bar' }).ok().done());
        return functions.process(task, null, (err, result) => {
          should.not.exist(err);
          result.response.statusCode.should.eql(200);
          result.response.body.should.eql(task.response.body);
          return done();
        });
      });

    it('should keep existing response body when task is a custom endpoint, no body is set and the request is continued',
      (done) => {
        const taskName = quickRandom();
        const task = sampleCustomEndpoint(taskName);
        functions.register(taskName, (context, complete) => complete({ foo: 'bar' }).ok().next());
        return functions.process(task, null, (err, result) => {
          should.not.exist(err);
          result.response.statusCode.should.eql(200);
          result.response.body.should.eql(task.response.body);
          result.request.body.should.not.eql(result.response.body);
          return done();
        });
      });

    it('should return a 201 created', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      functions.register(taskName, (context, complete) => complete({ foo: 'bar' }).created().done());
      return functions.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(201);
        result.response.body.should.eql({
          foo: 'bar'
        });
        return done();
      });
    });
    it('should return a 202 accepted', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      functions.register(taskName, (context, complete) => complete({ foo: 'bar' }).accepted().done());
      return functions.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(202);
        result.response.body.should.eql({
          foo: 'bar'
        });
        return done();
      });
    });
    it('should return a 400 bad request', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      functions.register(taskName, (context, complete) => complete('This is a bad request').badRequest().done());
      return functions.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(400);

        result.response.body.error.should.eql('BadRequest');
        result.response.body.description.should.eql('Unable to understand request');
        result.response.body.debug.should.eql('This is a bad request');
        return done();
      });
    });
    it('should return a 401 unauthorized', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      functions.register(taskName, (context, complete) => complete('You are not authorized!').unauthorized().done());
      return functions.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(401);
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
      functions.register(taskName, (context, complete) => complete('Forbidden!').forbidden().done());
      return functions.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(403);
        result.response.body.error.should.eql('Forbidden');
        result.response.body.description.should.eql('The request is forbidden');
        result.response.body.debug.should.eql('Forbidden!');
        return done();
      });
    });
    it('should return a 404 not found', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      functions.register(taskName, (context, complete) => complete('The request is not found!').notFound().done());
      return functions.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(404);
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
      functions.register(taskName, (context, complete) => complete('The request is not allowed!').notAllowed().done());
      return functions.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(405);
        result.response.body.error.should.eql('NotAllowed');
        result.response.body.description.should.eql('The request is not allowed');
        result.response.body.debug.should.eql('The request is not allowed!');
        return done();
      });
    });
    it('should return a 501 not implemented', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      functions.register(taskName, (context, complete) => complete('This isn\'t implemented').notImplemented().done());
      return functions.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(501);
        result.response.body.error.should.eql('NotImplemented');
        result.response.body.description.should.eql('The request invoked a method that is not implemented');
        result.response.body.debug.should.eql('This isn\'t implemented');
        return done();
      });
    });
    it('should return a 550 runtime error', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      functions.register(taskName, (context, complete) => complete('There was some error in the app!')
        .runtimeError().done());
      return functions.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(550);
        result.response.body.error.should.eql('FlexRuntimeError');
        result.response.body.description.should.eql(
          'The Flex Service had a runtime error.  See debug message for details'
        );
        result.response.body.debug.should.eql('There was some error in the app!');
        return done();
      });
    });
    it('should process a next (continuation) handler', (done) => {
      const taskName = quickRandom();
      const task = samplePostTask(taskName);
      functions.register(taskName, (context, complete) => complete({ foo: 'bar' }).ok().next());
      return functions.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({
          foo: 'bar'
        });
        result.response.continue = true;
        return done();
      });
    });
    it('should process a done (completion) handler', (done) => {
      const taskName = quickRandom();
      const task = sampleTask(taskName);
      functions.register(taskName, (context, complete) => complete({ foo: 'bar' }).ok().done());
      return functions.process(task, null, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({
          foo: 'bar'
        });
        result.response.continue = false;
        return done();
      });
    });
  });
});
