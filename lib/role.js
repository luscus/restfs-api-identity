'use strict';

const LRU     = require('lru');
const merge   = require('merge');
const elastic = require('./elastic-client')();
const mapping = require('./uuid-mapping');
const config  = require('../RESTfs/api/ApiConfig');

var   cache   = new LRU({
  max:    1000000,
  maxAge: 86400000 // store object one day
});

exports.isAuthorised = function isAuthorised(userUUID, context) {
  var user                  = context.user;
  var isKEEPER              = (user && user.roles.KEEPER);
  var isIDENTITY_MANAGER    = (user && user.roles[config.roles.IDENTITY_MANAGER]);
  var isDOMAIN_ROLE_MANAGER = (user && user.roles['ROLE_MANAGER:' + context.meta.domain]);

  if (
    context.meta.localRequest ||
    isKEEPER                  ||
    isIDENTITY_MANAGER        ||
    isDOMAIN_ROLE_MANAGER
  ) {
    return true;
  }

  return false;
};

exports.getDomainRoles  = function getDomainRoles(userUUID, domain, callback) {
  return exports.getRoles(userUUID, domain, callback);
};

exports.getBackendRoles = function getBackendRoles(userUUID, callback) {
  return exports.getRoles(userUUID, 'dungeon', callback);
};

exports.getExtendedDomainRoles     = function getExtendedDomainRoles(userUUID, domain, callback) {
  const rolesSetId = exports.getUserRolesID(userUUID, 'EXTENDED:' + domain);

  if (cache.peek(rolesSetId)) {
    return callback(null, cache.get(rolesSetId));
  }

  exports.getDomainRoles(userUUID, domain, function (error, domainRoles) {
    if (error) {
      callback(error);
    }

    exports.getBackendRoles(userUUID, function (error, dungeonRoles) {
      if (error) {
        callback(error);
      }

      // merge backend role with domain specific roles
      // and cache the result
      cache.set(rolesSetId, merge.recursive(true, domainRoles, dungeonRoles));

      callback(null, cache.get(rolesSetId));
    });
  });
};

exports.getRoles      = function getRoles(userUUID, domain, callback) {

  var roleID = exports.getUserRolesID(userUUID, domain);

  if (cache.peek(roleID)) {
    return callback(null, cache.get(roleID));
  }

  // retrieve domain specific roles
  elastic.get({
    index:   'identity',
    type:    'roles',
    _source:  true,
    id: roleID
  }, function (error, result) {
    if (error && error.message !== 'Not Found') {
      return callback(error);
    }

    // cache backend roles
    var rawRoles = (result && result.found ? result._source : {});
    var roles    = {};

    // format map
    Object.getOwnPropertyNames(rawRoles).forEach(function (roleName) {
      if (rawRoles[roleName].id) {
        roles[roleName] = rawRoles[roleName].id;
      }
    });

    // cache backend roles
    cache.set(roleID, roles);

    callback(null, cache.get(roleID));
  });
};

exports.addRole       = function addRole(granterUUID, userUUID, domain, roleName, callback) {
  exports.getRoles(userUUID, domain, function (error, roles) {
    if (error) {
      return callback(error, null);
    }

    if (!roles[roleName]) {
      var roleID = exports.getUserRolesID(userUUID, domain);

      // add role to user roles.json
      roles[roleName] = exports.generateRoleObject(domain, roleName, granterUUID);

      // overwrite cache
      cache.set(roleID, roles);

      elastic.index({
        index: 'identity',
        type: 'roles',
        id: roleID,
        body:  roles
      }, function (error) {
        if (error) {
          return callback(error, null);
        }

        callback(null, roles);
      });
    }
    else {
      // no change, return roles
      callback(null, roles);
    }
  });
};

exports.removeRole       = function removeRole(granterUUID, userUUID, domain, roleName, callback) {
  exports.getRoles(userUUID, domain, function (error, roles) {
    if (error) {
      return callback(error, null);
    }

    if (roles[roleName]) {
      var roleID = exports.getUserRolesID(domain, roleName);

      // delete role from user roles.json
      delete roles[roleName];

      // overwrite cache
      cache.set(roleID, roles);

      elastic.index({
        index: 'identity',
        type:  'roles',
        id:     roleID,
        body:   roles
      }, function (error) {
        if (error) {
          return callback(error, null);
        }

        callback(null, roles);
      });
    }
    else {
      // no change, return roles
      callback(null, roles);
    }
  });
};

exports.generateRoleObject = function generateRoleObject(domain, roleName, granterUUID) {
  var role          = {};

  role.id           = exports.getRoleID(roleName, domain);
  role.granter      = granterUUID;
  role.timestamp    = Date.now();

  return role;
};

exports.getUserRolesID = function getUserRolesID(userUUID, domain) {
  return 'CONFEDERATION:IDENTITY:ROLES:' + domain + ':' + userUUID;
};

exports.getRoleID = function getRoleID(roleName, domain) {
  return 'CONFEDERATION:IDENTITY:ROLE:' + domain + ':' + roleName;
};
