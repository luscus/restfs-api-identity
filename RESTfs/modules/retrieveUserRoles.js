'use strict';

const role     = require('../../lib/role');

module.exports = {
  chainCondition: function (routeElement) {
    var condition = routeElement.restricted;

    if (condition) {
      if (!Array.isArray(condition)) {
        // enforce an array as condition
        condition = [];
      }
    } else {
      // action is not restricted,
      // set condition to null
      condition = null;
    }

    return condition;
  },
  chainPosition: 'pre',
  autoload: false,
  handler: function retrieveUserRoles(request, context) {

    if (context.user) {
      var userUUID    = context.user.id;
      var domain      = context.meta.domain;

      role.getExtendedDomainRoles(userUUID, domain, function (error, roles) {
        if (error) {
          return context.fail(error);
        }

        context.user.roles = roles;

        context.logger.debug('    => User Roles:\n', context.user.roles);
      });
    }
    else {
      return context.fail('Not authenticated', 401);
    }

    if (context.meta.localRequest) {
      // add KEEPER role when accessing
      // api from localhost
      context.user.roles.KEEPER = {
        reason: 'local access'
      };

    }

    context.logger.debug('    => User Roles:\n', context.user.roles);
    return context.user.roles;
  }
};