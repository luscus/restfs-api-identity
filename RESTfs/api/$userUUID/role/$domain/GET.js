'use strict';

const role       = require('../../../../../lib/role');

exports.handler = function getUserDomainRoles (context) {
  var userUUID = context.data.url.userUUID;
  var domain   = context.data.url.domain;

  if (!context.user) {
    return context.fail('Not authenticated', 401);
  }

  if (userUUID !== user.id  && !role.isAuthorised(userUUID, context)) {
    return context.fail('Not authorised', 403);
  }

  role.getRoles(userUUID, domain, function (error, roles) {
    if (error) {
      return context.fail(error);
    }

    context.resolve(roles, 200);
  });
};

exports.STATUS_CODES = {
  200: 'User Role List',
  401: 'User Not Authenticated'
};
