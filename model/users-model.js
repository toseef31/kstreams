/*
* author  => Peek International
* designBy => Peek International
*/
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;
const jwt = require('jsonwebtoken');

const userSchema = new Schema({
	'userId': { type: String },
	"projectId": { type: Schema.ObjectId, ref: 'projects' },
	"chatWithRefId": {type: String, default: ''},
	'name': String,
	'email': String,
	"user_image": { type: String, default: ''},
	"phone": String,
	"country": String,
	'password': String,
	"updatedByMsg": {type: Date, default: Date.now}, // updated time according to which user has been messaged
	"userTitle": {type: String, default: ''}, // Title of the User coming from any connected project(e.g. Teacher)
	"userProfileUrl": {type:String, default: ''},
	"onlineStatus": { type: Number, default: 1 },
	"seenStatus": { type: Number , default: 1},
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

userSchema.methods.generateJWT = function() {
	console.log("generateJWT");
//	const today = new Date();
//	const expirationDate = new Date(today);
//  expirationDate.setDate(today.getDate() + 60);
  
	console.log("userId: "+ this._id);
	return jwt.sign({
	  id: this._id,
	  name: this.name,
	  email: this.email
	 // exp: parseInt(expirationDate.getTime() / 1000, 10),
	}, 'secret');
  }
  
  userSchema.methods.toAuthJSON = function() {
	console.log("toAuthJSON: "+ this._id);
	return {
	  _id: this._id,
	  email: this.email,
	  token: this.generateJWT(),
	  userId: this.userId,
	  projectId: this.projectId,
	  chatWithRefId: this.chatWithRefId,
      name: this.name,
	  email: this.email,
	  user_image: this.user_image,
	  phone: this.phone,
	  country: this.country,
	  password: this.password,
	  updatedByMsg: this.updatedByMsg,
	  userTitle: this.userTitle,
	  userProfileUrl: this.userProfileUrl,
	  onlineStatus: this.onlineStatus,
	  seenStatus: this.seenStatus,
	  isAdmin: this.isAdmin,
	  status: this.status,
	  pStatus: this.pStatus,
	};
  };

module.exports = mongoose.model('users', userSchema);
