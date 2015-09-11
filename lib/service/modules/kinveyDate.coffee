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

moment = require 'moment'

module.exports = do ->

  () ->

    dateToKinveyDateString = (date) ->
      return unless date?

      if typeof date is 'string' or Object::toString.call(date) is '[object Date]' or (moment.isMoment(date) and date.isValid?())
        if date.toString().indexOf('ISODate("') is 0
          return date

        parsedMoment = moment new Date(date)
        return 'Invalid date' unless parsedMoment.isValid()

        return 'ISODate("' + parsedMoment.toISOString() + '")'

    kinveyDateStringToDate = (kinveyDateString, format = 'date') ->
      unless typeof kinveyDateString is 'string' and kinveyDateString.indexOf('ISODate("') is 0
        return 'Invalid date'

      dateString = kinveyDateString.split('"')[1].toString()
      switch format
        when 'date' then return new Date dateString

        when 'moment' then return moment dateString

        when 'string' then return dateString

        else return 'Invalid Format.'

    kinveyDate =
      toKinveyDateString: dateToKinveyDateString
      fromKinveyDateString: kinveyDateStringToDate

    return kinveyDate