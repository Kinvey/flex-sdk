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

const util = require('util');
const sift = require('sift');
const isEmpty = require('lodash.isempty');
const assign = require('lodash.assign');
const forEach = require('lodash.foreach');

const isArray = Array.isArray;
const isRegExp = util.isRegExp;

class QueryError extends Error {
  constructor(debug, description = 'An error occurred on the query.') {
    super('QueryError');
    this.description = description;
    this.debug = debug;
  }
}

function nested(obj, dotProperty, value) {
  if (!dotProperty) {
    obj = value || obj;
    return obj;
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
  constructor(options) {
    options = assign({
      fields: [],
      filter: {},
      sort: {},
      limit: null,
      skip: 0
    }, options);

    this.fields = options.fields;
    this.filter = options.filter;
    this.sort = options.sort;
    this.limit = options.limit;
    this.skip = options.skip;
    this._parent = null;
  }

  get fields() {
    return this._fields;
  }

  set fields(fields) {
    fields = fields || [];

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
      this._parent.sort(sort);
    } else {
      this._sort = sort || {};
    }
  }

  get limit() {
    return this._limit;
  }

  set limit(limit) {
    if (typeof limit === 'string') {
      limit = parseFloat(limit);
    }

    if (limit && typeof limit !== 'number') {
      throw new QueryError('limit must be a number');
    }

    if (this._parent) {
      this._parent.limit = limit;
    } else {
      this._limit = limit;
    }
  }

  get skip() {
    return this._skip;
  }

  set skip(skip = 0) {
    if (typeof skip === 'string') {
      skip = parseFloat(skip);
    }

    if (typeof skip !== 'number') {
      throw new QueryError('skip must be a number');
    }

    if (this._parent) {
      this._parent.skip(skip);
    } else {
      this._skip = skip;
    }
  }

  equalTo(field, value) {
    return this.addFilter(field, value);
  }

  contains(field, values) {
    if (!isArray(values)) {
      values = [values];
    }

    return this.addFilter(field, '$in', values);
  }

  containsAll(field, values) {
    if (!isArray(values)) {
      values = [values];
    }

    return this.addFilter(field, '$all', values);
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
    if (!isArray(values)) {
      values = [values];
    }

    return this.addFilter(field, '$nin', values);
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
    flag = typeof flag === 'undefined' ? true : flag || false;
    return this.addFilter(field, '$exists', flag);
  }

  mod(field, divisor, remainder = 0) {
    if (typeof divisor === 'string') {
      divisor = parseFloat(divisor);
    }

    if (typeof remainder === 'string') {
      remainder = parseFloat(remainder);
    }

    if (typeof divisor !== 'number') {
      throw new QueryError('divisor must be a number');
    }

    if (typeof remainder !== 'number') {
      throw new QueryError('remainder must be a number');
    }

    return this.addFilter(field, '$mod', [divisor, remainder]);
  }

  matches(field, regExp, options = {}) {
    if (!isRegExp(regExp)) {
      regExp = new RegExp(regExp);
    }

    if ((regExp.ignoreCase || options.ignoreCase) && options.ignoreCase !== false) {
      throw new QueryError('ignoreCase glag is not supported.');
    }

    if (regExp.source.indexOf('^') !== 0) {
      throw new QueryError('regExp must have `^` at the beginning of the expression ' +
        'to make it an anchored expression.');
    }

    const flags = [];

    if ((regExp.multiline || options.multiline) && options.multiline !== false) {
      flags.push('m');
    }

    if (options.extended) {
      flags.push('x');
    }

    if (options.dotMatchesAll) {
      flags.push('s');
    }

    const result = this.addFilter(field, '$regex', regExp.source);

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
    if (!isArray(coords) || coords.length > 3) {
      throw new QueryError('coords must be [[number, number]]');
    }

    coords = coords.map(coord => {
      if (!coord[0] || !coord[1]) {
        throw new QueryError('coords argument must be [number, number]');
      }

      return [parseFloat(coord[0]), parseFloat(coord[1])];
    });

    return this.addFilter(field, '$within', { $polygon: coords });
  }

  size(field, size) {
    if (typeof size === 'string') {
      size = parseFloat(size);
    }

    if (typeof size !== 'number') {
      throw new QueryError('size must be a number');
    }

    return this.addFilter(field, '$size', size);
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

    if (condition && values) {
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
    queries = queries.map(query => {
      if (!(query instanceof Query)) {
        if (typeof query === 'object') {
          query = new Query(query);
        } else {
          throw new QueryError('query argument must be of type: Kinvey.Query[] or Object[].');
        }
      }

      return query.toJSON().filter;
    });

    // If there are no `queries` supplied, create a new (empty) `Query`.
    // This query is the right-hand side of the join expression, and will be
    // returned to allow for a fluent interface.
    if (queries.length === 0) {
      that = new Query();
      queries = [that.toJSON().filter];
      that.parent = this; // Required for operator precedence and `toJSON`.
    }

    // Join operators operate on the top-level of `filter`. Since the `toJSON`
    // magic requires `filter` to be passed by reference, we cannot simply re-
    // assign `filter`. Instead, empty it without losing the reference.
    const members = Object.keys(this.filter);
    forEach(members, member => {
      currentQuery[member] = this.filter[member];
      delete this.filter[member];
    });

    // `currentQuery` is the left-hand side query. Join with `queries`.
    this.filter[operator] = [currentQuery].concat(queries);

    // Return the current query if there are `queries`, and the new (empty)
    // `PrivateQuery` otherwise.
    return that;
  }

  process(data) {
    if (data) {
      // Validate arguments.
      if (!isArray(data)) {
        throw new QueryError('data argument must be of type: Array.');
      }

      // Apply the query
      const json = this.toJSON();
      data = sift(json.filter, data);

      // Remove fields
      if (json.fields && json.fields.length > 0) {
        data = data.map((item) => {
          const keys = Object.keys(item);
          forEach(keys, key => {
            if (json.fields.indexOf(key) === -1) {
              delete item[key];
            }
          });

          return item;
        });
      }

      // Sorting.
      data = data.sort((a, b) => {
        const fields = Object.keys(json.sort);
        forEach(fields, field => {
          // Find field in objects.
          const aField = nested(a, field);
          const bField = nested(b, field);

          // Elements which do not contain the field should always be sorted
          // lower.
          if (aField && !bField) {
            return -1;
          }

          if (bField && !aField) {
            return 1;
          }

          // Sort on the current field. The modifier adjusts the sorting order
          // (ascending (-1), or descending(1)). If the fields are equal,
          // continue sorting based on the next field (if any).
          if (aField !== bField) {
            const modifier = json.sort[field]; // 1 or -1.
            return (aField < bField ? -1 : 1) * modifier;
          }

          return 0;
        });

        return 0;
      });

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

    if (!isEmpty(this.filter)) {
      queryString.query = this.filter;
    }

    if (!isEmpty(this.fields)) {
      queryString.fields = this.fields.join(',');
    }

    if (this.limit) {
      queryString.limit = this.limit;
    }

    if (this.skip > 0) {
      queryString.skip = this.skip;
    }

    if (!isEmpty(this.sort)) {
      queryString.sort = this.sort;
    }

    const keys = Object.keys(queryString);
    forEach(keys, key => {
      queryString[key] = typeof queryString[key] === 'string' ? queryString[key] : JSON.stringify(queryString[key]);
    });

    return queryString;
  }

  toString() {
    return JSON.stringify(this.toQueryString());
  }
};
