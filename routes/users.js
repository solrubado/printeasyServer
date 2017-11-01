var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var fs = require('fs');
var path = require('path');
var passport = require('passport');
var LocalStrategy = require ('passport-local').Strategy;
var User = require('../models/user')
var usernameLogged;
var Payment = require('../models/payment')
var File = require('../models/file')
var Printer = require('zuzel-printer');
var ProgressBar = require('progress');
var uuid = require('node-uuid');


//Get Homepage

router.get('/',function(req,res){
	res.redirect('/login');
});

router.get('/login', function(req,res){
	res.render('login');
});

//Get Main Page

router.get('/main', ensureAuthenticated, function(req,res){
	File.getFileToPrintByUsername(usernameLogged, function(err,documents){
  	if(err) throw err;
	res.render('main', {documents:documents});
	});
});

router.get('/payment', ensureAuthenticated, function(req,res){
	Payment.getPaymentByUsername(usernameLogged, function(err,payments){
  	if(err) throw err;
	res.render('payment', {payments:payments});
	});
});

router.get('/history', ensureAuthenticated, function(req,res){
	File.getFilePrintedByUsername(usernameLogged, function(err,documents){
  	if(err) throw err;
        console.log("Got a response: ", documents);
	res.render('history', {documents:documents});
	});
});

router.post('/loginAndroid',
 passport.authenticate('local',{successRedirect:'', failureRedirect:''}),
 	function(req, res) {
 		res.writeHead(200, {"Content-Type": "application/json"});
  	res.end(); 
 		
  
  });
  

router.get('/historyAndroid', function(req,res){
	File.getFilePrintedByUsername(usernameLogged, function(err,documents){
  	if(err) throw err;
	res.writeHead(200, {"Content-Type": "application/json"});
  	var json = JSON.stringify({ documents: documents});
  	res.end(json);
    
	});
});

router.get('/paymentAndroid', function(req,res){
	Payment.getPaymentByUsername(usernameLogged, function(err,payments){
  	if(err) throw err;
	res.writeHead(200, {"Content-Type": "application/json"});
  	var json = JSON.stringify({ payments: payments});
  	res.end(json);
	});
});

router.get('/documentsAndroid', function(req,res){
	File.getFileToPrintByUsername(usernameLogged, function(err,documents){
  	if(err) throw err;
	res.writeHead(200, {"Content-Type": "application/json"});
  	var json = JSON.stringify({ documents: documents});
  	res.end(json);
	});
});

router.post('/print/:filename', function(req,res){	
	var papersize = req.body.papersize;
	var hojas = req.body.hojas;
	var copias = req.body.copias;

if(hojas==""){
    var options = {
    	n: copias,
    	P: hojas,
    	media: papersize
	};
}else{
	var options = {
    	n: copias,
    	P: hojas,
    	media: papersize
	};
}
// Get available printers list 
var filename = req.param("filename");
console.log(Printer.list());
console.log(""+papersize);
console.log(""+hojas);
console.log(""+copias);
console.log('/uploads/'+usernameLogged+'_'+filename);

var printer = new Printer('Deskjet-3050-J610-series');
var filePath = path.join(__dirname, '/uploads/'+usernameLogged+'_'+filename);

var jobFromFile = printer.printFile(filePath, options);

jobFromFile.once('sent', function () {
    console.log('Job ' + jobFromFile.identifier + ' has been sent');
	res.redirect('/main');


});

jobFromFile.on('completed', function () {
	File.setFileAsPrinted(filename,function(err,documents){
  	if(err) throw err;
	});
	var filePath = path.join(__dirname, '/uploads/'+usernameLogged+'_'+filename);

	require('pdfjs-dist');
	var fs = require('fs');
	var data = new Uint8Array(fs.readFileSync(filePath));
	PDFJS.getDocument(data).then(function (pdfDocument) {
  	console.log('Precio: ' + pdfDocument.numPages*1.85);
  	var price = pdfDocument.numPages*1.85;
  	var pages = pdfDocument.numPages;

  	var idString= uuid.v4();
	var newPayment = new Payment({
		id: idString,
  		filePrinted: filename,
  		username: usernameLogged,
  		pages: pages,
  		price: price,
		});
    Payment.createPayment(newPayment, function(err, user){
		if(err) throw err;
		console.log(newPayment);
	});

	})

	
	console.log('\ncomplete\n');
    console.log('Job ' + jobFromFile.identifier + ' has been printed');
    jobFromFile.removeAllListeners();
    printer.destroy();
    
});


File.getFileToPrintByUsername(usernameLogged, function(err,documents){
  	if(err) throw err;
	res.render('main', {documents:documents});
	});
});

router.get('/upload', ensureAuthenticated, function(req,res){
	res.render('upload');
});

router.get('/delete/:id', ensureAuthenticated, function(req,res){
var id = req.param("id");
	File.removeFile(id, function(err){
  	if(err) throw err;	
});
res.redirect('/main');
});

function ensureAuthenticated(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}else{
		res.redirect('/login');
	}
}


//Register User
router.post('/register', function(req,res){
	console.log('Register');
	var username = req.body.username;
	var password = req.body.password;

	//Validation
	req.checkBody('username','El registro es obligatorio').notEmpty();
	req.checkBody('password', 'La contraseña es obligatoria').notEmpty();
	
	var errors= req.validationErrors();

	if(errors){
		res.render('login',{
			errors:errors
		});
	}else{
		var newUser = new User({
			username: username,
			password: password
		});
	
	User.createUser(newUser, function(err, user){
		if(err) throw err;
		console.log(user);
	});

	req.flash('success_msg','You are registered and can now login');

	res.redirect('/login');

	}

});

passport.use(new LocalStrategy(
  function(username, password, done) {
  	User.getUserByUsername(username, function(err,user){
  		if(err) throw err;
  		if(!user){
  			return done (null, false,{message: 'Usuario incorrecto'})
  		}
  		usernameLogged = username;
  		User.comparePassword (password, user.password, function(err, isMatch){
  			if(err) throw err;
  			if(isMatch){

  				return done (null, user);
  			} else{
  				return done(null, false, {message: 'Contraseña incorrecta'});
  			}
  		});
  	});
    
  }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

router.post('/login',
  passport.authenticate('local',{successRedirect:'/main', failureRedirect:'/login', failureFlash:true}),
 	function(req, res) {
 		 db.dropDatabase();
 		res.redirect('/main');
  
  });



router.get('/logout', function(req,res){
	req.logout();
	req.flash('success_msg','Sesión cerrada correctamente');
	res.redirect('/login');
});

router.post('/upload', function(req, res){

  // create an incoming form object
  var form = new formidable.IncomingForm();

   // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;

  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/uploads');


  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function(field, file) {
    fs.rename(file.path, path.join(form.uploadDir, usernameLogged+"_"+file.name));
    var idString= uuid.v4();

    var newFile = new File({
		id:idString,
    		name: file.name,
		username: usernameLogged,
		isPrinted: false	
		});
    File.createFile(newFile, function(err, user){
		if(err) throw err;
		console.log(file);
	});
  });

  // log any errors that occur
  form.on('error', function(err) {
     res.writeHead(500, {"Content-Type": "application/json"});
  	res.end();
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    res.writeHead(200, {"Content-Type": "application/json"});
  	res.end();
  });

  // parse the incoming request containing the form data
  form.parse(req);

});

module.exports = router;
