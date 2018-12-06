/**
 * Copyright (c) 2018 Kinvey Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

const moment = require('moment');

function toKinveyDateString(date) {
  if (date == null) return null;

  if (typeof date === 'string' || Object.prototype.toString.call(date) === '[object Date]' ||
    (moment.isMoment(date) && (typeof date.isValid === 'function' && date.isValid()))) {
    if (date.toString().startsWith('ISODate("')) return date;

    const parsedMoment = moment(new Date(date));
    if (!parsedMoment.isValid()) return 'Invalid date';

    return `ISODate("${parsedMoment.toISOString()}")`;
  }

  return null;
}

function fromKinveyDateString(kinveyDateString, format = 'date') {
  if (typeof kinveyDateString !== 'string'
    || (!kinveyDateString.startsWith('ISODate("') || !kinveyDateString.endsWith('")'))
    || (kinveyDateString === 'ISODate("")')) {
    return 'Invalid date';
  }

  const dateString = kinveyDateString.split('"')[1].toString();
  switch (format) {
    case 'date':
      return new Date(dateString);
    case 'moment':
      return moment(dateString);
    case 'string':
      return dateString;
    default:
      return 'Invalid Format.';
  }
}


exports.toKinveyDateString = toKinveyDateString;
exports.fromKinveyDateString = fromKinveyDateString;
