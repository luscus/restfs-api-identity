'use strict';

require('chai').should();

const expect      = require('chai').expect;
const clone       = require('clone');
const apiModule   = require('../../RESTfs/modules/parseAuthenticationHeader');
const jwt         = require('../../lib/jwt');
const reqContext  = require('../testContext');

const secret      = 'my-big-secret';

var testContext   = null;
var testTimestamp = null;

describe('[' + __filename.substring(__filename.indexOf('/test/') + 1) + '] - parseAuthenticationHeader ', function() {

    beforeEach(function () {
        testTimestamp        = Math.floor(Date.now() / 1000);
        testContext          = clone(reqContext);

        delete testContext.user;

        // add headers
        testContext.meta.headers = {
            raw: {}
        };
    });

    it('should be a "pre" chain module', function() {
        expect(apiModule.chainPosition).to.equal('pre');
    });

    it('should load automatically', function() {
        expect(apiModule.autoload).to.equal(true);
    });

    describe('handler', function() {
        it('should do nothing if no JWT token exists', function () {
            apiModule.handler({}, testContext);
            expect(testContext.user).to.equal(undefined);
        });

        it('should ignore pending JWT tokens', function () {
            testContext.meta.headers.raw.authentication = 'JWT ' + jwt.tokenize(reqContext, secret, 10000, testTimestamp);

            apiModule.handler({}, testContext);

            expect(testContext.user).to.equal(undefined);
        });

        it('should ignore expired JWT tokens', function () {
            testContext.meta.headers.raw.authentication = 'JWT ' + jwt.tokenize(reqContext, secret, testTimestamp - 10000);

            apiModule.handler({}, testContext);

            expect(testContext.user).to.equal(undefined);
        });

        it('should retrieve user from JWT token', function () {
            testContext.meta.headers.raw.authentication = 'JWT ' + jwt.tokenize(reqContext, secret, testTimestamp - 100);

            apiModule.handler({}, testContext);

            expect(testContext.user).to.deep.equal(reqContext.user);
        });
    });

});
