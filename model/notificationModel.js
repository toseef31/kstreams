/*
* author  => Peek International
* designBy => Peek International
*/
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notiSchema = mongoose.Schema({
	"senderId": {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'users'
	},
	"receiverId": {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'users'
	},
	"message": String,
	"isSeen": {
		type: Number,
		default: 0        //0=No, 1=Yes
	},
}, { timestamps: true });

module.exports = mongoose.model('notifications', notiSchema)  