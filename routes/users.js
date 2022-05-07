const { Router } = require('express');
const User = require('../models/User');
const user = Router();
const jwt = require('jsonwebtoken');
const { createDBErrorRes } = require('../helpers/resObjects');
const { jwtAuth, googleAuth } = require('../config/passport');
require('dotenv').config();
/**
 * root is /users
 */

user.get('/me', (req, res) => {
  if (req.user) {
    res.json({ success: true, user: req.user });
  } else {
    res.redirect('/unauthorized');
  }
});

user.get('/people', (req, res) => {
  User.find({
    _id: { $ne: req.user._id.toString() },
    friendRequests: { $nin: [req.user._id.toString()] },
  })
    .limit(15)
    .sort({ createdAt: -1 })
    .exec((err, people) => {
      res.json({ success: true, people: people.map((p) => p.toPublic) });
    });
});

user.post('/request', (req, res) => {
  User.findById(req.body.to).exec((err, user) => {
    if (err) {
      res.json(createDBErrorRes(err));
    }
    if (user) {
      // append current users id
      if (
        user.friendRequests.find((r) => r == req.user._id.toString()) === -1
      ) {
        user.friendRequests.push(req.user._id.toString());
      }
      user.save((err, saved) => {
        console.log(saved);
        if (err) {
          return res.json(createDBErrorRes(err));
        }
        res.json({ success: true });
      });
    } else {
      res.json({ success: false, message: 'User not found.' });
    }
  });
});

user.get('/authtest', jwtAuth, (req, res, next) => {
  res.json({
    success: true,
    message: 'Authenticated JWT Token',
    user: req.user,
  });
});

module.exports = user;
