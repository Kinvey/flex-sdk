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

module.exports = do ->

  (metadata) ->

    clientAppVersion = do ->
      string = null
      major = minor = patch = Number.NaN
      numericParts = [major, minor, patch]
      if metadata.clientAppVersion? and metadata.clientAppVersion isnt ''
        string = metadata.clientAppVersion
        parts = string.split('.')
        for part, index in parts
          if index >= 3
            break
          if (part.match(/^\d+$/) isnt null)
            numericParts[index] = parseInt(part)
      return {
      stringValue: ->
        string
      majorVersion: ->
        numericParts[0]
      minorVersion: ->
        numericParts[1]
      patchVersion: ->
        numericParts[2]
      }


    metadata.customRequestProperties = metadata.customRequestProperties ? {}
    getCustomRequestProperties = ->
      metadata.customRequestProperties

    requestContextObject = {
      getAuthenticatedUsername: -> metadata.authenticatedUsername
      getAuthenticatedUserId: -> metadata.authenticatedUserId
      getCustomRequestProperty: (propertyName) ->
        metadata.customRequestProperties[propertyName]
      setCustomRequestProperty: (propertyName, propertyValue) ->
        metadata.customRequestProperties[propertyName] = propertyValue
      clientAppVersion: clientAppVersion
    }

    Object.defineProperty(requestContextObject, "getCustomRequestProperties", {enumerable: false, configurable: false, value:getCustomRequestProperties})

    return requestContextObject