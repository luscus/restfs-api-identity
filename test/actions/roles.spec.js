'use strict';

require('chai').should();

const expect      = require('chai').expect;
const clone       = require('clone');

const root        = __dirname.substring(0, __dirname.indexOf('/test/'));
const elastic     = require(root + '/lib/elastic-client')().mock();     // force use of mocked data
const jwt         = require(root + '/lib/jwt');                 // force use of mocked smtp server
const roleMeta    = require(root + '/RESTfs/api/$userUUID/role/$domain/EndpointConfig');
const roleGet     = require(root + '/RESTfs/api/$userUUID/role/$domain/GET');
const rolePost    = require(root + '/RESTfs/api/$userUUID/role/$domain/POST');
const roleDelete  = require(root + '/RESTfs/api/$userUUID/role/$domain/DELETE');
const reqContext  = require('../testContext');

describe('[' + __filename.substring(__filename.indexOf('/test/') + 1) + '] - "roles" action', function() {

  describe('GET (retrieve user roles)', function() {
    it('should return statusCode 401 if user is not authenticated', function () {
      var testContext = clone(reqContext);
      delete testContext.user;

      testContext.resolve = testContext.fail = function (data, statusCode) {
        expect(data).to.be.a('string')
          .and.to.equal('Not Authenticated');
        expect(statusCode).to.equal(401);
      };

      roleGet.handler(testContext);
    });

    it('should return statusCode 403 if user is not authorised', function () {
      var testContext = clone(reqContext);

      testContext.resolve = testContext.fail = function (data, statusCode) {
        expect(data).to.be.a('string')
          .and.to.equal('Not Authorised');
        expect(statusCode).to.equal(403);
      };

      roleGet.handler(testContext);
    });

    it('should return statusCode 200 if user asks for his own roles', function () {
      var testContext = clone(reqContext);

      testContext.data.url.userUUID = '6d64d5ec-5f51-4323-93d4-39605c0b17fc';

      testContext.resolve = testContext.fail = function (data, statusCode) {
        expect(data).to.be.a('object')
          .and.to.deep.equal({});
        expect(statusCode).to.equal(200);
      };

      roleGet.handler(testContext);
    });

    it('should return statusCode 200 if authorised user asks roles from some other user', function () {
      var testContext = clone(reqContext);

      testContext.user.roles.KEEPER = true;
      testContext.data.url.userUUID = 'some-other-user';

      testContext.resolve = testContext.fail = function (data, statusCode) {
        expect(data).to.be.a('object')
          .and.to.deep.equal({});
        expect(statusCode).to.equal(200);
      };

      roleGet.handler(testContext);
    });

  });

  describe('POST (adds user roles)', function() {
    it('should return statusCode 400 if granted role name is missing', function () {
      var testContext = clone(reqContext);

      testContext.resolve = testContext.fail = function (data, statusCode) {
        expect(data).to.be.a('string')
          .and.to.equal('Role name to be granted is missing');
        expect(statusCode).to.equal(400);
      };

      rolePost.handler(testContext);
    });

    it('should return statusCode 403 if user is not authorised to grant roles', function () {
      var testContext = clone(reqContext);

      testContext.data.body.roleName = 'SUPER_TESTER';

      testContext.resolve = testContext.fail = function (data, statusCode) {
        expect(data).to.be.a('string')
          .and.to.equal('Not authorised');
        expect(statusCode).to.equal(403);
      };

      rolePost.handler(testContext);
    });

    it('should return statusCode 201 if role was successfully granted', function () {
      var testContext = clone(reqContext);

      testContext.user.roles.KEEPER  = true;
      testContext.data.url.userUUID  = testContext.user.id;
      testContext.data.url.domain    = testContext.meta.domain;
      testContext.data.body.roleName = 'SUPER_TESTER';

      testContext.resolve = testContext.fail = function (data, statusCode) {
        expect(statusCode).to.equal(201);
        expect(data).to.be.a('object');
        expect(data.SUPER_TESTER.id).to.equal('CONFEDERATION:IDENTITY:ROLE:test.io:SUPER_TESTER');
        expect(data.SUPER_TESTER.granter).to.equal('6d64d5ec-5f51-4323-93d4-39605c0b17fc');
      };

      rolePost.handler(testContext);
    });
  });

  describe('DELETE (revokes user roles)', function() {
    it('should return statusCode 400 if granted role name is missing', function () {
      var testContext = clone(reqContext);

      testContext.resolve = testContext.fail = function (data, statusCode) {
        expect(data).to.be.a('string')
          .and.to.equal('Role name to be granted is missing');
        expect(statusCode).to.equal(400);
      };

      roleDelete.handler(testContext);
    });

    it('should return statusCode 403 if user is not authorised to revoke roles', function () {
      var testContext = clone(reqContext);

      testContext.data.body.roleName = 'SUPER_TESTER';

      testContext.resolve = testContext.fail = function (data, statusCode) {
        expect(data).to.be.a('string')
          .and.to.equal('Not authorised');
        expect(statusCode).to.equal(403);
      };

      roleDelete.handler(testContext);
    });

    it('should return statusCode 200 if role was successfully revoked', function () {
      var testContext = clone(reqContext);

      testContext.user.roles.KEEPER  = true;
      testContext.data.url.userUUID  = testContext.user.id;
      testContext.data.url.domain    = testContext.meta.domain;
      testContext.data.body.roleName = 'SUPER_TESTER';

      testContext.resolve = testContext.fail = function (data, statusCode) {
        expect(statusCode).to.equal(200);
        expect(data).to.be.a('object');
        expect(data).to.deep.equal({ TESTER: 'CONFEDERATION:IDENTITY:ROLE:test.io:TESTER' });
      };

      roleDelete.handler(testContext);
    });
  });

});
