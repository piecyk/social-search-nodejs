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





var API_FOODILY_URI = 'https://api.foodily.com/v1';
var API_EVRYTHNG_URI = 'http://api.evrythng.com';

var request = require('superagent');

function Ouaht2Token() {
  var self = this;
  self.token = null;

  this.getToken = function(next, refresh) {
    if (self.token && !refresh) {
      console.log('we have it');
      next(self.token.access_token);
    } else {
      request.post(API_FOODILY_URI + "/token")
        .set("Authorization", "Basic YWItNDpSYmI4NTdSb3F4Yk90R014")
        .send("grant_type=client_credentials")
        .end(function(responce) {

          self.token = responce.body;
          console.log('token = ', self.token);

          next(self.token.access_token);
        });
    }
  };
}
var ouaht2Token = new Ouaht2Token();


function getBeers(req, res) {

  ouaht2Token.getToken(function(access_token) {
    request.get(API_FOODILY_URI + "/beerLookup")
      .send({
        'zone': req.body.zone || 'EUR',
        'limit': req.body.limit || 50,
        'offset': req.body.offset || 0,
        'name': req.body.name,
        'flavorProfile': req.body.flavorProfile,
        'id': req.body.id
      })
      .set("Authorization", "Bearer " + access_token)
      .end(function(responce) {
        if (responce.error) {
          console.log('oh no ' + responce.error.message);
          // TODO: i know :( just some nice pupy died...
          ouaht2Token.getToken(null, true);
          res.send(responce.error);
        } else {
          res.json(responce.body);
        }
      });
  });

};


function getBeerPairings(req, res) {

  ouaht2Token.getToken(function(access_token) {
    request.get(API_FOODILY_URI + "/beerPairings")
      .send({
        'zone': req.body.zone || 'EUR',
        'limit': req.body.limit || 50,
        'offset': req.body.offset || 0,
        'pairingType': req.body.pairingType || 'all',
        'flavorProfile': req.body.flavorProfile,
        'q': req.body.q
      })
      .set("Authorization", "Bearer " + access_token)
      .end(function(responce) {
        if (responce.error) {
          console.log('oh no ' + responce.error.message);
          ouaht2Token.getToken(null, true);
          res.send(responce.error);
        } else {
          res.json(responce.body);
        }
      });
  });

};


function getRecipesById(req, res) {

  ouaht2Token.getToken(function(access_token) {
    request.get(API_FOODILY_URI + "/recipes/" + req.params.id)
      .set("Authorization", "Bearer " + access_token)
      .end(function(responce) {
        if (responce.error) {
          console.log('oh no ' + responce.error.message);
          ouaht2Token.getToken(null, true);
          res.send(responce.error);
        } else {
          res.json(responce.body);
        }
      });
  });

};

function getBeerFromImage(req, res) {

  //req.body.image
  request.get(API_EVRYTHNG_URI + "/")
    .set("Authorization", "Token jj9t0dmTuPqkwgmVLO6HhbuIL3JIMtbs11GEkeu4zpG83wZJaBj384FOHYWHx1OcqgT0TYBioiXy0i3f")
    .end(function(responce) {
      if (responce.error) {
        console.log('oh no ' + responce.error.message);
        res.send(responce.error);
      } else {

        // TODO: add check for
        // add name from responce and call getBeers
        req.body.name = 'tyskie';
        getBeers(req, res);
      }
    });
}

// endpoint /api/v1/beers for GET
router.route('/api/v1/beers').get(getBeers);

// endpoint /api/v1/beerPairings for GET
router.route('/api/v1/beerPairings').get(getBeerPairings);

// endpoint /api/v1/recipes/:id for GET
router.route('/api/v1/recipes/:id').get(getRecipesById);

// endpoint /api/v1/recipes/:id for GET
router.route('/api/v1/beerFromImage').get(getBeerFromImage);






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
