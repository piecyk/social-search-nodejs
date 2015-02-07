var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var logger = require('morgan');

var authService = require('./auth/authService');
var userService = require('./user/userService');
var opinionService = require('./opinion/opinionService');

// Connect to the mongoDB
var MONGO_URI = process.env.MONGOLAB_URI || 'mongodb://localhost/db';
mongoose.connect(MONGO_URI);

// Create our Express application
var app = express();

app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  secret: 'Super Secret Session Key',
  saveUninitialized: true,
  resave: true
}));

// set CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Use the passport package in our application
app.use(passport.initialize());


// TODO: MOVE THIS, FIX ME
// Create our Express router
var router = express.Router();


// TODO: BEERS
router.route('/api/v1/beers').get(opinionService.getBeer);



// Create endpoint handlers for /users
router.route('/api/v1/users')
  .post(userService.postUsers)
  .get(authService.isAuthenticated, userService.getUsers);


// Create endpoint handlers for /opinions
router.route('/api/v1/opinions/user').get(authService.isAuthenticated, opinionService.getOpinionsByUser);

// Create endpoint handlers for /opinions
router.route('/api/v1/opinions')
  .get(opinionService.getOpinions)
  .post(authService.isAuthenticated, opinionService.postOpinions);


// Create endpoint handlers for /opinions/:opinion_id
router.route('/api/v1/opinions/:opinion_id')
  .get(authService.isAuthenticated, opinionService.getOpinion)
  .delete(authService.isAuthenticated, opinionService.deleteOpinion);


// Register all our routes
app.use(router);


// log
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: err
  });
});


module.exports = app;
