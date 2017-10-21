var mongoose = require('mongoose');
var bcrypt=require('bcryptjs');

var UserSchema = mongoose.Schema({
  name: String,
  username: { type: Number, required: true, unique: true },
  password: { type: String, required: true },
  admin: Boolean,
  location: String,
  university: String,
  created_at: Date,
  updated_at: Date
});



UserSchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();
  
  // change the updated_at field to current date
  this.updated_at = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.created_at)
    this.created_at = currentDate;

  next();
});


var User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser= function(newUser, callback){
	var bcrypt = require('bcryptjs');
	bcrypt.genSalt(10, function(err, salt) {
    	bcrypt.hash(newUser.password, salt, function(err, hash) {
    	    newUser.password=hash;
    	    newUser.save(callback);
    });
});
}

module.exports.getUserByUsername = function(username, callback){
	var query = {username: username};
	User.findOne(query,callback);
}

module.exports.getUserById = function(id, callback){
	User.findById(id,callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
		if(err) throw err;
		callback(null, isMatch);
    
    });
}