'use strict';

const emailRegex  = require('email-regex');
const UUID_REGEXP = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

exports.SEP           = ':';

exports.TYPE_EMAIL_ADDRESS = 'IDENTIFIER' + exports.SEP + 'EMAIL_ADDRESS';
exports.TYPE_PHONE_NUMBER  = 'IDENTIFIER' + exports.SEP + 'PHONE_NUMBER';
exports.TYPE_UUID          = 'IDENTIFIER' + exports.SEP + 'UUID';

exports.TYPES         = [
    exports.TYPE_EMAIL_ADDRESS,
    exports.TYPE_PHONE_NUMBER,
    exports.TYPE_UUID
];

exports.isUUID        = function isUUID(identifier) {
    return identifier && UUID_REGEXP.test(identifier);
};

exports.isEmail       = function isEmail(identifier) {
    return identifier && emailRegex({exact: true}).test(identifier);
};

exports.isPhoneNumber = function isPhoneNumber(identifier) {
    return identifier && /d*/.test(identifier);
};

exports.type          = function type(identifier) {

    if (exports.isEmail(identifier)) {
        return exports.TYPE_EMAIL_ADDRESS;
    } else if (exports.isPhoneNumber(identifier)) {
        return exports.TYPE_PHONE_NUMBER;
    } else if (exports.isUUID(identifier)) {
        return exports.TYPE_UUID;
    }
};
