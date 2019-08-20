/*
* author  => Peek International
* designBy => Peek International
*/
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
	"userId": { type: String },
	"projectId": { type: Number, ref: 'projects' },
	"name": String,
	"email": String,
	"user_image": String,
	"phone": Number,
	"country": String,
	"password": String,
	"onlineStatus": { type: Number, default: 1 },
	"isAdmin": { type: Number, default: 0 },
	"status": { type: Number, default: 1 },  //active=1/inActive=0
	"pStatus": { type: Number, default: 0 },  //active=0/away=1/dNotDisturb=2/Invisible=3/Offline=4
},
	{ timestamps: true });

// userSchema.pre('save', function (next){
//   this.updatedAt = Date.now();
//   next();
// });
// userSchema.pre('update', function() {
//   this.update({},{ $set: { updatedAt: new Date() } });
// });

module.exports = mongoose.model('users', userSchema);