/*
* author  => Peek International
* designBy => Peek International
*/
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSchema = mongoose.Schema({
	"members": [{
		type: Schema.ObjectId,
		ref: 'users'
	}],
	"name": String,
	"status": {
		type: Number,
		default: 1        //1=Active, 0=Deleted
	},
}, { timestamps: true });

module.exports = mongoose.model('groups', groupSchema)