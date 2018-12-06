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
  }

  // eslint-disable-next-line class-methods-use-this
  _makeRequest(requestOptions, callback) {
    return new Promise((resolve, reject) => {
      request(requestOptions, (err, res, body) => {
        let resError = null;
        let resBody = null;

        if (err) {
          resError = err;
        } else if (res.statusCode > 299) {
          const error = new Error(body.error);
          error.description = body.description;
          error.debug = body.debug;
          resError = error;
        } else {
          resBody = body;
        }

        if (resError) {
          return callback ? callback(resError) : reject(resError);
        }
        return callback ? callback(null, resBody) : resolve(resBody);
      });
    });
  }

  _buildKinveyRequest(baseRoute, collection, options = {}) {
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
      json: true,
      proxy: false
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

  // eslint-disable-next-line class-methods-use-this
  _generateQueryString(query) {
    return query.toQueryString();
  }
}

module.exports = BaseStore;
