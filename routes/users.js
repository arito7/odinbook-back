const { Router } = require('express');
const async = require('async');
const User = require('../models/User');
const users = Router();
const { createDBErrorRes } = require('../helpers/resObjects');
require('dotenv').config();
/**
 * root is /users
 */

users.get('/me', (req, res) => {
  res.json({ success: true, user: req.user });
});

users.get('/people', (req, res) => {
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

users.post('/request', (req, res) => {
  // find user receiving the request
  console.log('processing requests');
  async.parallel(
    {
      receiver: (cb) => {
        User.findById(req.body.to).exec((err, user) => {
          if (err) {
            cb(err);
          }
          if (!user) {
            cb(new Error('User does not exist'));
          } else {
            cb(null, user);
          }
        });
      },
      requester: (cb) => {
        User.findById(req.user._id).exec((err, user) => {
          if (err) {
            cb(err);
          }
          if (!user) {
            cb(new Error('User does not exist'));
          } else {
            cb(null, user);
          }
        });
      },
    },
    (err, results) => {
      console.log('first of async parallel chain');
      if (err) {
        return res.json({
          success: false,
          message: 'Error after parallel process',
          error: err,
        });
      }
      async.parallel(
        {
          savedReceiver: (cb) => {
            if (
              !results.receiver.friendRequests.find(
                (r) => r == req.user._id.toString()
              ) &&
              !results.receiver.pendingRequests.find(
                (r) => r == req.user._id.toString()
              )
            ) {
              results.receiver.friendRequests.push(req.user._id.toString());
              results.receiver.save((err, user) => {
                if (err) cb(err);
                cb(null, user);
              });
            } else {
              cb(
                new Error('Friend request has already been sent to this user')
              );
            }
          },
          savedRequester: (cb) => {
            console.log();
            if (
              !results.requester.pendingRequests.find(
                (r) => r === results.reciever._id.toString()
              ) &&
              !results.requester.friendRequests.find(
                (r) => r == results.receiver._id.toString()
              )
            ) {
              results.requester.pendingRequests.push(
                results.receiver._id.toString()
              );
              results.requester.save((err, user) => {
                if (err) cb(err);
                cb(null, user);
              });
            } else {
              cb(
                new Error(
                  'User already has a pending request sent to this user'
                )
              );
            }
          },
        },
        (err, finalResults) => {
          console.log('second of async parallel chain');
          if (err) {
            return res.json(createDBErrorRes(err));
          }
          User.findById(req.user._id)
            .populate('friendRequests', ['username, iconUrl'])
            .populate('pendingRequests', ['username', 'iconUrl'])
            .exec((err, user) => {
              if (err) {
                return res.json(createDBErrorRes(err));
              }

              res.json({
                success: true,
                user: user.withoutHash,
              });
            });
        }
      );
    }
  );
});

users.get('/authtest', (req, res, next) => {
  res.json({
    success: true,
    message: 'Authenticated JWT Token',
    user: req.user,
  });
});

module.exports = users;
