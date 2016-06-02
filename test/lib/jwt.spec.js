'use strict';

require('chai').should();

const expect     = require('chai').expect;
const jwt        = require('../../lib/jwt');
const reqContext = require('../testContext');

const secret     = 'my-big-secret';
const expires    = 1464610645;
const testStr    = 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.';

describe('[' + __filename.substring(__filename.indexOf('/test/') + 1) + '] - jwt ', function() {

    describe('method "escape"', function() {

        it('should return a Base64url string', function() {
            const escaped = jwt.escape(JSON.stringify(testStr));
            expect(escaped).to.equal('IkxvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LCBjb25zZXRldHVyIHNhZGlwc2NpbmcgZWxpdHIsIHNlZCBkaWFtIG5vbnVteSBlaXJtb2QgdGVtcG9yIGludmlkdW50IHV0IGxhYm9yZSBldCBkb2xvcmUgbWFnbmEgYWxpcXV5YW0gZXJhdCwgc2VkIGRpYW0gdm9sdXB0dWEuIEF0IHZlcm8gZW9zIGV0IGFjY3VzYW0gZXQganVzdG8gZHVvIGRvbG9yZXMgZXQgZWEgcmVidW0uIFN0ZXQgY2xpdGEga2FzZCBndWJlcmdyZW4sIG5vIHNlYSB0YWtpbWF0YSBzYW5jdHVzIGVzdCBMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldC4gTG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQsIGNvbnNldGV0dXIgc2FkaXBzY2luZyBlbGl0ciwgc2VkIGRpYW0gbm9udW15IGVpcm1vZCB0ZW1wb3IgaW52aWR1bnQgdXQgbGFib3JlIGV0IGRvbG9yZSBtYWduYSBhbGlxdXlhbSBlcmF0LCBzZWQgZGlhbSB2b2x1cHR1YS4gQXQgdmVybyBlb3MgZXQgYWNjdXNhbSBldCBqdXN0byBkdW8gZG9sb3JlcyBldCBlYSByZWJ1bS4gU3RldCBjbGl0YSBrYXNkIGd1YmVyZ3Jlbiwgbm8gc2VhIHRha2ltYXRhIHNhbmN0dXMgZXN0IExvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LiI');
        });

    });

    describe('method "unescape"', function() {

        it('should transform a Base64url to an utf8 string', function() {
            const escaped   = jwt.escape(JSON.stringify(testStr));
            const unescaped = jwt.unescape(escaped);
            expect(JSON.parse(unescaped)).to.deep.equal(testStr);
        });

    });

    describe('method "sign"', function() {

        it('should encrypt a given string with a private key', function() {
            const signedString = jwt.sign(secret, reqContext.meta.certificate.private);
            expect(signedString).to.equal('uVKkHxazxq2oWBjBDnv4jFduFJmE2uiY/sz/Kun2/cGBtZq3A5jfFZkPBt6Js2hXhGgM0RRsNCX+TPbz11uMnk3bN+C+r+wiykyg1OxbxxD0v2f+03Mb6r4tJtyCaaExywsLWqG8xAjWeJw/tMslRC7kQfE2cK3GAXJTFiObZjE=');
        });
    });

    describe('method "verify"', function() {

        it('should decrypt a given string with a public key', function() {
            const signedString = jwt.sign(secret, reqContext.meta.certificate.private);
            const restored     = jwt.verify(signedString, reqContext.meta.certificate.public);
            expect(restored).to.equal(secret);
        });

    });

    describe('method "tokenize"', function() {

        it('should generate a JWT token from the request context', function() {
            const token = jwt.tokenize(reqContext, secret, expires);

            expect(token).to.equal('eyJjdHkiOiJKV1QiLCJhbGciOiJSU0EiLCJlbmMiOiJBRVMyNTYiLCJjZWsiOiJ1VktrSHhhenhxMm9XQmpCRG52NGpGZHVGSm1FMnVpWS9zei9LdW4yL2NHQnRacTNBNWpmRlprUEJ0NkpzMmhYaEdnTTBSUnNOQ1grVFBiejExdU1uazNiTitDK3Ird2l5a3lnMU94Ynh4RDB2MmYrMDNNYjZyNHRKdHlDYWFFeHl3c0xXcUc4eEFqV2VKdy90TXNsUkM3a1FmRTJjSzNHQVhKVEZpT2JaakU9Iiwiamt1IjoidGVzdC5pbyJ9.eyJpc3MiOiJ0ZXN0LmlvIiwic3ViIjoidGVzdC51c2VyIiwidXNlciI6eyJpZCI6InRlc3QudXNlciJ9LCJpYXQiOjE0NjQ2MTA2NDUsIm5iZiI6MTQ2NDYxMDY0NSwiZXhwIjoxNDY0NjE0MjQ1fQ.MmQ5MzM5NGQ5YmI3YzY3MmY2NmU5MjJiNTQyOWQzYjM5NTUzMGUyNDgzZWQ2MDNlNDUxNDI2YTFkZTIxMTJlYjU3ZTQzM2VjYTYwNjI4OTM5MjAyNWQ0M2I2MmNmMjhlMWNmYjdjMWM2ODk2NjNiMzkxYjc0ZDcxNmY2ZDA1NjQwNjY0YTY2MWM5ODlmOWVhMjJkNWQxZjY5YzhkNTA1NzE4YTQ0NWY2MTczOGYxZTU2MDU3ZDg3ZGEzY2Q3NGY5MjhjNWZmOWEzNjZhMTM2NTcwZTEwM2Y2ODQ5MzViYzA2MTAyMDhhYjhlY2Q3OGE2NjM4OTU2OTdmNzE2Yjk5ZmE1YmQ5MDYzNjU3MWRlNDVlNGU4MWZhZmNlZDBlNzQzOGNlMDFjMzdlMGQwZmU3Mjg5ZjZmZGRiMmJhNTc1OWViMzAwNjMxYjViNjk2YjI4Y2M5NjEyZjZmZGI5NDgyYzk0NDdlOGMxNmZjMzgyODBiYzEzODRiNTQ1NzVlODU3OGFlMGJmNDMzNDQ1MWNhOTYwOGZiZGVmNjgxMWFhNzMxMjMxZTc4MjNkMjBlNzY2YzExYzZhZTZmMDUyOTlkZWQwZTc1MjRkZWRhZjM5MjZiODRlY2U4N2QzYzc0YzMwYmMxZWQ5ODQ5YWNmYTIzMjgwMDNiNzc5NTNkMjFhNTA4YzIwYjI1OWVhYzA1YzhmOWY5MmY1NDA5YzU4ZGI3NWUyYmU2OWE3ZmU2OWRiOTM4MDFiOGQ2NTU5OTM5Njg3OTJkNDdmNDUyNmQ5NmUwZmE0N2M3M2Q4MDQyNDY1Mjk0OTg1YjE3MTc2ZDc2MTA1OTU0NDI1NjhmODE2ZWJjYWE0NWRjMDlhMzFlY2VjN2JlZjk1ZGIwNjczOTVlMzBiYzY1YjZkZDBkMDE1MjdmMzk3NWY5ZWIwMWFiN2IwZDgxNmIzMmEzYzc0YzMyODhhYzY4OTIxODE5ODgzNDNkNGVlNmY1YzkyNTgxNTY2ZGUyMjVhZTdiYzE1MGRmMWY4MzY1MTMwNmU5ZjQwZmI1NzA1Y2YwOWJiNTg1N2I2YzdiMDU1YjgxNzIwYmY4YjQzNzRlOTZlZWRiNzdjZjhhNTE3YmU3NTlkOWY5NWE3YTI5MjY2YTQ5YWNlOGI5YTljMzc2ZDY3YjFkODdkYTY0OGVjODExMDFmYjk2MjEyMWUxYmE0MmIyMDQxM2M1YmU1N2UxYjMyZjA5YWM0N2ZhMTg4OTdiOTU4YzUwYTBmYWM2OGY5ZDcwNDQ4ZDMwMTIz');
        });

    });

    describe('method "parse"', function() {

        it('should read the JWT token', function() {
            reqContext.meta.headers.raw.authentication = jwt.tokenize(reqContext, secret, 1, expires);
            const parsed                               = jwt.parse(reqContext);

            expect(parsed).to.deep.equal(
                {
                    header: {
                        cty: 'JWT',
                        alg: 'RSA',
                        enc: 'AES256',
                        cek: 'uVKkHxazxq2oWBjBDnv4jFduFJmE2uiY/sz/Kun2/cGBtZq3A5jfFZkPBt6Js2hXhGgM0RRsNCX+TPbz11uMnk3bN+C+r+wiykyg1OxbxxD0v2f+03Mb6r4tJtyCaaExywsLWqG8xAjWeJw/tMslRC7kQfE2cK3GAXJTFiObZjE=',
                        jku: 'test.io'
                    },
                    claim: {
                        iss: 'test.io',
                        sub: 'test.user',
                        user: { id: 'test.user' },
                        iat: 1464610645,
                        nbf: 1464610646,
                        exp: 1464614246
                    }
                }
            );
        });

    });

});
