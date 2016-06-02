'use strict';

require('chai').should();

const expect      = require('chai').expect;
const clone       = require('clone');

const root        = __dirname.substring(0, __dirname.indexOf('/test/'));
const elastic     = require(root + '/lib/elastic-client')().mock();     // force use of mocked data
const signupMeta  = require(root + '/RESTfs/api/signup/EndpointConfig');
const signup      = require(root + '/RESTfs/api/signup/PUT');
const reqContext  = require('../testContext');

describe('[' + __filename.substring(__filename.indexOf('/test/') + 1) + '] - "sign up" action', function() {

    it('should return statusCode 403 if user is already authenticated', function() {
        var testContext = clone(reqContext);

        testContext.resolve = testContext.fail = function(data, statusCode) {
            expect(data).to.be.a('string')
                .and.to.equal('Registration Failure User Authenticated');
            expect(statusCode).to.equal(403);
        };

        signup.handler(testContext);
    });

    it('should return statusCode 400 if no email address is provided', function() {
        var testContext = clone(reqContext);
        delete testContext.user;

        testContext.resolve = testContext.fail = function(data, statusCode) {
            expect(data).to.be.a('string')
                .and.to.equal('No email address specified');
            expect(statusCode).to.equal(400);
        };

        signup.handler(testContext);
    });

    it('should allow requests from authenticated MASTER users', function() {
        var testContext = clone(reqContext);
        testContext.user.roles = {
            MASTER: true
        };

        testContext.resolve = testContext.fail = function(data, statusCode) {
            expect(data).to.be.a('string')
                .and.to.equal('No email address specified');
            expect(statusCode).to.equal(400);
        };

        signup.handler(testContext);
    });

    it('should return statusCode 409 if user is already registered', function() {
        var testContext = clone(reqContext);

        delete testContext.user;
        testContext.data = {
            all: {
                email: 'regitered.user@test.io'
            },
            body: {
                email: 'regitered.user@test.io'
            }
        };

        testContext.resolve = testContext.fail = function(data, statusCode) {
            expect(data).to.be.a('string')
                .and.to.equal('User Already Exists');
            expect(statusCode).to.equal(409);
        };

        signup.handler(testContext);
    });

    it('should return statusCode 201 if new user has been registered', function(done) {
        var testContext = clone(reqContext);

        delete testContext.user;
        testContext.data = {
            all: {
                email: 'unknown.user@test.io'
            },
            body: {
                email: 'unknown.user@test.io'
            }
        };

        testContext.resolve = testContext.fail = function (userUUID, statusCode) {
            expect(userUUID).to.be.a('string')
                .and.to.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
            expect(statusCode).to.equal(201);

            // email to uuid mapping should have been created
            elastic.get({
                index: 'identity',
                type:  'mapping',
                id:    'IDENTIFIER:EMAIL_ADDRESS:unknown.user@test.io'
            },
            function (error, data) {
                expect(error).to.equal(null);
                expect(data).to.be.an('object');
                expect(data._source).to.deep.equal({
                    id: 'IDENTIFIER:EMAIL_ADDRESS:unknown.user@test.io',
                    userUUID: userUUID
                });

                done();
            });
        };

        signup.handler(testContext);
    });

});
