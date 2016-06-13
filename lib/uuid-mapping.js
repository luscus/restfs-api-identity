'use strict';

const LRU      = require('lru');
const elastic  = require('./elastic-client')();
const ident    = require('./identifier');


var   mappingCache = new LRU({
  max:    1000000,
  maxAge: 1296000000 // store object 15 days
});

exports.setMapping = function setMapping(identifier, userUUID, callback) {
  const mappingID = exports.generateMappingID(identifier);

  elastic.index({
    index: 'identity',
    type: 'mapping',
    id: mappingID,
    body: exports.generateMappingObject(mappingID, userUUID)
  }, function (error) {
    if (error) {
      return callback(error, null);
    }
    
    callback();
  });
};

exports.getMapping = function setMapping(identifier, callback) {
  const mappingID = exports.generateMappingID(identifier);

  if (mappingCache.peek(mappingID)) {
    // return cached ID
    // TODO workout some memory management
    return callback(null, mappingCache.get(mappingID));
  }
  else if (ident.isUUID(identifier)) {
    // return ID immediately sparing a request
    return callback(null, exports.generateMappingObject(mappingID, identifier));
  }

  elastic.get({
    index: 'identity',
    type: 'mapping',
    _source: true,
    id: mappingID
  }, function (error, result) {
    if (error) {
      return callback(error, null);
    }

    var mapping = (result.found ? result._source : null);

    if (mapping) {
      // set mapping cache
      mappingCache.set(mappingID, mapping);
      return callback(error, mapping);
    }

    callback(error, false);
  });
};

exports.removeMapping = function removeMapping(identifier, callback) {
  elastic.delete({
    index: 'identity',
    type: 'mapping',
    id: exports.generateMappingID(identifier),
  }, function (error) {
    if (error) {
      return callback(error, null);
    }

    callback();
  });
};

exports.generateMappingObject  = function generateMappingObject(mappingID, userUUID) {
  return {
    id: mappingID,
    userUUID: userUUID
  };
};

exports.generateMappingID  = function generateMappingID(identifier) {
  return ident.type(identifier) + ident.SEP + identifier;
};
