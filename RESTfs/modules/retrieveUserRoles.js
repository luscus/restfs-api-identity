'use strict';

const role     = require('../../lib/role');

module.exports = {
    chainCondition: function (routeElement) {
        return (typeof routeElement.restricted === 'boolean' ? routeElement.restricted : null);
    },
    chainPosition: 'pre',
    autoload: false,
    handler: function retrieveUserRoles(request, context) {

        if (context.user) {
            var userUUID = context.user.id;
            var domain   = context.meta.domain;

            role.getRoles(userUUID, domain, function (error, roles) {
                if (error) {
                    return context.fail(error);
                }

                context.user.roles = roles;

                context.logger.debug('    => User Roles:\n', context.user.roles);
                return;
            });
        }
        else if (context.meta.localRequest) {
            context.user = {
                id: 'LOCAL_KEEPER',
                roles: {
                    KEEPER: true
                }
            };

            context.logger.debug('    => User Roles:\n', context.user.roles);
            return;
        }
        else {
            return context.fail('Not authenticated', 401);
        }
    }
};