var mongoose = require('mongoose');

var OpinionSchema = new mongoose.Schema({
  txt: {
    type: String,
    required: true
  },
  userId: String
});

module.exports = mongoose.model('Opinion', OpinionSchema);
