const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const parser = require('body-parser');
const crypto = require('crypto');

let app = express()
app.use(cookieParser());
app.use(parser.json());
app.use(parser.urlencoded({extended: true}));
var iterations = 1000;

//============================MongoDB Setup and Connection================
//In the database "courseta", there are three collections
//"Account", "Chat" and "Course".
const db  = mongoose.connection;
const mongoDBURL = 'mongodb://127.0.0.1/courseta';

var Schema = mongoose.Schema;

var AccountSchema = new Schema({
  username: String,
  salt:String,
  hash:String,
  type:String,
  courses:[{type:Schema.Types.ObjectId, ref:'Course'}]
});
var Account = mongoose.model('Account', AccountSchema);

var ChatSchema = new Schema({
  user: String,
  message: String,
});
var Chat = mongoose.model('Chat', ChatSchema);

var CourseSchema = new Schema({
  title: String,
  deptNum: String,
  chats: [{type:Schema.Types.ObjectId, ref:'Chat'}],
  users:[{type:Schema.Types.ObjectId, ref:'Account'}]
});
var Course = mongoose.model('Course', CourseSchema);

//Connect to MongoDB
mongoose.connect(mongoDBURL, {useNewUrlParser: true, useUnifiedTopology: true});
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
//==========================================================================


//============Account Related Actions and Cookies Setup===================

var sessionKeys = {};

function updateSessions() {
  let now = Date.now();
  for (e in sessionKeys) {
    if (sessionKeys[e][1] < (now - 1200000)) {
	  console.log(sessionKeys);
      delete sessionKeys[e];
    }
  }
}

function authenticate(req, res, next) {
  if (Object.keys(req.cookies).length > 0) {
    let u = req.cookies.login.username;
    let key = req.cookies.login.key;
    if ( Object.keys(sessionKeys[u]).length > 0 && sessionKeys[u][0] == key) {
      next();
    } else {
      res.send('NOT ALLOWED');
    }
  } else {
    res.send('NOT ALLOWED');
  }
}

app.get('/testcookies', (req, res)=>{
  res.send(req.cookies);
});

app.use('/schedule.html', authenticate);
app.use('/', express.static('public_html'));

app.get('/login/:username/:password', (req, res) => {
  let u = req.params.username;
  Account.find({username : u}).exec(function(error, results) {
    if (results.length == 1) {
	  let password = req.params.password;
	  var salt = results[0].salt;
	  crypto.pbkdf2(password,salt,iterations,64,'sha512',(err, hash) => {
		  if(err)throw err;
		  let hStr = hash.toString('base64');
		  if (results[0].hash == hStr){
			  let sessionKey = Math.floor(Math.random() * 1000);
			  sessionKeys[u] = [sessionKey, Date.now()];
			  res.cookie("login", {username: u, key:sessionKey}, {maxAge: 1200000});//20min session
			  res.send('OK');
		  } else {
			res.send('There was an issue logging in. Please try again');
		  }
	  });
    } else {
      res.send('There was an issue logging in. Please try again');
    }
  });
});


app.post('/add/user/', (req, res) => {
  let u = JSON.parse(req.body.newUser).username;
  let t = JSON.parse(req.body.newUser).type;
  Account.find({username : u}).exec(function(error, results) {
    if (results.length == 0) {
	  let password = JSON.parse(req.body.newUser).password;
	  var salt = crypto.randomBytes(64).toString('base64');
	  crypto.pbkdf2(password, salt, iterations, 64, 'sha512',(err, hash) => {
		  if(err)throw err;
		  let hStr = hash.toString('base64');
		  var account = new Account({'username':u,'salt':salt, 'hash':hStr, 'type':t});
		  account.save(function (err) { if (err) console.log('an error occurred'); });
          res.send('Account created!');
	  });
    } else {
      res.send('Username already taken');
    }
  });
});

//==============================================================================


//=======================Courses Post and Schedule Management==================
app.get('/get/schedule/',(req,res) => {
	var Account = mongoose.model('Account', AccountSchema);
	var Course = mongoose.model('Course', CourseSchema);
	var reqUser = req.cookies.login.username;
	Account.find({username:reqUser}).
	populate({path:'courses',model:'Course'}).
	exec(function(error,results){
		res.send(results[0].courses);
	})
});

app.post('/add/course/',(req,res) => {
		var Account = mongoose.model('Account', AccountSchema);
		var Course = mongoose.model('Course', CourseSchema);
		var Chat = mongoose.model('Chat', ChatSchema);
		if (req.cookies == undefined){
			res.send("Please Login!");
			return true;
		}
		Account.find({username:req.cookies.login.username}).exec(function(error,results){
			if (results.length == 1){
				newcourse = JSON.parse(req.body.newCourse);
				//Add User to class list
				newcourse.users = [results[0]._id];
				//Add Welcome Message
				var welcomeMessage = {"user":"Courseta Team","message":"Welcome to "+ newcourse.deptNum};
				var welcomeMessage = new Chat(welcomeMessage);
				welcomeMessage.save(function(err){if (err) console.log('error');});
				newcourse.chats = [welcomeMessage._id];
				//Add new course to course collection
				var newcourse = new Course(newcourse);
				newcourse.save(function(err){if (err) console.log('error');});
				//Add new course to user's course list
				results[0].courses.push(newcourse._id);
				results[0].save(function(err){if (err) console.log('error');});
				res.send('Course Added!');
			}
		})
	});

//=============================================================================

//===================================Courses Chat=================================

app.get('/get/chat/:cour',(req,res) => {
	var Account = mongoose.model('Account', AccountSchema);
	var Course = mongoose.model('Course', CourseSchema);
	var Chat = mongoose.model('Chat', ChatSchema);
	var reqUser = req.cookies.login.username;
	Course.find({deptNum:req.params.cour}).
	populate({path:'chats',model:'Chat'}).
	exec(function(error,results){
		var reqUser = req.cookies.login.username;
		res.send({'Chats':results[0].chats,'ReqUser':reqUser});
	})
});

app.post('/add/message/:course',(req,res) => {
		let chatMessage = req.body;
		chatMessage.user = req.cookies.login.username;
		chatMessage = new Chat(chatMessage);
		chatMessage.save(function(err){if (err) console.log('error');});
		Course.find({deptNum:req.params.course}).
		populate({path:'chats',model:'Chat'}).
		exec(function(error,results){
			results[0].chats.push(chatMessage._id);
			results[0].save(function(err){if (err) console.log('error');});
			res.send('Message Posted!');
		});
	});

//================================================================================

//===================================Courses Search=================================
app.get('/search/course/:keyword',(req,res) => {
	var Course = mongoose.model('Course', CourseSchema);
	var reqUser = req.cookies.login.username;
	Course.find({}).exec(function(error,results){
			searchCourses = [];
			for (let i in results){
				var titles = results[i].title;
				var numbers = results[i].deptNum;
				var keyword = req.params.keyword;
				if (titles.toLowerCase().includes(keyword.toLowerCase())){
					searchCourses.push(results[i]);
				}else if(numbers.toLowerCase().includes(keyword.toLowerCase())){
					searchCourses.push(results[i]);
				}
			}
			if (searchCourses.length == 0){
				res.send('No Result!');
			}else{
				res.send(JSON.stringify({'sresult':searchCourses}));
			}
			
	})
});

app.post('/join/course/:c',(req,res) => {
		var Account = mongoose.model('Account', AccountSchema);
		var Course = mongoose.model('Course', CourseSchema);
		Course.find({deptNum:req.params.c}).
		populate({path:'users',model:'Account'}).
		exec(function(error,results){
			uName = [];
			for(let i in results[0].users){
				uName.push(results[0].users[i].username);
			}
			if (uName.indexOf(req.cookies.login.username) !== -1){
				res.send("You're in the class!");
				return;
			}
			Account.find({username:req.cookies.login.username}).exec(function(error,r){
				results[0].users.push(r[0]._id);
				results[0].save(function(err){if (err) console.log('error');});
				r[0].courses.push(results[0]._id);
				r[0].save(function(err){if (err) console.log('error');});
				res.send("Course Added!");
			});
		});
	});


//==================================================================================
app.listen(3000, function () {
  console.log('server running');
});