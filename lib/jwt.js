'use strict';

const crypto     = require('crypto');
const uuid       = require('uuid');
const constants  = require('./constants');

exports.unescape = function unescape (str) {
  str = (str + Array(5 - str.length % 4)
    .join('='))
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  return new Buffer(str, 'base64').toString();
};

exports.escape = function escape (buffer) {
  if (typeof buffer === 'string') {
    buffer = new Buffer(buffer);
  }

  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

exports.sign = function sign(data, privateKey) {

  if (!Buffer.isBuffer(data)) {
    data = new Buffer(data.toString(), 'utf8');
  }

  return crypto.privateEncrypt(privateKey, data).toString('base64');
};

exports.verify = function verify(data, publicKey) {

  if (!Buffer.isBuffer(data)) {
    data = new Buffer(data.toString(), 'base64');
  }

  return crypto.publicDecrypt(publicKey, data).toString('utf8');
};

exports.encrypt = function encrypt(data, secret) {
  const cipher  = crypto.createCipher('aes256', secret.toString());
  var encrypted = cipher.update(data.toString(), 'utf8', 'hex');
  encrypted    += cipher.final('hex');

  return encrypted.toString();
};

exports.decrypt = function decrypt(data, secret) {
  const cipher  = crypto.createDecipher('aes256', secret);
  var decrypted = cipher.update(data, 'hex', 'utf8');
  decrypted    += cipher.final('utf8');

  return decrypted.toString();
};

exports.expendLifetime = function expendLifetime (context) {
  var jwtHeader  = context.meta.headers.raw.authentication.replace(/^JWT /, '');
  var jwtParts   = jwtHeader.split('.').map(exports.unescape);

  const cek      = JSON.parse(jwtParts[0]).cek;
  const secret   = exports.verify(cek, context.meta.certificate.public);
  const lifespan = context.config.token && context.config.token.lifespan || constants.token.lifespan;

  var decrypted      = exports.decrypt(jwtParts[2], secret);
  var decryptedParts = decrypted.split('.') // separate header and claim
      .map(exports.unescape)                // unescape header and claim
      .map(JSON.parse);                     // convert to JSON

  const now     = Math.floor(Date.now() / 1000);

  if (decryptedParts[1].nbf < now) {
    // Token is in its validity window
    decryptedParts[1].exp = now + lifespan;

    var header    = exports.escape(JSON.stringify(decryptedParts[0]));
    var claim     = exports.escape(JSON.stringify(decryptedParts[1]));

    var encrypted = exports.encrypt(header + '.' + claim, secret);

    var signature = exports.escape(encrypted);

    return header + '.' + claim + '.' + signature;
  } else {
    // Token was not yet valid
    return jwtHeader;
  }
};

exports.parse = function parse (context) {
  var jwtHeader = context.meta.headers.raw.authentication.replace(/^JWT /, '');
  var jwtParts  = jwtHeader.split('.').map(exports.unescape);

  const header  = JSON.parse(jwtParts[0]);
  const secret  = exports.verify(header.cek, context.meta.certificate.public);

  var decrypted      = exports.decrypt(jwtParts[2], secret);
  var decryptedParts = decrypted.split('.') // separate header and claim
      .map(exports.unescape)                // unescape header and claim
      .map(JSON.parse);                     // convert to JSON

  return {
    header: decryptedParts[0],
    claim:  decryptedParts[1]
  };
};

exports.tokenize = function tokenize (context, secret, validityDelay, createdAt) {

  if (validityDelay > 1296000 && !createdAt) {
    // max validity delay is 15 days
    createdAt     = validityDelay;
    validityDelay = null;
  }

  validityDelay  = validityDelay || 0;
  createdAt      = createdAt     || Math.floor(Date.now() / 1000);
  secret         = secret        || uuid.v4() + '::' + uuid.v4();

  const lifespan = context.config.token && context.config.token.lifespan || constants.token.lifespan;
  const expires  = createdAt + validityDelay + lifespan;
  const validAt  = createdAt + validityDelay;

  var tokenInfo  = {
    cty: 'JWT',
    alg: 'RSA',
    enc: 'AES256',
    cek: exports.sign(secret, context.meta.certificate.private),
    jku: context.meta.domain
  };

  var tokenData = {
    iss: context.meta.domain,
    sub: context.user.id,
    user: context.user,
    iat: createdAt,
    nbf: validAt,
    exp: expires
  };

  var header    = exports.escape(JSON.stringify(tokenInfo));
  var claim     = exports.escape(JSON.stringify(tokenData));

  var encrypted = exports.encrypt(header + '.' + claim, secret);

  var signature = exports.escape(encrypted);

  return header + '.' + claim + '.' + signature;
};
