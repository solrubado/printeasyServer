var mongoose = require('mongoose');

var bcrypt=require('bcryptjs');


var PaymentSchema = mongoose.Schema({
  id: String,
  filePrinted: String,
  username: { type: Number, required: true},
  pages: Number,
  price: Number,
  created_at: Date,
  updated_at: Date,
  printed_at: Date
});


PaymentSchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();
  
  // change the updated_at field to current date
  this.updated_at = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.created_at)
    this.created_at = currentDate;

  next();
});

var Payment = module.exports = mongoose.model('Payment', PaymentSchema);

module.exports.createPayment= function(newPayment, callback){
	newPayment.save(callback);
}

module.exports.getPaymentByUsername = function(username, callback){
	var query = {username:username};
	Payment.find(query,callback);
}

module.exports.getPaymentById = function(id, callback){
	var query = {id: id};
	Payment.find(query,callback);
}



