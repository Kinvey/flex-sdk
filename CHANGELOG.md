## Changelog

### 2.0.1
* Fix stringification bug on some done() calls.

### 2.0.0
* Add Auth support to flex under flex.auth
* Change request to context
* Fix completion handlers to properly handle pre/post step context
* Added `setBody` and `setQuery` to data/function completion hanlder
* Added `useBl` option to userStore and dataStore.  Set to `true` to enable business logic execution for a store request.  Defaults to false.  
* Added `useUserContext` option to userStore and dataStore. Set to `true` to execute the request under user's authentication context.  Defaults to false.
* dataStore and authStore now default to using mastersecret credentials and not executing business logic
* Circular requests to userStore/dataStore (e.g. saving back to the sae collection in a post hook) now must not execute BL and must be executed under masterSecret credentials.  
* Some internal refactoring
* DEPRECATED:  Passing the entity directly in the `complete()` method.  Will be removed in future version.
* DEPRECATED:  useMasterSecret argument for userStore and dataStore.  Stores now default to using master secret.  Use `useUserContext` to use the context of the current user for dataStore or userStore requests.  
* DEPRECATED:  skipBl argument for userStore and dataStore.  Stores now default to not executing business logic hooks in response to store requests.  Use `useBl` to enable BL execution.  

### 1.2.0
* Append flex SDK version to task response
* Upgrade code-task-receiver to v1.2.1 to fix null tasks sent via the TCP stream from crashing
* Fixed doc issue

### 1.1.0
* Added `modules.userStore` for creating, updating, finding, deleting, suspending, and restoring user entities.
* Updated code-task-receiver to fix functions not being able to be tested locally

### 1.0.1
* Fixed bug with service discovery

### 1.0.0
* Pass requestMetadata (not requestContext) into dataStore
* Renamed package and changed some of the API Names
  * Rename `kinvey-backend-sdk` to `kinvey-flex-sdk`
  * Rename `DataLink` to `FlexData`
  * Rename `BusinessLogic` to `FlexFunctions`
  * Change readme and examples to refer to the package as `sdk`, the method to generate the service as `service`, and the generated service as `flex`.
* Tested and bumped node.js version to v6.9.1
* Allow FlexFunctions to be invoked externally
* Fix datastore overwriting requestContext

### 0.5.2
* Bumped code-task-runner to v0.3.1 (to address a protocol bug)

### 0.5.1
* Bumped code-task-runner to v0.3.0

### 0.5.0
* Added `modules` accessible to all handler methods via third argument (e.g. onInsert(request, complete, modules: 
  * backendContext
  * dataStore (including access to Service Object backed data)
  * email
  * kinveyDate
  * kinveyEntity
  * push
  * query
  * requestContext
  * tempObjectStore

### 0.4.4
* Updated readme with information on business logic and asynchronous, long-running code

### 0.4.3
* Fixed SDK logger bug which prevented output from reaching service logs and removed unneeded metadata from logger output
* Minor style refactoring

### 0.4.2
* Added improved SDK logger with threshold support

### 0.4.1
* Added support for business logic handler discovery
* Modified service discovery response structure

### 0.4.0
* Complete rewrite in es6, targeting node 6
* Make backend sdk work externally

### 0.3.4
* Parse request.query if it is stringified

### 0.3.3
* Updated task handler to put the query in the request if it is in the top level only

### 0.3.2
* Fixed an issue where outgoing HTTP requests caused backend-sdk calls to time out

### 0.3.1
* Added `modules` param to SDK business logic handler

### 0.3.0
* Added Kinvey Business Logic hook processing capability

### 0.2.3
* Bumped kinvey-task-receiver to v0.1.3

### 0.2.2
* Updated so backend-sdk generated errors return the entire task

### 0.2.1
* Fixed licenses
* Fixed copyrights

### 0.2.0
* Updated all 'collection' references to 'serviceObject' in sdk and documentation

### 0.1.2
* Updated bson library to v0.4.15

### 0.1.1
* Updated contributors
* Set to use code-task-runner v0.1.1

### 0.1.0
* Initial Release 
