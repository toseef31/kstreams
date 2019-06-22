/*
* author  => Peek International
* designBy => Peek International
*/
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const groupSchema = new Schema({
	"members":[],
	"name":String,         
	"message":[{name:String,originalName:String,msgType:String,sender:String,message:String,delete:{type:String,default:''},date:{type:Date,default:Date.now()}}],
	"lastMsg":{type:String,default:null},     
	"date": { type: Date, default: Date.now },
});
module.exports = mongoose.model('groups',groupSchema);