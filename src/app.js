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


var Q = require('q');
var _ = require('lodash');
var request = require('superagent');

var API_FOODILY_URI = 'https://api.foodily.com/v1';
var API_EVRYTHNG_URI = 'https://api.evrythng.com';


function Ouaht2Token() {
  var self = this;
  self.token = null;

  self.getToken = function(next) {
    if (self.token) {
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



function getBeerPromise(params) {
  var defer = Q.defer();
  console.log('params = ', params);

  ouaht2Token.getToken(function(access_token) {
    request.get(API_FOODILY_URI + "/beerLookup")
      .send({
        'zone': params.zone || 'EUR',
        'limit': params.limit || 50,
        'offset': params.offset || 0,
        'name': params.name,
        'flavorProfile': params.flavorProfile,
        'id': params.id
      })
      .set("Authorization", "Bearer " + access_token)
      .end(function(responce) {
        if (responce.error) {
          // TODO: i know :( just some nice pupy died...
          ouaht2Token.token = null;

          defer.reject(responce.error);
        } else {
          defer.resolve(responce.body);
        }
      });
  });

  return defer.promise;
}

var _flavorProfiles = [
  'green_hoppy',
  'roasted_toasted',
  'citrus_zesty',
  'sour',
  'spicy',
  'fruity',
  'toffee_caramel'
];

function getBeersByFlavorProfile(req, res) {

  var allPromise = _.map(req.body.flavorProfiles, function(flavorProfile) {
    return getBeerPromise({'flavorProfile': flavorProfile});
  });

  Q.all(allPromise).then(
    function(response) {

      res.json(_.reduce(response, function(result, el) {
        result.count += el.count;
        result.beers = result.beers.concat(_.map(el.beers, function(beer) {
          return {
            'id': beer.id,
            'name': beer.name,
            'imageUrl': beer.imageUrl,
            'flavorProfile': beer.flavorProfile,
            'glutenFree': beer.glutenFree
          };
        }));

        return result;
      }, {beers: [], count: 0}));

    },
    function(error) {
      res.send(error);
    });
}


function getPairingsPromise(params) {
  var defer = Q.defer();
  console.log('params = ', params);

  ouaht2Token.getToken(function(access_token) {
    request.get(API_FOODILY_URI + "/beerPairings")
      .send({
        'zone': params.zone || 'EUR',
        'limit': params.limit || 50,
        'offset': params.offset || 0,
        'pairingType': params.pairingType || 'all',
        'flavorProfile': params.flavorProfile,
        'q': params.q,
        'expand': 'recipePairings(recipes)',
        'fields': '*(*),recipePairings(recipe(name,id,href,images(list(smallUrl))),pairings(*))'
      })
      .set("Authorization", "Bearer " + access_token)
      .end(function(responce) {
        if (responce.error) {
          // TODO: i know :( just some nice pupy died...
          ouaht2Token.token = null;

          defer.reject(responce.error);
        } else {
          defer.resolve(responce.body);
        }
      });
  });

  return defer.promise;
}

function seniorPlakalJakKlepal(array) {
  var resultArrayForIntersection = [];
  var resultArray = [];
  array.forEach(function(result) {
    var pairingsArray = [];
    _.each(result.recipePairings, function(pairing) {
      pairingsArray.push(pairing.recipe.id);
      resultArray.push({
        'id': pairing.recipe.id,
        'name': pairing.recipe.name,
        'imageUrl': pairing.recipe.images.list[0].smallUrl,
        'flavorProfile': result.flavorProfiles.length > 0 ? result.flavorProfiles[0].name : ''
      });
    });
    resultArrayForIntersection.push(pairingsArray);
  });

  var _tmpArray = _.uniq(_.intersection(_.flatten(resultArrayForIntersection)));
  console.log(_tmpArray.length);

  return _.map(_tmpArray, function(id) {
    return _.findWhere(resultArray, { 'id': id });
  });
}


function seniorPlakalJakKlepalUnion(array) {
  var resultArrayFor = [];
  var resultArray = [];
  array.forEach(function(result) {
    var pairingsArray = [];
    _.each(result, function(recipe) {
      pairingsArray.push(recipe.id);
      resultArray.push(recipe);
    });
    resultArrayFor.push(pairingsArray);
  });

  var _tmpArray = _.union(_.flatten(resultArrayFor));
  console.log(_tmpArray.length);

  return _.map(_tmpArray, function(id) {
    return _.findWhere(resultArray, { 'id': id });
  });
}

function resolvePairingsArray(promises) {
  var defer = Q.defer();

  console.log('promises =', promises);

  Q.all(promises).then(
    function(response) {

      var ret = seniorPlakalJakKlepal(response);
      defer.resolve(ret);

    },
    function(error) {
      defer.reject(error);
    });
  return defer.promise;
}



// var _pairings = {
//   'pairingType': 'all',
//   'mains': ['chicken', 'beef'],
//   'additionals': ['potato'],
//   'flavorProfiles': ['spicy']
// };


function getPairingsByFlavorProfile(req, res) {

  var _pairings = req.body.pairings;
  var allPromise = [];

  _.each(_pairings.flavorProfiles, function(flavorProfile) {

    var m = _.map(_pairings.mains, function(main) {
      return {
        'flavorProfile': flavorProfile,
        'q': main,
        'pairingType': _pairings.pairingType
      };
    });

    //console.log('m = ', m);
    var a = _.map(_pairings.additionals, function(additional) {
      return {
        'flavorProfile': flavorProfile,
        'q': additional,
        'pairingType': _pairings.pairingType
      };
    });

    // ( (s c) & (s r) )  u   ((s b)  & (s r))
    _.each(m, function(el) {
      var promises = [el].concat(a);
      console.log('promises = ', promises);

      allPromise.push(resolvePairingsArray(_.map(promises, function(promise) {
        return getPairingsPromise(promise);
      })));

    });

    //console.log('a = ', a);
  });

  //res.json({});

  Q.all(allPromise).then(
    function(response) {
      res.json(seniorPlakalJakKlepalUnion(response).slice(0, 50));
    },
    function(error) {
      res.send(error);
    });
}

// endpoint /api/v1/beers for GET
router.route('/api/v1/beersFlavorProfiles').post(getBeersByFlavorProfile);
// todo get na postt
router.route('/api/v1/pairingsFlavorProfiles').post(getPairingsByFlavorProfile);



function getBeers(req, res) {
  //console.log("req.body = ", req.body);
  
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
          // TODO: i know :( just some nice pupy died...
          ouaht2Token.token = null;

          res.send(responce.error);
        } else {
          //console.log("responce.body = ", responce.body);
  
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
        'flavorProfile': req.body.flavorProfile || 'spicy',
        'q': req.body.q || 'beef',
        'expand': 'recipePairings(recipes)',
        'fields': '*(*),recipePairings(recipe(name,id,href,images(list(smallUrl))),pairings(*))'
      })
      .set("Authorization", "Bearer " + access_token)
      .end(function(responce) {
        if (responce.error) {
          // TODO: i know :( just some nice pupy died...
          ouaht2Token.token = null;

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
          // TODO: i know :( just some nice pupy died...
          ouaht2Token.token = null;

          res.send(responce.error);
        } else {
          res.json(responce.body);
        }
      });
  });

};


function getBeerFromImage(req, res) {

  //req.body.image
  request.post('https://api.evrythng.com/scan/recognitions?objpic=true')
    .set("Authorization", "ohg2l87RnqsijqKIfTR5nSfSFqAFisDZkkZFgHxwdP1vwZAS9JHiU8BE06EJ69os5zRauMiUofcXATIM")
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    .send({'image': 'data:image/jpeg;base64,' + req.body.image})
    .end(function(response) {
      if (response.error) {
        console.log('oh no ' + response.error.message);
        res.send(response.error);
      } else {
        // TODO: add check for
        // add name from response and call getBeers
        console.log('response =', response.body);

        request.get(response.body.evrythngUrl)
          .set("Authorization", "ohg2l87RnqsijqKIfTR5nSfSFqAFisDZkkZFgHxwdP1vwZAS9JHiU8BE06EJ69os5zRauMiUofcXATIM")
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .end(function(response) {
            if (response.error) {
              console.log('oh no ' + response.error.message);
              res.send(response.error);
            } else {
              console.log('response =', response.body);
              
              req.body.name = response.body.description;
              getBeers(req, res);
            }
          });

      }
    });
}

// endpoint /api/v1/beers for GET
router.route('/api/v1/beers').get(getBeers);

router.route('/api/v1/beers').post(getBeers);

// endpoint /api/v1/beerPairings for GET
router.route('/api/v1/beerPairings').get(getBeerPairings);

// endpoint /api/v1/recipes/:id for GET
router.route('/api/v1/recipes/:id').get(getRecipesById);

// endpoint /api/v1/recipes/:id for GET
router.route('/api/v1/beerFromImage').post(getBeerFromImage);






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
