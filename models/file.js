var mongoose = require('mongoose');

var bcrypt=require('bcryptjs');
var dateFormat = require('dateformat');



var FileSchema = mongoose.Schema({
  id: String,
  name: String,
  username: { type: Number, required: true},
  isPrinted: Boolean,
  created_at: Date,
  updated_at: Date,
  printed_at: Date
});


FileSchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();
  
  // change the updated_at field to current date
  this.updated_at = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.created_at)
    this.created_at = currentDate;

  next();
});

var File = module.exports = mongoose.model('File', FileSchema);

module.exports.createFile= function(newFile, callback){
	newFile.save(callback);
}

module.exports.getFileToPrintByUsername = function(username, callback){
	var query = {isPrinted:false , username:username};
	File.find(query,callback);
}

module.exports.getFileById = function(id, callback){
	var query = {id: id};
	File.find(query,callback);
}


module.exports.findByName = function(name, callback){
  var query = {name: name};
  File.find(query,callback);
}

module.exports.setFileAsPrinted = function(filename, callback){
  File.findOne({name: filename}, function(err, file) {
  if (!file)
    return next(new Error('Could not find file'));
  else {
    // do your updates here
    file.isPrinted = true;
    file.printed_at = dateFormat(new Date(), "dd-mm-yyyy h:MM:ss");
    console.log("Archivo: "+file.name+" ,impreso: "+file.isPrinted);
    file.save(function(err) {   
      if (err)
        console.log('error')
      else
        console.log('success')
    });
  }
});
}

module.exports.removeFile = function(id, callback){
  File.findOne({id: id}, function(err, file) {
  if (!file)
    console.log('Could not find file');
  else {
    // do your updates here
    file.remove(function(err) {   
      if (err)
        console.log('error')
      else
        console.log('success')

    });
  }
});
}

module.exports.getFilePrintedByUsername = function(username, callback){
	var query = {username: username, isPrinted:true};
	File.find(query,callback);
}
