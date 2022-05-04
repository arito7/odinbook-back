require('dotenv').config();
const mongoose = require('mongoose');

const URI = process.env.MONGO_URI;

mongoose.connect(URI, { useNewUrlParser: true });

const db = mongoose.connection;

db.on('error', () => {
  console.error.bind(console, 'mongo connection error');
});

module.exports = db;
