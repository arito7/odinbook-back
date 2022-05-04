const { Router } = require('express');
const passport = require('../config/passport.js');

const auth = Router();

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

auth.post('/login', passport.authenticate('jwt'));

auth.post('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

auth.get('/unauthorized', (req, res) => {
  res.status(401);
  res.json({ success: false, message: 'Unauthorized' });
});

module.exports = auth;
