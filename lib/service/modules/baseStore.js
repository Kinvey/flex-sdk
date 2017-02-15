/**
 * Created by mjsalinger on 2/15/17.
 */

const request = require('request');

class BaseStore {
  constructor(storeOptions, appMetadata, requestContext, taskMetadata) {
    this._appMetadata = appMetadata;
    this._requestContext = requestContext;
    this._taskMetadata = taskMetadata;
    this._useBl = storeOptions.useBl || false;
    this._useUserContext = storeOptions.useUserContext || false;

    if (storeOptions.skipBl != null) {
      this._useBl = storeOptions.skipBl === false;
    }

    if (storeOptions.useMasterSecret != null) {
      this._useUserContext = storeOptions.useMasterSecret === false;
    }

    this._useMasterSecret = !(this._useUserContext);
    this._skipBl = !(this._useBl);
  }

  _makeRequest(requestOptions, callback) {
    request(requestOptions, (err, res, body) => {
      if (err) {
        return callback(err);
      } else if (res.statusCode > 299) {
        const error = new Error(body.error);
        error.description = body.description;
        error.debug = body.debug;
        return callback(err);
      }
      return callback(null, body);
    });
  }

  _buildKinveyRequest(baseRoute, collection, options) {
    options = options || {};

    if (baseRoute == null) {
      throw new Error('Missing Base Route');
    }

    let url = `${this._appMetadata.baasUrl}/${baseRoute}/${this._appMetadata._id}/`;

    if (collection != null) {
      url += `${collection}/`;
    }

    const headers = {
      'Content-Type': 'application/json',
      'X-Kinvey-API-Version': this._requestContext.apiVersion,
    };

    if (this._useBl == null || this._useBl !== true) {
      headers['x-kinvey-skip-business-logic'] = true;
    }

    const requestOptions = {
      url,
      headers,
      json: true
    };

    if (options.useAppSecret === true) {
      requestOptions.auth = {
        user: this._appMetadata._id,
        pass: this._appMetadata.appsecret
      };
    } else if ((this._useUserContext === true && options.useUserContext !== false) || options.useUserContext === true) {
      requestOptions.headers.authorization = this._requestContext.authorization;
    } else {
      requestOptions.auth = {
        user: this._appMetadata._id,
        pass: this._appMetadata.mastersecret
      };
    }
    return requestOptions;
  }

  _generateQueryString(query) {
    return query.toQueryString();
  }
}

module.exports = BaseStore;
