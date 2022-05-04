const User = require('../models/User.js');
const Post = require('../models/Post.js');
const { Router } = require('express');
const async = require('async');
const index = Router();

index.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    async.parallel(
      {
        user: (cb) => {
          User.findById(req.user._id).exec((err, user) => {
            cb(err, user);
          });
        },
        posts: (cb) => {
          Post.find({ creator: req.user._id })
            .limit(25)
            .sort({ createdAt: -1 })
            .exec((err, posts) => {
              cb(err, posts);
            });
        },
        users: (cb) => {
          User.find({ _id: { $ne: req.user._id } }).exec((err, results) => {
            cb(err, results);
          });
        },
      },
      (err, results) => {
        if (err) {
          res.send(err.message);
        }
        res.render('layout', {
          partial: 'index-authorized',
          data: {
            user: results.user,
            posts: results.posts,
            users: results.users,
          },
        });
      }
    );
  } else {
    res.render('layout', { partial: 'index-unauthorized', data: {} });
  }
});

module.exports = index;
