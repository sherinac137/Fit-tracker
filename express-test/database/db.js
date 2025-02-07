const mongoose = require ('mongoose');
mongoose.connect('mongodb://localhost:27017/weightdb');
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MOngoDB connection error'));
db.once('open', () => {

    console.log('Connected to MongoDB');
});

module.exports = db;