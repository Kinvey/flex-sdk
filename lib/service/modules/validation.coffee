# Copyright (c) 2015 Kinvey Inc.
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

util = require 'util'

module.exports = do ->
  validationErrors =
    min: '%s must be greater than or equal to %d'
    max: '%s must be less than or equal to %d'
    pattern: '%s must match regex of %s'
    required: "%s is required"

  validate = (expected, validationType, propertyName, propertyValue) ->
    valid = false
    error = null

    switch validationType
      when 'min'
        if propertyValue?
          if propertyValue < expected
            error = util.format validationErrors.min, propertyName, expected
          else
            valid = true

      when 'max'
        if propertyValue?
          if propertyValue > expected
            error = util.format validationErrors.max, propertyName, expected
          else
            valid = true

      when 'pattern'
        error = []
        for pattern in expected
          regex = new RegExp pattern
          if util.isRegExp(regex) and (typeof propertyValue is 'undefined' or not regex.test(propertyValue))
            # regex either failed or 'expected' is undefined
            error.push util.format validationErrors.pattern, propertyName, pattern

        if error.length is 0
          valid = true

      when 'required'
        if propertyValue?
          valid = true
        else
          error = util.format validationErrors.required, propertyName

    if valid then return { valid: true }

    return {
    attr: propertyName
    valid: false
    msg: error
    }

  return {
  doValidation: (spec, objectToValidate) ->
    unless spec? and objectToValidate? and typeof spec is 'object' and typeof objectToValidate is 'object'
      throw new Error 'doValidation function requires two Object arguments'

    errors = []

    for own attrName, attrSpec of spec
      for own validationType, expectedValue of attrSpec
        validationResult = validate expectedValue, validationType, attrName, objectToValidate[attrName]

        unless validationResult.valid
          errors.push validationResult

    return errors
  }