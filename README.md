# Kinvey Flex SDK (beta)

This is the SDK for code execution of Flex Microservices. The module provides a framework for building kinvey-backed FlexData and FlexFunctions.

## [Installation](#installation)

To install this project, add it to your `package.json` file and install it via `npm`
```
npm install kinvey-flex-sdk
```

To use this module, require it in your project and
```
const sdk = require('kinvey-flex-sdk');
```

You then must initialize the sdk to retrieve a reference to the backend service:

```
service((err, flex) => {
  // code goes here
};
```


When running locally, you can specify a host and port to listen on by passing an options object with an optional host and port.  If no host/port is specified, localhost:10001 will be used:

```
sdk.service({ host: 'somehost', port: 7777 }, (err, flex) => {
  // code goes here
});
```

You can also specify a shared secret to be used by this service.  Any client that accesses this service *must* contain this shared secret, or requests will be rejected with a `401 Unauthorized` error.  

```
sdk.service({ sharedSecret: '<some shared secret>'} }, (err, flex) => {
  // code goes here
});
```

Once set here, you must set this shared secret in the Kinvey console when configuring your service for Kinvey requests to execute properly.  For testing locally, this shared secret can be passed in the `X-Auth-Key` http header.  


To run your code locally, execute `node .` in the root of your project.  Routes are:

For FlexData:

```
GET     /:serviceObject/                // Get all entities in a Service Object
GET     /:serviceObject/:id             // Get a single entity by id
GET     /:serviceObject/?{query}        // Get entities by query
POST    /:serviceObject/                // Create an entity
PUT     /:serviceObject/:id             // Update a service object entity
DELETE  /:serviceObject/                // Delete all service objects
DELETE  /:serviceObject/:id             // Delete a single entity by id
DELETE  /:serviceObject/?{query}        // Delete a service object by query
GET     /:serviceObject/_count          // Get a count of all records in the service object
GET     /:serviceObject/_count/?{query} // Get the count of a query result
```

For FlexFunctions:

```
POST    /_flexFunctions/:handlerName    // Execute the handler function
```

FlexFunctions are a RPC function that can contain the following properties in the body that represent the original request:

| property     | description |
| --------- | ----------- |
| objectName | The name of the object being acted on (collection) if applicable |
| body | The request body |
| query | The query string |
| entityId | The id of the entity if applicable |
| method | The original http method |
| hookType | The type of event hook.  Valid values are `pre` for a pre-data hook, `post` for a post-data hook, and `customEndpoint` for an endpoint hook.  Defaults to `customEndpoint` |

For FlexAuth:

```
POST    /_auth/:handlerName    // Execute the handler function
```

FlexAuth functions are a RPC function that can contain the following properties in the body that represent the original request:

| property     | description |
| --------- | ----------- |
| username | The name of the user logging in |
| body | The request body, containing `username`, `password`, and optional `options` arguments |
| method | The original http method |

For service discovery
```
POST   /_command/discover
```

## [FlexData](#flex-data)

The FlexData framework can be accessed via the sdk's `data` property.

```
const flexData = flex.data;
```

### Registering serviceObjects

Once you initialize the FlexData framework, you define your entites by defining ServiceObjects, and then wire up data access event handlers to those ServiceObjects.  To register a ServiceObject, use the `serviceObject` method of the `data` object:

```
// To register the 'widgets' ServiceObject:
const widgets = flex.data.serviceObject('widgets');
```

### Data Events

Each ServiceObject exposes data events that are invoked by Kinvey collections.  The data event takes a single handler function to be executed.


| event     | description |
| --------- | ----------- |
| onInsert  | executed on inserts (or POST to REST API) |
| onUpdate  | executed on updates (or PUT to the REST API) |
| onDeleteById | executed when a single entity is to be deleted |
| onDeleteByQuery | executed when a query is included as part of a DELETE |
| onDeleteAll | executed when the DELETE command is invoked |
| onGetById | get a single entity by Id |
| onGetByQuery | retrieve results based on a query |
| onGetAll | get all entities in a given ServiceObject |
| onGetCount | get the count of the entities in a ServiceObject |
| onGetCountByQuery | get the count of the entities in a query result |

For example, to get all entities in `widgets`:

```
widgets.onGetAll(callbackFunction);
```

### Data Handler Functions

The data events take a handler function, which takes three arguments:  `context`, `complete`, and `modules`.  `context` represents the current context of the request made to Kinvey, and `complete` is a completion handler for completing the data request.  The `modules` argument is an object containing several libraries for accessing Kinvey functionality via your service (for more information, see the section on [modules](#modules)).

#### context Object

The `context` object contains the following properties

| property | description |
| --------- | ----------- |
| method    | the HTTP method (GET, POST, PUT, DELETE) |
| headers   | the HTTP request headers |
| entityId  | the entityId, if specified |
| serviceObjectName | the name of the serviceObject |
| body | the HTTP body |
| query | the query object |

#### completion Handler

The completion handlers object follows a builder pattern for creating the handler's response.  The pattern for the completion handler is `complete()[.setBody(<entity>)].<status>.<done|next>`

For example, a sample completion handler is:

```
complete(myEntity).ok().next()
```

##### complete

The `complete` handler initiates the complete process.  It prodives a set of methods for altering the context of the request, and a series of status functions.  For the data step, the only relevant context-altering method is `setBody`, which takes either an entity, an array of entities, an error description or Error Object.  

Note that a body must be explicitly set using `setBody`. The entity must be a JSON object or a JSON array for successful responses.  For example:

```
// Sets the response to include an entity.
complete().setBody({"foo", "bar"});

// Sets the response to include an array of entities
complete().setBody([{"foo":"bar"}, {"abc":"123}]);
```

The `setBody` method is not required.  If you want to return an empty object, simply call `complete()`. If you need to pass an empty array, you *must* call setBody with the empty Array.

```
// empty body
complete();

//empty array
complete().setBody([]);
```
For errors, you can either pass a string as the error message, or a JavaScript `Error` object.

```
// Sets the response to an error string, to be used with error status functions
complete().setBody("Record 123 was not found");

// Sets the response to an error object, to be used with error status functions
complete().setBody(new Error("Record 123 was not found");
```

##### Status Functions

Status functions set the valid status codes for a Flex Data operation.  The status function also sets the body to a Kinvey-formatted error, and uses the value passed into the status function or the `setData` function as the debug property, if it is present.

The available status functions are:

| Function | Status Code | Description |
| --------- | ----------- |------------|
| ok | 200 | Used for a normal success response |
| created | 201 | Used for creating new records |
| accepted | 202 | Used when the request has been submitted for processing, but will be processed asynchronously |
| notFound | 404 | Used when the entity or entities could not be found |
| badRequest | 400 | Used when the request is invalid |
| unauthorized | 401 | Used when the request has not been authorized for the given user context |
| forbidden | 403 | Used when the specific request is forbidden for some reason |
| notAllowed | 405 | Used when the specific request or request method is not allowed |
| notImplemented | 501 | Used when the specific handler has no implementation |
| runtimeError | 550 | Used for custom runtime errors |

For example:

```
// Return that the record has been created
complete().setBody(myRecord).created();

// Entity wasn't found
complete().setBody("The given entity wasn't found").notFound();
```

##### End Processing

Once the status is set, you can end the processing of the handler request with either `done` or `next`.  Most requests should normally end with `next`, which will continue the Kinvey request pipeline.  `done` will return the response that was set in the completion handler, and end request processing without executing any further functions.

```
// This will continue the request chain
complete().setBody(myEntity).ok().next();

// This will end the request chain with no further processing
complete().ok().done();
```

### Example

The following is an example

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

  // wire up the events that we are not implementing
  widgets.onGetByQuery(notImplementedHandler);
  widgets.onGetAll(notImplementedHandler);
  widgets.onGetCount(notImplementedHandler);
  widgets.onInsert(notImplementedHandler);
  widgets.onUpdate(notImplementedHandler);
  widgets.onDeleteAll(notImplementedHandler);
  widgets.onDeleteByQuery(notImplementedHandler);
  widgets.onDeleteById(notImplementedHandler);
};
```

Note:  In previous versions of the Flex-SDK, entities were passed in the `complete` method.  This functionality is deprecated, and will be removed in a  future version of the SDK.  

## [FlexFunctions](#flex-functions)

The FlexFunctions framework is used to execute functions invoked by `hooks` or `endpoints`.  It can be accessed via the sdk's `functions` property.

```
const functions = flex.functions;
```

### Registering FlexFunction Handlers

In order to register a FlexFunction handler, you define that handler and give it a name by using the `register` method of the `functions` object:

```
// To register the 'someEventHandlerName' handler:
const widgets = flex.functions.register('someEventHandlerName', eventHandlerCallbackFunction);
```

In the console, when you define hooks or endpoints, you will be presented your list of event handlers to tie to a collection hook or endpoint.

### Handler Functions

Like the Data handlers, FlexFunctions take a handler functions with three arguments:  `context`, `complete`, and `modules`.  `context` represents the current context state of the Kinvey request, and `complete` is a completion handler for completing the function.  The `modules` argument is an object containing several libraries for accessing Kinvey functionality via your service (for more information, see the section on [modules](#modules)).

#### context Object

The `context` object contains the following properties:

| property | description |
| --------- | ----------- |
| method    | the HTTP method (GET, POST, PUT, DELETE) |
| headers   | the HTTP request headers |
| entityId  | the entityId included in the request, if specified |
| collectionName | the name of the collection |
| body | the data entity, entities, or error message associated with the request |
| query | the query object |

The `context` object will contain the appropriate state for the stage of the Kinvey request pipeline that the request is currently in.  For example, for events that are executed before a data request (pre-hooks), the context will contain the request body and query. 

The completion handlers object follows a builder pattern for creating the handler's response.  The pattern for the completion handler is `complete().[setBody(<entity>).setQuery(<query>)].<status>.<done|next>`

For example, a sample completion handler is:

```
complete().setBody(myEntity).setQuery(myQuery).ok().next()
```

##### complete

The `complete` handler initiates the complete process.  It prodives a set of methods for altering the context of the request, and a series of status functions.  

The context-altering methods are: 
| method | description | 
| ------- | -------|
| setBody | Sets the data entity or entities to be passed to the next step of the pipeline or as the final result.  Also used to pass error messages/objects.  
| setQuery | Replaces the query object with an altered query object.  This is only useful in pre-hook functions. |


Note that a body must be explicitly set using `setBody`. The entity must be a JSON object or a JSON array for successful responses.  For example:

```
// Sets the context to include an entity and altered query.
complete().setBody({"foo", "bar"}).setQuery({query: {foo: 'bar'});

// Sets the response to include an array of entities
complete().setBody([{"foo":"bar"}, {"abc":"123}]);
```

The `setBody` method is not required.  If you want to return an empty object, simply call `complete()`. If you need to pass an empty array, you *must* call setBody with the empty Array.

```
// empty body
complete();

//empty array
complete().setBody([]);
```
For errors, you can either pass a string as the error message, or a JavaScript `Error` object.

```
// Sets the response to an error string, to be used with error status functions
complete().setBody("Record 123 was not found");

// Sets the response to an error object, to be used with error status functions
complete().setBody(new Error("Record 123 was not found");
```

##### Status Functions

Status functions set the valid status codes for a Flex Function operation.  The status function also sets the body to a Kinvey-formatted error, and uses the value passed into function or into the `setBody` function as the debug property, if it is present.

The available status functions are:

| Function | Status Code | Description |
| --------- | ----------- |------------|
| ok | 200 | Used for a normal success response |
| created | 201 | Used for creating new records |
| accepted | 202 | Used when the request has been submitted for processing, but will be processed asynchronously |
| notFound | 404 | Used when the entity or entities could not be found |
| badRequest | 400 | Used when the request is invalid |
| unauthorized | 401 | Used when the request has not been authorized for the given user context |
| forbidden | 403 | Used when the specific request is forbidden for some reason |
| notAllowed | 405 | Used when the specific request or request method is not allowed |
| notImplemented | 501 | Used when the specific handler has no implementation |
| runtimeError | 550 | Used for custom runtime errors |

For example:

```
// Return that the record has been created
complete().setBody(myRecord).created();

// Entity wasn't found
complete().setBody("The given entity wasn't found").notFound();
```

##### End Processing

Once the status is set, you can end the processing of the handler request with either `done` or `next`.  Most requests should normally end with `next`, which will continue the Kinvey request pipeline.  `done` will return the response that was set in the completion handler, and end request processing without executing any further functions.

```
// This will continue the request chain
complete().setBody(myEntity).ok().next();

// This will end the request chain with no further processing
complete().ok().done();
```
 
### Example

The following is an example

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
      
      //otherwise, return the results
      return complete().setBody(body).ok().done();
    });
    
   }

  // set the handler
  flexFunctions.register('getRedLineData', getRedLineSchedule);
};
```

You can include both FlexData and FlexFunctions' handlers in the same flex service, but it is recommended to separate the two.

Note:  In previous versions of the Flex-SDK, entities were passed in the `complete` method.  This functionality is deprecated, and will be removed in a  future version of the SDK.

## [FlexAuth](#flex-auth)

The FlexAuth framework is used to execute custom auth handlers for logging in via Mobile Identity Connect.  It can be accessed via the sdk's `auth` property.

```
const auth = flex.auth;
```

### Registering FlexAuth Handlers

In order to register a FlexFunction handler, you define that handler and give it a name by using the `register` method of the `auth` object:

```
// To register the 'someEventHandlerName' handler:
const mySSO = flex.auth.register('mySSO', eventHandlerCallbackFunction);
```

In the console, when you define a flex auth service, you will be presented your list of auth event handlers.

### Handler Functions

Like the Data and Function handlers, FlexAuth takes a handler function with three arguments:  `context`, `complete`, and `modules`.  `context` represents the current context state of the Kinvey request, and `complete` is a completion handler for completing the function.  The `modules` argument is an object containing several libraries for accessing Kinvey functionality via your service (for more information, see the section on [modules](#modules)).

#### context Object

The `context` object contains the following properties:

| property | description |
| --------- | ----------- |
| method    | the HTTP method (GET, POST, PUT, DELETE) |
| headers   | the HTTP request headers |
| body | the body of the request |

The `body` can contain up to three arguments:

| property | description |
| --------- | ----------- |
| username    | the username of the user logging in | 
| password  | The password of the user logging in |
| options | Optional request options. |

The completion handlers object follows a builder pattern for creating the handler's response.  The pattern for the completion handler is `complete().[setToken(<token>).addAttribut(key, value).removeAttribute(key, value)].<status>.<done|next>`

For example, a sample completion handler is:

```
complete().setToken(myToken).addAttribute('userEmail', myEmail).ok().next()
```

##### complete

The `complete` handler initiates the complete process.  It prodives a set of methods for altering the context of the request, and a series of status functions.  For the auth step, the only relevant context-altering method is `setBody`, which takes either an entity, an array of entities, an error description or Error Object. 

The context-altering methods are: 

| method | description | 
| ------- | -------|
| setToken(token) | Sets the authentication token to be used for this user. |  
| addAttribute(key, value) | Adds custom attributes to your auth response |
| removeAttribtue(key) | Removes a previously added attribute |

Note that a token must be explicitly set using `setToken`. The entity must be a JSON object or a Base64 encoded string.  For example:

```
// Sets the context to include an entity and altered query.
complete().setToken({"myAuthToken", "ffds9afdsafdsaf89ds0fds90f8ds-="}).addAttribute('email', 'test123@test.com');
```

For errors, you can either pass a string as the error message, or a JavaScript `Error` object.

```
// Sets the response to an error string, to be used with error status functions
complete().setToken("Record 123 was not found");

// Sets the response to an error object, to be used with error status functions
complete().setToken(new Error("Record 123 was not found");
```

##### Status Functions

Status functions set the valid status codes for a Flex Auth operation.  The status function also sets the body to an OAuth-formatted error, and uses the value passed into the status function as the debug property, if it is present.

The available status functions are:

| Function | Status Code | Description |
| --------- | ----------- |------------|
| ok | 200 | Used for a normal success response |
| serverError | 401 | Used for any type of server error |
| accessDenied | 401 | Used when the authenticating user has been denied access |
| temporarilyUnavailable | 401 | Used when the underlying auth source is temporarily unavailable|

For example:

```
// Return that the user has been authenticated
complete().setToken(myToken).ok();

// Access was denied
complete().notFound("The given username/password combo was invalid");
```

##### End Processing

Once the status is set, you can end the processing of the handler request with either `done` or `next`.  Most requests should normally end with `next`, which will continue the Kinvey request pipeline.  `done` will return the response that was set in the completion handler, and end request processing without executing any further functions.

```
// This will continue the request chain
complete().setToken(myToken).ok().next();

// This will end the request chain with no further processing
complete().ok().done();
```
 
### Example

The following is an example

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

You can include FlexData, FlexAUth and FlexFunctions' handlers in the same flex service, but it is recommended to separate them.

## [Executing a Long-running Script](#long-running-scripts)

Because the services are persisted, you can execute long running tasks that run in the background.  However, all requests still need to be completed in less than 60 seconds.  

To accomplish this, you can execute a function asynchronously using one of the `Timer` functions from node.js: `setImmediate`, `setTimeout`, or `setInterval`.  
  
For example:  

```
const sdk = require('kinvey-flex-sdk');
const request = require('request'); // assumes that the request module was added to package.json
sdk.service(function(err, flex) {
  
  const flexFunctions = flex.functions;   // gets the FlexFunctions object from the service

    function calcSomeData() {
        // do something
    }

  function calcAndPostData() {
    auth = {
      user: '<MY_APP_KEY>',
      pass: '<MY_APP_SECRET>'
     };
     
    options = {
        url: 'https://baas.kinvey.com/appdata/<MY_APP_KEY?/someCollection',
        auth: auth,
        json: {
            someData: calcSomeData(),
            date: new Date().toString()
        }
     }
        
    request.get(options, (err, response, body) => {
      // if error, return an error
      if (err) {
        return console.log('Error: ' + err);
      }
      
      //otherwise, just return
      return; 
    });
    
  }
   
  function initiateCalcAndPost(context, complete, modules) {
    // Since the calc and post data function may take a long time, execute it asynchronously
    setImmediate(calcAndPostData);  
    
    // Immediately complete the handler function.  The response will be returned to the caller, and calcAndPostData will execute in the background.
    complete().accepted().done();
    
  // set the handler to point to the initiateCalcAndPost header
  flexFunctions.register('getRedLineData', initiateCalcAndPost);
};
```

In the above example, the handler receives a request and executes the `initiateCalcAndPost` function.  The function schedules an immediate asynchronous execution of `calcAndPostData`, and then executes the complete handler, returning control to the client and sending the response (in this case, `accepted`, because the request is accepted for processing).  The service stays running in the background, and the long-running `calcAndPostData` function is executed asynchronously.  


## [Modules](#modules)

Modules are a set of libraries intended for accessing Kinvey-specific functionality.  The optional `modules` argument is passed as the third argument to all handler functions.  For example:

```
// data handler
function onGetById(context, complete, modules) {
  const appKey = modules.backendContext.getAppKey();
  // etc...
}
```

You can use any non-Kinvey libraries or modules you want by including them in your `package.json` as you would for a standard node.js project.  

The following modules are available:

* [backendContext](#backend-context-module) Provides methods to access information about the current backend context.
* [dataStore](#data-store-module) Fetch, query, and write to Kinvey collections.
* [email](#email-module) Send Email notifications
* [groupStore](#group-store-module) Fetch, query, and write to Kinvey groups.
* [Kinvey Entity](#kinvey-entity-module) Kinvey entity utilities
* [kinveyDate](#kinvey-date-module) Kinvey date utilities
* [push](#push-module) Send push notifications to a user's device
* [Query](#query-module) Create queries to be used by the dataStore.  
* [requestContext](#request-context-module) Provides methods to access information about the current request context.
* [tempObjectStore](#temp-object-store-module) Key-value store for persisting temporary data between a pre- and post-hook.
* [userStore](#user-store-module) Fetch, query, create, update, delete, suspend and restore Kinvey Users

### [backendContext](#backend-context-module)

Used to return data and perform functions against the current backend context.      

| Method             | Behavior           |
|:-------------------|:-------------------|
| `getAppKey()` | Returns the current backend appKey |
| `getAppSecret()` | Returns the current backend appSecret |
| `getMasterSecret()` | Returns the current backend masterSecret |

One common use case for these functions is for calling requests against the current backend to provide a method to obtain the correct authentication credentials.  This allows for BL scripts to be migrated from backend to backend without code changes, such as in the case of seperate development and production backends.  

```javascript
const request = require('request');

function myHandler(context, complete, modules){
  
  const backendContext = modules.backendContext;

  const appKey = backendContext.getAppKey();
  const masterSecret = backendContext.getMasterSecret();
  
  const uri = 'https://' + context.headers.host + '/appdata/'+ appKey +'/myCollection/';
  const authString = "Basic " + utils.base64.encode(appKey + ":" + masterSecret);
  const requestOptions = {
    uri:uri, 
    headers: {
      "Authorization":authString
    }
  };
  
  var auth = request.get(requestOptions, (error, res, body) => {
    if (error){
      complete.setBody(error).runtimeError.done();
    } else {
      complete.setBody(body).ok().next();
    }
  });
}
```

### [dataStore](#data-store-module)

Use the dataStore module to interact with Kinvey Data at the collection level.  The dataStore module can be used to interact with both the Kinvey DataStore or with external data such as RAPID connectors or Flex Data Services.  

To initialize the DataStore:

```
const store = modules.dataStore();
```

The `dataStore` method also takes an optional `options` argument is an optional object containing store options for the current store.  The options are:

| Option             | Description                  |
|:-------------------|:------------------------| 
| `useBl` | If set to true, executes BL hooks associated with the dataStore request.  If false, business logic hooks will not execute.  Defaults to false. | 
| `useUserContext` | Uses user context credentials to access the datastore if set to `true`.  If false, will execute in the context of `mastersecret`.  Defaults to false. |
| `useMasterSecret` | **DEPRECATED:  use `useUserContext` instead** Uses the mastersecret credentials to access the datastore if set to `true`.  If set to false, will use the current user credentials. |
| `skipBl` | **DEPRECATED: use `useBl` instead** If set to true, skips BL processing when accessing the datastore.  If false or not included, it will default to executing any BL associated with the store. |

**NOTE** Requests that use userContext will *automatically* execute BL, as requests to the Kinvey platform using a user context cannot skip BL.  

For example:  

```
const options = {
  useBl: true,
  useUserContext: false
}

const store = modules.dataStore(options);
```

The `dataStore` object contains a single method, `collection` for specifying the collection to query.  

```
const myCollection = modules.dataStore().collection('myCollection');
```

The `collection` object contains methods for accessing data within the collection.  All methods take a `callback(err, results)` function.  

| Method             | Description                  |
|:-------------------|:------------------------|
| `find(query, callback)` | Finds the records contained in the `query`.  The `query` is a `Query` object created with `modules.Query`.  If no `Query` object is supplied, the `find` method will return all entities in the collection. |
| `findById(entityId, callback)` | Finds a single entity by its `_id`.  |
| `save(entity, callback)` | Saves the provided `entity` to the dataStore, either as an insert or update.  (NOTE:  if an `_id` is provided and that `_id` already exists, the `save` will update the existing entity by replacing it with the entity passed into this function).  |
| `remove(query, callback)` | Removes the records contained in the `query`.  The `query` is a `Query` object created with `modules.Query`. |
| `removeById(entityId, callback)` | Removes a single entity by its `_id`. |
| `count(query, callback)` | Gets a count of all records that would be returned by the `query`.  The `query` is a `Query` object created with `modules.Query`.  If no `Query` object is supplied, the `count` method will return a count of the number of entities in the collection. | 

**NOTE** Circular requests (request to the same collection as the originating Flex request) *must* be executed under `mastersecret` credentials and must not use business logic.  If either `useUserContext` or `useBl` are set to true, these types of requests will fail with an error in the callback.  

For example:

```
  const store = dataStore({ useUserContext: true });
  const products = store.collection('products');
  products.findById(1234, (err, result) => {
    if (err) {
      return complete(err).runtimeError().done();
    }
    result.status = 'Approved';
    products.save(result, (err, savedResult) => {
      if (err) {
        return complete().setBody(err).runtimeError().done();
      }
      complete().setBody(savedResult).ok().next();
    });
  });
});
```

**NOTE** When testing dataStore in particular locally, special headers need to be added to your local tests.  These headers will be added automatically by Kinvey in production use.  For information on the required headers, see the section on [testing locally](#testing-locally)

### [Email](#email-module)

Use the email module to send email to any valid email address.

Available Methods:

| Method             | Action                  |
|:-------------------|:------------------------|
| `send(from, to, subject, text_body, reply_to, html_body, cc, bcc, callback)` | Send an email to `to` from `from` using the `subject` and `body`.  `reply_to` is an optional argument for the reply to line of the message.  For the email body, `text_body` is for the plain-text version of the email and is required.  `html_body` is an optional parameter that accepts an HTML-formatted string, which creates an optional html body for the email message.  `cc` and `bcc` are optional arguments for adding cc and bcc users. |

For example, to send a text email:
```
	const email = modules.email;
	email.send('my-app@my-app.com',
			   request.body.friendEmail,
			   'Join my octagon in my-app!',
			   "You've been invited to join " + request.body.name + "'s octagon in my-app!", function(err, result) {
			   complete().ok().next();
			   });
```
	
To send an HTML email, it is important to note that the reply-to *must* be included; if you want the reply-to to be the same as the from address, you can either also pass the from address in the reply_to argument, or simply pass a null value (which will default the reply to to the from address).  For example:""

```
	const email = modules.email;
	email.send('my-app@my-app.com',
           request.body.friendEmail,
           'Join my octacgon in my-app!',
           "You've been invited to join " + request.body.name + "'s octagon in my-app!",
           null,
           '<html>You've been invited to join  <b>'+request.body.first_name+'</b>'s octagon in my-app!</html>', callback);
```

Email calls are asynchronous in nature.  They can be invoked without a callback, but are not guaranteed to complete before continuing to the next statement.  However, once invoked they will complete the sending of the email, even if the function ends via a complete handler. 

*Note:* The email module is currently only available for services running on the Kinvey Microservices Runtime, and is not available externally or for local testing.  

### [groupStore](#group-store-module)

Use the groupStore module to interact with Kinvey Groups.  The groupStore module can be used to create, update, retrieve, and remove Kinvey User groups.  

To initialize the groupStore:

```
const store = modules.groupStore();
```

The `groupStore` method also takes an optional `options` argument is an optional object containing store options for the current store.  The options are:

| Option             | Description                  |
|:-------------------|:------------------------| 
| `useUserContext` | Uses user context credentials to access the groupStore if set to `true`.  If false, will execute in the context of `mastersecret`.  Defaults to false. |


For example:  

```
const options = {
  useUserContext: true
}

const store = modules.groupStore(options);
```

The `groupStore` object contains methods for accessing Kinvey groups.  All methods take a `callback` function.  

*Note:*  most methods take a callback with `err` and `results` arguments. 

| Method             | Description                  |
|:-------------------|:------------------------|
| `create(group, callback)` | Creates a new `group`.  The group object should be formatted according to the [Group API Specification](http://devcenter.kinvey.com/rest/guides/users#usergroupscreate) |
| `update(ugroupser, callback)` | Updates the provided `group`.  Note that the `group` entity supplied must contain an `_id`. The group object should be formatted according to the [Group API Specification](http://devcenter.kinvey.com/rest/guides/users#usergroupsupdate) |  |
| `remove(groupId, callback)` | Removes a single group by its `_id`. Note this method deletes the user from the userStore and is non-recoverable. |
| `findById(groupId, callback)` | Finds a user based on its ID. |

For example:

```
  const store =  groupStore({ useUserContext: true });
  store.findById(1234, (err, result) => {
    if (err) {
      return complete().setBody(err).runtimeError().done();
    }
    store.update(result, (err, savedResult) => {
      if (err) {
        return complete(err).runtimeError().done();
      }
      complete().setBody(savedResult).ok().next();
    });
  });
```

**NOTE** When testing groupStore in particular locally, special headers need to be added to your local tests.  These headers will be added automatically by Kinvey in production use.  For information on the required headers, see the section on [testing locally](#testing-locally)  

### [Kinvey Entity](#kinvey-entity-module)

A Kinvey Entity is a JSON object containing Kinvey-specific metadata for use with AppData collections. Kinvey Entities also contain methods to manipulate Kinvey metadata.  

The `kinveyEntity` module provides the following  methods:

| Method             | Behavior           |
|:-------------------|:-------------------|
| `entity()` | Returns a Kinvey Entity with system generated `_id`. |
| `entity(id)` | Returns a Kinvey Entity with the supplied `id` as the `_id` property.|
| `entity(JsonObject)` | Updates `JsonObject` with Kinvey-specific metadata and functions, and returns a Kinvey Entity as the result. |
| `isKinveyEntity(someObject)` | Returns true if `someObject` is a Kinvey Entity returned from one of the entity() methods above.  |

For example, to create a Kinvey Entity with only Kinvey metadata:

```javascript
function someHandler(context, complete, modules) {
  complete().setBody((modules.kinveyEntity.entity()).ok().done();
}
```

The response would contain an entity containing no additional attributes, except for Kinvey metatada attributes:

```json
{
  "_acl": {
    "creator": "kid_VT5YYv2KWJ"
  },
  "_kmd": {
    "lmt": "2013-05-08T13:48:36+00:00",
    "ect": "2013-05-08T13:48:36+00:00"
  },
  "_id": "518a57b4d79b4d4308000002"
}
```

To use your own `_id`, you can simply pass that ID as a `String` into the method:

```javascript
function handler(context, complete, modules){
  var myID = "000-22-2343";
  complete().setBody(modules.kinvey.entity(myID)).ok().done();
}
```  

```json
{
  "_acl": {
    "creator": "kid_VT5YYv2KWJ"
  },
  "_kmd": {
    "lmt": "2013-05-08T13:51:02+00:00",
    "ect": "2013-05-08T13:51:02+00:00"
  },
  "_id": "000-22-2343"
}
```

You can add Kinvey metatada to your own JavaScript object by passing that object into the function.  

```javascript
function handler(context, complete, modules){
  function employee() {
    this.firstName = "John";
    this.lastName = "Doe";
    this.status = "Active";
    this.dob = "5/5/1985";
    this.doh = "1/12/2012";
  }
    
  complete().setBody((modules.kinvey.entity(new employee())).ok().done();
}
```

This example results in the Kinvey metadata being added to your employee object.  

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "status": "Active",
  "dob": "5/5/1985",
  "doh": "1/12/2012",
  "_acl": {
    "creator": "kid_VT5YYv2KWJ"
  },
  "_kmd": {
    "etc": "2013-05-08T13:57:11+00:00",
    "lmt": "2013-05-08T13:57:11+00:00"
  },
  "_id": "518a59b7d79b4d4308000003"
}
```

Note that you can add properties directly to a Kinvey Entity and pass it directly into a `dataStore method that takes an entity as an argument:

```javascript
function handler(context, complete, modules) {
	const entity = modules.kinveyEntity.entity();
	entity.name = "Sachin";
	modules.dataStore().collection('People').save(entity, (err, result) => 
	  if (err) {
	    // handle error
	  } else {
	    complete().setBody(result).ok().next(); 
	  }
	});
}
```

*Note:* If you call `entity(JsonObject)` with an object that already contains Kinvey metadata, the original metadata will be maintained.  Only `lmt` will be updated with the current date and time.  

#### _acl Namespace

Kinvey Entities returned from `entity()` are also imbued with an `_acl` namespace containing methods for accessing that entity's user and group access privileges:

| Method             | Behavior           |
|:-------------------|:-------------------|
| `_acl.getCreator()` | Return entity creator user ID as a `String`|
| `_acl.getReaders()` | Return `Array` of `String` containing user IDs with read access |
| `_acl.getWriters()` | Return `Array` of `String` containing user IDs with write access |
| `_acl.getReaderGroups()` |  Return `Array` of `String` containing group IDs with read access  |
| `_acl.getWriterGroups()` | Return `Array` of `String` containing group IDs with write access |
| `_acl.addReader(userId)` | Grant read access to `userId`, passed as `String`. Returns the _acl namespace for method chaining. |
| `_acl.addWriter(userId)` | Grant write access to `userId`, passed as `String`. Returns the _acl namespace for method chaining. |
| `_acl.addReaderGroup(groupId)` | Grant read access to `groupId`, passed as `String`. Returns the _acl namespace for method chaining. |
| `_acl.addWriterGroup(groupId)` | Grant write access to `groupId`, passed as `String`. Returns the _acl namespace for method chaining. |
| `_acl.removeReader(userId)` | Revoke read access for `userId `, passed as `String`. Returns the _acl namespace for method chaining. (`userId` will retain read access if part of a group with read access) |
| `_acl.removeWriter(userId)` | Revoke write access for `userId `, passed as `String`. Returns the _acl namespace for method chaining. (`userId` will retain write access if part of a group with write access) |
| `_acl.removeReaderGroup(groupId)` | Revoke group read access for `groupId`, passed as `String`. Returns the _acl namespace for method chaining.|
| `_acl.removeWriterGroup(groupId)` | Revoke group write access for `groupId`, passed as `String`. Returns the _acl namespace for method chaining.|
| `_acl.getGloballyReadable()` | Return `bool` indicating whether entity is readable by all users |
| `_acl.getGloballyWritable()` | Return `bool` indicating whether entity is writable by all users |
| `_acl.setGloballyReadable(gr)` | Set global readability to `gr`, passed as `bool`. Returns the _acl namespace for method chaining.|
| `_acl.setGloballyWritable(gw)` | Set global writability to `gw`, passed as `bool`. Returns the _acl namespace for method chaining.|

##### ACL method chaining

All `_acl` methods can be chained to the `modules.kinveyEntity.entity()` by chaining the `_acl` namespace followed by the desired method. Furthermore the `_acl` modifier methods (those that return the `_acl` namespace) can be chained to each other. Since the `_acl` modifier methods return the `_acl` namespace, there's no need to restate the `_acl` namespace for the next method in the chain. 

For example, the following line will create a Kinvey Entity, add a reader, add a writer, then return all readers. NOTE: Since getReaders() returns an array, no futher `_acl` methods can be chained to it.

```
modules.kinveyEntity.entity(someObject)._acl.addReader(readUserId).addWriter(writeUserId).getReaders();
```

##### Example

The example below uses `kinveyEntity.entity()._acl` along with the [Request Context](#requestcontext-module) module to grant write access on the requested entity to the user making the request:

```javascript
function handler(context, complete, modules) {
	const currentUser = modules.requestContext.getAuthenticatedUserId();
    const serviceObjectName = context.objectName;
	const entityId = request.entityId;
	
	const collection = modules.dataStore().collection(collectionName);
	
	collection.findById({entityId, (err, doc) => {
	  	if (err){
	  	  //handle error
	  	} else if (doc) {
                  
	  	  const entity = modules.kinveyEntity.entity(doc)._acl.addWriter(currentUser);
	  	  //Note we directly pass the Kinvey Entity to the save method. 
	  	  collection.save(entity, (err, result) => {
	  	    complete().setBody(result).ok().next();
	  	  });
	  	} else {
                  // entity not found
                  complete().setBody(new Error "Entity not found").runtimeError().done();
                }
	});
}
```

### [Kinvey Date](#kinvey-date-module)

A utility for converting dates.  

| Method             | Behavior           |
|:-------------------|:-------------------|
| `toKinveyDateString(date)` | Converts a Date object, a moment, or a date string into the Kinvey date format.  If the passed in date is not a valid date, "Invalid date" will be returned.  |
| `fromKinveyDateString(str, format)` | Decodes a Kinvey date string into the specified format.  Valid formats are 'date', 'moment' and 'string'.  If no format is provided, a JavaScript Date object is returned.  If the passed in *str* is not a valid date, "Invalid date" will be returned.   |

For example, to convert a date to to a Kinvey Date string:  

```
myDate = new Date();
kinveyDate = modules.kinveyDate.toKinveyDateString(myDate);
```

To convert a Kinvey Date string to a JavaScript date object:

```
myDate = modules.kinveyDate.fromKinveyDateString(kinveyDate, 'date');
// note:  this could also be accomplished via modules.kinveyDate.fromKinveyDateString(kinveyDate);
```

To convert a Kinvey Date string to a moment:  

```
myMoment = modules.kinveyDate.fromKinveyDateString(kinveyDate, 'moment');
```

To convert a Kinvey Date into a standard ISO-8601 date string

```
myDateString = modules.kinveyDate.fromKinveyDateString(kinveyDate, 'string');
```

### [Push](#push-module)

Use the push module to send a push notification to a device registered with your app.


Available Methods:

| Method             | Action                  |
|:-------------------|:------------------------|
| `broadcastMessage(message, calback)`   | Broadcasts `message` to all devices registered with this app |
| `sendMessage(users, message, callback)` | Sends `messages` to the users in `users` |
| `sendPayload(users, iOSAps, iOSExtras, androidPayload, callback)` | Sends a custom payload to the users in `users` |
| `broadcastPayload(iOSAps, iOSExtras, androidPayload, callback)` | Broadcasts custom payloads to all devices registered with this app.

For example, to send a broadcast message:

```javascript
	var push = modules.push;
	if (context.body.sendMessageToAll){
		push.broadcastMessage(context.body.message, (err, result) => {
 		  complete().ok().next();
 		});
	}
```

The `users` argument to `send` is either an array of Kinvey User documents or a single user document.  The message
will be sent to all iOS or Android devices that are contained in the documents in `users`.

You can query the `user` collection with the [`dataStore` module](#data-store-module) to get a list of users.

For example:

```javascript
	const push = modules.push;
	const dataStore = dataStore();
	const query = new modules.Query();
	
	query.equalTo('firstName', request.body.firstName);
	
	dataStore.collection('user').find(query, (err, userColl) => {
	  if (err) {
		complete().setBody(err).runtimeError().done();
	  } else {
		userColl.forEach((user) => {
		  push.sendMessage(user, `People who are named ${user.firstName} are awesome!", (err, result) => {
		  //complete here 
		  });
		});
	  }
	});
```
	
##### Payloads

The methods `sendPayload` and `broadcastPayload` allow for more robust push
 messages.  For iOS, the payload consists of two arguments, `iOSAps` and
 `iOSExtras`.  `iOSAps` is a JSON object that can have the following properties:

| Field               | Value                                                                 |
|:--------------------|:----------------------------------------------------------------------|
| `alert`             |  An alert message to display to the user                              |
| `badge`             |  The badge number to appear on the notification                       |
| `sound`             |  The name of the sound file in the application package to play        |
| `content-available` |  If set to 1, the remote notification acts as a "silent" notification |

`iOSExtras` is a JSON object with custom name-value pairs to be included in the push notification.  

For Android, the payload is contained in the `androidPayload` attribute, which is any JSON object to be sent to Google Cloud Messaging (GCM).  

Each of the arguments above are null-safe.

For example, to send a broadcast with payloads:

```javascript
const iOSAps = { alert: "You have a new message", badge: 2, sound: "notification.wav" }
const iOSExtras = {from: "Kinvey", subject: "Welcome to Flex Services!"}
const androidPayload = {message: "You have a new Message", from: "Kinvey", subject: "Welcome to BL" }
const push = modules.push;
push.broadcastPayload(iOSAps, iOSExtras, androidPayload, callback);
```

Push calls are asynchronous in nature.  They can be invoked without a callback, but are not guaranteed to complete before continuing to the next statement.  However, once invoked they will complete the sending of the push messages, even if the handler function is terminated via a completion handler.

*Note:* The email module is currently only available for services running on the Kinvey Microservices Runtime, and is not available externally or for local testing.  

### [Query](#query-module)

The `Query` module allows you to build queries for use in the `dataStore` module. 

```
const query = new modules.Query();
```

#### Operators

All operator methods as exposed by the `Query` module follow the same pattern: the first argument must be the field under condition, while the other arguments specify the exact condition on that field. All operators return the query itself, so it is easy to concatenate multiple conditions on one line.

For example, to select all models with a rate between 25 and 50:

```
const query = new modules.Query();
query.greaterThanOrEqualTo('rate', 25).lessThanOrEqualTo('rate', 50);
```

##### Comparison Operators
* `equalTo` matches if the field is = the supplied value.
* `greaterThan` matches if the field is > the supplied value.
* `greaterThanOrEqualTo` matches if the field is >= the supplied value.
* `lessThan` matches if the field is < the supplied value.
* `lessThanOrEqualTo` matches if the field is <= the supplied value.
* `notEqualTo` matches if the field is != the supplied value.
* `exists` matches if the field exists.
* `mod` matches if the field modulo the supplied divisor (second argument) has the supplied remainder (third argument).
* `matches` matches if the field matches the supplied regular expression.

**Note:** Regular expressions need to be anchored (prefixed with `^`), and case sensitive. To do case insensitive search, create a normalized (i.e. all lowercase) field in your collection and perform the match on that field.

##### Array Operators
* `contains` matches if any of the supplied values is an element in the field.
* `containsAll` matches if the supplied values are all elements in the field.
* `notContainedIn` matches if the supplied value is not an element in the field.
* `size` matches if the number of elements in the field equals the supplied value.

#### Modifiers
Query modifiers control how query results are presented. A distinction is made between limit, skip, and sort modifiers.

##### Limit and Skip
Limit and skip modifiers allow for paging of results. Set the limit to the number of results you want to show per page. The skip modifier indicates how many results are skipped from the beginning.

```
// Show results 20–40
const query = new modules.Query();
query.limit = 20;
query.skip = 20;
```

##### Sort
Query results are sorted either in ascending or descending order. It is possible to add multiple fields to sort on.

```
// Sort on last name (ascending), then on age (descending).
const query = new modules.Query();
query.ascending('last_name');
query.descending('age');
```

**Note** Data is sorted lexicographically, meaning `B` comes before `a`, and `10` before `2`.

##### Field Selection
By default, all fields in an entity will be retrieved. You can, however, specify specific fields to retrieve. This can be useful to save bandwidth.

```
const query = new modules.Query();
query.fields = [ 'last_name', 'age' ];
```

Saving entities after retrieving them using Field Selection will result in the loss of all fields not selected. Further, these partial entities will not be available for use with [Caching & Offline Saving](/guides/caching-offline).

#### Compound Queries
You can combine filters with modifiers within a single query.

```
// Returns the first five users with last_name “Doe”, sorted by first_name.
const query = new modules.Query();
query.limit = 5;
query.equalTo('last_name', 'Doe');
query.ascending('first_name');
```

##### Joining Operators
It is very easy to join multiple queries into one. In order of precedence, the three joining operators are listed below in order of precendence.

* `and` joins two or more queries using a logical AND operation.
* `nor` joins two or more queries using a logical NOR operation.
* `or` joins two or more queries using a logical OR operation.

The example below demonstrates how to join two separate queries.

```
const query = new modules.Query();
query.equalTo('last_name', 'Doe');
const secondQuery = new modules.Query();
secondQuery.equalTo('last_name', 'Roe')

// Selects all users with last_name “Doe” or “Roe”.
query.or(secondQuery);
```

Alternatively, the snippet above can be shortened using the join operator inline.

```
// Selects all users with last_name “Doe” or “Roe”.
const query = new modules.Query();
query.equalTo('last_name', 'Doe').or().equalTo('last_name', 'Roe');
```

You can build arbitrary complex queries using any join operators. The rule of thumb is to take the precendence order into account when building queries to make sure the correct results are returned.

#### Location Queries

**Note** Location Queries are only available on fields named `_geoloc`. The value of this field should be an array holding two elements: longitude and latitude (in that order). Kinvey indexes that attribute for optimal location querying.  

The following Location Operators are supported by `modules.Query`:

* `near` matches if the field is within the supplied radius (in miles) of the supplied coordinate.
* `withinBox` matches if the field is within the box specified by the two supplied coordinates.
* `withinPolygon` matches if the field is within the polygon specified by the supplied list of coordinates.

For example, a query to retrieve all restaurants close (10 mile radius) to a users’ current location could look as follows:

```
// Get users current position
function handler(context, complete, modules) {
  const coord = [context.body.longitude, context.body.latitude];

  // Query for restaurants close by.
  var query = new modules.Query();
  query.near('_geoloc', coord, 10);

  var dataStore = modules.dataStore().collection('restaurants');
  var stream = dataStore.find(query, (err, result) => {  
  	if (err) {
  	  return complete().setBody(err).runtimeError().done():
  	}
  	complete().setBody(result).ok().next();
  });
});
```

### [requestContext](#requestcontext-module)

Used to return data and perform functions against the current request context.

| Method             | Behavior           |
|:-------------------|:-------------------|
| `getAuthenticatedUserId()` | Returns the ID of the user who submitted the request. When the app or master secret is used to authenticate, the application ID is returned. |
| `getAuthenticatedUsername()` | Returns the username of the user who submitted the request. |
| `getAuthoritativeUsername()` | Returns the authoritative username of the user who submitted the request.  The authoritative username is determined based on the type of user.  If the user logged in with a token obtained from Mobile Identity Connect, and a MIC Enterprise ID is defined, this method returns the value defined in that field from the enterprise identity source.  If the user logged in in with a MIC token and no MIC enterprise id is defined, or a social login, the social provider's `id` is used. If the user logs in with a Kinvey native login, the `user.username` value is used. |
| `getSecurityContext()` | Returns the context of the current user - possible values are __user__ for a user account, __app__ for the app account with app secret, and __master__ for the app account with master secret |

#### Custom Request Properties
Kinvey Client libraries provide API to pass Custom Request Properties when communicating with Kinvey services. The requestContext module provides methods to read and manipulate those properties.


| Method             | Behavior           |
|:-------------------|:-------------------|
| `getCustomRequestProperty(propertyName)` | Takes string value `propertyName` and returns value of key `propertyName` from the Custom Request Properties object. Returns `undefined` if key `propertyName` does not exist. |
| `setCustomReqeustProperty(propertyName, propertyValue)` | Creates Custom Request Property `propertyName` using the provided string `propertyName`, and assigns `propertyValue` as its value. If `propertyName` doesn't exist, it will be created. `propertyValue` can be any valid JSON value.|

The Custom Request Properties object will be available throughout the entire Kinvey Request pipeline. For example, you can add/modify a Custom Request Property in a preFetch hook, and those changes will be available in a postFetch hook on the same transaction.

##### Example Code
```
//Assume {officeLocation: 'Paris'} was provided as the Custom Request Properties object

function handlerForPrefetch(context, complete, modules){
 
  const requestContext = modules.requestContext;
  const officeLocation = requestContext.getCustomRequestProperty('officeLocation');
  
  if (officeLocation === 'Paris'){
  	  try {
  	     //Perform some 'preprocessing' logic for requests from Paris
  	     //...
  	     //Set didPreprocess to true in the Custom Request Properties
  	     requestContext.setCustomRequestProperty('didPreprocess', true);
  	  } catch (error) {
	     //If preprocessing fails due to an error, set didPreprocess to false
	     requestContext.setCustomRequestProperty('didPreprocess', false);
  	  }  
  }
 
  //Continue the execution
  complete().ok().next();
  
}
```

The above code checks the Custom Request Properties for a property, `officeLocation`. If the `officeLocation` is Paris, then some custom pre-processing is done as part of the pre-fetch hook. If the pre-processing succeeds, we set `didPreprocess` to `true` in the Custom Request Properties. If an error is encountered during preprocessing, we set `didPreprocess` to `false`.

We could implement a post-fetch hook that looks for the `didPreprocess` flag on the Custom Request Properties object:

```
//Assume {officeLocation: 'Paris', didPreprocess: true} was provided as the Custom Request Properties object

function handlerForPostFetch(context, complete, modules){
 
  const requestContext = modules.requestContext;
  const officeLocation = requestContext.getCustomRequestProperty('officeLocation');
  const didPreprocess = requestContext.getCustomRequestProperty('didPreprocess');
  
  if (officeLocation === 'Paris'){
  	  if (didPreprocess === true) {
  	  	//perform some post-processing specific to pre-process success
  	  } else {
  	  	//optionally perform some other post-processing
  	  }
  }
 
  //Finish the execution
  complete().ok().next();
  
}
```

For details on passing Custom Request Properties to Kinvey backend services, please see the API reference for the Kinvey Client Library of your choice.

#### Client App Version
All of the Kinvey client libraries provide API to pass a client-app-specific version string (for implementation details, see the Kinvey Dev Center reference documentation for the library of your choice). The requestContext module provides a `clientAppVersion` namespace, which includes API to retrieve details about the version of the client app making the request. 

**Note** Kinvey *recommends* (but does not require) using version strings that conform to the pattern `major.minor.patch`, where all values are integers and `minor` and `patch` are optional. The `majorVersion()`, `minorVersion()` and `patchVersion()` methods defined below are convenience methods designed to work with version strings conforming to this pattern. If `major`, `minor` or `patch` contain any non-digit characters (i.e. 'v1' contains a non-digit character, 'v'), the corresponding convenience method will return `NaN`.

The requestContext.clientAppVersion namespace provides the following methods: 

| Method             | Behavior           |
|:-------------------|:-------------------|
| `stringValue()` | Returns the client app version value as a `String`. Returns `null` if no client app version is passed in. |
| `majorVersion()` | Returns the first dot-separated field of the client app version string (or the entire version string if there are no 'dot' characters) as a `Number`, or `NaN` if that field contains any non-digit characters. See [A note on version numbering](#version-numbering) above for details on formatting version strings. |
| `minorVersion()` | Returns the second dot-separated field of the client-app version string as a `Number`, or `NaN` if that field contains any non-digit characters. See [A note on version numbering](#version-numbering) above for details on formatting version strings. |
| `patchVersion()` | Returns the third dot-separated field of the client-app version string as a `Number`, or `NaN` if that field contains any non-digit characters. See [A note on version numbering](#version-numbering) above for details on formatting version strings. |


##### Example Code

Assuming a client app version string of "1.1.5":

```

function handler(context, complete, modules){
  const requestContext = modules.requestContext;
  
  const majorVersion = requestContext.clientAppVersion.majorVersion(); //majorVersion will be 1
  const minorVersion = requestContext.clientAppVersion.minorVersion(); //minorVersion will be 1
  const patchVersion = requestContext.clientAppVersion.patchVersion(); //patchVersion will be 5
  
  if (majorVersion < 2) {								//will be true
  	//Perform some version 1 compatible logic
  	if ((minorVersion >= 1) && (patchVersion === 5)) {	//Will be true
  		//perform some logic for a specific patch release
  	}
  } else if (majorVersion >= 2) {						//Will be false
  	//Perform some version 2+ compatible logic
  }
 
  
  //Finish the execution
  complete().ok().done();
  
}
```

Assuming a client app version string of "1.0.1-beta":

```

function handler(context, response, modules){
  const requestContext = modules.requestContext;
  
  const versionString = requestContext.clientAppVersion.stringValue(); //versionString will be "1.0.1-beta"
  const majorVersion = requestContext.clientAppVersion.majorVersion();   //majorVersion will be 1
  const patchVersion = requestContext.clientAppVersion.patchVersion();   //patchVersion will be NaN
  
  if (majorVersion < 2) { 						//Will be true
  	//Perform some version 1 compatible logic
  	if (patchVersion > 1) {						//Will be FALSE as patchVersion is NaN
  		//Perform some patch-specific logic
  	}
  }
   
  if (versionString.match("beta") !== null){	//Will be true
  	//Perform some beta-specific logic
  }
  
  //Finish the execution
  complete().ok().done();
  
}
```

### [Temp Object Store](#temp-object-store-module)

A key-value store for persisting temporary data between a pre- and post-hook. `tempObjectStore` is an ephemeral store that only lives for the duration of a single request, but will allow for data that is written in a pre-hook to be read in a dataLino and/or in the post-hook.  The module implements three methods:
   

| Method             | Behavior           |
|:-------------------|:-------------------|
| `set(key, value)` | Writes a value for the given key to the `tempObjectStore` |
| `get(key)` | Returns the value of the supplied key |
| `getAll()` | Returns all key/values in the `tempObjectStore` as an object |

For example, to store an item in a handler:

```javascript
function handler1(context, complete, modules) {
  var tempObjectStore = modules.tempObjectStore;
  tempObjectStore.set('token', context.body.token);
  complete().ok().next();
}
```

Then, to retrieve it:  
```
function handler2(context, response, modules) {
  var tempObjectStore = modules.tempObjectStore;
  var token = tempObjectStore.get('token');
  complete().setBody({ message: `Object for token ${token} was saved successfully.` }).ok().done();
}
```

*Note:* `tempObjectStore` is meant for storing small, temporary amounts of data to be passed between different functions.  Large amounts of data / large objects should not be stored in the `tempObjectStore` for performance reasons.  

### [userStore](#user-store-module)

Use the userStore module to interact with Kinvey Users.  The userStore module can be used to create, update, find, remove, suspend, and restore Kinvey users.  

To initialize the userStore:

```
const store = modules.userStore();
```

The `userStore` method also takes an optional `options` argument is an optional object containing store options for the current store.  The options are:

| Option             | Description                  |
|:-------------------|:------------------------| 
| `useBl` | If set to true, executes BL hooks associated with the userStore request.  If false, business logic hooks will not execute.  Defaults to false. | 
| `useUserContext` | Uses user context credentials to access the userStore if set to `true`.  If false, will execute in the context of `mastersecret`.  Defaults to false. |
| `useMasterSecret` | **DEPRECATED:  use `useUserContext` instead** Uses the mastersecret credentials to access the userStore if set to `true`.  If set to false, will use the current user credentials. |
| `skipBl` | **DEPRECATED: use `useBl` instead** If set to true, skips BL processing when accessing the userStore.  If false or not included, it will default to executing any BL associated with the store. |

**NOTE** Requests that use userContext will *automatically* execute BL, as requests to the Kinvey platform using a user context cannot skip BL.  

For example:  

```
const options = {
  useBl: true,
  useUserContext: true
}

const store = modules.userStore(options);
```

The `userStore` object contains methods for accessing Kinvey users.  All methods take a `callback` function.  

*Note:*  most methods take a callback with `err` and `results` arguments.  `remove`, `suspend`, and `restore` take only an `err` arguemnt.

| Method             | Description                  |
|:-------------------|:------------------------|
| `find(query, callback)` | Finds the users contained in the `query`.  The `query` is a `Query` object created with `modules.Query`.  If no `Query` object is supplied, the `find` method will return all users in the system, based on the authenticated user (or `mastersecret` and the `_acls` of the user collection. |
| `findById(userId, callback)` | Finds a single user by its `_id`.  |
| `getCurrentUser(callback)` | Gets the current user's user entity.  Note, this method executes in the current user context, regardless of whether the store was set to `mastersecret` or not. |
| `create(user, callback)` | Creates the provided `user`.  Note that regardless of whether user or `mastersecret` credentials are selected for the store, `create` always uses `appsecret` credentials. |
| `update(user, callback)` | Updates the provided `user`.  Note that the `user` entity supplied must contain an `_id`. |  |
| `remove(userId, callback)` | Removes a single user by its `_id`. Note this method deletes the user from the userStore and is non-recoverable. |
| `suspend(userId, callback)` | Suspends a single user by its `_id`. |
| `restore(userId, callback)` | Restores a suspended user. |
| `count(query, callback)` | Gets a count of all users that would be returned by the `query`.  The `query` is a `Query` object created with `modules.Query`.  If no `Query` object is supplied, the `count` method will return a count of the total number of users. | 

**NOTE** Circular requests to the userStore (request to the useStore when the origin originating Flex request was also a request to the userStore) *must* be executed under `mastersecret` credentials and must not use business logic.  If either `useUserContext` or `useBl` are set to true, these types of requests will fail with an error in the callback.  

For example:

```
  const store =  userStore({ useUserContext: true });
  store.findById(1234, (err, result) => {
    if (err) {
      return complete().setBody(err).runtimeError().done();
    }
    result.status = 'Approved';
    store.update(result, (err, savedResult) => {
      if (err) {
        return complete(err).runtimeError().done();
      }
      complete().setBody(savedResult).ok().next();
    });
  });
});
```

**NOTE** When testing userStore in particular locally, special headers need to be added to your local tests.  These headers will be added automatically by Kinvey in production use.  For information on the required headers, see the section on [testing locally](#testing-locally)  

## [Testing Locally](#testing-locally)

In production use, certain data is sent to the the service by Kinvey for use in certain modules.  This data can be sent via HTTP headers when testing locally.  Different modules within the backend-sdk require these arguments. All are optional, but required if you want to make use of certain features in local testing.  


| Header             | Description           | What requires it |
|:-------------------|:-------------------|:-------------------|
| `X-Kinvey-App-Metadata` | A stringified JSON object that contains information about the app context from which this request is being executed.  | `backendContext`, `dataStore`, `userStore` | 
| `X-Kinvey-Original-Request-Headers` | A stringified JSON object that contains the request headers that belong to the request context of the BL or data request | `requestContext`, `dataStore`, `userStore`, the `request` argument in all handlers (if you want to access request headers) |
| `X-Kinvey-Username` | The username of the user making the request. | `requestContext`, `dataStore`, `userStore` |
| `X-Kinvey-User-Id` | The User Id | `requestContext`, `dataStore`, `userStore` |
| `X-Auth-Key` | The shared secret API Key used for accessing this flex service |

The `X-Kinvey-App-Metadata` object contains:

| Property             | Description           |
|:-------------------|:-------------------|
| `_id` | The environmentId | 
| `appsecret` | The app secret | 
| `mastersecret` | The master secret |  
| `baasUrl` | The base URL for the Kinvey instance you are using.  For example, `https://baas.kinvey.com` | 

The `X-Kinvey-Original-Request-Headers` object can contain any number of custom headers, but should contain:

| Property             | Description           |
|:-------------------|:-------------------|
| `x-kinvey-api-version` | The API version to use (number).  Note this is important for the `dataStore` module. | 
| `authorization` | The authorization string (either Basic or Kinvey auth) for accessing Kinvey's REST service. | 
| `x-kinvey-client-app-version` | The Client App Version string |
| `x-kinvey-custom-request-properties` | A JSON-stringified The custom request properties.  |
