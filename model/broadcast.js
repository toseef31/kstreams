/*
* author  => Peek International
* designBy => Peek International
*/
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const broadCastSchema = new Schema({
	"presenterId":{
		type:mongoose.Schema.Types.ObjectId,
		ref: 'users'
	},          
	"password":String,  
	startDate:{
		type:Date,
		default:Date.now()
	},
	endDate:{
		type:Date,
		default: null
	},                
	"viewers":[
		{
			viewerId:{
				type:mongoose.Schema.Types.ObjectId,
				 ref: 'users'
			},  
			startDate:{
				type:Date,
				default:Date.now()
			},
			endDate:{
				type:Date,
				default: null
			}
		}
	] 
});
module.exports = mongoose.model('broadcast',broadCastSchema);