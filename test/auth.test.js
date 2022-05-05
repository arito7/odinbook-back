const request = require('supertest');
const express = require('express');
const authRoute = require('../routes/auth');
const app = express();
const expect = require('chai').expect;

require('mocha');
require('../config/mongoConfigTesting')();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', authRoute);

describe('/register', () => {
  it('works with proper request', (done) => {
    request(app)
      .post('/register')
      .send({ username: 'tester1', password: 'tester1', rpassword: 'tester1' })
      .then((res) => {
        expect(res.body.success).to.equal(true);
        expect(res.body.message).to.equal('User Successfully created');
        expect(res.body.user.username).to.equal('tester1');
        expect(res.statusCode).to.equal(200);
        done();
      })
      .catch((err) => done(err));
  });

  it('rejects mismatching passwords', (done) => {
    request(app)
      .post('/register')
      .send({ username: 'tester1', password: 'tester', rpassword: 'tester2' })
      .then((res) => {
        expect(res.body.success).to.equal(false);
        expect(res.statusCode).to.equal(200);
        done();
      })
      .catch((err) => done(err));
  });

  it('rejects taken usernames passwords', (done) => {
    request(app)
      .post('/register')
      .send({ username: 'tester1', password: 'tester1', rpassword: 'tester1' })
      .then((res) => {
        request(app)
          .post('/register')
          .send({
            username: 'tester1',
            password: 'tester1',
            rpassword: 'tester1',
          })
          .then((res) => {
            expect(res.body.message).to.equal("Username 'tester1' is in use");
            expect(res.body.success).to.equal(false);
            expect(res.statusCode).to.equal(200);
            done();
          })
          .catch((err) => {
            done(err);
          });
      });
  });
});
