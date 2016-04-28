'use strict';

const Elastic = require('elasticsearch');
const config = require('./config');
var   client  = null;

module.exports = function () {
    if (!client && config && config.db) {
        client  = new Elastic.Client(config.db);
    }

    return Object.freeze(client);
};
