/*
 * (C) Copyright 2014 Kurento (http://kurento.org/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

var path = require('path');
var express = require('express');
var ws = require('ws');
var minimist = require('minimist');
var url = require('url');
var kurento = require('kurento-client');
var fs = require('fs');
var https = require('https');
const sslConfig = require('../../../ssl-config');
// let hostIs=location.host.split(':');
// let webSocketIp='110.10.130.70';
// if(hostIs[0]=='localhost') webSocketIp='127.0.0.1';  //searchbysearch.com

var os = require( 'os' );
var ifaces = os.networkInterfaces();

var options   = {};
var serverIpAdd=[]; 
Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0; 
  ifaces[ifname].forEach(function (iface) { 
    if (('IPv4' !== iface.family || iface.internal !== false) && iface.address!='127.0.0.1') return;
	console.log(alias,' and ',iface.address,' and ',iface.family,' and ',iface.internal);
    if (alias < 1) serverIpAdd.push(iface.address);  
    ++alias;
  });
});


var siteLink='https://localhost:8443/';
if(serverIpAdd.includes('58.229.208.176')){ //Job callme
	options = {
		key: sslConfig.keyJcm,
		cert: sslConfig.certJcm,
    }; 
    siteLink='https://www.jobcallme.com:8443/';
}
else if(serverIpAdd.includes('192.168.1.10') || serverIpAdd.includes('127.0.0.1')){ // Peek let 
	options       = {
		key: sslConfig.keyPl,
		cert: sslConfig.certPl,
    };
    siteLink='https://www.peeklet.com:8443/';
}
 

var argv = minimist(process.argv.slice(2), {
    default: {
        as_uri: siteLink, 
        ws_uri: "ws://localhost:8888/kurento"
    }
});

var app = express();

/*
 * Definition of global variables.
 */

var kurentoClient = null;
var userRegistry = new UserRegistry();
var pipelines = {};
var candidatesQueue = {};
var idCounter = 0;

function nextUniqueId() {
    idCounter++;
    return idCounter.toString();
}

/*
 * Definition of helper classes
 */

// Represents caller and callee sessions
function UserSession(id, name, ws) {
    this.id = id;
    this.name = name;
    this.ws = ws;
    this.peer = null;
    this.sdpOffer = null;
}

UserSession.prototype.sendMessage = function (message) {
    console.log('Sending message from server ================ ', message);
    this.ws.send(JSON.stringify(message));
}

// Represents registrar of users
function UserRegistry() {
    this.usersById = {};
    this.usersByName = {};
}

UserRegistry.prototype.register = function (user) {
    this.usersById[user.id] = user;
    this.usersByName[user.name] = user;
}

UserRegistry.prototype.unregister = function (id) {
    var user = this.getById(id);
    if (user) delete this.usersById[id]
    if (user && this.getByName(user.name)) delete this.usersByName[user.name];
}

UserRegistry.prototype.getById = function (id) {
    return this.usersById[id];
}

UserRegistry.prototype.getByName = function (name) {
    return this.usersByName[name];
}

UserRegistry.prototype.removeById = function (id) {
    var userSession = this.usersById[id];
    if (!userSession) return;
    delete this.usersById[id];
    delete this.usersByName[userSession.name];
}

// Represents a B2B active call
function CallMediaPipeline() {
    this.pipeline = null;
    this.webRtcEndpoint = {};
}

CallMediaPipeline.prototype.createPipeline = function (callerId, calleeId, ws, callback) {
    var self = this;
    getKurentoClient(function (error, kurentoClient) {
        if (error) {
            return callback(error);
        }

        kurentoClient.create('MediaPipeline', function (error, pipeline) {
            if (error) {
                return callback(error);
            }

            pipeline.create('WebRtcEndpoint', function (error, callerWebRtcEndpoint) {
                if (error) {
                    pipeline.release();
                    return callback(error);
                }

                if (candidatesQueue[callerId]) {
                    while (candidatesQueue[callerId].length) {
                        var candidate = candidatesQueue[callerId].shift();
                        callerWebRtcEndpoint.addIceCandidate(candidate);
                    }
                }

                callerWebRtcEndpoint.on('OnIceCandidate', function (event) {
                    var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                    userRegistry.getById(callerId).ws.send(JSON.stringify({
                        id: 'iceCandidate',
                        candidate: candidate
                    }));
                });

                pipeline.create('WebRtcEndpoint', function (error, calleeWebRtcEndpoint) {
                    if (error) {
                        pipeline.release();
                        return callback(error);
                    }

                    if (candidatesQueue[calleeId]) {
                        while (candidatesQueue[calleeId].length) {
                            var candidate = candidatesQueue[calleeId].shift();
                            calleeWebRtcEndpoint.addIceCandidate(candidate);
                        }
                    }

                    calleeWebRtcEndpoint.on('OnIceCandidate', function (event) {
                        var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                        userRegistry.getById(calleeId).ws.send(JSON.stringify({
                            id: 'iceCandidate',
                            candidate: candidate
                        }));
                    });

                    callerWebRtcEndpoint.connect(calleeWebRtcEndpoint, function (error) {
                        if (error) {
                            pipeline.release();
                            return callback(error);
                        }

                        calleeWebRtcEndpoint.connect(callerWebRtcEndpoint, function (error) {
                            if (error) {
                                pipeline.release();
                                return callback(error);
                            }
                        });

                        self.pipeline = pipeline;
                        self.webRtcEndpoint[callerId] = callerWebRtcEndpoint;
                        self.webRtcEndpoint[calleeId] = calleeWebRtcEndpoint;
                        callback(null);
                    });
                });
            });
        });
    })
}

CallMediaPipeline.prototype.generateSdpAnswer = function (id, sdpOffer, callback) {
    this.webRtcEndpoint[id].processOffer(sdpOffer, callback);
    this.webRtcEndpoint[id].gatherCandidates(function (error) {
        if (error) {
            return callback(error);
        }
    });
}

CallMediaPipeline.prototype.release = function () {
    if (this.pipeline) this.pipeline.release();
    this.pipeline = null;
}

/*
 * Server startup
 */

var asUrl = url.parse(argv.as_uri);
var port = asUrl.port;
var server = https.createServer(options, app).listen(port, function () {
    console.log('Kurento Tutorial started');
    console.log('Open ' + url.format(asUrl) + ' with a WebRTC capable browser');
});

var wss = new ws.Server({
    server: server,
    path: '/one2one'
});

wss.on('connection', function (ws) {
    var sessionId = nextUniqueId();
    console.log('Connection received with sessionId ' + sessionId);

    ws.on('error', function (error) {
        console.log('Connection ' + sessionId + ' error');
        stop(sessionId);
    });

    ws.on('close', function () {
        console.log('Connection ' + sessionId + ' closed');
        stop(sessionId);
        userRegistry.unregister(sessionId);
    });

    ws.on('message', function (_message) {
        var message = JSON.parse(_message);
        if (typeof message.event !== "undefined") message = JSON.parse(message.event);
        console.log(message.id, ' = Connection ' + sessionId + ' received message ', message);
        switch (message.id) {
            case 'register':
                register(sessionId, message.name, ws);
                break;

            case 'call':
                call(sessionId, message.to, message.from, message.sdpOffer, message.userData, ws);
                break;

            case 'incomingCallResponse':
                incomingCallResponse(sessionId, message.from, message.callResponse, message.sdpOffer, ws);
                break;

            case 'stop':
                stop(sessionId);
                break;

            case 'onIceCandidate':
                onIceCandidate(sessionId, message.candidate);
                break;

            default:
                ws.send(JSON.stringify({
                    id: 'error',
                    message: 'Invalid message ' + message
                }));
                break;
        }

    });
});

// Recover kurentoClient for the first time.
function getKurentoClient(callback) {
    if (kurentoClient !== null) {
        return callback(null, kurentoClient);
    }

    kurento(argv.ws_uri, function (error, _kurentoClient) {
        if (error) {
            var message = 'Coult not find media server at address ' + argv.ws_uri;
            return callback(message + ". Exiting with error " + error);
        }

        kurentoClient = _kurentoClient;
        callback(null, kurentoClient);
    });
}

function stop(sessionId) {

    console.log("Stop from server called ",sessionId);
    if (!pipelines[sessionId]) return; 

    var pipeline = pipelines[sessionId];
    delete pipelines[sessionId];
    pipeline.release();
    var stopperUser = userRegistry.getById(sessionId); 
    if (typeof stopperUser === "undefined" || stopperUser == null) console.log("stopperUser undefined ",sessionId);

    var stoppedUser = userRegistry.getByName(stopperUser.peer);
    stopperUser.peer = null;

    if (stoppedUser) {
        stoppedUser.peer = null;
        delete pipelines[stoppedUser.id];
        var message = {
            id: 'stopCommunication',
            message: 'remote user hanged out'
        }
        stoppedUser.sendMessage(message)
    }

    clearCandidatesQueue(sessionId);
}

function incomingCallResponse(calleeId, from, callResponse, calleeSdp, ws) {

    clearCandidatesQueue(calleeId);

    function onError(callerReason, calleeReason) {
        console.log('callerReason: ',callerReason);
        console.log('calleeReason: ',calleeReason);
        if (pipeline) pipeline.release();
        if (caller) {
            var callerMessage = {
                id: 'callResponse',
                response: 'rejected'
            }
            if (callerReason) callerMessage.message = callerReason;
            caller.sendMessage(callerMessage);
        }

        var calleeMessage = {
            id: 'stopCommunication'
        };
        if (calleeReason) calleeMessage.message = calleeReason;
        callee.sendMessage(calleeMessage);
    }

    var callee = userRegistry.getById(calleeId);
    if (typeof from === "undefined" || from == null) return onError(null, 'unknown from = ' + from);   

    var caller = userRegistry.getByName(from);
    if (typeof caller === "undefined" || caller==null) return onError(null, 'unknown caller = ' + caller); 

    if (callResponse === 'accept') {
        var pipeline = new CallMediaPipeline();
        pipelines[caller.id] = pipeline;
        pipelines[callee.id] = pipeline;

        pipeline.createPipeline(caller.id, callee.id, ws, function (error) {
            if (error) {
                return onError(error, error);
            }

            pipeline.generateSdpAnswer(caller.id, caller.sdpOffer, function (error, callerSdpAnswer) {
                if (error) {
                    return onError(error, error);
                }

                pipeline.generateSdpAnswer(callee.id, calleeSdp, function (error, calleeSdpAnswer) {
                    if (error) {
                        return onError(error, error);
                    }

                    var message = {
                        id: 'startCommunication',
                        sdpAnswer: calleeSdpAnswer
                    };
                    callee.sendMessage(message);

                    message = {
                        id: 'callResponse',
                        response: 'accepted',
                        sdpAnswer: callerSdpAnswer
                    };
                    caller.sendMessage(message);
                });
            });
        });
    } else {
        var decline = {
            id: 'callResponse',
            response: 'rejected',
            message: 'user declined'
        };
        caller.sendMessage(decline);
    }
}

function call(callerId, to, from, sdpOffer, userData,ws) {
    
    clearCandidatesQueue(callerId);

    var caller = userRegistry.getById(callerId);
    console.log('Checking caller1 ==================== ',caller);
    if(typeof caller !== 'object' || typeof caller.sdpOffer==="undefined"){
        caller = userRegistry.getByName(from);
        console.log('Checking caller2 ==================== ',caller);
        if(typeof caller !== 'object' || typeof caller.sdpOffer==="undefined"){
            userRegistry.register(new UserSession(callerId, from, ws));
            console.log('Registered in call');
        }
    }
    
    var rejectCause = 'User ' + to + ' is not registered';
    console.log(callerId, '===============================================Caller ', from, ' and callee ', to);
    if (userRegistry.getByName(to) && typeof caller === 'object' && typeof caller.sdpOffer!=="undefined") {
        var callee = userRegistry.getByName(to);
        caller.sdpOffer = sdpOffer
        callee.peer = from;
        caller.peer = to;
        var message = {
            id: 'incomingCall',
            from: from,
            userData: userData
        };

        if (userData && typeof userData.friendId !== "undefined") {
            let sendToSbs = 'sbsSite-' + userData.friendId;
            if (userRegistry.getByName(sendToSbs)) {
                let siteCallee = userRegistry.getByName(sendToSbs);
                siteCallee.peer = from;
                siteCallee.sendMessage(message);
            }
        } 

        console.log('Sending incomingCall ===========================================');
        try {
            return callee.sendMessage(message);
        } catch (exception) {
            rejectCause = "Error " + exception;
        }
    } 
    else console.log('Call else case =========');
    
    if(typeof caller !== 'object' || typeof caller.sdpOffer==="undefined"){
        console.log('caller.sdpOffer ',caller);
    }   
    else{
        var message = {
            id: 'callResponse',
            response: 'rejected: ',
            message: rejectCause
        };
        //console.log('Outside ',message,' caller ',caller);
        caller.sendMessage(message);
    }
    
}

function register(id, name, ws, callback) {
    function onError(error) {
        ws.send(JSON.stringify({
            id: 'registerResponse',
            response: 'rejected ',
            message: error
        }));
    }

    if (typeof name === 'undefined' || name=='') 
        return onError("empty user name ",name);
    

    let checkVal = userRegistry.getByName(name);
    if (checkVal && typeof checkVal !== "undefined") {
        console.log("User " + name + " is already registered");
        //return onError("User " + name + " is already registered");
    }

    userRegistry.register(new UserSession(id, name, ws));
    try {
        ws.send(JSON.stringify({
            id: 'registerResponse',
            response: 'accepted'
        }));
    } catch (exception) {
        onError(exception);
    }
}

function clearCandidatesQueue(sessionId) {
    if (candidatesQueue[sessionId]) {
        delete candidatesQueue[sessionId];
    }
}

function onIceCandidate(sessionId, _candidate) {
    var candidate = kurento.getComplexType('IceCandidate')(_candidate);
    var user = userRegistry.getById(sessionId);

    if (pipelines[user.id] && pipelines[user.id].webRtcEndpoint && pipelines[user.id].webRtcEndpoint[user.id]) {
        var webRtcEndpoint = pipelines[user.id].webRtcEndpoint[user.id];
        webRtcEndpoint.addIceCandidate(candidate);
    } else {
        if (!candidatesQueue[user.id]) {
            candidatesQueue[user.id] = [];
        }
        candidatesQueue[sessionId].push(candidate);
    }
}

app.use(express.static(path.join(__dirname, 'static')));