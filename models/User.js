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

UserSchema.methods.addFriend = async function (id) {
  if (!this.friends.find((i) => i == id)) {
    return new Promise((res, rej) => {
      UserModel.findById(this._id).exec((err, user) => {
        if (err) {
          res(err);
        }
        user.friends.push(id);
        user.save((err, savedUser) => {
          if (err) {
            res(err);
          }
          res(savedUser);
        });
      });
    });
  } else
    return Promise.resolve(
      new Error(`${id} is already a friend for ${this._id}`)
    );
};

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
