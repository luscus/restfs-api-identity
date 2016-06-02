'use strict';

require('chai').should();

const expect      = require('chai').expect;
const clone       = require('clone');

const root        = __dirname.substring(0, __dirname.indexOf('/test/'));
const elastic     = require(root + '/lib/elastic-client')().mock();     // force use of mocked data
const smtp        = require(root + '/lib/smtp').mock();                 // force use of mocked smtp server
const signupMeta  = require(root + '/RESTfs/api/auth/EndpointConfig');
const authGet     = require(root + '/RESTfs/api/auth/GET');
const authPost    = require(root + '/RESTfs/api/auth/POST');
const reqContext  = require('../testContext');

var challengeID   = null;

describe('[' + __filename.substring(__filename.indexOf('/test/') + 1) + '] - "auth" action', function() {

  describe('GET', function() {
    it('should return statusCode 400 if email address is missing', function () {
      var testContext = clone(reqContext);
      delete testContext.user;

      testContext.resolve = testContext.fail = function (data, statusCode) {
        expect(data).to.be.a('string')
          .and.to.equal('Missing User email address');
        expect(statusCode).to.equal(400);
      };

      authGet.handler(testContext);
    });


    it('should return statusCode 400 if email address is malformed', function () {
      var testContext = clone(reqContext);
      delete testContext.user;

      testContext.data.all.identifier = 'no-email.address';

      testContext.resolve = testContext.fail = function (data, statusCode) {
        expect(data).to.be.a('string')
          .and.to.equal('Malformed User email address: "' + testContext.data.all.identifier + '"');
        expect(statusCode).to.equal(400);
      };

      authGet.handler(testContext);
    });

    it('should return statusCode 202 if an email challenge was issued', function () {
      var testContext = clone(reqContext);
      delete testContext.user;

      testContext.data.all.identifier = 'regitered.user@test.io';

      testContext.resolve = testContext.fail = function (data, statusCode) {
        expect(data).to.be.a('string')
          .and.to.match(/EMAIL_CHALLENGE:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        expect(statusCode).to.equal(202);

        challengeID = data;
      };

      authGet.handler(testContext);
    });
  });

  describe('POST', function() {
    it('should return statusCode 400 if identifier is missing', function () {
      var testContext = clone(reqContext);
      delete testContext.user;

      testContext.resolve = testContext.fail = function (data, statusCode) {
        expect(data).to.be.a('string')
          .and.to.equal('Missing Identifier');
        expect(statusCode).to.equal(400);
      };

      authPost.handler(testContext);
    });

    it('should return statusCode 400 if identifier is malformed', function () {
      var testContext = clone(reqContext);
      delete testContext.user;

      testContext.data.body.identifier = '6876tiusvgjh333-ff';

      testContext.resolve = testContext.fail = function (data, statusCode) {
        expect(data).to.be.a('string')
          .and.to.equal('Malformed Identifier');
        expect(statusCode).to.equal(400);
      };

      authPost.handler(testContext);
    });

    it('should return statusCode 400 if challenge secret is missing', function () {
      var testContext = clone(reqContext);
      delete testContext.user;

      testContext.data.body.identifier = 'regitered.user@test.io';

      testContext.resolve = testContext.fail = function (data, statusCode) {
        expect(data).to.be.a('string')
          .and.to.equal('Missing Challenge Secret');
        expect(statusCode).to.equal(400);
      };

      authPost.handler(testContext);
    });

    it('should return statusCode 400 if challenge id is missing', function () {
      var testContext = clone(reqContext);
      delete testContext.user;

      testContext.data.body.identifier = 'regitered.user@test.io';
      testContext.data.body.secret     = 'TEST';

      testContext.resolve = testContext.fail = function (data, statusCode) {
        expect(data).to.be.a('string')
          .and.to.equal('Missing Challenge ID');
        expect(statusCode).to.equal(400);
      };

      authPost.handler(testContext);
    });

    it('should return statusCode 200 and user roles if challenge was successful', function () {
      var testContext = clone(reqContext);
      delete testContext.user;

      elastic.get(
        {index:'auth', id:challengeID},
        function (error, challenge) {
          testContext.data.body.identifier  = 'regitered.user@test.io';
          testContext.data.body.challengeID = challenge._source.id;
          testContext.data.body.secret      = challenge._source.secret;

          testContext.resolve = testContext.fail = function (data, statusCode) {
            expect(data).to.be.a('object')
              .and.to.deep.equal({});
            expect(statusCode).to.equal(200);
          };

          authPost.handler(testContext);
        }
      );

    });
  });

});
