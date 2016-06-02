'use strict';

const jwt        = require('../../lib/jwt');
const constants  = require('../../lib/constants');

module.exports = {
  chainPosition: 'pre',
  autoload: true,
  handler: function parseAuthenticationHeader(request, context) {

      if (context.meta.headers.raw.authentication) {
          const tokenInfo = jwt.parse(context);
          const timestamp = Math.floor(Date.now() / 1000);
          const lifespan  = context.config.token && context.config.token.lifespan || constants.token.lifespan;


          if (!tokenInfo.claim.iat) {
              // token is not valid
              context.logger.debug('    => invalid JWT token');
              return;
          } else if (tokenInfo.claim.nbf && timestamp < tokenInfo.claim.nbf) {
              // token is not valid yet
              context.logger.debug('    => JWT token will be valid at:\n', tokenInfo.claim.nbf);
              return;
          } else if (tokenInfo.claim.exp && timestamp >= tokenInfo.claim.exp) {
              // token has expired
              context.logger.debug('    => JWT token has expired at:\n', tokenInfo.claim.exp);
              return;
          } else if (tokenInfo.claim.iat && timestamp > tokenInfo.claim.iat + lifespan) {
              // token is not valid yet
              context.logger.debug('    => JWT token has expired at:\n', tokenInfo.claim.iat + lifespan);
              return;
          }

          context.user  = tokenInfo.claim.user;
          context.logger.debug('    => Authenticated User:\n', context.user);
      }
  }
};