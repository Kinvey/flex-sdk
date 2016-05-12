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

module.exports = (task, callback) => {
  const completionHandler = (entity) => {
    if (!entity) entity = {};

    let api = {};
    const responseCallback = callback;
    const result = task.response;

    result.body = entity;

    const created = () => {
      result.statusCode = 201;
      return api;
    };

    const accepted = () => {
      result.statusCode = 202;
      return api;
    };

    const ok = () => {
      result.statusCode = 200;
      return api;
    };

    const notFound = (debug) => {
      result.statusCode = 404;
      result.body = {
        error: 'NotFound',
        description: 'The requested entity or entities were not found in the serviceObject',
        debug: debug || result.body || {}
      };
      return api;
    };

    const badRequest = (debug) => {
      result.statusCode = 400;
      result.body = {
        error: 'BadRequest',
        description: 'Unable to understand request',
        debug: debug || result.body || {}
      };
      return api;
    };

    const unauthorized = (debug) => {
      result.statusCode = 401;
      result.body = {
        error: 'InvalidCredentials',
        description: 'Invalid credentials. Please retry your request with correct credentials',
        debug: debug || result.body || {}
      };
      return api;
    };

    const forbidden = (debug) => {
      result.statusCode = 403;
      result.body = {
        error: 'Forbidden',
        description: 'The request is forbidden',
        debug: debug || result.body || {}
      };
      return api;
    };

    const notAllowed = (debug) => {
      result.statusCode = 405;
      result.body = {
        error: 'NotAllowed',
        description: 'The request is not allowed',
        debug: debug || result.body || {}
      };
      return api;
    };

    const notImplemented = (debug) => {
      result.statusCode = 501;
      result.body = {
        error: 'NotImplemented',
        description: 'The request invoked a method that is not implemented',
        debug: debug || result.body || {}
      };
      return api;
    };

    const runtimeError = (debug) => {
      result.statusCode = 550;
      result.body = {
        error: 'DataLinkRuntimeError',
        description: 'The Datalink had a runtime error.  See debug message for details',
        debug: debug || result.body || {}
      };
      return api;
    };

    const done = () => {
      if (result.statusCode === null) {
        result.statusCode = 200;
      }
      result.body = JSON.stringify(result.body);
      result.continue = false;
      return responseCallback(null, task);
    };

    const next = () => {
      if (result.statusCode === null) {
        result.statusCode = 200;
      }
      result.body = JSON.stringify(result.body);
      result.continue = true;
      return responseCallback(null, task);
    };

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
  };

  return completionHandler;
};
