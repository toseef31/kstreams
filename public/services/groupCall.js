app.factory('GroupCall', ['$rootScope',
    function ($rootScope, $http) {
        /** CONFIG 
            $rootScope.signaling_socket for emit purpose
        **/
        var USE_AUDIO = true;
        var USE_VIDEO = true;
        var MUTE_AUDIO_BY_DEFAULT = false;

        /** You should probably use a different stun server doing commercial stuff **/
        /** Also see: https://gist.github.com/zziuni/3741933 **/
        /**
         * 
            {
                url: 'turn:turn.peekvideochat.com:3478?transport=udp',
                credential: '12345',
                username: 'peekinter'
            }
         */
        // var ICE_SERVERS = [
        //     {
        //         url: 'turn:178.128.19.180:3478?transport=udp',
        //         credential: '3d7d3ed8-838d-11e9-9a3a-7a7a3a22eac8',
        //         username: 'pl_zD4H7uQH7knjmjBXK999m6Y221Ytd08i3rN1_olJMgD21YRzzm9vlkQTrXwr0AAAAAFzw_yFsaW5rc2hhcmU='
        //     }
        // ];
        var ICE_SERVERS = [
            {
                url: 'turn:turn.peekvideochat.com:3478?transport=udp',
                credential: '12345',
                username: 'peekinter'
            }
        ];
        
        //$rootScope.signaling_socket = null;   /* our socket.io connection to our webserver */
        var local_media_stream = null; /* our own microphone / webcam */
        var peers = {};                /* keep track of our peer connections, indexed by peer_id (aka socket.io id) */
        var peer_media_elements = {};  /* keep track of our <video>/<audio> tags, indexed by peer_id */
        var tempUserdata = null;

        function init(userData, status = 0) {
            setup_local_media(userData, function () {
                tempUserdata = userData;
                /* once the user has given us access to their
                * microphone/camcorder, join the channel and start peering up */
                join_chat_channel(userData.groupId, userData, status);
            });
        }

        function sendMessage(message) {
           // console.log('Sending message from groupCall.js ', message);
            $rootScope.signaling_socket.$emit(JSON.stringify(message));
        }

        function join_chat_channel(channel, userdata, status = 0) {
        //    console.log('join_chat_channel');
            var message = {
                id: 'join',
                channel: channel,
                userdata: userdata
            }
            // status: 0- for caller,, 1- for joiner,, 2- caller stopped the call,, 3- joined user has left
            $.ajax({
                type: "POST",
                url: "/gCallStatus",
                data: { 'status': status, 'userdata': userdata }
            })

            sendMessage(message);
        }

        function part_chat_channel(channel) {
            var message = {
                id: 'part',
                channel: channel
            }
            sendMessage(message);
        }

        /** 
        * When we join a group, our signaling server will send out 'addPeer' events to each pair
        * of users in the group (creating a fully-connected graph of users, ie if there are 6 people
        * in the channel you will connect directly to the other 5, so there will be a total of 15 
        * connections in the network). 
        */
        //$rootScope.signaling_socket.on('addPeer', function (config) {
        function addPeerEmitted(config) {
          //  console.log('addPeerEmitted:', config);
            var peer_id = config.peer_id;
            if (peer_id in peers) {
                /* This could happen if the user joins multiple channels where the other peer is also in. */
              //  console.log("Already connected to peer ", peer_id);
                return;
            }
            var peer_connection = new RTCPeerConnection(
                { "iceServers": ICE_SERVERS },
                { "optional": [{ "DtlsSrtpKeyAgreement": true }] } /* this will no longer be needed by chrome
                                                                * eventually (supposedly), but is necessary 
                                                                * for now to get firefox to talk to chrome */
            );
            peers[peer_id] = peer_connection;
         //   console.log(peers);
            peer_connection.onicecandidate = function (event) {
              //  console.log("onicecandidate");
             //   console.log(event);
                if (event.candidate) {
                    var message = {
                        'id': 'relayICECandidate',
                        'peer_id': peer_id,
                        'ice_candidate': {
                            'sdpMLineIndex': event.candidate.sdpMLineIndex,
                            'candidate': event.candidate.candidate
                        }
                    };
                    sendMessage(message);
                }
            }
            peer_connection.onaddstream = function (event) {
               // console.log(event);
                var remote_media = USE_VIDEO ?
                    $("<video id='setId'>")
                        .add("<span id='setVideoName' class='groupCallVideos'>") :
                    $("<audio>");

                remote_media.attr("autoplay", "autoplay");
                if (MUTE_AUDIO_BY_DEFAULT) {
                    remote_media.attr("muted", "true");
                }
                remote_media.attr("controls", "");
                peer_media_elements[peer_id] = remote_media;
             //   console.log(peer_media_elements);
                let spanId = Math.floor(100000000 + Math.random() * 900000000);
                var spanTag = $(`<span id='${spanId}' class='groupCallVideoSpan'>`);
                $('.groupCallModalContent').append(spanTag);
                $('#' + spanId).append(remote_media);

                if (tempUserdata && tempUserdata.callerId == $rootScope.user._id) {
                    tempUserdata = null;
                    //  console.log("**** SOCKET CALLED ****");
                    // $.ajax({
                    //     type: "POST",
                    //     url: "/gCallStatus",
                    //     data: {'status': 4, 'spanId': spanId, 'name': $rootScope.user.name, 'id': $rootScope.user._id}
                    // })
                }

                event.stream.userName = $rootScope.user.name;
                attachMediaStream(remote_media[0], event.stream);
            }

            /* Add our local stream */
          //  console.log("addStream");

            peer_connection.addStream(local_media_stream);

            // console.log(local_media_stream);
            /* Only one side of the peer connection should create the
                * offer, the signaling server picks one to be the offerer. 
                * The other user will get a 'sessionDescription' event and will
                * create an offer, then send back an answer 'sessionDescription' to us
                */
            if (config.should_create_offer) {
                // console.log("Creating RTC offer to ", peer_id);
                peer_connection.createOffer(
                    function (local_description) {
                        peer_connection.setLocalDescription(local_description,
                            function () {
                                var message = {
                                    'id': 'relaySessionDescription',
                                    'peer_id': peer_id,
                                    'session_description': local_description
                                };
                                sendMessage(message);

                                // $rootScope.signaling_socket.emit('relaySessionDescription',
                                //     { 'peer_id': peer_id, 'session_description': local_description });
                            //    console.log("Offer setLocalDescription succeeded");
                            },
                            function () { Alert("Offer setLocalDescription failed!"); }
                        );
                    },
                    function (error) {
                        //   console.log("Error sending offer: ", error);
                    });
            }
        }


        /** 
         * Peers exchange session descriptions which contains information
         * about their audio / video settings and that sort of stuff. First
         * the 'offerer' sends a description to the 'answerer' (with type
         * "offer"), then the answerer sends one back (with type "answer").  
         */
        //$rootScope.signaling_socket.on('sessionDescription', function (config) {
        function sessionDescriptionEmitted(config) {
            // console.log('sessionDescriptionEmitted: ', config);
            var peer_id = config.peer_id;
            var peer = peers[peer_id];
            var remote_description = config.session_description;

            var desc = new RTCSessionDescription(remote_description);
            var stuff = peer.setRemoteDescription(desc,
                function () {
                    //  console.log("setRemoteDescription succeeded");
                    if (remote_description.type == "offer") {
                        // console.log("Creating answer");
                        peer.createAnswer(
                            function (local_description) {
                                peer.setLocalDescription(local_description,
                                    function () {
                                        var message = {
                                            'id': 'relaySessionDescription',
                                            'peer_id': peer_id,
                                            'session_description': local_description
                                        };
                                        sendMessage(message);
                                        // $rootScope.signaling_socket.emit('relaySessionDescription',
                                        //     { 'peer_id': peer_id, 'session_description': local_description });
                                     //   console.log("Answer setLocalDescription succeeded");
                                    },
                                    function () { Alert("Answer setLocalDescription failed!"); }
                                );
                            },
                            function (error) {
                                //  console.log("Error creating answer: ", error);
                                // console.log(peer);
                            });
                    }
                },
                function (error) {
                    // console.log("setRemoteDescription error: ", error);
                }
            );
            // console.log("Description Object: ", desc);
        }

        /**
         * The offerer will send a number of ICE Candidate blobs to the answerer so they 
         * can begin trying to find the best path to one another on the net.
         */
        //$rootScope.signaling_socket.on('iceCandidate', function (config) {
        function iceCandidateEmitted(config) {
         //   console.log("iceCandidateEmitted");
            var peer = peers[config.peer_id];
            var ice_candidate = config.ice_candidate;
            peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
        }


        /**
         * When a user leaves a channel (or is disconnected from the
         * signaling server) everyone will recieve a 'removePeer' message
         * telling them to trash the media channels they have open for those
         * that peer. If it was this client that left a channel, they'll also
         * receive the removePeers. If this client was disconnected, they
         * wont receive removePeers, but rather the
         * $rootScope.signaling_socket.on('disconnect') code will kick in and tear down
         * all the peer sessions.
         */
        //$rootScope.signaling_socket.on('removePeer', function (config) {
        function removePeerEmitted(config) {
            //  console.log('Signaling server said to remove peer:', config);
            var peer_id = config.peer_id;
            if (peer_id in peer_media_elements) {
                peer_media_elements[peer_id].remove();
            }
            if (peer_id in peers) {
                peers[peer_id].close();
            }

            delete peers[peer_id];
            delete peer_media_elements[peer_id];
        };

        // status: 2- means caller has stopped the call, 3- joined user has left the call
        function stop(userData = null, status = 2) {
            // console.log('$rootScope.signaling_socket ', $rootScope.signaling_socket);
            $rootScope.signaling_socket.$emit('disconnect');
            $(".groupCallModalContent").html('');

            // if already null then return otherwise will generate error
            if (local_media_stream == null) return;

            local_media_stream.getTracks().forEach(function (track) {
                track.stop();
            });
            // #parentVideo
            local_media_stream = null;

            if (status != -1) {
                $.ajax({
                    type: "POST",
                    url: "/gCallStatus",
                    data: { 'status': status, 'userdata': userData }
                })
            }
            //closeIt();
        }
        /***********************/
        /** Local media stuff **/
        /***********************/
        function setup_local_media(userData, callback, errorback) {
            //   console.log("setup_local_media 1");
            //   console.log(local_media_stream);
            if (local_media_stream != null) {  /* ie, if we've already been initialized */
                if (callback) callback();
                return;
            }
            /* Ask user for permission to use the computers microphone and/or camera, 
                * attach it to an <audio> or <video> tag if they give us access. */
            //  console.log("Requesting access to local audio / video inputs");
            //  console.log("setup_local_media 2");
            navigator.getUserMedia = (navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia);

            attachMediaStream = function (element, stream) {
                //  console.log("setup_local_media 3");
                //   console.log('DEPRECATED, attachMediaStream will soon be removed.');
                element.srcObject = stream;
            };
            //  console.log("setup_local_media 4");
            navigator.getUserMedia({ "audio": USE_AUDIO, "video": USE_VIDEO },
                function (stream) { /* user accepted access to a/v */
                    //("setup_local_media 5");
                    local_media_stream = stream;
                    local_media_stream.userData = userData;

                    var local_media = USE_VIDEO ? $("<video id='parentVideo'>")
                        .add("<span id='name' class='groupCallVideoName'>")
                        .append("") : $("<audio id='parentAudio'>");

                    // var local_media = USE_VIDEO ? $("<div>").append(
                    //     $("<video id='parentVideo'>").attr({autoplay:"autoplay", controls: ""}).append(
                    //         $("<span id='name'>").append(""+userData.name)
                    //     )
                    // ): $("<audio id='parentAudio'>");

                    local_media.attr("controls", "");
                    local_media.attr("autoplay", "autoplay");
                    //console.log(local_media);
                    //local_media.attr("muted", "true"); /* always mute ourselves by default */
                    //local_media.muted=true;
                    $('.groupCallModalContent').append(local_media);
                    document.getElementById("parentVideo").muted = true;
                    attachMediaStream(local_media[0], stream);
                    if (callback) callback();
                },
                function () { /* user denied access to a/v */
                  //  console.log("Access denied for audio/video");
                    $rootScope.updateGC();
                    alert("You choose not to provide access to the camera/microphone");
                    if (errorback) errorback();
                });
        }

        function closeIt() {
            /* Tear down all of our peer connections and remove all the
                * media divs when we disconnect */
            if (typeof peer_id === 'undefined' || !peer_id) return;
            // console.log('closeIt called ', peer_id);
            for (peer_id in peer_media_elements) peer_media_elements[peer_id].remove();
            for (peer_id in peers) peers[peer_id].close();
            peers = {};
            peer_media_elements = {};
        }

        function getGroupData() {
            var message = {
                id: 'groupData'
            };
            sendMessage(message);
        }
        return {
            init: init,
            setup_local_media: setup_local_media,
            stop: stop,
            closeIt: closeIt,
            removePeerEmitted: removePeerEmitted,
            iceCandidateEmitted: iceCandidateEmitted,
            sessionDescriptionEmitted: sessionDescriptionEmitted,
            addPeerEmitted: addPeerEmitted,
            getGroupData: getGroupData
        }
    }
]);