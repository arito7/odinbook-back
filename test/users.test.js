const request = require('supertest');
const express = require('express');
const passport = require('../config/passport');
const authRoute = require('../routes/auth');
const usersRoute = require('../routes/users');
const { after, before } = require('mocha');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = express();
const logger = require('morgan');
const { token } = require('morgan');
const expect = require('chai').expect;

require('mocha');
// const mmserver = require('../config/mongoConfigTesting')();

let mongoServer;
app.use(logger('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', authRoute);
app.use(
  passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/unauthorized',
  })
);

app.use('/users', usersRoute);

let users = [
  { id: '', username: 'tester1', password: 'tester1', token: '' },
  { id: '', username: 'tester2', password: 'tester2', token: '' },
];
before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  // set up users to be used in tests
  await Promise.all([
    request(app)
      .post('/register')
      .send({
        username: users[0].username,
        password: users[0].password,
        rpassword: users[0].password,
      })
      .then((res) => {
        users[0].token = res.body.token;
        users[0].id = res.body.user._id;
      }),
    request(app)
      .post('/register')
      .send({
        username: users[1].username,
        password: users[1].password,
        rpassword: users[1].password,
      })
      .then((res) => {
        users[1].token = res.body.token;
        users[1].id = res.body.user._id;
        console.log(users[1].id);
      }),
  ]);
});

after(async () => {
  console.log('cleaning up');
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('/me', () => {
  it('get user data back w/ valid token', (done) => {
    request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${users[0].token}`)
      .end((err, res) => {
        if (err) {
          done(err);
        }
        try {
          expect(res.body.success).to.equal(true);
          expect(res.body.user.username).to.equal(users[0].username);
          expect(res.statusCode).to.equal(200);
          done();
        } catch (error) {
          done(error);
        }
      });
  });

  it('request fails w/ invalid token', (done) => {
    request(app)
      .get('/users/me')
      .set('Authorization', 'Bearer notarealtoken')
      .end((err, res) => {
        if (err) {
          done(err);
        }
        try {
          console.log(res.body);
          done();
        } catch (error) {
          done(error);
        }
      });
  });
});

describe('/request', () => {
  it('create a new friend request', (done) => {
    request(app)
      .post('/users/request')
      .set('Authorization', `Bearer ${users[0].token}`)
      .send({ to: users[1].id })
      .end((err, res) => {
        if (err) {
          done(err);
        }
        expect(res.body.success).to.equal(true);
        expect(res.body.friendRequest.from).to.equal(users[0].id);
        expect(res.body.friendRequest.to).to.equal(users[1].id);
        done();
      });
  });

  it('if request is already sent will not push another request from same user', (done) => {
    request(app)
      .post('/users/request')
      .set('Authorization', `Bearer ${users[0].token}`)
      .send({ to: users[1].id })
      .end((err, res) => {
        if (err) {
          done(err);
        }
        expect(res.body.success).to.equal(false);
        expect(res.body.message).to.equal('There is a preexisting request');
        done();
      });
  });

  it('user A that has received a request from user B cannot request back', (done) => {
    request(app)
      .post('/users/request')
      .set('Authorization', `Bearer ${users[1].token}`)
      .send({ to: users[0].id })
      .end((err, res) => {
        if (err) {
          done(err);
        }
        expect(res.body.success).to.equal(false);
        expect(res.body.message).to.equal('There is a preexisting request');
        done();
      });
  });
});

describe('/accept', () => {
  it('accepts a friend request', (done) => {
    request(app)
      .post('/users/accept')
      .set('Authorization', `Bearer ${users[1].token}`)
      .send({ from: users[0].id })
      .end((err, res) => {
        if (err) {
          done(err);
        }
        expect(res.body.success).to.equal(true);
        expect(res.body.message).to.equal(
          'Successfully accepted friend request'
        );
        done();
      });
  });
});
