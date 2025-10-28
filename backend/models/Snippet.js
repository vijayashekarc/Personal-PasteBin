const mongoose = require('mongoose');

const snippetSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// The 'Snippet' model will create a 'snippets' collection in MongoDB
module.exports = mongoose.model('Snippet', snippetSchema);