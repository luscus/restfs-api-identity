'use strict';

const crypto     = require('crypto');

function unescape (str) {
  str = (str + Array(5 - str.length % 4)
    .join('='))
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  return new Buffer(str, 'base64');
};

function escape (buffer) {
  if (typeof buffer === 'string') {
    buffer = new Buffer(buffer);
  }

  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

exports.parse = function parse (jwtHeader, context) {
  jwtHeader     = jwtHeader.replace(/^JWT /, '');
  var jwtParts  = jwtHeader.split('.').map(unescape);

  var decrypted      = crypto.publicDecrypt(context.meta.certificate.public, jwtParts[2]);
  var decryptedParts = decrypted.toString().split('.').map(unescape);

  var info           = {
    header: JSON.parse(decryptedParts[0].toString()),
    payload:  JSON.parse(decryptedParts[1].toString())
  };

  return info;
};

exports.tokenize = function tokenize (context) {

  var tokenInfo = {
    alg: 'none',
    jku: context.meta.domain,
    cty: 'JWT'
  };

  var tokenData = {
    iss: context.meta.domain,
    sub: context.user.id,
    user: context.user,
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  var header    = escape(JSON.stringify(tokenInfo));
  var payload   = escape(JSON.stringify(tokenData));
  var signature = escape(crypto.privateEncrypt(context.meta.certificate.private, new Buffer(header + '.' + payload)));

  return header + '.' + payload + '.' + signature;
};
