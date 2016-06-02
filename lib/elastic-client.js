'use strict';

const Elastic = require('elasticsearch');
const config = require('./config');
var   client  = null;

function mock() {
  if (!client.mocked) {
    const merge = require('merge');
    var db      = require('../test/mockDB');

    client.mocked = true;

    client.index = function index(meta, callback) {
      if (!db[meta.index]) {
        db[meta.index] = {};
        db[meta.index].index = {};
        db[meta.index].data = [];
      }

      if (db[meta.index].index[meta.id] === undefined) {
        db[meta.index].index[meta.id] = db[meta.index].data.push(meta.body) - 1;
      } else {
        // document exists and will be replaced
        var position = db[meta.index].index[meta.id];
        db[meta.index].data.splice(position, 1, meta.body);
      }

      //console.log('-----\ninsert', meta.index, '=>\nindex:', meta.id + ': ' + db[meta.index].index[meta.id], '\ndata:', JSON.stringify(meta.body, null, 2));

      callback(null);
    };

    client.get = function (meta, callback) {

      if (db[meta.index].index[meta.id] === undefined) {
        callback(new Error('Not Found'));
      } else {
        // document exists and will be removed
        var position = db[meta.index].index[meta.id];

        callback(null, {
          found: true,
          _source: db[meta.index].data[position]
        });
      }
    };

    client.update = function (meta, callback) {

      if (db[meta.index].index[meta.id] === undefined) {
        callback(new Error('Not Found'));
      } else {
        // document exists and will be removed
        var position = db[meta.index].index[meta.id];

        merge.recursive(true, db[meta.index].data[position], meta.body.doc);

        callback(null, db[meta.index].data[position]);
      }
    };

    client.delete = function (meta, callback) {

      if (db[meta.index].index[meta.id] === undefined) {
        callback(new Error('Not Found'));
      } else {
        // document exists and will be removed
        var position = db[meta.index].index[meta.id];
        db[meta.index].data.splice(position, 1);

        callback(null);
      }
    };
  }

  return client;
}

module.exports = function () {
  if (!client && config && config.db) {
    client  = new Elastic.Client(config.db);
  } else if (!client) {
    client      = {};
    client.mock = mock;
  }


  return client;
};
