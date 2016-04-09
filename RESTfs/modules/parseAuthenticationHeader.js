'use strict';

const jwt        = require('../../lib/jwt');

module.exports = {
  chainPosition: 'pre',
  autoload: true,
  handler: function parseAuthenticationHeader(request, context) {

      if (context.meta.headers.raw.authentication) {
          var tokenInfo = jwt.parse(context.meta.headers.raw.authentication, context);

          context.user  = tokenInfo.payload.user;
          context.logger.debug('    => Authenticated User:\n', context.user);
      }
  }
};