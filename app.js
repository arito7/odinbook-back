require('dotenv').config();
const createError = require('http-errors');
const cors = require('cors');
const logger = require('morgan');
const path = require('path');
const express = require('express');
const passport = require('./config/passport.js');
require('./config/mongodb.js');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session');

// routes
const indexRoute = require('./routes/index.js');
const authRoute = require('./routes/auth.js');
const postsRoute = require('./routes/posts.js');
const userRoute = require('./routes/users.js');

const MongoStore = MongoDBStore(session);

const app = express();

const mongoStore = new MongoStore({
  uri: process.env.MONGO_URI,
});

app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5000'],
    methods: ['GET', 'POST'],
    credentials: true,
  })
);
mongoStore.on('error', (error) => console.log(error));

app.use(
  session({
    secret: process.env.STORE_SECRET,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 14 },
    store: mongoStore,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.authenticate('session'));

app.use('/', indexRoute);
app.use('/', authRoute);
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
