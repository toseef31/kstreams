/*
* author  => Peek International
* designBy => Peek International
*/
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

const userSchema = new Schema({
	"userId": { type: String },
	"projectId": { type: Schema.ObjectId, ref: 'projects' },
	"name": String,
	"email": String,
	"user_image": { type: String, default: ''},
	"phone": Number,
	"country": String,
	"password": String,
	"onlineStatus": { type: Number, default: 1 },
	"isAdmin": { type: Number, default: 0 },
	"status": { type: Number, default: 1 },  //deleted=0/active=1/inActive=2
	"pStatus": { type: Number, default: 0 },  //active=0/away=1/dNotDisturb=2/Invisible=3/Offline=4
},
	{ timestamps: true });

userSchema.pre('save', function (next) {
	var user = this;
	if (!user.isModified('password')) return next();

	bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
		if (err) return next(err);

		bcrypt.hash(user.password, salt, function (err, hash) {
			if (err) return next(err);

			user.password = hash;
			next();
		});
	});
});

module.exports = mongoose.model('users', userSchema);