'use strict';

const merge   = require('merge');
const elastic = require('./elastic-client')();
const mapping = require('./uuid-mapping');
const config  = require('../RESTfs/api/ApiConfig');

var   cache   = {};

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

exports.getRoles      = function getRoles(userUUID, domain, callback) {
    var roleID = exports.getRoleID(userUUID, domain);
    var keepID = exports.getRoleID(userUUID, 'dungeon');

    if (cache[roleID] && cache[keepID]) {
        return callback(null, cache[roleID]);
    }

    // retrieve first backend roles (for ADMIN,...)
    elastic.get({
        index:   'identity',
        type:    'roles',
        _source:  true,
        id: keepID
    }, function (error, result) {
        if (error && error.message !== 'Not Found') {
            return callback(error);
        }

        // cache backend roles
        cache[keepID] = (result.found ? result._source : {});

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
            var roles = (result.found ? result._source : {});

            console.log('MERGE ROLES:\n', cache[keepID], roles);
            // merge backend role with domain specific roles
            // and cache the result
            cache[roleID] = merge.recursive(true, cache[keepID], roles);

            callback(null, cache[roleID]);
        });
    });
};

exports.addRole       = function getRoles(granterUUID, userUUID, domain, roleName, callback) {
    exports.getRoles(userUUID, domain, function (error, roles) {
        if (error) {
            return callback(error, null);
        }

        if (!roles[roleName]) {
            var roleID = exports.getRoleID(userUUID, domain);

            // add role to user roles.json
            roles[roleName] = exports.generateRoleObject(roleID, granterUUID);

            // overwrite cache
            cache[roleID]   = roles;

            elastic.index({
                index: 'identity',
                type: 'roles',
                id: exports.getRoleID(userUUID, domain),
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

exports.generateRoleObject = function generateRoleObject(roleID, granterUUID) {
    var role          = {};

    role.id           = roleID;
    role.granter      = granterUUID;
    role.timestamp    = Date.now();

    return role;
};

exports.getRoleID = function getRoleID(userUUID, domain) {
    return 'CONFEDERATION:IDENTITY:ROLES:' + domain + ':' + userUUID;
};
