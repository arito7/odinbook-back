const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, length: { min: 5, max: 20 }, required: true },
    hash: { type: String },
    iconUrl: { type: String },
    providerId: { type: String },
    friends: {
      type: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
      default: [],
    },
  },
  { timestamps: true }
);

UserSchema.virtual('toPublic').get(function () {
  const obj = this.toObject();
  delete obj.hash;
  return obj;
});

UserSchema.virtual('withoutHash').get(function () {
  const obj = this.toObject();
  delete obj.hash;
  return obj;
});
module.exports = mongoose.model('User', UserSchema);
