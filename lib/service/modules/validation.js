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

const has = require('lodash.has');
const isNil = require('lodash.isnil');
const forOwn = require('lodash.forown');
const util = require('util');

const validationErrors = {
  min: '%s must be greater than or equal to %d',
  max: '%s must be less than or equal to %d',
  pattern: '%s must match regex of %s',
  required: '%s is required'
};

function validate(expected, validationType, propertyName, propertyValue) {
  let valid = false;
  let error = null;

  switch (validationType) {
    case 'min':
      if (!isNil(propertyValue)) {
        if (propertyValue < expected) {
          error = util.format(validationErrors.min, propertyName, expected);
        } else {
          valid = true;
        }
      }
      break;
    case 'max':
      if (!isNil(propertyValue)) {
        if (propertyValue > expected) {
          error = util.format(validationErrors.max, propertyName, expected);
        } else {
          valid = true;
        }
      }
      break;
    case 'pattern':
      error = [];
      forOwn(expected, (val, index) => {
        const pattern = expected[index];
        const regex = new RegExp(pattern);
        if (util.isRegExp(regex) && (typeof propertyValue === 'undefined' || !regex.test(propertyValue))) {
          error.push(util.format(validationErrors.pattern, propertyName, pattern));
        }
      });
      if (error.length === 0) {
        valid = true;
      }
      break;
    case 'required':
      if (!isNil(propertyValue)) {
        valid = true;
      } else {
        error = util.format(validationErrors.required, propertyName);
      }
      break;
    default:
  }

  if (valid) return { valid: true };

  return {
    attr: propertyName,
    valid: false,
    msg: error
  };
}

function doValidation(spec, objectToValidate) {
  if (isNil(spec) || isNil(objectToValidate) || typeof spec !== 'object' || typeof objectToValidate !== 'object') {
    throw new Error('doValidation function requires two Object arguments');
  }

  const errors = [];

  for (const attrName in spec) {
    if (!has(spec, attrName)) continue;
    const attrSpec = spec[attrName];
    for (const validationType in attrSpec) {
      if (!has(attrSpec, validationType)) continue;
      const expectedValue = attrSpec[validationType];
      const validationResult = validate(expectedValue, validationType, attrName, objectToValidate[attrName]);
      if (!validationResult.valid) {
        errors.push(validationResult);
      }
    }
  }

  return errors;
}

exports.doValidation = doValidation;
