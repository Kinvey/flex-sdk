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
| id | The id of the entity if applicable |
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

The data events take a handler function, which takes three arguments:  `request`, `complete`, and `modules`.  `request` represents the request made to Kinvey, and `complete` is a completion handler for completing the data request.  The `modules` argument is an object containing several libraries for accessing Kinvey functionality via your service (for more information, see the section on [modules](#modules)).

#### request Object

The request object contains the following properties

| property | description |
| --------- | ----------- |
| method    | the HTTP method (GET, POST, PUT, DELETE) |
| headers   | the HTTP request headers |
| entityId  | the entityId, if specified |
| serviceObjectName | the name of the serviceObject |
| body | the HTTP body |
| query | the query object |

#### completion Handler

The completion handlers object follows a builder pattern for creating the handler's response.  The pattern for the completion handler is `complete(<entity>).<status>.<done|next>`

For example, a sample completion handler is:

```
complete(myEntity).ok().next()
```

##### complete

The `complete` handler takes either an entity, an array of entities, or an error description.  The result of the `complete` handler is an object of status functions.

```
// Sets the response to include an entity.
complete({"foo", "bar"});

// Sets the response to include an array of entities
complete([{"foo":"bar"}, {"abc":"123}]);

// Sets the response to an error string, to be used with error status codes
complete("Record 123 was not found");
```

##### Status Functions

Status functions set the valid status codes for a Data Link Connector.  The status function also sets the body to a Kinvey-formatted error, and uses the value passed into the `complete` function as the debug property, if it is present.

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
complete(myRecord).created();

// Entity wasn't found
complete("The given entity wasn't found").notFound();
```

##### End Processing

Once the status is set, you can end the processing of the handler request with either `done` or `next`.  Most requests should normally end with `next`, which will continue the Kinvey request pipeline.  `done` will return the response that was set in the completion handler, and end request processing without executing any further functions.

```
// This will continue the request chain
complete(myEntity).ok().next();

// This will end the request chain with no further processing
complete(myEntity).ok().done();
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
      return complete(entity).ok().next();
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

Like the Data handlers, FlexFunctions take a handler functions with three arguments:  `request`, `complete`, and `modules`.  `request` represents the handler request's current state, and `complete` is a completion handler for completing the function.  The `modules` argument is an object containing several libraries for accessing Kinvey functionality via your service (for more information, see the section on [modules](#modules)).

#### request Object

The request object contains the following properties:

| property | description |
| --------- | ----------- |
| method    | the HTTP method (GET, POST, PUT, DELETE) |
| headers   | the HTTP request headers |
| entityId  | the entityId included in the request, if specified |
| collectionName | the name of the collection |
| body | the HTTP body |
| query | the query object |

#### completion Handler

The completion handlers object follows a builder pattern for creating the FlexFunctions' response.  The pattern for the completion handler is `complete(<entity>).<status>.<done|next>`

For example, a sample completion handler is:

```
complete(myEntity).ok().next()
```

The entity is optional, as it will not always be returned.  

You can also alter the request object by making changes to the query, body, or headers objects.  If the request body is modified, it will be persisted back for subsequent steps in the request pipeline.   

##### complete

The `complete` handler takes either an entity, an array of entities, or an error description.  The result of the `complete` handler is an object of status functions.

```

// No entity as part of the response
complete();

// Sets the response to include an entity.
complete({"foo", "bar"});

// Sets the response to include an array of entities
complete([{"foo":"bar"}, {"abc":"123}]);

// Sets the response to an error string, to be used with error status codes
complete("Record 123 was not found");
```

##### Status Functions

Status functions set the valid status codes for the request.  The status function also sets the body to a Kinvey-formatted error, and uses the value passed into the `complete` function as the debug property, if it is present.

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
complete(myRecord).created();

// Entity wasn't found
complete("The given entity wasn't found").notFound();
```

##### End Processing

Once the status is set, you can end the processing of the handler request with either `done` or `next`.  Most requests should normally end with `next`, which will continue the Kinvey request pipeline.  `done` will return the response that was set in the handler, and end request processing without executing any further part of the kinvey request pipeline.

```
// This will continue the request chain
complete(myEntity).ok().next();

// This will end the request chain with no further processing
complete(myEntity).ok().done();
```

### Example

The following is an example

```
const sdk = require('kinvey-flex-sdk');
const request = require('request'); // assumes that the request module was added to package.json
sdk.service(function(err, flex) {
  
  const flexFunctions = flex.functions;   // gets the FlexFunctions object from the service

  function getRedLineSchedule(req, complete, modules) {
    request.get('http://developer.mbta.com/Data/Red.json', (err, response, body) => {
      // if error, return an error
      if (err) {
        return complete("Could not complete request").runtimeError().done();
      }
      
      //otherwise, return the results
      return complete(body).ok().done();
    });
    
   }

  // set the handler
  flexFunctions.register('getRedLineData', getRedLineSchedule);
};
```

You can include both FlexData and FlexFunctions' handlers in the same flex service, but it is recommended to separate the two.

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
   
  function initiateCalcAndPost(req, complete, modules) {
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
function onGetById(request, complete, modules) {
  const appKey = modules.backendContext.getAppKey();
  // etc...
}
```

You can use any non-Kinvey libraries or modules you want by including them in your `package.json` as you would for a standard node.js project.  

The following modules are available:

* [backendContext](#backendcontext) Provides methods to access information about the current backend context.
* [dataStore](#datastore) Fetch, query, and write to Kinvey collections.
* [email](#email) Send Email notifications
* [Kinvey Entity](#kinvey-entity) Kinvey entity utilities
* [kinveyDate](#kinvey-date) Kinvey date utilities
* [push](#push) Send push notifications to a user's device
* [Query](#query) Create queries to be used by the dataStore.  
* [requestContext](#request-context) Provides methods to access information about the current request context.
* [tempObjectStore](#temp-object-store) Key-value store for persisting temporary data between a pre- and post-hook.

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

function myHandler(request, complete, modules){
  
  const context = modules.backendContext;

  const appKey = context.getAppKey();
  const masterSecret = context.getMasterSecret();
  
  const uri = 'https://' + request.headers.host + '/appdata/'+ appKey +'/myCollection/';
  const authString = "Basic " + utils.base64.encode(appKey + ":" + masterSecret);
  const requestOptions = {
    uri:uri, 
    headers: {
      "Authorization":authString
    }
  };
  
  var auth = request.get(requestOptions, (error, res, body) => {
    if (error){
      complete(error).runtimeError.done();
    } else {
      complete(body).ok().next();
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
| `useMasterSecret` | Uses the mastersecret credentials to access the datastore if set to `true`.  If not included or set to false, will use the current user credentials. |
| `skipBl` | If set to true, skips BL processing when accessing the datastore.  If false or not included, it will default to executing any BL associated with the store. |

For example:  

```
const options = {
  useBl: true,
  useMasterSecret: false
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

For example:

```
  const store = dataStore({ useMasterSecret: true });
  const products = store.collection('products');
  products.findById(1234, (err, result) => {
    if (err) {
      return complete(err).runtimeError().done();
    }
    result.status = 'Approved';
    products.save(result, (err, savedResult) => {
      if (err) {
        return complete(err).runtimeError().done();
      }
      complete(savedResult).ok().next();
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
			   complete.ok().next();
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
function someHandler(request, complete, modules) {
  complete(modules.kinveyEntity.entity()).ok().done();
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
function handler(request, complete, modules){
  var myID = "000-22-2343";
  complete()modules.kinvey.entity(myID)).ok().done();
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
function handler(request, complete, modules){
  function employee() {
    this.firstName = "John";
    this.lastName = "Doe";
    this.status = "Active";
    this.dob = "5/5/1985";
    this.doh = "1/12/2012";
  }
    
  complete(modules.kinvey.entity(new employee())).ok().done();
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
function handler(request, complete, modules) {
	const entity = modules.kinveyEntity.entity();
	entity.name = "Sachin";
	modules.dataStore().collection('People').save(entity, (err, result) => 
	  if (err) {
	    // handle error
	  } else {
	    complete(result).ok().next(); 
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
function handler(request, complete, modules) {
	const currentUser = modules.requestContext.getAuthenticatedUserId();
    const serviceObjectName = request.collectionName;
	const entityId = request.entityId;
	
	const collection = modules.dataStore().collection(collectionName);
	
	collection.findById({entityId, (err, doc) => {
	  	if (err){
	  	  //handle error
	  	} else if (doc) {
                  
	  	  const entity = modules.kinveyEntity.entity(doc)._acl.addWriter(currentUser);
	  	  //Note we directly pass the Kinvey Entity to the save method. 
	  	  collection.save(entity, (err, result) => {
	  	    complete(result).ok().next();
	  	  });
	  	} else {
                  // entity not found
                  complete(new Error "Entity not found").runtimeError().done();
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
	if (request.body.sendMessageToAll){
		push.broadcastMessage(request.body.message, (err, result) => {
 		  complete.ok().next();
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
		complete(err).runtimeError().done();
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
function handler(request, complete, modules) {
  const coord = [request.body.longitude, request.body.latitude];

  // Query for restaurants close by.
  var query = new modules.Query();
  query.near('_geoloc', coord, 10);

  var dataStore = modules.dataStore().collection('restaurants');
  var stream = dataStore.find(query, (err, result) => {  
  	if (err) {
  	  return complete(err).runtimeError().done():
  	}
  	complete(result).ok().next();
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

function handlerForPrefetch(request, complete, modules){
 
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

function handlerForPostFetch(request, complete, modules){
 
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
  complete().ok().done();
  
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

function handler(request, complete, modules){
  const context = modules.requestContext;
  
  const majorVersion = context.clientAppVersion.majorVersion(); //majorVersion will be 1
  const minorVersion = context.clientAppVersion.minorVersion(); //minorVersion will be 1
  const patchVersion = context.clientAppVersion.patchVersion(); //patchVersion will be 5
  
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

function handler(request, response, modules){
  const context = modules.backendContext;
  
  const versionString = context.clientAppVersion.stringValue(); //versionString will be "1.0.1-beta"
  const majorVersion = context.clientAppVersion.majorVersion();   //majorVersion will be 1
  const patchVersion = context.clientAppVersion.patchVersion();   //patchVersion will be NaN
  
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
function handler1(request, complete, modules) {
  var tempObjectStore = modules.tempObjectStore;
  tempObjectStore.set('token', request.body.token);
  complete().ok().next();
}
```

Then, to retrieve it:  
```
function handler2(request, response, modules) {
  var tempObjectStore = modules.tempObjectStore;
  var token = tempObjectStore.get('token');
  complete({ message: `Object for token ${token} was saved successfully.` }).ok().done();
}
```

*Note:* `tempObjectStore` is meant for storing small, temporary amounts of data to be passed between different functions.  Large amounts of data / large objects should not be stored in the `tempObjectStore` for performance reasons.    


## [Testing Locally](#testing-locally)

In production use, certain data is sent to the the service by Kinvey for use in certain modules.  This data can be sent via HTTP headers when testing locally.  Different modules within the backend-sdk require these arguments. All are optional, but required if you want to make use of certain features in local testing.  


| Header             | Description           | What requires it |
|:-------------------|:-------------------|:-------------------|
| `X-Kinvey-App-Metadata` | A stringified JSON object that contains information about the app context from which this request is being executed.  | `backendContext`, `dataStore` | 
| `X-Kinvey-Original-Request-Headers` | A stringified JSON object that contains the request headers that belong to the request context of the BL or data request | `requestContext`, `dataStore`, the `request` argument in all handlers (if you want to access request headers) |
| `X-Kinvey-Username` | The username of the user making the request. | `requestContext`, `dataStore` |
| `X-Kinvey-User-Id` | The User Id | `requestContext`, `dataStore` |

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
