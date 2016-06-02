'use strict';

const root       = __dirname.substring(0, __dirname.indexOf('/RESTfs'));
const challenge  = require(root + '/lib/challenge');
const identifier = require(root + '/lib/identifier');
const role       = require(root + '/lib/role');
const smtp       = require(root + '/lib/smtp');
const jwt        = require(root + '/lib/jwt');

exports.handler = function getAuthChallenge (context) {

  if (context.user) {
    role.getRoles(context.user.id, context.meta.domain, function (error, roles) {
      if (error) {
        return context.fail(error);
      }

      context.resolve(roles, 200);
    });
    return;
  }

  if (!context.data.all.identifier) {
    return context.fail('Missing User email address', 400);
  }

  if (!identifier.isEmail(context.data.all.identifier)) {
    return context.fail('Malformed User email address: "' + context.data.all.identifier + '"', 400);
  }

  challenge.set(context, function (error, challengeObject) {
    if (error) {
      return context.fail(error);
    }

    smtp.sendEmailChallenge(context.meta.domain, context.data.all.identifier, challengeObject.secret, function (error) {
      if (error) {
        return context.fail(error);
      }

      context.resolve(challengeObject.id, 202);
    });
  });
};

exports.chain      = {
  post: [
    function refreshAuthenticationHeader(response, context) {
      if (context.user && response.statusCode === 200) {
        var value = jwt.expendLifetime(context);

        response.setHeader('Authentication', 'JWT ' + value);
      }
    }
  ]
};

exports.STATUS_CODES = {
  200: 'Authentication Succes',
  202: 'Authentication Challenge Sended',
  400: 'Authentication Credential Missing'
};
