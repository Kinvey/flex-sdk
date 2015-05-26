# Copyright (c) 2014, Kinvey, Inc. All rights reserved.
#
# This software is licensed to you under the Kinvey terms of service located at
# http://www.kinvey.com/terms-of-use. By downloading, accessing and/or using this
# software, you hereby accept such terms of service  (and any agreement referenced
# therein) and agree that you have read, understand and agree to be bound by such
# terms of service and are of legal age to agree to such terms with Kinvey.
#
# This software contains valuable confidential and proprietary information of
# KINVEY, INC and is subject to applicable licensing agreements.
# Unauthorized reproduction, transmission or distribution of this file and its
# contents is a violation of applicable laws.

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