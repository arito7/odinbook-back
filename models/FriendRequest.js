const mongoose = require('mongoose');

const FriendRequest = new mongoose.Schema(
  {
    from: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

FriendRequest.methods.deleteThis = function (cb) {
  FriendRequestModel.findByIdAndDelete(this._id).exec((err) => {
    if (err) {
      cb(err);
    } else {
      cb(null);
    }
  });
};

const FriendRequestModel = mongoose.model('FriendRequest', FriendRequest);

module.exports = FriendRequestModel;
