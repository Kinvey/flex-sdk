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

'use strict';

function createCompletionHandler(task, callback) {
  function completionHandler(entity) {
    if (!entity) entity = {};

    let api = {};
    const responseCallback = callback;
    const result = task.response;

    result.body = entity;

    function created() {
      result.statusCode = 201;
      return api;
    }

    function accepted() {
      result.statusCode = 202;
      return api;
    }

    function ok() {
      result.statusCode = 200;
      return api;
    }

    function notFound(debug) {
      result.statusCode = 404;
      result.body = {
        error: 'NotFound',
        description: 'The requested entity or entities were not found in the serviceObject',
        debug: debug || result.body || {}
      };
      return api;
    }

    function badRequest(debug) {
      result.statusCode = 400;
      result.body = {
        error: 'BadRequest',
        description: 'Unable to understand request',
        debug: debug || result.body || {}
      };
      return api;
    }

    function unauthorized(debug) {
      result.statusCode = 401;
      result.body = {
        error: 'InvalidCredentials',
        description: 'Invalid credentials. Please retry your request with correct credentials',
        debug: debug || result.body || {}
      };
      return api;
    }

    function forbidden(debug) {
      result.statusCode = 403;
      result.body = {
        error: 'Forbidden',
        description: 'The request is forbidden',
        debug: debug || result.body || {}
      };
      return api;
    }

    function notAllowed(debug) {
      result.statusCode = 405;
      result.body = {
        error: 'NotAllowed',
        description: 'The request is not allowed',
        debug: debug || result.body || {}
      };
      return api;
    }

    function notImplemented(debug) {
      result.statusCode = 501;
      result.body = {
        error: 'NotImplemented',
        description: 'The request invoked a method that is not implemented',
        debug: debug || result.body || {}
      };
      return api;
    }

    function runtimeError(debug) {
      result.statusCode = 550;
      result.body = {
        error: 'DataLinkRuntimeError',
        description: 'The Datalink had a runtime error.  See debug message for details',
        debug: debug || result.body || {}
      };
      return api;
    }

    function done() {
      if (result.statusCode === null) {
        result.statusCode = 200;
      }
      result.body = JSON.stringify(result.body);

      // TODO:  Ensure that the result is a kinveyEntity or array of kinveyEntities or {count} object
      //
      //        if result.statusCode < 400 and entityParser.isKinveyEntity(entity) is false
      //          if entity.constructor isnt Array
      //            entity = entityParser.entity entity

      result.continue = false;
      return responseCallback(null, task);
    }

    function next() {
      if (result.statusCode === null) {
        result.statusCode = 200;
      }
      result.body = JSON.stringify(result.body);

      // TODO:  Ensure that the result is a kinveyEntity or array of kinveyEntities or {count} object

      result.continue = true;
      return responseCallback(null, task);
    }

    api = {
      created,
      accepted,
      ok,
      done,
      next,
      notFound,
      badRequest,
      unauthorized,
      forbidden,
      notAllowed,
      notImplemented,
      runtimeError
    };

    return api;
  }

  return completionHandler;
}

module.exports = createCompletionHandler;
