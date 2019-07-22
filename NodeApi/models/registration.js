const mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;
const Schema = mongoose.Schema;

// Define collection and schema for Reg.
let RegistrationSchema = new Schema({
    username: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    country: {
        type: String 
    },
    phone: {
        type: Number
    },
    user_image: {
        type: String 
    },
    status: {
        type: Number,
        default: 1
    },
    pstatus: {
        type: Number,
        default: 0
    },
    isAdmin: {
        type: Number,
        default: 0
    },
}, { timestamps: true });


RegistrationSchema.pre('save', function (next) {
    var user = this;
    if (!user.isModified('password')) return next();

    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) return next(err);

            user.password = hash;
            // console.log(user.password);
            next();
        });
    });
});

module.exports = mongoose.model('users', RegistrationSchema);