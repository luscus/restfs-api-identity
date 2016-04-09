'use strict';

const Elastic = require('elasticsearch');
var   client  = null;

module.exports = function () {
    if (!client) {
        client  = new Elastic.Client({
            host: '52.49.207.116:9200',
            log: 'trace'
        })
    }

    return client;
};
