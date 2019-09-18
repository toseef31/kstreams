/*
 * (C) Copyright 2014-2015 Kurento (http://kurento.org/)
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
var url = require('url');
var express = require('express');
var minimist = require('minimist');
var ws = require('ws');
var kurento = require('kurento-client');
var fs    = require('fs');
var https = require('https');
//searchbysearch.com
//localhost
var argv = minimist(process.argv.slice(2), {
    default: {
        as_uri: "https://www.jobcallme.com:8444/", //www.jobcallme.com / www.businesschatapp.com / localhost
        ws_uri: "ws://localhost:8888/kurento"
    }
});

var options =
{
	key:  fs.readFileSync('../../../private/ssl.key'),
    cert: fs.readFileSync('../../../private/ssl.crt')
};

var app = express();

/*
 * Definition of global variables.
 */
var idCounter = 0;
var candidatesQueue = {};
var kurentoClient = null;
var presenter = []; 
var viewers = [];
var noPresenterMessage = 'No active presenter. Try again later...';

/*
 * Server startup
 */
var asUrl = url.parse(argv.as_uri);
var port = asUrl.port;
var server = https.createServer(options, app).listen(port, function() {
    console.log('Kurento Tutorial started');
    console.log('Open ' + url.format(asUrl) + ' with a WebRTC capable browser');
});

var wss = new ws.Server({
    server : server,
    path : '/one2many'
});

function nextUniqueId() {
	idCounter++;
	return idCounter.toString();
}

/*
 * Management of WebSocket messages
 */
wss.on('connection', function(ws) {

	var sessionId = nextUniqueId();
	console.log('Connection received with sessionId ' + sessionId);

    ws.on('error', function(error) {
        console.log('Connection ' + sessionId + ' error');
        stop(sessionId);
    });

    ws.on('close', function() {
        console.log('Connection ' + sessionId + ' closed');
        stop(sessionId);
    });

    ws.on('message', function(_message) {
        var message = JSON.parse(_message); 
        if(typeof message.event!=="undefined") message=JSON.parse(message.event);
        switch (message.id) {
			case 'presenter':
				startPresenter(sessionId, ws, message, function(error, sdpAnswer) {
					if (error) {
						return ws.send(JSON.stringify({
							id : 'presenterResponse',
							response : 'rejected',
							message : error
						}));
					}
					
					ws.send(JSON.stringify({
						id : 'presenterResponse',
						response : 'accepted',
						sdpAnswer : sdpAnswer, 
					})); 
					
				});
				break;
			case 'presenterData':
					let presArr=[];
					for (var i in presenter) presArr.push({
						'preId':presenter[i].preId,
						'preName':presenter[i].preName,
						'password':presenter[i].password
					});
					
					ws.send(JSON.stringify({
						id : 'presenterDataResp', 
						data : presArr
					}));
				break;
			case 'viewer': 
				startViewer(sessionId, ws,message.sdpOffer,message.preId, function(error, sdpAnswer) {
					if (error) {
						return ws.send(JSON.stringify({
							id : 'viewerResponse',
							response : 'rejected',
							message : error
						}));
					}

					ws.send(JSON.stringify({
						id : 'viewerResponse',
						response : 'accepted',
						sdpAnswer : sdpAnswer
					}));
				});
				break;
			case 'stop':
				stop(sessionId);
				break;
			case 'onIceCandidate': 
				onIceCandidate(sessionId, message.candidate);
				break; 
			default:
				ws.send(JSON.stringify({
					id : 'error',
					message : 'Invalid message ' + message
				}));
            break;
        }
	}); 
	
});

/*
 * Definition of functions
 */

// Recover kurentoClient for the first time.
function getKurentoClient(callback) {
    if (kurentoClient !== null) {
        return callback(null, kurentoClient);
    }

    kurento(argv.ws_uri, function(error, _kurentoClient) {
        if (error) {
            console.log("Could not find media server at address " + argv.ws_uri);
            return callback("Could not find media server at address" + argv.ws_uri
                    + ". Exiting with error " + error);
        }

        kurentoClient = _kurentoClient;
        callback(null, kurentoClient);
    });
}

function startPresenter(sessionId, ws, message, callback) {
	var sdpOffer=message.sdpOffer;  
	clearCandidatesQueue(sessionId); 
 
	for (var i in presenter){
		if(presenter[i].preId==message.preId){
			if(presenter[i].pipeline) presenter[i].pipeline.release(); 
			presenter.splice(i, 1);
		}
	}

	console.log('Presenter registering ',message.preId);
	 
	presenter[sessionId]={
		id : sessionId,
		pipeline : null,
		webRtcEndpoint : null,
		preId:message.preId,
		preName:message.preName,
		password:message.password
	};
	 
	getKurentoClient(function(error, kurentoClient) {
		if (error) {
			stop(sessionId);
			return callback(error);
		}

		if (presenter.length==0) {
			stop(sessionId);
			return callback(noPresenterMessage);
		}

		kurentoClient.create('MediaPipeline', function(error, pipeline) {
			if (error) {
				stop(sessionId);
				return callback(error);
			}

			if (presenter.length==0) {
				stop(sessionId);
				return callback(noPresenterMessage);
			}

			presenter[sessionId].pipeline = pipeline;
			pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
				if (error) {
					stop(sessionId);
					return callback(error);
				}

				if (presenter.length==0) {
					stop(sessionId);
					return callback(noPresenterMessage);
				}

				presenter[sessionId].webRtcEndpoint = webRtcEndpoint;

                if (candidatesQueue[sessionId]) {
                    while(candidatesQueue[sessionId].length) {
                        var candidate = candidatesQueue[sessionId].shift();
                        webRtcEndpoint.addIceCandidate(candidate);
                    }
                }

                webRtcEndpoint.on('OnIceCandidate', function(event) {
                    var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
                    ws.send(JSON.stringify({
                        id : 'iceCandidate',
                        candidate : candidate
                    }));
                });

				webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer) {
					if (error) {
						stop(sessionId);
						return callback(error);
					}

					if (presenter.length==0) {
						stop(sessionId);
						return callback(noPresenterMessage);
					}

					callback(null, sdpAnswer);
				});

                webRtcEndpoint.gatherCandidates(function(error) {
                    if (error) {
                        stop(sessionId);
                        return callback(error);
                    }
                });
            });
        });
	});
}

function startViewer(sessionId, ws, sdpOffer,preId, callback) {
	clearCandidatesQueue(sessionId);

	if (presenter.length==0) {
		stop(sessionId);
		return callback(noPresenterMessage);
	}
	console.log('Presenter length',presenter.length);

	var currPreIndex=0;
	for (let i in presenter)
		if (presenter[i].preId ==preId) {
			currPreIndex=i;
			break;
		}
	 
	if(currPreIndex==0) return 'Could not find presenter'; 
	presenter[currPreIndex].pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
		if (error) {
			stop(sessionId);
			return callback(error);
		}
		viewers[sessionId] = {
			"webRtcEndpoint" : webRtcEndpoint,
			"ws" : ws
		}

		if (presenter.length==0) {
			stop(sessionId);
			return callback(noPresenterMessage);
		}

		if (candidatesQueue[sessionId]) {
			while(candidatesQueue[sessionId].length) {
				var candidate = candidatesQueue[sessionId].shift();
				webRtcEndpoint.addIceCandidate(candidate);
			}
		}

        webRtcEndpoint.on('OnIceCandidate', function(event) {
            var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
            ws.send(JSON.stringify({
                id : 'iceCandidate',
                candidate : candidate
            }));
        });

		webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer) {
			if (error) {
				stop(sessionId);
				return callback(error);
			}
			if (presenter.length==0) {
				stop(sessionId);
				return callback(noPresenterMessage);
			}
			
			presenter[currPreIndex].webRtcEndpoint.connect(webRtcEndpoint, function(error) {
				if (error) {
					stop(sessionId);
					return callback(error);
				}
				if (presenter.length==0) {
					stop(sessionId);
					return callback(noPresenterMessage);
				}

				callback(null, sdpAnswer);
		        webRtcEndpoint.gatherCandidates(function(error) {
		            if (error) {
			            stop(sessionId);
			            return callback(error);
		            }
		        });
		    });
	    });
	});
}

function clearCandidatesQueue(sessionId) {
	if (candidatesQueue[sessionId]) {
		delete candidatesQueue[sessionId];
	}
}

function stop(sessionId) {
	if (presenter.length>0 && presenter[sessionId] && presenter[sessionId].pipeline) {
		for (var i in viewers) {
			var viewer = viewers[i];
			if (viewer.ws) {
				viewer.ws.send(JSON.stringify({
					id : 'stopCommunication'
				}));
			}
		}
		console.log('Stoping presenter ',presenter[sessionId].id,' and ',sessionId);
		presenter[sessionId].pipeline.release(); 
		presenter.splice(sessionId, 1);
		viewers = []; 
	} else if (viewers[sessionId]) {
		viewers[sessionId].webRtcEndpoint.release();
		delete viewers[sessionId];
	}

	clearCandidatesQueue(sessionId);

	// if (viewers.length < 1 && !presenter) {
    //     console.log('Closing kurento client');
    //     kurentoClient.close();
    //     kurentoClient = null;
    // }
}

function onIceCandidate(sessionId, _candidate) {
    var candidate = kurento.getComplexType('IceCandidate')(_candidate);

    if (presenter.length>0 && presenter[sessionId] && presenter[sessionId].id === sessionId && presenter[sessionId].webRtcEndpoint) {
        console.info('Sending presenter candidate');
        presenter[sessionId].webRtcEndpoint.addIceCandidate(candidate);
    }
    else if (viewers[sessionId] && viewers[sessionId].webRtcEndpoint) {
        console.info('Sending viewer candidate');
        viewers[sessionId].webRtcEndpoint.addIceCandidate(candidate);
    }
    else {
        console.info('Queueing candidate');
        if (!candidatesQueue[sessionId]) {
            candidatesQueue[sessionId] = [];
        }
        candidatesQueue[sessionId].push(candidate);
    }
} 

app.use(express.static(path.join(__dirname, 'static')));
