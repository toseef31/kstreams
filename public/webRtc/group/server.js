/**************/
/*** CONFIG ***/
/**************/
var PORT = 8080;


/*************/
/*** SETUP ***/
/*************/
var ws = require('ws');
var url = require('url');
var express = require('express');
var https = require('https');
const sslConfig = require('../../../ssl-config');
var os = require('os');
var ifaces = os.networkInterfaces();

var options = {};
var serverIpAdd = [];
Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;
    ifaces[ifname].forEach(function (iface) {
        if (('IPv4' !== iface.family || iface.internal !== false) && iface.address != '127.0.0.1') return;
        //console.log(alias,' and ',iface.address,' and ',iface.family,' and ',iface.internal);
        if (alias < 1) serverIpAdd.push(iface.address);
        ++alias;
    });
});

var siteLink = 'https://localhost:8080/';
if (serverIpAdd.includes('58.229.208.176')) { //Job callme
    options = {
        key: sslConfig.keyJcm,
        cert: sslConfig.certJcm,
    };
    siteLink = 'https://www.jobcallme.com:8080/';
}
else if (serverIpAdd.includes('192.168.1.10')) { // Peek let 
    options = {
        key: sslConfig.keyPl,
        cert: sslConfig.certPl,
    };
    siteLink = 'https://www.peeklet.com:8080/';
}
else {
    options = {
        key: sslConfig.keyPl,
        cert: sslConfig.certPl,
    };
}
//var bodyParser = require('body-parser')
var main = express()
// var server = http.createServer(main)
// var io  = require('socket.io').listen(server);
 
var asUrl = url.parse(siteLink);
var port = asUrl.port;
var server = https.createServer(options, main).listen(port, function () {
    console.log('Group Call server started');
    console.log('Open ' + url.format(asUrl) + ' with a WebRTC capable browser');
});
var wss = new ws.Server({
    server: server,
    path: '/groupCall'
});
// server.listen(PORT, null, function() {
//     console.log("Listening on port " + PORT);
// });
//main.use(express.bodyParser());

//main.get('/', function(req, res){ res.sendFile(__dirname + '/client.html'); });
// main.get('/index.html', function(req, res){ res.sendfile('newclient.html'); });
// main.get('/client.html', function(req, res){ res.sendfile('newclient.html'); });



/*************************/
/*** INTERESTING STUFF ***/
/*************************/
var channels = {};
var sockets = {};

/**
 * Users will connect to the signaling server, after which they'll issue a "join"
 * to join a particular channel. The signaling server keeps track of all sockets
 * who are in a channel, and on join will send out 'addPeer' events to each pair
 * of users in a channel. When clients receive the 'addPeer' even they'll begin
 * setting up an RTCPeerConnection with one another. During this process they'll
 * need to relay ICECandidate information to one another, as well as SessionDescription
 * information. After all of that happens, they'll finally be able to complete
 * the peer connection and will be streaming audio/video between eachother.
 */
var idCounter = 0;
function nextUniqueId() {
    idCounter++;
    return idCounter.toString();
}
wss.on('connection', function (socket) {
    var sessionId = nextUniqueId();
    socket.channels = {};
    sockets[sessionId] = socket;
    
    socket.on('error', function (error) {
        console.log('Connection ' + sessionId + ' error');
        //stop(sessionId);
    });

    console.log("["+ sessionId + "] connection accepted");
    socket.on('close', function () {
        closeIt();
    });

    socket.on('message', function (_message) {
        console.log('Received message in group server.js ', _message);
        var message = JSON.parse(_message);
        console.log(message);
        if(message.event=='disconnect'){
            closeIt();
            return;
        }
        console.log(message.event);
        if (typeof message.event !== "undefined") message = JSON.parse(message.event);
        console.log('Received message in group parsed server.js ', message);
        switch (message.id) {
            case 'join':
                joinIt(message);
                break;
            case 'part':
                part(message.channel);
                break;    
            case 'relayICECandidate':
                relayICECandidate(message);
                break;  
            case 'relaySessionDescription':
                relaySessionDescription(message);
                break; 
        }
    });

    function closeIt(){
        for (var channel in socket.channels) {
            part(channel);
        }
        console.log("["+ sessionId + "] disconnected");
        delete sockets[sessionId];
    }
    function joinIt(config){
        console.log("["+ sessionId + "] join ", config);
        var channel = config.channel;
        var userdata = config.userdata;

        if (channel in socket.channels) {
            console.log("["+ sessionId + "] ERROR: already joined ", channel);
            return;
        }

        if (!(channel in channels)) {
            channels[channel] = {};
        }

        var message={};
        for (id in channels[channel]) {
            message={
                'id':'addPeer',
                'peer_id': sessionId,
                'should_create_offer':false
            };
            sendMessage(channels[channel][id],message); 
            //channels[channel][id].emit('addPeer', {'peer_id': socket.id, 'should_create_offer': false});
            message={
                'id':'addPeer',
                'peer_id': id,
                'should_create_offer':true
            };
            sendMessage(socket,message);
            //socket.emit('addPeer', {'peer_id': id, 'should_create_offer': true});
        }

        channels[channel][sessionId] = socket;
        socket.channels[channel] = channel;
    }

    function sendMessage(socketEmit,message){
        console.log('Sending message from group server.js ', message);
        socketEmit.send(JSON.stringify(message));
    }
    // socket.on('join', function (config) {
    //     console.log("["+ socket.id + "] join ", config);
    //     var channel = config.channel;
    //     var userdata = config.userdata;
    //     if (channel in socket.channels) {
    //         console.log("["+ socket.id + "] ERROR: already joined ", channel);
    //         return;
    //     }
    //     if (!(channel in channels)) {
    //         channels[channel] = {};
    //     }
    //     for (id in channels[channel]) {
    //         channels[channel][id].emit('addPeer', {'peer_id': socket.id, 'should_create_offer': false});
    //         socket.emit('addPeer', {'peer_id': id, 'should_create_offer': true});
    //     }
    //     channels[channel][socket.id] = socket;
    //     socket.channels[channel] = channel;
    // });

    function part(channel) {
        console.log("["+ sessionId + "] part ");
        if (!(channel in socket.channels)) {
            console.log("["+ sessionId + "] ERROR: not in ", channel);
            return;
        }
        delete socket.channels[channel];
        delete channels[channel][sessionId];
        var message={};
        for (id in channels[channel]) {
            message={
                'id':'removePeer',
                'peer_id':sessionId
            };
            sendMessage(channels[channel][id],message);
            //channels[channel][id].emit('removePeer', {'peer_id': socket.id});

            message={
                'id':'removePeer',
                'peer_id': id
            };
            sendMessage(socket,message);
            //socket.emit('removePeer', {'peer_id': id});
        }
    }
    //socket.on('part', part);

    function relayICECandidate(config){
        var peer_id = config.peer_id;
        var ice_candidate = config.ice_candidate;
        console.log("["+ sessionId + "] relaying ICE candidate to [" + peer_id + "] ", ice_candidate);

        if (peer_id in sockets) {
            var message={
                'id':'iceCandidate',
                'peer_id':sessionId,
                'ice_candidate':ice_candidate
            };
            sendMessage(sockets[peer_id],message); 
            //sockets[peer_id].emit('iceCandidate', {'peer_id': socket.id, 'ice_candidate': ice_candidate});
        }
    }
    // socket.on('relayICECandidate', function(config) {
    //     var peer_id = config.peer_id;
    //     var ice_candidate = config.ice_candidate;
    //     console.log("["+ socket.id + "] relaying ICE candidate to [" + peer_id + "] ", ice_candidate);

    //     if (peer_id in sockets) {
    //         sockets[peer_id].emit('iceCandidate', {'peer_id': socket.id, 'ice_candidate': ice_candidate});
    //     }
    // });

    function relaySessionDescription(config){
        var peer_id = config.peer_id;
        var session_description = config.session_description;
        console.log("["+ sessionId + "] relaying session description to [" + peer_id + "] ", session_description);

        if (peer_id in sockets) {
            var message={
                'id':'sessionDescription',
                'peer_id':sessionId,
                'session_description':session_description
            };
            sendMessage(sockets[peer_id],message);
            //sockets[peer_id].emit('sessionDescription', {'peer_id': socket.id, 'session_description': session_description});
        }
    }
    // socket.on('relaySessionDescription', function(config) {
    //     var peer_id = config.peer_id;
    //     var session_description = config.session_description;
    //     console.log("["+ socket.id + "] relaying session description to [" + peer_id + "] ", session_description);

    //     if (peer_id in sockets) {
    //         sockets[peer_id].emit('sessionDescription', {'peer_id': socket.id, 'session_description': session_description});
    //     }
    // });
});
