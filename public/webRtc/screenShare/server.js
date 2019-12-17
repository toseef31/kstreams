// https://www.webrtc-experiment.com/

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
var siteLink = 'https://localhost:9559/';
if (serverIpAdd.includes('58.229.208.176')) { //Job callme
    options = {
        key: sslConfig.keyJcm,
        cert: sslConfig.certJcm,
    };
    siteLink = 'https://www.jobcallme.com:9559/';
} else if (serverIpAdd.includes('192.168.1.10') || serverIpAdd.includes('127.0.0.1')) { // Peek let 
    options = {
        key: sslConfig.keyPl,
        cert: sslConfig.certPl,
    };
    siteLink = 'https://www.peeklet.com:9559/';
}


// HTTPs server
var app = require('https').createServer(options, function (request, response) {
    response.writeHead(200, {
        'Content-Type': 'text/html'
    });
    response.write('Peek ScreenShare server');
    response.end();
});


// socket.io goes below

var io = require('socket.io').listen(app, {
    log: true,
    origins: '*:*'
});

io.set('transports', [
    // 'websocket',
    'xhr-polling',
    'jsonp-polling'
]);

var channels = {};

io.sockets.on('connection', function (socket) {
    console.log('connection ===');
    var initiatorChannel = '';
    if (!io.isConnected) {
        io.isConnected = true;
    }

    socket.on('new-channel', function (data) {
        console.log('new-channel ===');
        if (!channels[data.channel]) {
            initiatorChannel = data.channel;
        }

        channels[data.channel] = data.channel;
        onNewNamespace(data.channel, data.sender);
    });

    socket.on('presence', function (channel) {
        console.log('presence ===');
        var isChannelPresent = !!channels[channel];
        socket.emit('presence', isChannelPresent);
    });

    socket.on('disconnect', function (channel) {
        console.log('disconnect ===');
        if (initiatorChannel) {
            delete channels[initiatorChannel];
        }
    });
});

function onNewNamespace(channel, sender) {
    io.of('/' + channel).on('connection', function (socket) {
        console.log('onNewNamespace ===');
        var username;
        if (io.isConnected) {
            io.isConnected = false;
            socket.emit('connect', true);
        }

        socket.on('message', function (data) {
            console.log('onNewNamespace === message ===');

            if (data.sender == sender) {
                if (!username) username = data.data.sender; 
                socket.broadcast.emit('message', data.data);
            }
        });

        socket.on('disconnect', function () {
            console.log('onNewNamespace- disconnect ===');
            if (username) {
                socket.broadcast.emit('user-left', username);
                username = null;
            }
        });
    });
}

// run app

app.listen(process.env.PORT || 9559);

process.on('unhandledRejection', (reason, promise) => {
    process.exit(1);
});

console.log('Please open SSL URL: ' + siteLink);