const passport = require('passport');
const User = require('../models/User.js');
require('dotenv').config();
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const jwtStrat = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
  },
  (payload, done) => {
    User.findOne({ id: payload.sub }, (err, user) => {
      if (err) {
        return done(err, false);
      }
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  }
);

passport.use(jwtStrat);

passport.serializeUser((user, done) => {
  console.log('serializing user', user);
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  console.log('deserializing user', user);
  User.findById(id).exec((err, user) => {
    if (err) {
      done(err, null);
    }
    done(null, user);
  });
});

passport.jwtAuth = passport.authenticate('jwt', { session: false });

module.exports = passport;
