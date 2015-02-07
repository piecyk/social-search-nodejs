var Opinion = require('./opinion');


// Create endpoint /api/opinions for POST
exports.postOpinions = function(req, res) {
  var opinion = new Opinion();

  opinion.txt = req.body.txt;
  opinion.userId = req.user._id;

  // Save the opinion and check for errors
  opinion.save(function(err) {
    if (err) {
      return res.send(err);
    }

    return res.json({ message: 'Opinion added!', data: opinion });
  });
};

// Create endpoint /api/user/opinions for GET
exports.getOpinions = function(req, res) {
  Opinion.find({}, function(err, opinions) {
    if (err) {
      return res.send(err);
    }
    return res.json(opinions);
  });
};

// Create endpoint /api/opinions/user for GET
exports.getOpinionsByUser = function(req, res) {
  Opinion.find({ userId: req.user._id }, function(err, opinions) {
    if (err) {
      return res.send(err);
    }

    return res.json(opinions);
  });
};

// Create endpoint /api/opinions/:opinion_id for GET
exports.getOpinion = function(req, res) {
  // Use the Opinion model to find a specific opinion
  Opinion.find({ userId: req.user._id, _id: req.params.opinion_id }, function(err, opinion) {
    if (err) {
      res.send(err);
    }

    res.json(opinion);
  });
};

// Create endpoint /api/opinions/:opinion_id for DELETE
exports.deleteOpinion = function(req, res) {
  // Use the Opinion model to find a specific opinion and remove it
  Opinion.remove({ userId: req.user._id, _id: req.params.opinion_id }, function(err) {
    if (err) {
      res.send(err);
    }

    res.json({ message: 'Opinion removed!' });
  });
};






var API_FOODILY_URI = 'https://api.foodily.com/v1';
var request = require('superagent');

function Ouaht2Token() {
  var self = this;
  self.token = null;

  this.getToken = function(next) {
    console.log("next = ", self.access_token);

    if (this.token) {
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
// beers
var ouaht2Token = new Ouaht2Token();


exports.getBeer = function(req, res) {

  ouaht2Token.getToken(function(access_token) {
    console.log('access_token dupa = ', access_token);

    request.get(API_FOODILY_URI + "/beerLookup")
      .send({
        'zone': req.body.zone || 'EUR',
        'limit': req.body.zone || 50,
        'offset': req.body.offset || 0,
        'name': req.body.name,
        'flavorProfile': req.body.flavorProfile,
        'id': req.body.id
      })
      .set("Authorization", "Bearer " + access_token)
      .end(function(responce) {
        if (responce.error) {
          console.log('oh no ' + responce.error.message);
        } else {
          res.json(responce.body);
        }
      });
  });

};
