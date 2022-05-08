const Post = require('../models/Post');
const { Router } = require('express');

const {
  postValidation,
  validateResults,
} = require('../config/validationSchemas');
const { createDBErrorRes } = require('../helpers/resObjects');

const posts = Router();

/**
 * Root is /posts
 */

posts.post('/', postValidation, validateResults, (req, res, next) => {
  if (req.user) {
    const post = new Post({
      creator: req.user._id,
      body: req.body.body,
    });

    post.save((err, savedPost) => {
      if (err) {
        return res.json(createDBErrorRes(err));
      }
      res.status(200);
      res.json({
        success: true,
        message: 'Post created successfully.',
        post: savedPost,
      });
    });
  } else {
    res.redirect('/unauthorized');
  }
});

/**
 * currently only gets requesting users posts.
 * ultimately needs to be able to get all posts of friends of the
 * requesting user as well
 */
posts.get('/', (req, res) => {
  console.log(req.user);
  if (req.user) {
    Post.find({ creator: req.user._id })
      .populate('creator', 'username')
      .sort({ createdAt: -1 })
      .limit(50)
      .exec((err, posts) => {
        if (err) {
          return res.json(createDBErrorRes(err));
        }
        return res.json({ success: true, posts });
      });
  } else {
    res.redirect('/unauthorized');
  }
});

module.exports = posts;
