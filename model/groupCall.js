/*
* author  => Peek International
* designBy => Peek International
*/
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupCall = mongoose.Schema({
	// "members": {
	// 	userId:{
	// 		type: Schema.ObjectId,
	// 		ref: 'users'
	// 	},  
	// 	startDate:{
	// 		type:Date,
	// 		default:Date.now()
	// 	},
	// 	endDate:{
	// 		type:Date,
	// 		default: null
	// 	}
	// },
	"members": [{
		type: Schema.ObjectId,
		ref: 'users'
	}],
	"groupId": {
		type: Schema.ObjectId,
		ref: 'groups'
	},
	"projectId": {
		type: Schema.ObjectId,
		ref: 'projects'
	},
	"callerId": { // included for better usage
		type: Schema.ObjectId,
		ref: 'users'
	},
	'createdBy':{
		type: Schema.ObjectId,
		ref: 'users'
	}, 
	"status": {
		type: Number,
		default: 1       //1=Active, 0=closed
	},
	"closedAt":{
		type:Date,
		default: null
	}
}, { timestamps: true });

module.exports = mongoose.model('groupCall', groupCall)