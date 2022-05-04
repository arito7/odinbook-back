const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    creator: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, maxlength: 250, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', CommentSchema);
