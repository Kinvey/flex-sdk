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

const data = require('../../../lib/service/data');
const should = require('should');

const serviceObjectName = 'myServiceObject';

function sampleTask() {
  return {
    taskType: 'data',
    method: 'POST',
    endpoint: null,
    request: {
      method: 'POST',
      headers: {},
      entityId: '12345',
      serviceObjectName
    },
    response: {
      status: 0,
      headers: {},
      body: {}
    }
  };
}

describe('FlexData', () => {
  afterEach((done) => {
    data.clearAll();
    return done();
  });
  describe('data registration', () => {
    it('can register an insert', (done) => {
      data.serviceObject(serviceObjectName).onInsert(() => done());
      const fn = data.serviceObject(serviceObjectName).resolve('onInsert');
      return fn();
    });
    it('can register a deleteAll', (done) => {
      data.serviceObject(serviceObjectName).onDeleteAll(() => done());
      const fn = data.serviceObject(serviceObjectName).resolve('onDeleteAll');
      return fn();
    });
    it('can register a deleteById', (done) => {
      data.serviceObject(serviceObjectName).onDeleteById(() => done());
      const fn = data.serviceObject(serviceObjectName).resolve('onDeleteById');
      return fn();
    });
    it('can register a deleteByQuery', (done) => {
      data.serviceObject(serviceObjectName).onDeleteByQuery(() => done());
      const fn = data.serviceObject(serviceObjectName).resolve('onDeleteByQuery');
      return fn();
    });
    it('can register an update', (done) => {
      data.serviceObject(serviceObjectName).onUpdate(() => done());
      const fn = data.serviceObject(serviceObjectName).resolve('onUpdate');
      return fn();
    });
    it('can register a getAll', (done) => {
      data.serviceObject(serviceObjectName).onGetAll(() => done());
      const fn = data.serviceObject(serviceObjectName).resolve('onGetAll');
      return fn();
    });
    it('can register a getById', (done) => {
      data.serviceObject(serviceObjectName).onGetById(() => done());
      const fn = data.serviceObject(serviceObjectName).resolve('onGetById');
      return fn();
    });
    it('can register a getByQuery', (done) => {
      data.serviceObject(serviceObjectName).onGetByQuery(() => done());
      const fn = data.serviceObject(serviceObjectName).resolve('onGetByQuery');
      return fn();
    });
    it('can register a getCount', (done) => {
      data.serviceObject(serviceObjectName).onGetCount(() => done());
      const fn = data.serviceObject(serviceObjectName).resolve('onGetCount');
      return fn();
    });
    return it('can register a getCount by query', (done) => {
      data.serviceObject(serviceObjectName).onGetCount(() => done());
      const fn = data.serviceObject(serviceObjectName).resolve('onGetCount');
      return fn();
    });
  });
  describe('discovery', () => {
    afterEach((done) => {
      data.clearAll();
      return done();
    });
    it('returns an array of all registered serviceObjects', (done) => {
      const testName = 'testObj';
      data.serviceObject(testName);
      const discoveredServiceObjects = data.getServiceObjects();
      discoveredServiceObjects.length.should.eql(1);
      should.exist(discoveredServiceObjects[0]);
      discoveredServiceObjects[0].should.eql(testName);
      done();
    });
  });
  describe('processing', () => {
    describe('error cases', () => {
      it("should return a 'BadRequest' response with a non-JSON body", (done) => {
        const task = {
          request: {
            serviceObjectName: 'testObject',
            body: "{;'"
          },
          response: {
            body: {}
          }
        };
        return data.process(task, null, (err) => {
          err.response.statusCode.should.eql(400);
          err.response.body.debug.should.eql('Request body contains invalid JSON');
          return done();
        });
      });
      it("should return a 'BadRequest' response with a non-JSON query", (done) => {
        const task = {
          request: {
            serviceObjectName: 'testObject',
            body: {},
            query: "{;'"
          },
          response: {
            body: {}
          }
        };
        return data.process(task, null, (err) => {
          err.response.statusCode.should.eql(400);
          err.response.body.debug.should.eql('Request query contains invalid JSON');
          return done();
        });
      });
      it('will return an error if the handler isn\'t registered', (done) => {
        const task = sampleTask();
        task.method = 'GET';
        data.serviceObject(serviceObjectName).onGetAll(() => {});
        return data.process(task, {}, (err, result) => {
          result.response.continue.should.eql(false);
          result.response.statusCode.should.eql(501);
          result.response.body.error.should.eql('NotImplemented');
          result.response.body.description.should.eql('The request invoked a method that is not implemented');
          result.response.body.debug.should.eql('These methods are not implemented');
          return done();
        });
      });
      it('will return an error if the ServiceObject name isn\'t set', (done) => {
        const task = {
          response: {
            body: {}
          }
        };
        return data.process(task, {}, (err) => {
          err.response.body.debug.should.eql('ServiceObject name not found');
          return done();
        });
      });
      it('will return an error if the method isn\'t set', (done) => {
        const task = sampleTask();
        delete task.method;
        data.serviceObject(serviceObjectName).onInsert(() => {});
        return data.process(task, {}, (err) => {
          err.response.body.debug.should.eql('Cannot determine data operation');
          return done();
        });
      });
    });
    it('can explicitly set a body', (done) => {
      const task = sampleTask();
      data.serviceObject(serviceObjectName).onInsert((context, complete) => complete()
        .setBody({ foo: 'bar' })
        .ok()
        .done());
      return data.process(task, {}, (err, result) => {
        should.not.exist(err);
        result.response.body.should.eql({ foo: 'bar' });
        done();
      });
    });
    it('can process an insert', (done) => {
      const task = sampleTask();
      data.serviceObject(serviceObjectName).onInsert((context) => {
        context.entityId = task.request.entityId;
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process an insert and include request, complete, and modules', (done) => {
      const task = sampleTask();
      data.serviceObject(serviceObjectName).onInsert((context, complete, modules) => {
        context.should.be.an.Object();
        complete.should.be.a.Function();
        modules.should.be.an.Object();
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process an update', (done) => {
      const task = sampleTask();
      task.method = 'PUT';
      data.serviceObject(serviceObjectName).onUpdate((context) => {
        context.entityId.should.eql(task.request.entityId);
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process an update and include context, complete, and modules', (done) => {
      const task = sampleTask();
      task.method = 'PUT';
      data.serviceObject(serviceObjectName).onUpdate((context, complete, modules) => {
        context.should.be.an.Object();
        complete.should.be.a.Function();
        modules.should.be.an.Object();
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process a get all', (done) => {
      const task = sampleTask();
      task.method = 'GET';
      delete task.entityId;
      delete task.request.entityId;
      delete task.query;
      delete task.request.query;
      data.serviceObject(serviceObjectName).onGetAll((context) => {
        should.not.exist(context.entityId);
        should.not.exist(context.query);
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process a getAll and include context, complete, and modules', (done) => {
      const task = sampleTask();
      task.method = 'GET';
      delete task.entityId;
      delete task.request.entityId;
      delete task.query;
      delete task.request.query;
      data.serviceObject(serviceObjectName).onGetAll((context, complete, modules) => {
        context.should.be.an.Object();
        complete.should.be.a.Function();
        modules.should.be.an.Object();
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process a get by Id', (done) => {
      const task = sampleTask();
      task.method = 'GET';
      delete task.query;
      delete task.request.query;
      data.serviceObject(serviceObjectName).onGetById((context) => {
        context.entityId.should.eql(task.request.entityId);
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process a getById and include context, complete, and modules', (done) => {
      const task = sampleTask();
      task.method = 'GET';
      delete task.query;
      delete task.request.query;
      data.serviceObject(serviceObjectName).onGetById((context, complete, modules) => {
        context.should.be.an.Object();
        complete.should.be.a.Function();
        modules.should.be.an.Object();
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process a get by query', (done) => {
      const task = sampleTask();
      task.method = 'GET';
      delete task.entityId;
      delete task.request.entityId;
      task.request.query = {};
      task.query = {};
      data.serviceObject(serviceObjectName).onGetByQuery((context) => {
        should.not.exist(context.entityId);
        context.query.should.eql(task.request.query);
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process a getByQuery and include context, complete, and modules', (done) => {
      const task = sampleTask();
      task.method = 'GET';
      delete task.entityId;
      delete task.request.entityId;
      task.request.query = {};
      task.query = {};
      data.serviceObject(serviceObjectName).onGetByQuery((context, complete, modules) => {
        context.should.be.an.Object();
        complete.should.be.a.Function();
        modules.should.be.an.Object();
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process a get by query with a query just in the top level task', (done) => {
      const query = {
        foo: 'bar'
      };
      const task = sampleTask();
      task.method = 'GET';
      delete task.entityId;
      delete task.request.entityId;
      task.query = query;
      data.serviceObject(serviceObjectName).onGetByQuery((context) => {
        context.query.should.eql(query);
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process a get by query with a query just in the context', (done) => {
      const query = {
        foo: 'bar'
      };
      const task = sampleTask();
      task.method = 'GET';
      delete task.entityId;
      delete task.request.entityId;
      task.request.query = query;
      data.serviceObject(serviceObjectName).onGetByQuery((context) => {
        context.query.should.eql(query);
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process a delete all', (done) => {
      const task = sampleTask();
      task.method = 'DELETE';
      delete task.entityId;
      delete task.request.entityId;
      delete task.query;
      delete task.request.query;
      data.serviceObject(serviceObjectName).onDeleteAll((context) => {
        should.not.exist(context.entityId);
        should.not.exist(context.query);
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process a deleteAll and include context, complete, and modules', (done) => {
      const task = sampleTask();
      task.method = 'DELETE';
      delete task.entityId;
      delete task.request.entityId;
      delete task.query;
      delete task.request.query;
      data.serviceObject(serviceObjectName).onDeleteAll((context, complete, modules) => {
        context.should.be.an.Object();
        complete.should.be.a.Function();
        modules.should.be.an.Object();
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process a delete by Id', (done) => {
      const task = sampleTask();
      task.method = 'DELETE';
      delete task.query;
      delete task.request.query;
      data.serviceObject(serviceObjectName).onDeleteById((context) => {
        context.entityId.should.eql(task.request.entityId);
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process a deleteById and include context, complete, and modules', (done) => {
      const task = sampleTask();
      task.method = 'DELETE';
      delete task.query;
      delete task.request.query;
      data.serviceObject(serviceObjectName).onDeleteById((context, complete, modules) => {
        context.should.be.an.Object();
        complete.should.be.a.Function();
        modules.should.be.an.Object();
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process a delete by query', (done) => {
      const task = sampleTask();
      task.method = 'DELETE';
      delete task.entityId;
      delete task.request.entityId;
      task.request.query = {};
      task.query = {};
      data.serviceObject(serviceObjectName).onDeleteByQuery((context) => {
        should.not.exist(context.entityId);
        context.query.should.eql(task.request.query);
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process a deleteByQuery and include request, complete, and modules', (done) => {
      const task = sampleTask();
      task.method = 'DELETE';
      delete task.entityId;
      delete task.request.entityId;
      task.request.query = {};
      task.query = {};
      data.serviceObject(serviceObjectName).onDeleteByQuery((context, complete, modules) => {
        context.should.be.an.Object();
        complete.should.be.a.Function();
        modules.should.be.an.Object();
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process a count all', (done) => {
      const task = sampleTask();
      task.method = 'GET';
      task.endpoint = '_count';
      delete task.entityId;
      delete task.request.entityId;
      delete task.query;
      delete task.request.query;
      data.serviceObject(serviceObjectName).onGetCount((context) => {
        should.not.exist(context.entityId);
        should.not.exist(context.query);
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process a count all and include context, complete, and modules', (done) => {
      const task = sampleTask();
      task.method = 'GET';
      task.endpoint = '_count';
      delete task.entityId;
      delete task.request.entityId;
      delete task.query;
      delete task.request.query;
      data.serviceObject(serviceObjectName).onGetCount((context, complete, modules) => {
        context.should.be.an.Object();
        complete.should.be.a.Function();
        modules.should.be.an.Object();
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process a count by query', (done) => {
      const task = sampleTask();
      task.method = 'GET';
      task.endpoint = '_count';
      delete task.entityId;
      delete task.request.entityId;
      task.request.query = {};
      task.query = {};
      data.serviceObject(serviceObjectName).onGetCountByQuery((context) => {
        should.not.exist(context.entityId);
        context.query.should.eql(task.request.query);
        return done();
      });
      return data.process(task, {}, () => {});
    });
    it('can process a count by query and include request, complete, and modules', (done) => {
      const task = sampleTask();
      task.method = 'GET';
      task.endpoint = '_count';
      delete task.entityId;
      delete task.request.entityId;
      task.request.query = {};
      task.query = {};
      data.serviceObject(serviceObjectName).onGetCountByQuery((context, complete, modules) => {
        context.should.be.an.Object();
        complete.should.be.a.Function();
        modules.should.be.an.Object();
        return done();
      });
      return data.process(task, {}, () => {});
    });
  });
  describe('completion handlers', () => {
    it('should return a successful response', (done) => {
      const task = sampleTask();
      data.serviceObject(serviceObjectName).onInsert((context, complete) => complete().ok().next());
      return data.process(task, {}, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({});
        return done();
      });
    });
    it('should include a body', (done) => {
      const task = sampleTask();
      data.serviceObject(serviceObjectName).onInsert((context, complete) => complete({ foo: 'bar' }).ok().next());
      return data.process(task, {}, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({
          foo: 'bar'
        });
        return done();
      });
    });
    it('should return a 201 created', (done) => {
      const task = sampleTask();
      data.serviceObject(serviceObjectName).onInsert((context, complete) => complete({ foo: 'bar' }).created().next());
      return data.process(task, {}, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(201);
        result.response.body.should.eql({
          foo: 'bar'
        });
        return done();
      });
    });
    it('should return a 202 accepted', (done) => {
      const task = sampleTask();
      data.serviceObject(serviceObjectName).onInsert((context, complete) => complete({ foo: 'bar' }).accepted().next());
      return data.process(task, {}, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(202);
        result.response.body.should.eql({
          foo: 'bar'
        });
        return done();
      });
    });
    it('should return a 400 bad request', (done) => {
      const task = sampleTask();
      data.serviceObject(serviceObjectName).onInsert((context, complete) => complete('This is a bad request')
        .badRequest().next());
      return data.process(task, {}, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(400);
        result.response.body.error.should.eql('BadRequest');
        result.response.body.description.should.eql('Unable to understand request');
        result.response.body.debug.should.eql('This is a bad request');
        return done();
      });
    });
    it('should return a 401 unauthorized', (done) => {
      const task = sampleTask();
      data.serviceObject(serviceObjectName).onInsert((context, complete) => complete('You are not authorized!')
        .unauthorized().next());
      return data.process(task, {}, (err, result) => {
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
      const task = sampleTask();
      data.serviceObject(serviceObjectName).onInsert((context, complete) => complete('Forbidden!').forbidden().next());
      return data.process(task, {}, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(403);
        result.response.body.error.should.eql('Forbidden');
        result.response.body.description.should.eql('The request is forbidden');
        result.response.body.debug.should.eql('Forbidden!');
        return done();
      });
    });
    it('should return a 404 not found', (done) => {
      const task = sampleTask();
      data.serviceObject(serviceObjectName).onInsert((context, complete) => complete('The request is not found!')
        .notFound().next());
      return data.process(task, {}, (err, result) => {
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
      const task = sampleTask();
      data.serviceObject(serviceObjectName).onInsert((context, complete) => complete('The request is not allowed!')
        .notAllowed().next());
      return data.process(task, {}, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(405);
        result.response.body.error.should.eql('NotAllowed');
        result.response.body.description.should.eql('The request is not allowed');
        result.response.body.debug.should.eql('The request is not allowed!');
        return done();
      });
    });
    it('should return a 501 not implemented', (done) => {
      const task = sampleTask();
      data.serviceObject(serviceObjectName).onInsert((context, complete) => complete('This isn\'t implemented')
        .notImplemented().next());
      return data.process(task, {}, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(501);
        result.response.body.error.should.eql('NotImplemented');
        result.response.body.description.should.eql('The request invoked a method that is not implemented');
        result.response.body.debug.should.eql('This isn\'t implemented');
        return done();
      });
    });
    it('should return a 550 runtime error', (done) => {
      const task = sampleTask();
      data.serviceObject(serviceObjectName).onInsert((context, complete) =>
        complete('There was some error in the app!').runtimeError().next());
      return data.process(task, {}, (err, result) => {
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
      const task = sampleTask();
      data.serviceObject(serviceObjectName).onInsert((context, complete) => complete({ foo: 'bar' }).ok().next());
      return data.process(task, {}, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({
          foo: 'bar'
        });
        result.response.continue.should.eql(true);
        return done();
      });
    });
    it('should process a done (completion) handler', (done) => {
      const task = sampleTask();
      data.serviceObject(serviceObjectName).onInsert((context, complete) => complete({ foo: 'bar' }).ok().done());
      return data.process(task, {}, (err, result) => {
        should.not.exist(err);
        result.response.statusCode.should.eql(200);
        result.response.body.should.eql({
          foo: 'bar'
        });
        result.response.continue.should.eql(false);
        return done();
      });
    });
  });
});
