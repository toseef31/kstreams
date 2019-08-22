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
	"projectId": {
		type: Schema.ObjectId,
		ref: 'projects'
	},
	"name": String,
	"status": {
		type: Number,
		default: 1        //1=Active, 0=Deleted
	},
}, { timestamps: true });

module.exports = mongoose.model('groups', groupSchema)