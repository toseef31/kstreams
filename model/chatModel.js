/*
* author  => Peek International
* designBy => Peek International
*/
const mongoose = require('mongoose');

const chatSchema = mongoose.Schema({
	"senderId": {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'users'
	},
	"recevierId": {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'users'
	},
	"groupId": {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'groups'            //If isGroup is 1 then there will be groupId and no receiver id          
	},
	"message": String,
	"status": {
		type: Number,
		default: 1        //1=Active, 0=Deleted
	},
	"isSeen": {
		type: Number,
		default: 0        //0=No, 1=Yes
	},
	"isDeleted": {
		type: Number,
		default: 0
	},
	"isGroup": {
		type: Number,
		default: 0        //0=No, 1=Yes
	}
}, { timestamps: true });

module.exports = mongoose.model('chat', chatSchema)