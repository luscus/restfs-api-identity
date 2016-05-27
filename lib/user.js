'use strict';

const uuid    = require('uuid');
const elastic = require('./elastic-client')();
const mapping = require('./uuid-mapping');

const mappedProperties = [
  'primaryEmail',
  'primaryPhone'
];

exports.getUUID = function getUUID(identifier, callback) {
  mapping.getMapping(identifier, function (error, mapping) {
    if (error) {
      return callback(error, null);
    }

    callback(error, mapping.userUUID);
  });
};

exports.select = function select(identifier, callback) {
  exports.getUUID(identifier, function (error, userUUID) {

    if (userUUID) {
      elastic.get({
        index:   'identity',
        type:    'user',
        _source:  true,
        id:       userUUID
      }, function (error, result) {
        if (error) {
          return callback(error, null);
        }

        var user = (result.found ? result._source : null);

        callback(null, user);
      });
    }
    else {
      callback(null, null);
    }
  });
};

exports.create = function createUser(data, callback) {
  var user     = exports.generateUserObject(data);
  var mappings = exports.getMappings(user);

  elastic.index({
    index: 'identity',
    type:  'user',
    id:    user.id,
    body:  user
  }, function (error) {

    if (error) {
      return callback(error);
    }

    // set user mappings
    exports.setMappings(mappings, user.id, callback);
  });
};

exports.remove = function remove(identifier, callback) {
  exports.select(identifier, function (error, user) {
    var mappings = exports.getMappings(user);

    if (user) {
      elastic.delete({
        index: 'identity',
        type:  'user',
        id:    user.id
      }, function () {
        exports.deleteMappings(mappings, callback);
      });
    }
  });
};

exports.getMappings     = function getMappings(user) {
  var index    = mappedProperties.length;
  var mappings = [];

  while (index--) {
    if ( user[mappedProperties[index]] ) {
      mappings.push(user[mappedProperties[index]]);
    }
  }

  return mappings;
};

exports.deleteMappings     = function deleteMappings(mappings, callback) {
  if (mappings.length) {
    var identifier = mappings.pop();

    mapping.removeMapping(identifier, function () {
      exports.deleteMappings(mappings, callback);
    });
  }
  else {
    callback();
  }
};

exports.setMappings        = function setMappings(mappings, userUUID, callback) {
  if (mappings.length) {
    var identifier = mappings.pop();

    mapping.setMapping(identifier, userUUID, function (error) {

      if (error) {
        return callback(error);
      }

      exports.setMappings(mappings, userUUID, callback);
    });
  }
  else {
    callback(null, userUUID);
  }
};

exports.generateUserObject = function generateUserObject(data) {
  var userData          = {};
  userData.id           = uuid.v4();
  userData.type         = 'CONFEDERATION:IDENTITY:USER';
  userData.username     = data.username;
  userData.primaryEmail = data.email;

  if (data.phoneNumber) {
    userData.primaryPhone = data.phoneNumber;
  }

  return userData;
};
