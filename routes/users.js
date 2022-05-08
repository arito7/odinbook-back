const { Router, json } = require('express');
const async = require('async');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const users = Router();
const {
  createDBErrorRes,
  createGenericRes,
  createFailRes,
  createSuccessRes,
} = require('../helpers/resObjects');
require('dotenv').config();
/**
 * root is /users
 */

users.get('/me', (req, res) => {
  res.json({ success: true, user: req.user });
});

users.get('/people', (req, res) => {
  User.find({
    $and: [{ _id: { $ne: req.user._id } }, { _id: { $nin: req.user.friends } }],
  })
    .limit(15)
    .sort({ createdAt: -1 })
    .exec((err, people) => {
      if (err) {
        return res.json(createDBErrorRes(err));
      }
      res.json({ success: true, people: people.map((p) => p.toPublic) });
    });
});

users.post('/request', (req, res) => {
  if (req.body.to) {
    FriendRequest.findOne({
      $or: [
        { from: req.user._id, to: req.body.to },
        { from: req.body.to, to: req.user._id },
      ],
    }).exec((err, fr) => {
      if (err) return res.json(createDBErrorRes(err));
      if (fr) {
        return res.json({
          success: false,
          message: 'There is a preexisting request',
        });
      } else {
        console.log('Creating new friend request');
        // request does not exist so safe to create one
        const newFr = new FriendRequest({
          to: req.body.to,
          from: req.user._id,
        });
        newFr.save((err, savedFr) => {
          if (err) return res.json(createDBErrorRes(err));
          console.log(savedFr);
          return res.json({
            success: true,
            message: 'Successfully made request',
            friendRequest: savedFr,
          });
        });
      }
    });
  } else {
    return res.json({
      success: false,
      message:
        'Make sure the request body follows the body format {to: <UserId>}.',
    });
  }
});

users.post('/accept', (req, res) => {
  if (req.body.from) {
    FriendRequest.findOne({ to: req.user._id, from: req.body.from })
      .populate('from')
      .populate('to')
      .exec((err, fr) => {
        if (err) return res.json(createDBErrorRes(err));
        if (!fr) {
          return res.json(
            createGenericRes(false, 'This is not a valid request')
          );
        } else {
          console.log('Found following request', fr);
          Promise.all([
            fr.from.addFriend(fr.to._id),
            fr.to.addFriend(fr.from._id),
          ])
            .then((results) => {
              if (!results.find((i) => i instanceof Error)) {
                fr.deleteThis((err) => {
                  if (err) {
                    return res.json(createDBErrorRes(err));
                  }
                  return res.json(
                    createSuccessRes('Successfully accepted friend request')
                  );
                });
              } else {
                return createFailRes(results, results);
              }
            })
            .catch((err) => console.log(err.message));
        }
      });
  } else {
    return res.json(
      createFailRes(
        false,
        `Make sure your request body follows the format {from: <ID of requesting user>}.`
      )
    );
  }
});

users.get('/authtest', (req, res) => {
  res.json({
    success: true,
    message: 'Authenticated JWT Token',
    user: req.user,
  });
});

module.exports = users;
