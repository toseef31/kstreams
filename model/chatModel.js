/*
* author  => Peek International
* designBy => Peek International
*/
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const chatSchema = new Schema({
	"senderId":String,
	"senderName":String,
	"senderImage":String,
	"msgType":String,
	"originalName":String,
	"recevierId":String,         //{ type: Schema.Types.ObjectId, ref: 'Users' }, for populate joins
	"receiverImage":String,         //{ type: Schema.Types.ObjectId, ref: 'Users' }, for populate joins
	"message":String,           //{ type: Schema.Types.ObjectId, ref: 'Users' },
	"delete":{type:String,default:''},      
	"isseen":{type:Boolean,default:false},
	"date": { type: Date, default: Date.now },
},{ toJSON: { virtuals: true } });
 
module.exports = mongoose.model('chat',chatSchema);