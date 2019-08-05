/*
* author  => Peek International
* designBy => Peek International
*/

const express     = require('express');
const app         = express();
const mongoose    = require('mongoose'); 
const session     = require('express-session');
const userModel   = require('./model/users-model'); 
const bodyParser  = require('body-parser');
//const webpush     = require('web-push');
const cors        = require('cors');
const sslConfig   = require('./ssl-config');
const options     = {
    	key: sslConfig.privateKey,
    	cert: sslConfig.certificate,
      };
const server    = require('https').Server(options,app);
const io       = require('socket.io')(server);
const config = require('./config/DB');
//*****
//*****
//mongo db connection 
//*****
//*****
//mongodb://localhost/kstreams
//const db = "./config/DB";
mongoose.Promise = global.Promise;
mongoose.connect(config.url, { useNewUrlParser: true }).then(
    () => { console.log('Database is connected') },
    err => { console.log('Cannot connect to the database' + err) }
);


//mongoose.connect(db,{ useNewUrlParser: true });

//*****
//*****
// define all variable used in app
//*****
//***** 
var users  = [];

//const publicVapidKey = 'BEU-89R8Bp4adsJtnp7fcqnQR1FbzVZeQ1YD7N5tA';
//const privateVapidKey = 'adaqwqwsa';
const port = 22000;
var authUser;


//*****
//*****
// middle ware area 
//*****
//*****

app.use(cors());
app.use(session({secret:"kstreams@123",resave:true,saveUninitialized:true})); //resave changed to 'true'
app.use(express.static('public'));
app.use(express.static('Images/Profiles'));
// Provide access to node_modules folder
// app.use('/scripts', express.static(`${__dirname}/node_modules/`));
/*get data from url and encode in to json*/
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const registrationRoute = require('./routes/registration.routes');
const groupsRoute = require('./routes/groups.routes');
app.use('/business', registrationRoute);
app.use('/groups', groupsRoute);
 
//****
//****
// push notification code 
//****
//****
// webpush.setVapidDetails('mailto:saadahmed.91221@gmail.com',publicVapidKey,privateVapidKey);
// app.post('/subscribe',(req,res) => {
// 	//Get push subcription object
// 	const subscription = req.body.subscription;
// 	//send 201 resource created
// 	res.status(201).json({});
// 	//create payload
// 	const payload = JSON.stringify({ title :req.body.title});
// 	//pass object into send notification
// 	webpush.sendNotification(subscription,payload).catch(err => console.error(err));
// });
//*****
//*****
// server start
//*****
//***** 

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.info('listening on %d', port);
});

//*****
//*****
// routes area 
//*****
//*****
require('./serverRoutes')(app,io,saveUser);
//*****
//*****
// custom function area 
//*****
//*****
 
/*
//** get data from database
//**@param modelname
//**@param pass object which you wana search if get all pass null
//**@param call back function 
*/
function getData(model,obj = 0, callback){
	if(obj != 0 && obj != null)
		model.find(obj).exec(function(err,data){
			if(err){
				callback({err:err});
			}else{
				callback(data);
			}
		});	
	else
		model.find({status:1}).exec(function(err,data){
			callback(data);
		});
}
/* save the current login user info in a variable */
function saveUser(user){
	authUser = user;  
	setUserStatus(1,authUser._id);
}
//*****
//*****
// socket io events area 
//*****
//*****
function setUserStatus(status,userId){ 
	userModel.update({ '_id': userId }, { 'onlineStatus': status}).exec();
}
io.on('connection', function (socket) {
 
	socket.on('user_connected', (data) => { 
		socket.userId=data.userId; 	 
		setUserStatus(1,socket.userId);
		
		io.emit('front_user_status',{'userId':socket.userId,'status':1});
	});
	/*disconnect user */
	socket.on('disconnect', function () {  	 
		setUserStatus(0,socket.userId);
		io.emit('front_user_status',{'userId':socket.userId,'status':0});
	});

	module.exports.authUser = authUser;
	
	socket.username = "Anonymous";
	//listen on change_username
	socket.on('change_username', (data) => {
		socket.username = data.username;
		socket.rcv_id = data.rcv_id;   
	});
	
	//listen on typing
	socket.on('typing', (data) => { 
		socket.broadcast.emit('typingRec', {username : socket.username,rcv_id:socket.rcv_id})
	});

	socket.on('updatechat',(coversation) => {
		io.emit('updateChatAll',coversation);
	});
	socket.on('checkmsg',function(chat){
		io.emit('remsg',chat);
	});
 
	socket.on('calldisconnect',function(data){
		io.emit('calldis',data);
	})
	socket.on('callStart',function(data){
		io.emit('startTimmer',data);
	});
	socket.on('updateGroupChat',function(chats){
		io.emit('updateAllGroupChat',chats);
	});
	socket.on('busy',function(data){
		io.emit('userBusy',data);
	});
	socket.on('groupvideoCall',function(data){
		io.emit('reveiceGroupVideoCall',data);
	});
	socket.on('broadcasting',function(data){
		io.emit('receiveBroadcasting',data);
	});
	socket.on('connectUsers',function(data){
		io.emit('updateConnectedUsers',data);
	})
	socket.on('removeconnectUser',function(data){
		io.emit('deductConnectedUser',data);
	})
	socket.on('dropCall',function(data){
		io.emit('callDroped',data);
	})
	socket.on('dropTheCall',function(data){
		io.emit('dropeTheFriendCall',data);
	})
	socket.on('dropTheGroupCall',function(data){
		io.emit('dropeTheMembersCall',data);
	})
	socket.on('updateGroupFiles',function(data){
		io.emit('updateOtherMembersFiles',data);
	});

	//listen on typing
    socket.on('typing', (data) => {
    	io.emit('typing', data)
    });

});