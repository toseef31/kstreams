const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const friendSchema = new Schema({
    "userId": {
        type: Schema.ObjectId,
        ref: 'users'
    },
    "friendId": {
        type: Schema.ObjectId,
        ref: 'users'
    },
    "status": { type: Number, default: 1 }
}, {
        timestamps: true
    });

module.exports = mongoose.model('friends', friendSchema);