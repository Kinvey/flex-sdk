[![Build Status](https://travis-ci.org/Kinvey/flex-sdk.svg?branch=master)](https://travis-ci.org/Kinvey/flex-sdk)

# Kinvey Flex SDK

This is the SDK for code execution of Flex Microservices. The module provides a framework for building Kinvey-backend services using FlexData, FlexFunctions, and FlexAuth.

## Upgrading from 2.x to 3.x

Flex-sdk 3.x contains several breaking changes as well as new features.  To upgrade your service from Flex-sdk 2.x to 3.x:

* All email and push methods now return a promise.  It is now required that you either handle the promise, or pass a callback.
* For all stores (e.g. dataStore, userStore, etc), the deprecated options `skipBl` and `useMasterSecret` have been removed and no longer function.  Use `useBl` and `useUserContext` instead.
* All asynchonous modules (dataStore, groupStore, roleStore, endpointRunner, userStore, email, and push) now return a promise or accept a callback.
* For more information on what's new, see the [Changelog](CHANGELOG.md).

## [Official documentation](#docs)
* [Kinvey FlexServices guide](http://devcenter.kinvey.com/nodejs/guides/flex-services)
* [Developing and testing FlexServices locally](http://devcenter.kinvey.com/nodejs/guides/flex-services#runninglocally)
* [FlexService Runtime information (for deploying FlexServices to Kinvey for use in production)](http://devcenter.kinvey.com/nodejs/guides/flexservice-runtime)
* [External Flex Services](http://devcenter.kinvey.com/nodejs/guides/external-flex)

## [Installation and usage](#installation)

To install this project, add `kinvey-flex-sdk` to your `package.json` file and install it via `npm`
```
npm install kinvey-flex-sdk
```

To use this module, require it in your project as such:
```
const sdk = require('kinvey-flex-sdk');
```

### [Working Flex SDK service examples](#samples)
This section contains standalone sample microservices for FlexData, FlexFunctions, and FlexAuth frameworks. Note that all three can be combined into one service and are separated for example purposes.

#### [Flex Service initialization Options](#init)
When [developing and testing FlexServices locally](http://devcenter.kinvey.com/nodejs/guides/flex-services#runninglocally), you can specify a host and port to listen on by passing an options object with an optional host and port.  If no host/port is specified, localhost:10001 will be used:

```
sdk.service({ host: 'somehost', port: 7777 }, (err, flex) => {
  // code goes here
});
```

You can also specify a shared secret (i.e. a secret key) to be used by this service.  Any client that accesses this service *must* contain this shared secret, or requests will be rejected with a `401 Unauthorized` error.

```
sdk.service({ sharedSecret: '<some shared secret>'} }, (err, flex) => {
  // code goes here
});
```

Once set here, you must set this shared secret in the Kinvey console when configuring your service for Kinvey requests to execute properly.  For testing locally, this shared secret can be passed in the `X-Auth-Key` http header.

#### [FlexData](#flexdata)
```
const sdk = require('kinvey-flex-sdk');
sdk.service(function(err, flex) {
  const data = flex.data;   // gets the FlexData object from the service

  function getRecordById(request, complete, modules) {
    let entityId = request.entityId;
    let entity = null;

    // Do some logic to get the entity id from the remote data store
    // Assume that data is retrieved and stored in "entity" variable

    // After entity is retrieved, check to see if it exists
    if (typeof entity === 'undefined' || entity === null) {
      return complete("The entity could not be found").notFound().next();
    } else  {
      // return the entity
      return complete().setBody(entity).ok().next();
    }
  }

  // set the serviceObject
  const widgets = data.serviceObject('widgets');

  // wire up the event that we want to process
  widgets.onGetById(getRecordById);
};
```

#### [FlexFunctions](#flexfunctions)
```
const sdk = require('kinvey-flex-sdk');
const request = require('request'); // assumes that the request module was added to package.json
sdk.service(function(err, flex) {

  const flexFunctions = flex.functions;   // gets the FlexFunctions object from the service

  function getRedLineSchedule(context, complete, modules) {
    request.get('http://developer.mbta.com/Data/Red.json', (err, response, body) => {
      // if error, return an error
      if (err) {
        return complete().setBody("Could not complete request").runtimeError().done();
      }

      // otherwise, return the results
      return complete().setBody(body).ok().done();
    });

   }

  // set the handler
  flexFunctions.register('getRedLineData', getRedLineSchedule);
};
```

#### [FlexAuth](#flexauth)
```
const sdk = require('kinvey-flex-sdk');
const request = require('request'); // assumes that the request module was added to package.json
sdk.service(function(err, flex) {

  const flexAuth = flex.auth;   // gets the FlexAuth object from the service

  function authenticate(context, complete, modules) {
    // authenticate the user here
    if (err) {
      return complete().accessDenied(err).next();
    }
    return complete().setToken(token).ok().next();
  }

  // set the handler
  flexFunctions.register('myAuth', authenticate);
};
```

## Support
Please contact Kinvey for further information or questions
