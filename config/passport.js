const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
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

const googleStrat = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CB_URL,
    scope: ['profile'],
    state: true,
  },
  (accessToken, refreshToken, profile, cb) => {
    console.log('access token:', accessToken);
    console.log('refresh token:', refreshToken);
    User.findOne({ providerId: profile.id }).exec((err, user) => {
      if (err) {
        return cb(err);
      }
      // if user account is already linked
      if (user) {
        User.findByIdAndUpdate(user._id, {
          name: {
            first: profile.name.givenName,
            last: profile.name.familyName,
          },
          imgUrl: profile.photos[0].value,
        });
        return cb(null, user);
      } else {
        // create new user account
        const user = new User({
          providerId: profile.id,
          username: profile.displayName,
          imgUrl: profile.photos[0].value,
        });

        user.save((err, savedUser) => {
          if (err) {
            cb(err);
          }

          return cb(null, savedUser);
        });
      }
    });
  }
);

passport.use(jwtStrat);
passport.use(googleStrat);

passport.serializeUser((user, done) => {
  console.log('serializing user', user);
  done(null, user);
});

passport.deserializeUser((user, done) => {
  console.log('deserializing user', user);
  done(null, user);
});

passport.googleAuth = passport.authenticate('google');
passport.jwtAuth = passport.authenticate('jwt', { session: true });

module.exports = passport;
