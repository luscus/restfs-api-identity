'use strict';

const root       = __dirname.substring(0, __dirname.indexOf('/RESTfs'));
const user       = require(root + '/lib/user');

exports.handler = function handler (context) {

  if (context.user && !context.user.roles['MASTER']) {
    return context.fail('Registration Failure User Authenticated', 403);
  }

  user.getUUID(context.data.body.email, function (error, userUUID) {

    if (!userUUID) {
      user.create(context.data.body, function (error, userUUID) {

        if (error) {
          return user.remove(context.data.body.email, function () {
            context.fail(error);
          });
        }

        context.resolve(userUUID, 201);
      });
    }
    else {
      context.fail('User Already Exists', 409);
    }
  });

};

exports.STATUS_CODES = {
  201: 'Registration Success',
  403: 'Registration Failure User Authenticated',
  409: 'Registration Failure User Exists'
};
