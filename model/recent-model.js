/*
* author  => Peek International
* designBy => Peek International
*/
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const recentSchema = new Schema({
	"receiverId":String,
	"receiverName":String,
	"senderId":String,
	"senderName":String,
	"sender_image":String,
	"receiver_image":String,
	"chat":[{senderId:String,recevierId:String,date:{type:Date,default:Date.now},message:String,unreadMsg:{type:Number,default:0},isseen:{type:Boolean,default:false}}],
	"date": { type: Date, default: Date.now },
	"updatedAt": {type: Date, default: Date.now}
},{ toJSON: { virtuals: true } });
 
recentSchema.pre('save', function (next){
  this.updatedAt = Date.now();
  next();
});
recentSchema.pre('update', function() {
  this.update({},{ $set: { updatedAt: new Date() } });
});

module.exports = mongoose.model('Recent',recentSchema);