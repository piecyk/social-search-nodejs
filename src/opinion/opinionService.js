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
