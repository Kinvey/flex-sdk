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