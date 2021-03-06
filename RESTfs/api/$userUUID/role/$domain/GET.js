'use strict';

const root       = __dirname.substring(0, __dirname.indexOf('/RESTfs'));
const role       = require(root + '/lib/role');

exports.handler = function getUserDomainRoles (context) {

  var userUUID = context.data.url.userUUID;
  var domain   = context.data.url.domain;

  if (!context.user) {
    return context.fail('Not Authenticated', 401);
  }

  if (userUUID !== context.user.id  && !role.isAuthorised(userUUID, context)) {
    return context.fail('Not Authorised', 403);
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
  401: 'User Not Authenticated',
  403: 'User Not Authorised'
};
