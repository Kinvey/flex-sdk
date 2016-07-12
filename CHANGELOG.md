## Changelog

### 0.4.1
* BACK-1670: Added support for business logic handler discovery
* Modified service discovery response structure

### 0.4.0
* Complete rewrite in es6, targeting node 6
* BACK-1531: make backend sdk work externally

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
