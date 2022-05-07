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
    console.log('payload user id is', payload.sub);
    User.findById(payload.sub)
      .populate('friendRequests')
      .exec((err, user) => {
        if (err) {
          return done(err, false);
        }
        if (user) {
          // dont make hash available beyond this point
          const { hash, providerId, ...rest } = user._doc;
          rest.friendRequests = rest.friendRequests.map((r) => r.toPublic);
          return done(null, rest);
        } else {
          return done(null, false);
        }
      });
  }
);

passport.use(jwtStrat);

passport.jwtAuth = passport.authenticate('jwt', { session: false });

module.exports = passport;
