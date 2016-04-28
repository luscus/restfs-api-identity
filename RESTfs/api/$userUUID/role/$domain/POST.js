'use strict';

const root       = __dirname.substring(0, __dirname.indexOf('/RESTfs'));
const role       = require(root + '/lib/role');

exports.handler = function handler (context) {

  var granterUUID = context.user && context.user.id || 'KEEPER';
  var userUUID    = context.data.url.userUUID;
  var domain      = context.data.url.domain;
  var roleName    = context.data.body.roleName;

  if (!roleName) {
    return context.fail('Role name to be granted is missing', 400);
  }

  if (!role.isAuthorised(userUUID, context)) {
    return context.fail('Not authorised', 403);
  }

  role.addRole(granterUUID, userUUID, domain, roleName, function (error, roles) {
    if (error) {
      return context.fail(error);
    }

    context.resolve(roles, 201);
  });
};

exports.STATUS_CODES = {
  201: 'User Role Added'
};
