const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, length: { min: 5, max: 20 } },
    hash: { type: String },
    iconURI: { type: String },
    providerId: { type: String },
    friendRequests: {
      type: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    friends: {
      type: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
