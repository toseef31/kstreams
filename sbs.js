/*
 * author  => Peek International
 * designBy => Peek International
 */

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const userModel = require('./model/users-model');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const cors = require('cors');
const sslConfig = require('./ssl-config');
var os = require('os');
var ifaces = os.networkInterfaces();

var keysOpt = {};
var serverIpAdd = [];
Object.keys(ifaces).forEach(function (ifname) {
	var alias = 0;
	ifaces[ifname].forEach(function (iface) {
		if (('IPv4' !== iface.family || iface.internal !== false) && iface.address != '127.0.0.1') return;
		console.log(alias, ' and ', iface.address, ' and ', iface.family, ' and ', iface.internal);
		if (alias < 1) serverIpAdd.push(iface.address);
		++alias;
	});
});

 
if (serverIpAdd.includes('58.229.208.176')) { //Job callme
	keysOpt = {
		key: sslConfig.keyJcm,
		cert: sslConfig.certJcm,
	};
} else if (serverIpAdd.includes('192.168.1.10') || serverIpAdd.includes('127.0.0.1')) { // Peek let 
	keysOpt = {
		key: sslConfig.keyPl,
		cert: sslConfig.certPl,
	};
}

const server = require('https').Server(keysOpt, app);
const io = require('socket.io')(server);
const config = require('./config/DB');

//*****
//*****
//mongo db connection 
//*****
//*****
//mongodb://localhost/kstreams
//const db = "./config/DB";
mongoose.Promise = global.Promise;
mongoose.connect(config.url, {
	useNewUrlParser: true
}).then(
	() => {
		console.log('Database is connected')
	},
	err => {
		console.log('Cannot connect to the database' + err)
	}
);

const publicVapidKey = 'BOkWsflrOnCVOs19RXCMiHl-tAbRzKC3BlAwxzTo7rJYWGAgGFzDweF9jgSvlZ17AwV-fIlXPRxPVp_-Hr9gwk4';
const privateVapidKey = '52YWJRrW8wan8J8hon6w4MP7QTKPrvIzKCENPe7vTXM';
//const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
//const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

webpush.setVapidDetails('https://localhost:22000/#!/', publicVapidKey, privateVapidKey);

//*****
//*****
// define all variable used in app
//*****
//***** 
var users = [];

//const publicVapidKey = 'BEU-89R8Bp4KeZEjOSQtFj-3aBvwgFE8iJ20y4CG2H4Mwip9jaX8dkldWsOPJtnp7fcqnQR1FbzVZeQ1YD7N5tA';
//const privateVapidKey = 'ntLibayiqZ-KpIC5swgVRep2ywsbn6zEVC0sS10mnaQ';
const port = 22000;
var authUser;


//*****
//*****
// middle ware area 
//*****
//*****

const corsOptions = {
	origin: ["https://peekhelpers.com", "https://www.peekhelpers.com", "http://127.0.0.1:8000"], //the port my react app is running on. https://alllinkshare.com   / https://searchbysearch.com
	credentials: true,
};

app.use(cors(corsOptions));
app.use(session({
	secret: "kstreams@123",
	resave: true,
	saveUninitialized: true
})); //resave changed to 'true'
app.use(express.static('public'));
app.use(express.static('images'));


// Provide access to node_modules folder
// app.use('/scripts', express.static(`${__dirname}/node_modules/`));
/*get data from url and encode in to json*/
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

const registrationRoute = require('./routes/registration.routes');
const groupsRoute = require('./routes/groups.routes');
const projectRoute = require('./routes/projects.routes');
const friendRoute = require('./routes/friends.routes');

app.use('/business', registrationRoute);
app.use('/groups', groupsRoute);
app.use('/projects', projectRoute);
app.use('/friends', friendRoute);

//****
//****
// push notification code 
//****
//****
// const vapidKeys = webpush.generateVAPIDKeys();
// console.log('vapidKeys: ',publicVapidKey,' and ',privateVapidKey);
webpush.setVapidDetails('mailto:muhammadsajid9005@gmail.com', publicVapidKey, privateVapidKey);

app.post('/subscribe', (req, res) => {

	//Get push subcription object
	const subscription = req.body.subscription;
	//send 201 resource created
	res.status(201).json({});
	//create payload
	const payload = JSON.stringify({
		title: req.body.title
	});
	//pass object into send notification
	webpush.sendNotification(subscription, payload).catch(err => console.error(err));
});


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
require('./serverRoutes')(app, io, saveUser);
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

/* save the current login user info in a variable */
function saveUser(user) {
	authUser = user;
	setUserStatus(1, authUser._id);
}
//*****
//*****
// socket io events area 
//*****
//*****
function setUserStatus(status, userId) {
	userModel.update({
		'_id': userId
	}, {
		'onlineStatus': status
	}).exec();
}

io.on('connection', function (socket) {

	// socket.on('setSSL', function (SSLData){
	// 	options.key = SSLData.sslKey;
	// 	options.key = SSLData.sslCert;
	// })

	socket.on('user_connected', (data) => {
		socket.userId = data.userId;
		setUserStatus(1, socket.userId);

		io.emit('front_user_status', {
			'userId': socket.userId,
			'status': 1
		});
	});
	/*disconnect user */
	socket.on('disconnect', function () {
		setUserStatus(0, socket.userId);
		io.emit('front_user_status', {
			'userId': socket.userId,
			'status': 0
		});
	});

	module.exports.authUser = authUser;

	socket.username = "Anonymous";
	//listen on change_username
	socket.on('change_username', (data) => {
		socket.username = data.username;
		socket.rcv_id = data.rcv_id;
	});

	socket.on('updateUserSelection', (data) => {
		io.emit('receiverUserStatus', data);
	});

	socket.on('updateChatWithId', (data) => {
		io.emit('updateUserChatWithId', data);
	})

	socket.on('logoutUpdate', (data) => {
		io.emit('logoutStatusUpdate', data);
	})

	//listen on typing
	socket.on('typing', (data) => {
		socket.broadcast.emit('typingRec', {
			username: socket.username,
			rcv_id: socket.rcv_id
		})
	});

	socket.on('updatechat', (coversation) => {
		io.emit('updateChatAll', coversation);
	});
	socket.on('checkmsg', function (chat) {
		io.emit('remsg', chat);
	});

	socket.on('updateChatSeenStatus', (chatData) => {
		io.emit('updateMsgSeenStatus', chatData);
	})

	socket.on('calldisconnect', function (data) {
		io.emit('calldis', data);
	})
	socket.on('callStart', function (data) {
		io.emit('startTimmer', data);
	});
	socket.on('updateGroupChat', function (chats) {
		io.emit('updateAllGroupChat', chats);
	});
	socket.on('busy', function (data) {
		io.emit('userBusy', data);
	});
	socket.on('groupvideoCall', function (data) {
		io.emit('reveiceGroupVideoCall', data);
	});
	socket.on('broadcasting', function (data) {
		console.log('bc socket');
		io.emit('receiveBroadcasting', data);
	});
	socket.on('connectUsers', function (data) {
		console.log('ucu socket');
		io.emit('updateConnectedUsers', data);
	})
	socket.on('removeconnectUser', function (data) {
		io.emit('deductConnectedUser', data);
	})
	socket.on('dropCall', function (data) {
		io.emit('callDroped', data);
	})
	socket.on('dropTheCall', function (data) {
		io.emit('dropeTheFriendCall', data);
	})
	socket.on('dropTheGroupCall', function (data) {
		io.emit('dropeTheMembersCall', data);
	})
	socket.on('updateGroupFiles', function (data) {
		io.emit('updateOtherMembersFiles', data);
	});

	//listen on typing
	socket.on('typing', (data) => {
		io.emit('typing', data)
	});

});

app.post('/pauseChatFunc', (req, res) => {
	console.log('pauseCH sbs');
	io.emit('pauseChatFunctionality', req.body.chatId); // this emitted function is after line#900
	res.status(200).json({});
});

var serveStatic = require('serve-static');
app.use(serveStatic('./'));
//app.use(express.static(path.join(__dirname, "client")));