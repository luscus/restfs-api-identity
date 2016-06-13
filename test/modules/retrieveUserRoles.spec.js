'use strict';

require('chai').should();

const expect      = require('chai').expect;
const clone       = require('clone');
const apiModule   = require('../../RESTfs/modules/retrieveUserRoles');
const reqContext  = require('../testContext');

describe('[' + __filename.substring(__filename.indexOf('/test/') + 1) + '] - retrieveUserRoles module', function() {

  it('should be a "pre" chain module', function() {
    expect(apiModule.chainPosition).to.equal('pre');
  });

  it('should not load automatically', function() {
    expect(apiModule.autoload).to.equal(false);
  });

  describe('chain condition', function() {

    it('should return null if route is not restricted', function() {
      var isActiveForRoute = apiModule.chainCondition({});
      expect(isActiveForRoute).to.equal(null);
    });

    it('should return empty array if restricted=true', function() {
      var isActiveForRoute = apiModule.chainCondition({restricted:true});
      expect(isActiveForRoute).to.deep.equal([]);
    });

    it('should return allowed role array if restricted to roles', function() {
      var isActiveForRoute = apiModule.chainCondition({restricted:['TESTER', 'OTHER']});
      expect(isActiveForRoute).to.deep.equal(['TESTER', 'OTHER']);
    });

  });

  describe('handler', function() {

    it('should return 401 if user is not authenticated', function() {
      var testContext = clone(reqContext);
      delete testContext.user;

      //testContext.user.roles.KEEPER = true;
      //testContext.data.url.userUUID = 'some-other-user';

      testContext.resolve = testContext.fail = function (data, statusCode) {
        expect(data).to.be.a('string')
          .and.to.equal('Not authenticated');
        expect(statusCode).to.equal(401);
      };

      apiModule.handler({}, testContext);
    });

    it('should retrieve user roles if user is authenticated', function() {
      var testContext = clone(reqContext);
      var roles       = apiModule.handler({}, testContext);

      expect(roles).to.equal(testContext.user.roles);
      expect(roles).to.be.an('object')
          .and.to.deep.equal({ TESTER: 'CONFEDERATION:IDENTITY:ROLE:test.io:TESTER',
            MINION: 'CONFEDERATION:IDENTITY:ROLE:test.io:MINION' });
    });

    it('should add KEEPER role if request was issued locally', function() {
      var testContext               = clone(reqContext);
      testContext.meta.localRequest = true;

      var roles       = apiModule.handler({}, testContext);

      expect(roles).to.equal(testContext.user.roles);
      expect(roles).to.be.an('object')
          .and.to.deep.equal({
            KEEPER: { reason: 'local access' } ,
            TESTER: 'CONFEDERATION:IDENTITY:ROLE:test.io:TESTER',
            MINION: 'CONFEDERATION:IDENTITY:ROLE:test.io:MINION'
          });
    });

  });

});
