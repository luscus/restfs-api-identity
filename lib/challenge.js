'use strict';

const client   = require('./elastic-client')();
const user     = require('./user');
const shortid  = require('shortid');
const uuid     = require('uuid');

exports.SEP = ':';

exports.check = function check(context, callback) {
    exports.get(context, context.data.body.challengeID, function (error, challenge) {
        if (error) {
            return context.fail(error);
        }

        if (challenge.accessTime) {
            return context.fail({
                reason:      'challenge already accessed and locked',
                accessResult: challenge.accessResult,
                accessIp:     challenge.accessIp,
                accessTime:   challenge.accessTime
            }, 423);
        }

        if (challenge.timeLimit < Date.now()) {
            return context.fail('Challenge was valid until ' + new Date(challenge.timeLimit).toISOString(), 410);
        }

        callback(null, context.data.body.secret === challenge.secret);
    });
};

exports.get = function get(context, challengeID, callback) {
    client.get({
        index:  'auth',
        type:   'challenge',
        _source: true,
        id:      challengeID
    }, function (error, result) {
        if (error && error.message !== 'Not Found') {
            return context.fail(error);
        }

        if (result && (result.found && result._source)) {
            return callback(null, result._source);
        }

        context.fail('Challenge could not be found', 410);
    });
};

exports.set = function set(context, callback) {
    var challengeID     = exports.generateChallengeID();
    var challengeObject = exports.generateChallengeObject(challengeID);

    client.index({
        index:  'auth',
        type:   'challenge',
        id:      challengeID,
        body:    challengeObject
    }, function (error) {
        if (error) {
            return callback(error);
        }

        callback(null, challengeObject);
    });
};

exports.lock = function lock(context, status, callback) {
    var challengeID = context.data.body.challengeID;
    var remoteIp    = context.meta.remoteIp;

    client.update({
        index: 'auth',
        type:  'challenge',
        id:    challengeID,
        body: {
            doc: {
                accessResult: (status ? 'authenticated' : 'unauthenticated'),
                accessTime:   Date.now(),
                accessIp:     remoteIp
            }
        }
    }, function (error) {
        if (error) {
            return context.fail(error);
        }

        callback(null, challengeID);
    });
};

exports.generateChallengeObject  = function generateChallengeObject(challengeID) {
    var secret = shortid().substring(0,4).toUpperCase();

    return {
        id:        challengeID,
        timeLimit: Date.now() + 120000,
        secret:    secret
    };
};

exports.generateChallengeID  = function generateChallengeID() {
    return 'EMAIL_CHALLENGE' + exports.SEP + uuid.v4();
};
