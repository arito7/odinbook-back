require('dotenv').config();
const createError = require('http-errors');
const cors = require('cors');
const logger = require('morgan');
const path = require('path');
const express = require('express');
const passport = require('./config/passport.js');
require('./config/mongodb.js');

// routes
const indexRoute = require('./routes/index.js');
const authRoute = require('./routes/auth.js');
const postsRoute = require('./routes/posts.js');
const userRoute = require('./routes/users.js');

const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5000'],
    methods: ['GET', 'POST'],
  })
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// paths not requiring auth
app.use('/', authRoute);

app.use(
  passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/unauthorized',
  })
);

// paths requiring auth
app.use('/', indexRoute);
app.use('/posts', postsRoute);
app.use('/users', userRoute);

app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({ message: err.message });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('Listening on port', port);
});
