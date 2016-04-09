var email      = require("emailjs");

var server = email.server.connect({
  user:     "AKIAJYYPCPF6WULDWK4A",
  password: "Ari8YYH4OuurVvpIQwHU6c0g0E5dSwuU94SqMhrRIvGi",
  host:     "email-smtp.eu-west-1.amazonaws.com",
  port:     587,
  tls:      true
});

exports.sendEmailChallenge = function sendEmailChallenge (domain, identifier, secret, callback) {
  server.send(
      {
        from:    domain + ' <service@cf-id.me>',
        to:      identifier,
        subject: secret + ' - Challenge Password',
        text:   'Please enter following password in the Login Form: ' + secret + '\n' +
                'This password will only be valid 2 minutes\n\n------------\n' +
                'Sended by Confederation-ID on behalf of ' + domain
      },

      callback
  );
};