const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let groupsSchema = new Schema({
    members: [{
        type: Schema.ObjectId,
        ref: 'users'
    }],
    name: {
        type: String
    },
    status: {
        type: Number,
        default: 1 //1=Active, 0=Deleted
    }
}, {
        timestamps: true
    });

module.exports = mongoose.model('groups', groupsSchema);