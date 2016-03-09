# Copyright (c) 2016 Kinvey Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

module.exports = (task, callback) ->

  completionHandler = (entity = {}) ->
    responseCallback = callback
    result = task.response
    result.body = entity
    methods = {}

    created = ->
      result.statusCode = 201
      return methods

    accepted = ->
      result.statusCode = 202
      return methods

    ok = ->
      result.statusCode = 200
      return methods

    notFound = (debug) ->
      result.statusCode = 404
      result.body =
        error: "NotFound"
        description: "The requested entity or entities were not found in the serviceObject"
        debug: debug or result.body or {}
      return methods

    badRequest = (debug) ->
      result.statusCode = 400
      result.body =
        error: "BadRequest"
        description: "Unable to understand request"
        debug: debug or result.body or {}
      return methods

    unauthorized = (debug) ->
      result.statusCode = 401
      result.body =
        error: "InvalidCredentials"
        description: "Invalid credentials. Please retry your request with correct credentials"
        debug: debug or result.body or {}
      return methods

    forbidden = (debug) ->
      result.statusCode = 403
      result.body =
        error: "Forbidden"
        description: "The request is forbidden"
        debug: debug or result.body or {}
      return methods

    notAllowed = (debug) ->
      result.statusCode = 405
      result.body =
        error: "NotAllowed"
        description: "The request is not allowed"
        debug: debug or result.body or {}
      return methods

    notImplemented = (debug) ->
      result.statusCode = 501
      result.body =
        error: "NotImplemented"
        description: "The request invoked a method that is not implemented"
        debug: debug or result.body or {}
      return methods

    runtimeError = (debug) ->
      result.statusCode = 550
      result.body =
        error: "DataLinkRuntimeError"
        description: "The Datalink had a runtime error.  See debug message for details"
        debug: debug or result.body or {}
      return methods

    done = ->
      unless result.statusCode?
        result.statusCode = 200

      result.body = JSON.stringify result.body

      # TODO:  Ensure that the result is a kinveyEntity or array of kinveyEntities or {count} object

      #        if result.statusCode < 400 and entityParser.isKinveyEntity(entity) is false
      #          if entity.constructor isnt Array
      #            entity = entityParser.entity entity

      result.continue = false
      responseCallback null, task

    next = ->
      unless result.statusCode?
        result.statusCode = 200

      result.body = JSON.stringify result.body

      # TODO:  Ensure that the result is a kinveyEntity or array of kinveyEntities or {count} object

      result.continue = true
      responseCallback null, task

    methods =
      created: created
      accepted: accepted
      ok: ok
      done: done
      next: next
      notFound: notFound
      badRequest: badRequest
      unauthorized: unauthorized
      forbidden: forbidden
      notAllowed: notAllowed
      notImplemented: notImplemented
      runtimeError: runtimeError

    return methods

  return completionHandler