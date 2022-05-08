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
  { id: '', username: 'tester3', password: 'tester3', token: '' },
  { id: '', username: 'tester4', password: 'tester4', token: '' },
  { id: '', username: 'tester5', password: 'tester5', token: '' },
  { id: '', username: 'tester6', password: 'tester6', token: '' },
];
before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  // set up users to be used in tests
  const createUserPromises = [];

  for (let i = 0; i < users.length; i += 1) {
    createUserPromises.push(
      new Promise((resolve, reject) => {
        request(app)
          .post('/register')
          .send({
            username: users[i].username,
            password: users[i].password,
            rpassword: users[i].password,
          })
          .then((res) => {
            users[i].token = res.body.token;
            users[i].id = res.body.user._id;
            resolve();
          })
          .catch((err) => reject(err));
      })
    );
  }
  await Promise.all(createUserPromises);
});

after(async () => {
  console.log('cleaning up');
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('/me', () => {
  it('abel to get user data back w/ valid token', (done) => {
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

  it('unable to get user data w/ an invalid token', (done) => {
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

describe('/people', () => {
  it('doesnt include friends', (done) => {
    // user 0 is friends with user 1 at this point
    // so res.body.people is expected to exclude user1
    request(app)
      .get('/users/people')
      .set('Authorization', `Bearer ${users[0].token}`)
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          console.log(res.body);
          expect(res.body.success).equal(true);
          expect(res.body.people.find((i) => i._id === users[1].id)).to.equal(
            undefined
          );
          done();
        }
      });
  });
});

describe('GET /requests', () => {
  // user0 should not have any requests at this point
  it('user with no request return empty arrays', (done) => {
    request(app)
      .get('/users/request')
      .set('Authorization', `Bearer ${users[0].token}`)
      .end((err, res) => {
        if (err) done(err);
        expect(res.body.success).equal(true);
        expect(res.body.pendingRequests).length(0);
        expect(res.body.requests).length(0);
        done();
      });
  });

  // send a request from user4 to user0
  // user0 requests should contain user4
  it('test requests', (done) => {
    request(app)
      .post('/users/request')
      .set('Authorization', `Bearer ${users[4].token}`)
      .send({ to: users[0].id })
      .end((err) => {
        if (err) {
          done(err);
        }
        request(app)
          .get('/users/request')
          .set('Authorization', `Bearer ${users[0].token}`)
          .end((err, res) => {
            if (err) {
              done(err);
            }
            try {
              expect(res.body.success).equal(true);
              expect(res.body.requests).length(1);
              expect(res.body.requests[0].from.username).equal(
                users[4].username
              );
              done();
            } catch (error) {
              done(error);
            }
          });
      });
  });
  it('test pending requests', (done) => {
    // users 4 has a pending request that was send the test before
    request(app);
    request(app)
      .get('/users/request')
      .set('Authorization', `Bearer ${users[4].token}`)
      .end((err, res) => {
        if (err) {
          done(err);
        }
        try {
          expect(res.body.success).equal(true);
          expect(res.body.pendingRequests).length(1);
          expect(res.body.pendingRequests[0].to.username).equal(
            users[0].username
          );
          done();
        } catch (error) {
          done(error);
        }
      });
  });
});
