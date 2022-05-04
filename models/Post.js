const mongoose = require('mongoose');
const moment = require('moment');

const PostSchema = new mongoose.Schema(
  {
    body: { type: String, maxlength: 250 },
    creator: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    comments: [{ type: mongoose.Types.ObjectId, ref: 'Comment' }],
    likes: [{ type: mongoose.Types.ObjectId, ref: 'Like' }],
  },
  { timestamps: true }
);

PostSchema.virtual('creation_date_formatted').get(function () {
  return moment(this.createdAt).format('MMM Do, YYYY HH:mm');
});

module.exports = mongoose.model('Post', PostSchema);
