require('dotenv').config();
const { Router } = require('express');
const User = require('../models/User');
const auth = Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  registerValidation,
  validateResults,
} = require('../config/validationSchemas');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { createDBErrorRes } = require('../helpers/resObjects');

/**
 * Verifies google token authenticity
 */
async function verifyIdToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const userid = payload['sub'];
  return userid;
}

auth.post('/login/google', async (req, res) => {
  const userId = await verifyIdToken(req.body.tokenId);
  User.find({ providerId: userId }).exec((err, user) => {
    if (err) {
      return res.json(createDBErrorRes(err));
    }

    if (user) {
      const payload = { sub: user._id, iat: Date.now() };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      return res.json({
        success: true,
        message: 'Logged in via google',
        user,
        token,
      });
    } else {
      return res.json({
        success: false,
        message: 'No account associated with this google account.',
      });
    }
  });
});

auth.post('/register/google', async (req, res) => {
  const userId = await verifyIdToken(req.body.tokenId);
  User.findOne({ providerId: userId }).exec((err, user) => {
    if (err) {
      return res.json(createDBErrorRes(err));
    }
    if (user) {
      console.log('User with this provider id already exists');
      //user already exists log them in or return failure

      const payload = { sub: user._id, iat: Date.now() };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      return res.json({
        success: true,
        message: 'User with this google account already exists',
        token,
      });
    } else {
      console.log('User does not exist, creating new');
      // user with this google id doesn't exist yet so create one
      const user = new User({
        username: req.body.profileObj.name,
        providerId: userId,
        iconURI: req.body.profileObj.imageUrl,
      });
      user.save((err, user) => {
        if (err) {
          return res.json(createDBErrorRes(err));
        }

        const payload = { sub: user._id, iat: Date.now() };
        const token = jwt.sign(payload, process.env.JWT_SECRET);
        res.json({
          success: true,
          message: 'New user successfully created through google sign in',
          token,
          user,
        });
      });
    }
  });
});

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

auth.post('/login', (req, res) => {
  User.findOne({ username: req.body.username })
    .populate('friendRequests', ['username', 'iconUrl'])
    .populate('pendingRequests', ['username', 'iconUrl'])
    .populate('friends', ['username', 'iconUrl'])
    .exec((err, user) => {
      if (err) {
        return res.json(createDBErrorRes(err));
      }
      if (!user) {
        return res.json({
          success: false,
          message: 'Username does not exist.',
        });
      } else {
        bcrypt.compare(req.body.password, user.hash).then((match) => {
          if (match) {
            const payload = { sub: user._id, iat: Date.now() };
            const token = jwt.sign(payload, process.env.JWT_SECRET);
            res.json({
              success: true,
              token,
              expiresIn: '14d',
              user: user.withoutHash,
            });
          } else {
            res.json({
              success: false,
              message: 'Incorrect login credentials',
            });
          }
        });
      }
    });
});

auth.post('/register', registerValidation, validateResults, (req, res) => {
  User.findOne({ username: req.body.username }).exec((err, user) => {
    if (err) {
      return res.json(createDBErrorRes(err));
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
          return res.json(createDBErrorRes(err));
        }
        const payload = { sub: saved._id, iat: Date.now() };
        const token = jwt.sign(payload, process.env.JWT_SECRET);
        return res.json({
          success: true,
          message: 'User Successfully created',
          user: saved,
          token,
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

auth.get('/unauthorized', (req, res) => {
  // res.status(401);
  res.json({ success: false, message: 'Unauthorized' });
});

module.exports = auth;
