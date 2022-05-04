const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema(
  {
    creator: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Types.ObjectId, ref: 'Post', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Like', LikeSchema);
