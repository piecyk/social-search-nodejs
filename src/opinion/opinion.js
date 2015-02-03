var mongoose = require('mongoose');


var OpinionSchema = new mongoose.Schema({
  txt: String,
  userId: String
});


module.exports = mongoose.model('Opinion', OpinionSchema);
