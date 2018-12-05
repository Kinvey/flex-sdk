/**
 * Copyright (c) 2018 Kinvey Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

const should = require('should');

const INCLUDE_HEADERS =
  'Connection;Content-Length;Content-Type;Date;Location;X-Kinvey-API-Version;X-Kinvey-Request-Id;X-Powered-By;Server';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10) AppleWebKit/600.1.25 (KHTML, like Gecko) Version/8.0 Safari/600.1.25';

const sampleTaskInfo = {
  appId: 12345,
  appMetadata: {
    _id: '12345',
    applicationId: 'abc123',
    appsecret: 'appsecret',
    mastersecret: 'mastersecret',
    pushService: undefined,
    restrictions: {
      level: 'starter'
    },
    API_version: 3,
    name: 'DevApp',
    platform: null
  },
  authKey: 'abc123',
  requestId: 'ea85600029b04a18a754d57629cff62d',
  serviceObjectName: 'quick',
  taskType: 'data',
  containerMappingId: 'abc:123',
  method: 'POST',
  endpoint: null,
  request: {
    method: 'POST',
    headers: {
      host: 'localhost:7007',
      'X-Kinvey-Custom-Request-Properties': '{"foo":"bar"}',
      'x-kinvey-include-headers-in-response': INCLUDE_HEADERS,
      authorization: 'Basic a2lkX1oxQkVoeDJDczpkYmNiNTUwMWZlOGM0MWQ3YTFmOTkyYjhkNTdiOGEzOA==',
      'accept-encoding': 'gzip, deflate',
      'accept-language': 'en-us',
      'x-kinvey-responsewrapper': 'true',
      accept: '*/*',
      origin: 'http://0.0.0.0:4200',
      'content-length': '0',
      connection: 'keep-alive',
      'user-agent': USER_AGENT,
      referer: 'http://0.0.0.0:4200/environments/kid_Z1BEhx2Cs/business-logic/endpoint/quick/editor'
    },
    username: 'kid_Z1BEhx2Cs',
    userId: 'kid_Z1BEhx2Cs',
    entityId: '12345',
    serviceObjectName: 'quick'
  },
  response: {
    status: 0,
    headers: {},
    body: {}
  }
};

describe('modules creation', () => {
  let moduleGenerator = null;
  before((done) => {
    moduleGenerator = require('../../../lib/service/moduleGenerator'); // eslint-disable-line global-require
    return done();
  });
  return it('can generate modules', (done) => {
    const modules = moduleGenerator.generate(sampleTaskInfo);
    should.exist(modules.backendContext);
    should.exist(modules.email);
    should.exist(modules.endpointRunner);
    should.exist(modules.kinveyEntity);
    should.exist(modules.kinveyDate);
    should.exist(modules.push);
    should.exist(modules.requestContext);
    should.exist(modules.tempObjectStore);
    should.exist(modules.Query);
    should.exist(modules.dataStore);
    should.exist(modules.userStore);
    return done();
  });
});
