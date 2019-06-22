/*
* author  => Peek International
* designBy => Peek International
*/
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const notiSchema = new Schema({
	"senderId":String,
	"senderName":String,
	"recevierId":String,         
	"message":String,                 
	"isseen":{type:Boolean,default:false},
	"date": { type: Date, default: Date.now },
});
module.exports = mongoose.model('notification',notiSchema);