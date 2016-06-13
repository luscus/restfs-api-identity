'use strict';

module.exports = {
  identity: {
    index: {
      '6d64d5ec-5f51-4323-93d4-39605c0b17fc': 0,
      'IDENTIFIER:EMAIL_ADDRESS:regitered.user@test.io': 1,
      'CONFEDERATION:IDENTITY:ROLES:test.io:6d64d5ec-5f51-4323-93d4-39605c0b17fc': 2,
      'CONFEDERATION:IDENTITY:ROLES:dungeon:6d64d5ec-5f51-4323-93d4-39605c0b17fc': 3
    },
    data: [
      {
        id: '6d64d5ec-5f51-4323-93d4-39605c0b17fc',
        type: 'CONFEDERATION:IDENTITY:USER',
        primaryEmail: 'regitered.user@test.io'
      },
      {
        id: 'IDENTIFIER:EMAIL_ADDRESS:regitered.user@test.io',
        userUUID: '6d64d5ec-5f51-4323-93d4-39605c0b17fc'
      },
      {
        id: 'CONFEDERATION:IDENTITY:ROLES:test.io:6d64d5ec-5f51-4323-93d4-39605c0b17fc',
        TESTER: {
          id: 'CONFEDERATION:IDENTITY:ROLE:test.io:TESTER',
          granter: 'KEEPER',
          timestamp: 100
        }
      },
      {
        id: 'CONFEDERATION:IDENTITY:ROLES:dungeon:6d64d5ec-5f51-4323-93d4-39605c0b17fc',
        MINION: {
          id: 'CONFEDERATION:IDENTITY:ROLE:test.io:MINION',
          granter: 'KEEPER',
          timestamp: 100
        }
      }
    ]
  }
};
