/**
 * Copyright (c) 2016 Kinvey Inc.
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
const backendContextModule = require('../../../lib/service/modules/backendContext');

describe('modules / backendContext', () => {
  let backendContext = null;
  const metadata = {
    _id: 'test ID',
    appsecret: 'test app secret',
    mastersecret: 'test master secret',
    securityContext: 'test security context',
    authenticatedUsername: 'test authenticated username',
    authenticatedUserId: '12345'
  };
  before((done) => {
    backendContext = backendContextModule(metadata);
    return done();
  });
  it('exposes the environment ID through the getAppKey method', (done) => {
    backendContext.getAppKey().should.eql(metadata._id);
    return done();
  });
  it('exposes the app secret through the getAppSecret method', (done) => {
    backendContext.getAppSecret().should.eql(metadata.appsecret);
    return done();
  });
  it('exposes the master secret through the getMasterSecret method', (done) => {
    backendContext.getMasterSecret().should.eql(metadata.mastersecret);
    return done();
  });
  it('exposes the security context through the getSecurityContext method', (done) => {
    backendContext.getSecurityContext().should.eql(metadata.securityContext);
    return done();
  });
  return it('exposes the authenticated username through the getAuthenticatedUsername method', (done) => {
    backendContext.getAuthenticatedUsername().should.eql(metadata.authenticatedUsername);
    return done();
  });
});
