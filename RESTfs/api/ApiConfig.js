'use strict';

var config = require('../../lib/config');
var merge  = require('merge');

module.exports = {
    name: 'identity',
    alias: 'id',
    description: 'Allows the CRUD operations for the user account and the authentication',
    roles: {
        IDENTITY_MANAGER: 'can create/delete users'
    },
    init: function init (options) {

        // save options in config module
        merge.recursive(config, options);

        // init database connection
        require('../../lib/elastic-client')();
    }
};
