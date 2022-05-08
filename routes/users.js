const { Router } = require('express');
const async = require('async');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const users = Router();
const {
  createDBErrorRes,
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

users.get('/requests', (req, res) => {
  async.parallel(
    {
      requests: (cb) => {
        FriendRequest.find({ to: req.user._id })
          .populate('from', ['username', 'iconUrl'])
          .exec((err, requests) => {
            if (err) cb(err);
            if (!requests) cb(null, []);
            cb(null, requests);
          });
      },
      pendingRequests: (cb) => {
        FriendRequest.find({ from: req.user._id })
          .populate('to', ['username', 'iconUrl'])
          .exec((err, requests) => {
            if (err) cb(err);
            if (!requests) cb(null, []);
            cb(null, requests);
          });
      },
    },
    (err, results) => {
      if (err) return res.json(createDBErrorRes(err));
      return res.json(
        createSuccessRes('Successfully retreived user requests', {
          requests: results.requests,
          pendingRequests: results.pendingRequests,
        })
      );
    }
  );
});

// do some validation
users.post('/requests', (req, res) => {
  if (req.body.to) {
    FriendRequest.findOne({
      $or: [
        { from: req.user._id, to: req.body.to },
        { from: req.body.to, to: req.user._id },
      ],
    }).exec((err, fr) => {
      if (err) return res.json(createDBErrorRes(err));
      if (fr) {
        return res.json(createFailRes('There is a preexisting request'));
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
          return res.json(
            createSuccessRes('Successfully made request', {
              friendRequest: savedFr,
            })
          );
        });
      }
    });
  } else {
    return res.json(
      createFailRes(
        'Make sure the request body follows the body format {to: <UserId>}.'
      )
    );
  }
});

users.post('/requests/accept', (req, res) => {
  if (req.body.from) {
    FriendRequest.findOne({ to: req.user._id, from: req.body.from })
      .populate('from')
      .populate('to')
      .exec((err, fr) => {
        if (err) return res.json(createDBErrorRes(err));
        if (!fr) {
          return res.json(createFailRes('This is not a valid request'));
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
