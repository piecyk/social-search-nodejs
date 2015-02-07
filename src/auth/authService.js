var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;

//var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
//var BearerStrategy = require('passport-http-bearer').Strategy;

var User = require('../user/user');

passport.use(new BasicStrategy(function(username, password, callback) {
  User.findOne({ username: username }, function (err, user) {
    console.log('basic');

    if (err) { return callback(err); }

    // No user found with that username
    if (!user) { return callback(null, false); }

    // Make sure the password is correct
    user.verifyPassword(password, function(err, isMatch) {
      if (err) { return callback(err); }

      // Password did not match
      if (!isMatch) { return callback(null, false); }

      // Success
      return callback(null, user);
    });
  });
}));

// passport.use(new BearerStrategy({}, function(token, done) {
//   // asynchronous validation, for effect...
//   process.nextTick(function () {
//     var API_URI = 'https://api.foodily.com/v1';
//     var request = require('superagent');

//         request.post(API_URI + "/token")
//         .set("Authorization", "Basic YWItNDpSYmI4NTdSb3F4Yk90R014")
//         .send("grant_type=client_credentials")
//         .end(function(responce) {
//           var access_token = responce.body.access_token;
//           console.log('access_token = ', access_token);
//           return done(null, {'access_token': access_token});
//         });
//   });
// }));

// passport.use(new OAuth2Strategy({
//   authorizationURL: 'https://api.foodily.com/v1/token',
//   tokenURL: 'https://api.foodily.com/v1/token',
//   clientID: 'ab-4',
//   clientSecret: 'Rbb857RoqxbOtGMx',
//   callbackURL: "http://localhost:3000"
// }, function(accessToken, refreshToken, profile, done) {
//   console.log(accessToken);
//   done(accessToken);
// }));

exports.isAuthenticated = passport.authenticate(['basic'], {
  session : false
});

// exports.isBearerAuthenticated = passport.authenticate('bearer', {
//   session: false
// });

// exports.isOauth2 = passport.authenticate(['oauth2'], {
//   session : false
// });
