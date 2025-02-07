const mongoose = require('mongoose');
const userSchema =  new mongoose.Schema({

    email: {
        type: String,
        required: [true, 'Email field is required'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Password fields is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },

    createdAt: {
        type: Date,
        default: Date.now

    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;