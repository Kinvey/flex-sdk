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
const requestContextModule = require('../../../../lib/service/modules/requestContext');

describe('modules / requestContext', () => {
  let requestContext = null;
  const metadata = {
    _id: 'test ID',
    authenticatedUsername: 'test authenticated username',
    authenticatedUserId: '12345',
    securityContext: 'test security context',
    customRequestProperties: {
      first: 1
    }
  };
  before((done) => {
    requestContext = requestContextModule(metadata);
    done();
  });

  it('exposes the authenticated username through the getAuthenticatedUsername method', () => {
    requestContext.getAuthenticatedUsername().should.eql(metadata.authenticatedUsername);
  });

  it('exposes the authenticated id through the getAuthenticatedUserId method', () => {
    requestContext.getAuthenticatedUserId().should.eql(metadata.authenticatedUserId);
  });

  it('exposes the custom properties through the getCustomRequestProperty method', () => {
    requestContext.getCustomRequestProperty('first').should.eql(metadata.customRequestProperties.first);
  });

  it('exposes the security context through the getSecurityContext method', () => {
    requestContext.getSecurityContext().should.eql(metadata.securityContext);
  });

  it('allows setting the custom properties through the setCustomRequestProperty method', () => {
    requestContext.setCustomRequestProperty('second', 2);
    requestContext.getCustomRequestProperty('second').should.eql(2);
  });

  describe('getCustomRequestProperty return value', () => {
    it('should be undefined when nothing is passed', () => {
      requestContext = requestContextModule(metadata);
      (requestContext.getCustomRequestProperty() === undefined).should.be.true();
    });

    describe('when property does not exist', () =>
      it('returns undefined', () => {
        (requestContext.getCustomRequestProperty('doesntexist') === undefined).should.be.true();
      }));

    describe('when getting a property whose value is an empty string', () =>
      it('returns an empty string', () => {
        requestContext.setCustomRequestProperty('emptyString', '');
        requestContext.getCustomRequestProperty('emptyString').should.eql('');
      }));

    describe('when getting a property whose value is false', () =>
      it('returns false', () => {
        requestContext.setCustomRequestProperty('shouldBeFalse', false);
        requestContext.getCustomRequestProperty('shouldBeFalse').should.be.false();
      }));

    describe('when getting a property whose value is an object', () =>
      it('returns the object', () => {
        requestContext.setCustomRequestProperty('prop', {
          a: 1
        });
        const prop = requestContext.getCustomRequestProperty('prop');
        prop.should.be instanceof Object;
        prop.a.should.eql(1);
      }));
  });

  describe('setCustomProperty special cases', () => {
    describe('when passing undefined as a value', () => {
      it('sets the value to undefined', () => {
        requestContext.setCustomRequestProperty('newprop');
        (requestContext.getCustomRequestProperty('newprop') === undefined).should.be.true();
      });
    });

    describe('when overwriting a value', () => {
      it('the value is overwritten', () => {
        metadata.customRequestProperties.first = 1;
        requestContext.getCustomRequestProperty('first').should.eql(1);
        requestContext.setCustomRequestProperty('first', 2);
        requestContext.getCustomRequestProperty('first').should.eql(2);
      });
    });

    describe('when passing null as a value', () => {
      it('the value is set to null', () => {
        requestContext.setCustomRequestProperty('shouldbenull', null);
        (requestContext.getCustomRequestProperty('shouldbenull') === null).should.be.true();
      });
    });

    describe('when passing undefined as a property name', () =>
      it('the value is set to null', () => {
        requestContext.setCustomRequestProperty('undefined', 1);
        (requestContext.getCustomRequestProperty('undefined') === 1).should.be.true();
      }));

    describe('when passing a special characater in the value', () =>
      it('the value is set properly', () => {
        requestContext.setCustomRequestProperty('foo', 'bár');
        requestContext.getCustomRequestProperty('foo').should.eql('bár');
      }));

    describe('when passing an object property value', () =>
      it('the value is set properly', () => {
        requestContext.setCustomRequestProperty('foo', { prop: 1 });
        requestContext.getCustomRequestProperty('foo').prop.should.eql(1);
      }));
  });

  describe('Client App Version API', () => {
    describe('stringValue()', () => {
      it('should return the current client version for the request', () => {
        metadata.clientAppVersion = '1.0.1';
        requestContext = requestContextModule(metadata);
        requestContext.clientAppVersion.stringValue().should.eql(metadata.clientAppVersion);
      });

      it('should return null when metadata value is null', () => {
        metadata.clientAppVersion = null;
        requestContext = requestContextModule(metadata);
        (requestContext.clientAppVersion.stringValue() === null).should.be.true();
      });

      it('returns null when no customer app version is passed in', () => {
        requestContext = requestContextModule(metadata);
        (requestContext.clientAppVersion.stringValue() === null).should.be.true();
      });

      it('should return null when metadata value is \'\'', () => {
        metadata.clientAppVersion = '';
        requestContext = requestContextModule(metadata);
        (requestContext.clientAppVersion.stringValue() === null).should.be.true();
      });

      it('should return null when metadata value is undefined', () => {
        metadata.clientAppVersion = undefined;
        requestContext = requestContextModule(metadata);
        (requestContext.clientAppVersion.stringValue() === null).should.be.true();
      });
    });

    describe('majorVersion()', () => {
      it('should return correct value when only one number passed in', () => {
        metadata.clientAppVersion = '1';
        requestContext = requestContextModule(metadata);
        requestContext.clientAppVersion.majorVersion().should.eql(1);
      });

      it('should return correct value when major and minor are passed in', () => {
        metadata.clientAppVersion = '1.0';
        requestContext = requestContextModule(metadata);
        requestContext.clientAppVersion.majorVersion().should.eql(1);
      });

      it('should return correct value when major, minor and patch are passed in', () => {
        metadata.clientAppVersion = '1.2.3';
        requestContext = requestContextModule(metadata);
        requestContext.clientAppVersion.majorVersion().should.eql(1);
      });

      it('should return correct value when major, minor and patch AND MORE are passed in', () => {
        metadata.clientAppVersion = '1.2.3.4';
        requestContext = requestContextModule(metadata);
        requestContext.clientAppVersion.majorVersion().should.eql(1);
      });

      it('should return correct value when major ver is more than 1 digit', () => {
        metadata.clientAppVersion = '12.2.3';
        requestContext = requestContextModule(metadata);
        requestContext.clientAppVersion.majorVersion().should.eql(12);
      });

      it('returns NaN when no customer app version is passed in', () => {
        metadata.clientAppVersion = '';
        requestContext = requestContextModule(metadata);
        (isNaN(requestContext.clientAppVersion.majorVersion())).should.be.true();
      });

      it('should return NaN major component contains a string', () => {
        metadata.clientAppVersion = '1a.1.2';
        requestContext = requestContextModule(metadata);
        (isNaN(requestContext.clientAppVersion.majorVersion())).should.be.true();
      });

      it('should return number value minor or patch contain non-digit characters', () => {
        metadata.clientAppVersion = '1.2a.3-beta';
        requestContext = requestContextModule(metadata);
        requestContext.clientAppVersion.majorVersion().should.eql(1);
      });
    });

    describe('minorVersion()', () => {
      it('should return correct value when major and minor are passed in', () => {
        metadata.clientAppVersion = '1.0';
        requestContext = requestContextModule(metadata);
        requestContext.clientAppVersion.minorVersion().should.eql(0);
      });

      it('should return correct value when major, minor and patch are passed in', () => {
        metadata.clientAppVersion = '1.2.3';
        requestContext = requestContextModule(metadata);
        requestContext.clientAppVersion.minorVersion().should.eql(2);
      });

      it('should return correct value when major ver is more than 1 digit', () => {
        metadata.clientAppVersion = '12.34.56';
        requestContext = requestContextModule(metadata);
        requestContext.clientAppVersion.minorVersion().should.eql(34);
      });

      it('returns NaN when no customer app version is passed in', () => {
        metadata.clientAppVersion = '';
        requestContext = requestContextModule(metadata);
        (isNaN(requestContext.clientAppVersion.minorVersion())).should.be.true();
      });

      it('should return NaN when minor component contains a string', () => {
        metadata.clientAppVersion = '1.1a.2';
        requestContext = requestContextModule(metadata);
        (isNaN(requestContext.clientAppVersion.minorVersion())).should.be.true();
      });

      it('should return correct value when major or patch contains a string', () => {
        metadata.clientAppVersion = '1a.2.3-beta';
        requestContext = requestContextModule(metadata);
        requestContext.clientAppVersion.minorVersion().should.eql(2);
      });
    });

    describe('patchVersion()', () => {
      it('should return correct value when major, minor and patch are passed in', () => {
        metadata.clientAppVersion = '1.2.3';
        requestContext = requestContextModule(metadata);
        requestContext.clientAppVersion.patchVersion().should.eql(3);
      });

      it('should return correct value when major ver is more than 1 digit', () => {
        metadata.clientAppVersion = '12.34.56';
        requestContext = requestContextModule(metadata);
        requestContext.clientAppVersion.patchVersion().should.eql(56);
      });

      it('returns NaN when no customer app version is passed in', () => {
        metadata.clientAppVersion = '';
        requestContext = requestContextModule(metadata);
        (isNaN(requestContext.clientAppVersion.patchVersion())).should.be.true();
      });

      it('should return NaN when patch component contains a string', () => {
        metadata.clientAppVersion = '1.2.3-beta';
        requestContext = requestContextModule(metadata);
        (isNaN(requestContext.clientAppVersion.patchVersion())).should.be.true();
      });

      it('should return correct value when major or minor contain string characters', () => {
        metadata.clientAppVersion = '1a.2-beta.3';
        requestContext = requestContextModule(metadata);
        requestContext.clientAppVersion.patchVersion().should.eql(3);
      });
    });
  });
});
