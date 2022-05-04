const { Router, request } = require('express');
const User = require('../models/User.js');
const bcrypt = require('bcryptjs');
const user = Router();
const jwt = require('jsonwebtoken');
const { jwtAuth, googleAuth } = require('../config/passport');
require('dotenv').config();
/**
 * root is /users
 */

user.get('/', jwtAuth, (req, res, next) => {
  res.send(req.user);
});

user.get('/me', (req, res) => {
  if (req.user) {
    res.json({ success: true, user: req.user });
  } else {
    res.redirect('/unauthorized');
  }
});

user.get('/:id', jwtAuth, (req, res, next) => {
  User.findById(req.params.id).exec((err, user) => {
    if (err) {
      res.status(500);
      res.json({ message: 'Database Error' });
    }
    if (!user) {
      res.status(500);
      res.json({ message: 'User Not Found' });
    } else {
      res.status(200);
      res.json({ user });
    }
  });
});

user.get('/logout', (req, res) => {
  console.log(req.cookies);
  console.log('receiving get request to logout');
  res.clearCookie('sid');
  res.json({ success: true });
});

user.post('/request', (req, res, next) => {
  User.findById(req.body.id).exec((err, user) => {
    if (err || !user) {
      res.status(500);
      res.json({ message: 'User Not Found' });
    }
    if (user) {
      // append current users id
      user.friendRequests.push(req.user._id);
      user.save((err) => {
        if (err) {
          return next(err);
        }
        res.status(200);
        res.send();
      });
    }
  });
});

user.post('/login', (req, res, next) => {
  User.findOne({ username: req.body.username }).exec((err, user) => {
    if (err) {
      return res.json({
        success: false,
        message: 'Database Error',
        error: err.message,
      });
    }
    if (!user) {
      return res.json({ success: false, message: 'Username does not exist.' });
    } else {
      bcrypt.compare(req.body.password, user.hash).then((match) => {
        if (match) {
          const payload = { sub: user._id, iat: Date.now() };
          const token = jwt.sign(payload, process.env.JWT_SECRET);
          res.json({ success: true, token, expiresIn: '14d', user });
        } else {
          res.json({ success: false, message: 'Incorrect login credentials' });
        }
      });
    }
  });
});

user.post('/register', (req, res, next) => {
  User.findOne({ username: req.body.username }).exec((err, user) => {
    if (err) {
      res.status(500);
      return res.json({
        success: false,
        message: 'Database Error',
        error: err.message,
      });
    }
    // username is not taken so safe to create
    if (!user) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(req.body.password, salt);

      const user = User({
        username: req.body.username,
        hash: hash,
        name: {
          first: req.body.firstname,
          last: req.body.lastname,
        },
      });

      user.save((err, saved) => {
        if (err) {
          res.status(500);
          return res.json({
            success: false,
            message: 'Database Error',
            error: err.message,
          });
        }
        return res.json({
          success: false,
          message: 'User Successfully created',
          user: saved,
        });
      });
    } else {
      return res.json({
        success: false,
        message: `Username '${req.body.username}' is in use`,
      });
    }
  });
});

user.get('/request/:id', (req, res, next) => {
  console.log(req.params.id);
  res.send();
});

user.get('/authtest', jwtAuth, (req, res, next) => {
  res.json({
    success: true,
    message: 'Authenticated JWT Token',
    user: req.user,
  });
});

module.exports = user;
