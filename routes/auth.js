const { Router } = require('express');
const passport = require('../config/passport.js');
const User = require('../models/User');
const auth = Router();
const bcrypt = require('bcryptjs');
const {
  registerValidation,
  validateResults,
} = require('../config/validationSchemas');

auth.get('/login/google', passport.authenticate('google'));

auth.get(
  '/oauth2/redirect/google',
  passport.authenticate('google', {
    failureRedirect: 'http://localhost:3000/login',
  }),
  (req, res) => {
    console.log(req.session);
    res.redirect('http://localhost:3000');
  }
);

auth.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.json({
        success: false,
        message: 'Error occurred while trying to delete session.',
      });
    } else {
      res.json({ success: true, message: 'Logged out.' });
    }
  });
});

auth.get('/unauthorized', (req, res) => {
  // res.status(401);
  res.json({ success: false, message: 'Unauthorized' });
});

auth.post('/login', (req, res) => {
  console.log('received login request');
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

auth.post(
  '/register',
  registerValidation,
  validateResults,
  (req, res, next) => {
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
            success: true,
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
  }
);

module.exports = auth;
