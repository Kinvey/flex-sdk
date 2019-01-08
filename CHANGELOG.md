## Changelog

### 3.3.0
* When making requests to Kinvey, use original requests computed API version rather than relying on the header API Version.
* Change default API version to 3 when making requests to Kinvey and no API version is present
* Fix bug that prevented null values from being passed for the options object on flex initialization
* Fix spelling mistake in README (contributed by kumardinkar9)
* Remove BETA tag from README

### 3.2.0
* Validated support for node v6.x, node v8.x, and node v10.x
* Updated dependencies
* Adjusted Linitng and fixed linting issues

### 3.1.2
* FLEX-286 Fixed setQuery to propagate on FSR prehook
* Stringify query.query and query.sort if they are objects before returning

### 3.1.1
* FLEX-293 Removed SIGKILL handler to prevent crash

### 3.1.0
* FLEX-270 Added graceful shutdown
  * Now on ctrl-c, SIGTERM, SIGINT, or SIGKILL, the sdk will attempt to wait for in-process tasks to finish.
 * Will time out and force-quit if all tasks aren't complete in 50 seconds
 * Pressing ctrl-c, or sending SIGINT/SIGTERM/SIGKILL a second time will terminate the process immediately.
* FLEX-291 Remove lodash as a dependency
* FLEX-290 Changed destination property in body for sendPush to recipients
* Removed CoffeeScript as a dependency
* Updated code-task-receiver to 2.3.1
* Updated kinvey-datalink-errors to 0.3.2

### 3.0.0
* See README for migration guide
* BREAKING CHANGE: email and push modules now require a callback or promise handlers.  They can no longer be executed as "fire and forget".
* FLEX-206 Added Promise support to Asynchronous flex-sdk modules
  * dataStore
  * userStore
  * groupStore
  * push
  * email
* FLEX-176 Add RoleStore
* FLEX-240 Add endpointRunner to support executing of custom endpoints
* FLEX-246 Use new KCS endpoints for push/email
* FLEX-248 Removed deprecated skipBl and useMasterSecret options for all stores
* FLEX-247 Change baasUrl property to retrieve it from top-level task object
* Updated dependencies with nsp warnings
* Removed lodash isNil package

### 2.1.0
* Added role helper to kinveyEntity module (ronheiney)
* FLEX-212 Disable proxy for push and email modules
* FLEX-68 Disable proxy when using dataStore
* FLEX-204 Fixed errors for null or empty entityIds for dataStore, groupStore, and userStore
* Updated request module to 2.85.0
* Updated code-task-receiver to 2.2.3 to add response object parsing for FlexFunctions (FLEX-220)

### 2.0.9
* FLEX-173 Fix for content.objectName undefined if request.collectionName passed
* Update code-task-receiver to 2.2.2

### 2.0.8
* FLEX-172 Add the sdk version to the task object before validation for authKey. Add check for it in unit test. Small fix for unit test for count() missing a query.
* FLEX-171 When validation functions in service modules call their callbacks with a task as a first argument, don't pass this task as an error argument to receiver.
* Bumped code task runner to 2.2.1

### 2.0.7
* FLEX-154: Add support for filtering with values like null, 0, and ""
* Added query tests and fixed a few query bugs
* Updated moment to 2.21.0

### 2.0.6
* Fixed kinveyEntity not retaining a passed-in _id

### 2.0.5
* Added NotImplementedHandler for FlexAuth requests that don't have a defined handler
* Fixed shared secrets hanging the flex service
* Fixed shared secrets not working locally if shared secret is defined
* Bumped kinvey-code-task-runner to v2.2.0 to add mapping of tempObjectStore for external flex functions requests

### 2.0.4
* Fixed bug in error response callback for stores (data, user, group)

### 2.0.3
* Fixed bug which broke push module functionality in FSR-hosted services

### 2.0.2
* Fixed top-level errors to return JSON, fixing the bug where an invalid shared secret would generate the wrong error
* Set maxSockets to 100 for both http and https agents

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
