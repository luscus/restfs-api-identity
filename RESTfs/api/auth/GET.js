'use strict';

const challenge  = require('../../../lib/challenge');
const identifier = require('../../../lib/identifier');
const role       = require('../../../lib/role');
const smtp       = require('../../../lib/smtp');

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

  if (!context.data.body) {
    return context.fail('Missing User email address', 400);
  }

  if (!identifier.isEmail(context.data.body.identifier)) {
    return context.fail('Malformed User email address: "' + context.data.body.identifier + '"', 400);
  }

  challenge.set(context, function (error, challengeObject) {
    if (error) {
      return context.fail(error);
    }

    smtp.sendEmailChallenge(context.meta.domain, context.data.body.identifier, challengeObject.secret, function (error) {
      if (error) {
        return context.fail(error);
      }

      context.resolve(challengeObject.id, 202);
    });
  });
};

exports.STATUS_CODES = {
  200: 'Authentication Succes',
  202: 'Authentication Challenge Sended',
  400: 'Authentication Credential Missing'
};
