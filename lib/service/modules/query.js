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

const util = require('util');
const sift = require('sift');

const isArray = Array.isArray;
const isRegExp = util.isRegExp;

const PROTECTED_FIELDS = ['_id', '_acl'];

class QueryError extends Error {
  constructor(debug, description = 'An error occurred on the query.') {
    super('QueryError');
    this.description = description;
    this.debug = debug;
  }
}

function isObjectEmpty(obj) {
  return Object.keys(obj).length === 0;
}

function nested(nestedObj, dotProperty, value) {
  let obj = nestedObj;

  if (!dotProperty) {
    return value || obj;
  }

  const parts = dotProperty.split('.');
  let current = parts.shift();
  while (current && obj) {
    obj = obj[current];
    current = parts.shift();
  }

  return value || obj;
}

module.exports = class Query {
  constructor(options = {}) {
    const queryOptions = Object.assign({
      fields: [],
      filter: {},
      sort: {},
      limit: null,
      skip: 0
    }, options);

    this.fields = queryOptions.fields;
    this.filter = queryOptions.filter;
    this.sort = queryOptions.sort;
    this.limit = queryOptions.limit;
    this.skip = queryOptions.skip;
    this._parent = null;
  }

  get fields() {
    return this._fields;
  }

  set fields(fields = []) {
    if (!Array.isArray(fields)) {
      throw new QueryError('fields must be an Array');
    }

    if (this._parent) {
      this._parent.fields = fields;
    } else {
      this._fields = fields;
    }
  }

  get filter() {
    return this._filter;
  }

  set filter(filter) {
    this._filter = filter;
  }

  get sort() {
    return this._sort;
  }

  set sort(sort) {
    if (sort && typeof sort !== 'object') {
      throw new QueryError('sort must an Object');
    }

    if (this._parent) {
      this._parent.sort = sort;
    } else {
      this._sort = sort || {};
    }
  }

  get limit() {
    return this._limit;
  }

  set limit(limit) {
    const queryLimit = typeof limit === 'string' ? parseFloat(limit) : limit;

    if (queryLimit && typeof queryLimit !== 'number') {
      throw new QueryError('limit must be a number');
    }

    if (this._parent) {
      this._parent.limit = queryLimit;
    } else {
      this._limit = queryLimit;
    }
  }

  get skip() {
    return this._skip;
  }

  set skip(skip = 0) {
    const querySkip = typeof skip === 'string' ? parseFloat(skip) : skip;

    if (typeof querySkip !== 'number') {
      throw new QueryError('skip must be a number');
    }

    if (this._parent) {
      this._parent.skip = querySkip;
    } else {
      this._skip = querySkip;
    }
  }

  equalTo(field, value) {
    return this.addFilter(field, value);
  }

  contains(field, values) {
    const containsValues = isArray(values) ? values : [values];
    return this.addFilter(field, '$in', containsValues);
  }

  containsAll(field, values) {
    const containsValues = isArray(values) ? values : [values];
    return this.addFilter(field, '$all', containsValues);
  }

  greaterThan(field, value) {
    if (typeof value !== 'number' && typeof value !== 'string') {
      throw new QueryError('You must supply a number or string.');
    }

    return this.addFilter(field, '$gt', value);
  }

  greaterThanOrEqualTo(field, value) {
    if (typeof value !== 'number' && typeof value !== 'string') {
      throw new QueryError('You must supply a number or string.');
    }

    return this.addFilter(field, '$gte', value);
  }

  lessThan(field, value) {
    if (typeof value !== 'number' && typeof value !== 'string') {
      throw new QueryError('You must supply a number or string.');
    }

    return this.addFilter(field, '$lt', value);
  }

  lessThanOrEqualTo(field, value) {
    if (typeof value !== 'number' && typeof value !== 'string') {
      throw new QueryError('You must supply a number or string.');
    }

    return this.addFilter(field, '$lte', value);
  }

  notEqualTo(field, value) {
    return this.addFilter(field, '$ne', value);
  }

  notContainedIn(field, values) {
    const containsValues = isArray(values) ? values : [values];
    return this.addFilter(field, '$nin', containsValues);
  }

  and(...args) {
    // AND has highest precedence. Therefore, even if this query is part of a
    // JOIN already, apply it on this query.
    return this.join('$and', args);
  }

  nor(...args) {
    // NOR is preceded by AND. Therefore, if this query is part of an AND-join,
    // apply the NOR onto the parent to make sure AND indeed precedes NOR.
    if (this._parent && this._parent.filter.$and) {
      return this._parent.nor(...args);
    }

    return this.join('$nor', args);
  }

  or(...args) {
    // OR has lowest precedence. Therefore, if this query is part of any join,
    // apply the OR onto the parent to make sure OR has indeed the lowest
    // precedence.
    if (this._parent) {
      return this._parent.or(...args);
    }

    return this.join('$or', args);
  }

  exists(field, flag) {
    const fieldExists = typeof flag === 'undefined' ? true : flag || false;
    return this.addFilter(field, '$exists', fieldExists);
  }

  mod(field, divisor, remainder = 0) {
    const modDivisor = typeof divisor === 'string' ? parseFloat(divisor) : divisor;
    const modRemainder = typeof remainder === 'string' ? parseFloat(remainder) : remainder;

    if (typeof divisor !== 'number') {
      throw new QueryError('divisor must be a number');
    }

    if (typeof remainder !== 'number') {
      throw new QueryError('remainder must be a number');
    }

    return this.addFilter(field, '$mod', [modDivisor, modRemainder]);
  }

  matches(field, regExp, options = {}) {
    const expression = isRegExp(regExp) ? regExp : new RegExp(regExp);

    if ((expression.ignoreCase || options.ignoreCase) && options.ignoreCase !== false) {
      throw new QueryError('ignoreCase is not supported.');
    }

    if (expression.source.indexOf('^') !== 0) {
      throw new QueryError('regExp must have `^` at the beginning of the expression ' +
        'to make it an anchored expression.');
    }

    const flags = [];

    if ((expression.multiline || options.multiline) && options.multiline !== false) {
      flags.push('m');
    }

    if (options.extended) {
      flags.push('x');
    }

    if (options.dotMatchesAll) {
      flags.push('s');
    }

    const result = this.addFilter(field, '$regex', expression.source);

    if (flags.length) {
      this.addFilter(field, '$options', flags.join(''));
    }

    return result;
  }

  near(field, coord, maxDistance) {
    if (!isArray(coord) || typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
      throw new QueryError('coord must be a [number, number]');
    }

    const result = this.addFilter(field, '$nearSphere', [coord[0], coord[1]]);

    if (maxDistance) {
      this.addFilter(field, '$maxDistance', maxDistance);
    }

    return result;
  }

  withinBox(field, bottomLeftCoord, upperRightCoord) {
    if (!isArray(bottomLeftCoord) || !bottomLeftCoord[0] || !bottomLeftCoord[1]) {
      throw new QueryError('bottomLeftCoord must be a [number, number]');
    }

    if (!isArray(upperRightCoord) || !upperRightCoord[0] || !upperRightCoord[1]) {
      throw new QueryError('upperRightCoord must be a [number, number]');
    }

    bottomLeftCoord[0] = parseFloat(bottomLeftCoord[0]);
    bottomLeftCoord[1] = parseFloat(bottomLeftCoord[1]);
    upperRightCoord[0] = parseFloat(upperRightCoord[0]);
    upperRightCoord[1] = parseFloat(upperRightCoord[1]);

    const coords = [
      [bottomLeftCoord[0], bottomLeftCoord[1]],
      [upperRightCoord[0], upperRightCoord[1]]
    ];
    return this.addFilter(field, '$within', { $box: coords });
  }

  withinPolygon(field, coords) {
    if (!isArray(coords) || coords.length === 0 || coords.length > 3) {
      throw new QueryError('coords must be [[number, number]]');
    }

    const polyCoords = coords.map((coord) => {
      if (!coord[0] || !coord[1]) {
        throw new QueryError('coords argument must be [number, number]');
      }

      return [parseFloat(coord[0]), parseFloat(coord[1])];
    });

    return this.addFilter(field, '$within', { $polygon: polyCoords });
  }

  size(field, size) {
    const sizeValue = typeof size === 'string' ? parseFloat(size) : size;

    if (typeof sizeValue !== 'number') {
      throw new QueryError('size must be a number');
    }

    return this.addFilter(field, '$size', sizeValue);
  }

  ascending(field) {
    if (this._parent) {
      this._parent.ascending(field);
    } else {
      this.sort[field] = 1;
    }

    return this;
  }

  descending(field) {
    if (this._parent) {
      this._parent.descending(field);
    } else {
      this.sort[field] = -1;
    }

    return this;
  }

  addFilter(field, condition, values) {
    if (typeof this.filter[field] !== 'object') {
      this.filter[field] = {};
    }

    const isValueValid = values || values === 0 || values === null || values === '' || values === false ||
      (typeof values === 'number' && isNaN(values));
    if (condition && isValueValid) {
      this.filter[field][condition] = values;
    } else {
      this.filter[field] = condition;
    }

    return this;
  }

  join(operator, queries) {
    let that = this;
    const currentQuery = {};

    // Cast, validate, and parse arguments. If `queries` are supplied, obtain
    // the `filter` for joining. The eventual return function will be the
    // current query.
    let mappedQueries = queries.map((query) => {
      if (!(query instanceof Query)) {
        if (typeof query === 'object') {
          return new Query(query).toJSON().filter;
        }
        throw new QueryError('query argument must be of type: Kinvey.Query[] or Object[].');
      }

      return query.toJSON().filter;
    });

    // If there are no `queries` supplied, create a new (empty) `Query`.
    // This query is the right-hand side of the join expression, and will be
    // returned to allow for a fluent interface.
    if (mappedQueries.length === 0) {
      that = new Query();
      mappedQueries = [that.toJSON().filter];
      that._parent = this; // Required for operator precedence and `toJSON`.
    }

    // Join operators operate on the top-level of `filter`. Since the `toJSON`
    // magic requires `filter` to be passed by reference, we cannot simply re-
    // assign `filter`. Instead, empty it without losing the reference.
    const members = Object.keys(this.filter);
    members.forEach((member) => {
      currentQuery[member] = this.filter[member];
      delete this.filter[member];
    });

    // `currentQuery` is the left-hand side query. Join with `queries`.
    this.filter[operator] = [currentQuery].concat(mappedQueries);

    // Return the current query if there are `queries`, and the new (empty)
    // `PrivateQuery` otherwise.
    return that;
  }

  process(dataToProcess) {
    let data = dataToProcess;

    if (data) {
      // Validate arguments.
      if (!isArray(data)) {
        throw new QueryError('data argument must be of type: Array.');
      }

      // Apply the query
      const json = this.toJSON();
      data = sift(json.filter, data);

      if (json.sort != null) {
        data.sort((a, b) => {
          let sortAction = 0;

          Object.keys(json.sort).some((field) => {
            // Find field in objects.
            const aField = nested(a, field);
            const bField = nested(b, field);
            const modifier = json.sort[field]; // 1 (ascending) or -1 (descending).

            if (aField != null && bField == null) {
              sortAction = 1 * modifier;
              return true;
            } else if (aField == null && bField != null) {
              sortAction = -1 * modifier;
              return true;
            } else if (typeof aField === 'undefined' && bField === null) {
              sortAction = 0;
              return true;
            } else if (aField === null && typeof bField === 'undefined') {
              sortAction = 0;
              return true;
            } else if (aField !== bField) {
              sortAction = (aField < bField ? -1 : 1) * modifier;
            }
            return false;
          });

          return sortAction;
        });
      }

      // Remove fields
      if (Array.isArray(json.fields) && json.fields.length > 0) {
        const fields = [].concat(json.fields, PROTECTED_FIELDS);
        data = data.map((item) => {
          const keys = Object.keys(item);
          keys.forEach((key) => {
            if (fields.indexOf(key) === -1) {
              delete item[key];
            }
          });

          return item;
        });
      }

      // Limit and skip.
      if (json.limit) {
        return data.slice(json.skip, json.skip + json.limit);
      }

      return data.slice(json.skip);
    }

    return data;
  }

  toPlainObject() {
    if (this._parent) {
      return this._parent.toPlainObject();
    }

    // Return set of parameters.
    const json = {
      fields: this.fields,
      filter: this.filter,
      sort: this.sort,
      skip: this.skip,
      limit: this.limit
    };

    return json;
  }

  toJSON() {
    return this.toPlainObject();
  }

  toQueryString() {
    const queryString = {};

    if (!isObjectEmpty(this.filter)) {
      queryString.query = this.filter;
    }

    if (this.fields.length > 0) {
      queryString.fields = this.fields.join(',');
    }

    if (this.limit) {
      queryString.limit = this.limit;
    }

    if (this.skip > 0) {
      queryString.skip = this.skip;
    }

    if (!isObjectEmpty(this.sort)) {
      queryString.sort = this.sort;
    }

    const keys = Object.keys(queryString);
    keys.forEach((key) => {
      queryString[key] = typeof queryString[key] === 'string' ? queryString[key] : JSON.stringify(queryString[key]);
    });

    return queryString;
  }

  toString() {
    return JSON.stringify(this.toQueryString());
  }
};
