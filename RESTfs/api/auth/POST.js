'use strict';

const root       = __dirname.substring(0, __dirname.indexOf('/RESTfs'));
const jwt        = require(root + '/lib/jwt');
const user       = require(root + '/lib/user');
const role       = require(root + '/lib/role');
const challenge  = require(root + '/lib/challenge');
const identifier = require(root + '/lib/identifier');

exports.handler = function handler (context) {

  if (context.user) {
    role.getRoles(context.user.id, context.meta.domain, function (error, roles) {
      if (error) {
        return context.fail(error);
      }

      context.resolve(roles, 200);
    });
    return;
  }

  if (!identifier.isEmail(context.data.body.identifier)) {
    return context.fail('Missing/Malformed Email', 400);
  }

  if (!context.data.body.secret) {
    return context.fail('Challenge Secret Missing', 400);
  }

  challenge.check(context, function (error, challengeMastered) {
    if (error) {
      return context.fail(error);
    }

    challenge.lock(context, challengeMastered, function () {
      if (challengeMastered) {
        user.select(context.data.body.identifier, function (error, userInfo) {
          if (error) {
            return context.fail(error);
          }

          context.user = userInfo;

          role.getRoles(userInfo.id, context.meta.domain, function (error, roles) {
            if (error) {
              return context.fail(error);
            }

            context.resolve(roles, 200);
          });
        });
      }
      else {
        context.fail('Challenge failed', 401);
      }
    });
  });
};

exports.chain      = {
  post: [
    function generateAuthenticationHeader(response, context) {
      if (response.statusCode === 200) {
        var value = jwt.tokenize(context);

        response.setHeader('Authentication', 'JWT ' + value);
      }
    }
  ]
};

exports.STATUS_CODES = {
  200: 'Authentication Succes',
  202: 'Authentication Challenge Sended',
  400: 'Authentication Credentials Missing',
  401: 'Authentication Failed',
  410: 'Authentication Challenge Expired',
  423: 'Authentication Challenge Locked'
};
