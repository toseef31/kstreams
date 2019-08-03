app.controller("dashController", function ($scope, $http, $window, $location, $rootScope, $uibModal) {
    $scope.isGroupSelected = 0;
    $scope.selectedGroupId = 0;
    $scope.backPressed = false;
    $scope.usersLoaded = false;
    $scope.groupsLoaded = false;
    $scope.chatLoaded = false;
    $scope.isChatPanel = false;
    $scope.isSidePanel = true;
    $scope.nchatIndex = 0;
    $scope.gchatIndex = 1;
    $scope.loggedUserId = 0;
    /*save with whom user are chatting*/
    $scope.chatWith = '';
    $scope.chatWithId = '';
    /*save all chats */
    $scope.chats = [];
    $scope.groupchats = [];
    $scope.groupChat = false;
    $scope.allGroups;
    $scope.editMsgIconStatus = false;
    /*socket io connection*/

    $scope.audio = new Audio('audio/call.mp3');
    $scope.ringbell = new Audio('audio/ring_bells.mp3');
    // KURENTO WebRtc functions  ======================================================
    $scope.callCancelTimmer = '';
    $scope.webRtcPeer = null;
    const NO_CALL = 0;
    const PROCESSING_CALL = 1;
    const IN_CALL = 2;
    var callState = 0
    $scope.timmerObj = new timmer('#timmer');
    $scope.inComCallData = 0;
    $scope.setCallState = function (nextState) {
        switch (nextState) {
            case NO_CALL:
                $('#videoCall').attr('disabled', false);
                $('#terminate').attr('disabled', true);
                break;

            case PROCESSING_CALL:
                $('#videoCall').attr('disabled', true);
                $('#terminate').attr('disabled', true);
                break;
            case IN_CALL:
                $('#videoCall').attr('disabled', true);
                $('#terminate').attr('disabled', false);
                break;
            default:
                return;
        }

        callState = nextState;
    }



    function onIceCandidate(candidate) {
        console.log('Local candidate' + JSON.stringify(candidate));

        var message = {
            id: 'onIceCandidate',
            candidate: candidate
        }
        $scope.sendKMessage(message);
    }

    let hostIs = location.host.split(':');
    let webSocketIp = 'kstreams.com';  //localhost || kstreams.com
    if (hostIs[0] == 'localhost') webSocketIp = '127.0.0.1';
    class Ws {
        get newClientPromise() {
            return new Promise((resolve, reject) => {

                let wsClient = new WebSocket('wss://' + webSocketIp + ':8443/one2one');
                console.log(wsClient)
                wsClient.onopen = () => {
                    console.log("connected");
                    resolve(wsClient);
                };
                wsClient.onerror = error => reject(error);
            })
        }
        get clientPromise() {
            if (!this.promise) {
                this.promise = this.newClientPromise
            }
            return this.promise;
        }
    }
    $scope.wsSingleton = new Ws();

    $scope.sendKMessage = function (message) {
        var jsonMessage = JSON.stringify(message);
        console.log('Senging message: ' + jsonMessage);
        //console.log(webSokt.readyState ,' check state b ',webSokt.OPEN);
        //webSokt.send(jsonMessage);
        $scope.wsSingleton.clientPromise
            .then(wsClient => {
                wsClient.send(jsonMessage);
                console.log('sendKMessage sent');


                wsClient.onmessage = function (message) {
                    var parsedMessage = JSON.parse(message.data);
                    console.info('Received message: ' + message.data);

                    switch (parsedMessage.id) {
                        case 'registerResponse':
                            //resgisterResponse(parsedMessage);
                            break;
                        case 'callResponse':
                            callResponse(parsedMessage);
                            break;
                        case 'incomingCall':
                            incomingCall(parsedMessage);
                            break;
                        case 'startCommunication':
                            startCommunication(parsedMessage);
                            break;
                        case 'stopCommunication':
                            console.info("Communication ended by remote peer");
                            console.log('Calling stop from 5');
                            $scope.stopK(true);
                            break;
                        case 'iceCandidate':
                            $scope.webRtcPeer.addIceCandidate(parsedMessage.candidate)
                            break;
                        default:
                            console.error('Unrecognized message', parsedMessage);
                    }
                }
            })
            .catch(error => console.log('WS send error: ', error))
    }

    function callResponse(message) {
        if (message.response != 'accepted') {
            console.info('Call not accepted by peer. Closing call');
            var errorMessage = message.message ? message.message
                : 'Unknown reason for call rejection.';
            console.log(errorMessage);
            console.log('Calling stop from 6');
            $scope.stopK(true);
        } else {
            $scope.setCallState(IN_CALL);
            $scope.webRtcPeer.processAnswer(message.sdpAnswer);
        }
    }

    $scope.stopK = function (message, friendId = 0) {
        $scope.setCallState(NO_CALL);
        console.log('stopK Stopping ', $scope.webRtcPeer);
        if ($scope.webRtcPeer) {
            $scope.webRtcPeer.dispose();
            $scope.webRtcPeer = null;
            console.log('Inside stopK ', message);
            if (!message) {
                var message = { id: 'stop' }
                $scope.sendKMessage(message);
            }
        }
        $scope.disconnect(friendId);
    };

    function incomingCall(message) {
        // If bussy just reject without disturbing user
        console.log('incomingCall ', callState, ' and ', NO_CALL);
        if (callState != NO_CALL) {
            var response = {
                id: 'incomingCallResponse',
                from: message.from,
                callResponse: 'reject',
                message: 'bussy'

            };
            return $scope.sendKMessage(response);
        }

        $scope.showVideo = true;
        $scope.openVoice = true;
        console.log('incomingCall ', message.userData);
        $scope.setCallState(PROCESSING_CALL);

        // if ('serviceWorker' in navigator) {
        //     send(message.userData.callerName +' is calling').catch(err => console.log('incomingCall ',err));
        // }
        $scope.toggleBtn(true);
        //$scope.busy               = true;

        //$scope.reveiveGroupCall   = false;
        $scope.receiveGroupCallId = ''
        $scope.callerId = message.userData.callerId;
        $scope.friendId = message.userData.friendId;
        $scope.callType = message.userData.callType;
        $scope.audio.loop = true;
        $scope.audio.play();
        document.getElementById('incommingCall').style.display = 'block';
        document.getElementById('callerName').innerHTML = message.userData.callerName;
        $scope.inComCallData = message;

        if ($scope.callType == 1) $scope.timmerObj = new timmer('#audioTimmer');
        else $scope.timmerObj = new timmer('#timmer');
    }

    $scope.startCall = function () {
        let localAsset = document.getElementById('local-video');
        let remoteAsset = document.getElementById('videoOutput');
        let medConst = {};

        if ($scope.callType == 1) {
            localAsset = document.getElementById('audioInput');
            remoteAsset = document.getElementById('audioOutput');
            medConst = {
                mediaConstraints: {
                    audio: true,
                    video: false
                }
            };
        }
        var options = {
            localVideo: localAsset,
            remoteVideo: remoteAsset,
            onicecandidate: onIceCandidate, medConst
        }
        $scope.webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
            function (error) {
                if (error) {
                    console.error(error);
                    $scope.setCallState(NO_CALL);
                }

                this.generateOffer(function (error, offerSdp) {
                    if (error) {
                        console.error(error);
                        $scope.setCallState(NO_CALL);
                    }

                    var response = {
                        id: 'incomingCallResponse',
                        from: $scope.inComCallData.from,
                        callResponse: 'accept',
                        sdpOffer: offerSdp
                    };
                    $scope.sendKMessage(response);
                });
            });
    }

    $scope.stopCall = function () {
        var response = {
            id: 'incomingCallResponse',
            from: $scope.inComCallData.from,
            callResponse: 'reject',
            message: 'user declined'
        };
        $scope.sendKMessage(response);
        $scope.stopK(true);
    }

    function videoKCall(from, to, userData, isAudio) {
        $scope.setCallState(PROCESSING_CALL);
        let localAsset = document.getElementById('local-video');
        let remoteAsset = document.getElementById('videoOutput');
        let medConst = {};

        if (isAudio == 1) {
            localAsset = document.getElementById('audioInput');
            remoteAsset = document.getElementById('audioOutput');
            medConst = {
                mediaConstraints: {
                    audio: true,
                    video: false
                }
            };
        }
        var options = {
            localVideo: localAsset,
            remoteVideo: remoteAsset,
            onicecandidate: onIceCandidate, medConst
        }

        console.log('videoKCall ', options);

        $scope.webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function (error) {
            if (error) {
                console.error(error);
                $scope.setCallState(NO_CALL);
            }

            this.generateOffer(function (error, offerSdp) {
                if (error) {
                    console.error(error);
                    $scope.setCallState(NO_CALL);
                }

                var message = {
                    id: 'call',
                    from: from,
                    to: to,
                    userData: userData,
                    sdpOffer: offerSdp
                };
                //if(isAudio!=1) message['sdpOffer']=offerSdp;
                //console.log('videoKCall2 ',message);
                $scope.sendKMessage(message);
            });
        });
    }

    function startCommunication(message) {
        $scope.setCallState(IN_CALL);
        $scope.webRtcPeer.processAnswer(message.sdpAnswer);
    }

    $scope.showVideo = true;
    $scope.toggelVideo = function () {
        $scope.showVideo = !$scope.showVideo;
        $scope.webRtcPeer.getLocalStream().getVideoTracks()[0].enabled = $scope.showVideo;
    };

    $scope.openVoice = true;
    $scope.toggelMute = function () {
        $scope.openVoice = !$scope.openVoice;
        $scope.webRtcPeer.getLocalStream().getAudioTracks()[0].enabled = $scope.openVoice;
    };

    // Kurento webrtc functions end================================================
    /*check session of the user if he is logged in or not*/
  
    
    $http({
        method: 'GET',
        url: '/get',
        xhrFields: { withCredentials: true }
    }).then(function successCallback(response) {
        $scope.loggedUserId = response.data._id;
        $scope.check = function (event) {
            console.log(event);
        }
        /*login user */
        /* store video of calling sound*/

        $scope.usersInGroup = 1;
        $scope.countGroupMembers = 1;
        $scope.groupOrUser = '';
        $rootScope.user = response.data;

        // Registering user with kurento start 
        var jsonMessage = {
            id: 'register',
            name: $rootScope.user._id
        };
        console.log('Registering client: ' + jsonMessage);
        $scope.sendKMessage(jsonMessage);
        //end
        $scope.setCallState(NO_CALL);
        //$scope.busy              = false; // true then the user is on the call
        $scope.chatIsActive = true;
        //$scope.groupIsActive     = false;
        // $scope.reveiveGroupCall  = false;
        $scope.receiveCall = false;
        //$scope.liveStream        = false;
        $scope.welcomePage = true;
        $scope.caller = false;
        $scope.getmembers = [];
        $scope.files = [];
        /*get user image*/
        // $http.get($scope.sbsLink+"api/getUserinfo/"+response.data.userId)
        //     .then(function(response) {
        //     });

        // $http.get('/checkSession/'+ $scope.user._id).then(function (res) {
             
        // })

        /*get all users*/
        $http.get("/getUsers/" + response.data._id)
        .then(function (response) {
     $scope.allUsers = response.data;
                for (i = 0; i < response.data.length; i++) {
                    if (response.data[i].email != $scope.user.email) {
                        $scope.getmembers.push(response.data[i]);
                    }
                }
                $scope.usersLoaded = true;
        });

        /*get all group users*/
        $http.get("/getCreatedGroups/"+$scope.user._id)
        .then(function (response) { 
             $scope.allGroups = response.data;
             $scope.groupsLoaded = true;
             // for (i = 0; i < response.data.length; i++) {
             //     if (response.data[i].email != $scope.user.email) {
             //         $scope.getmembers.push(response.data[i]);
             //     }
             // } 
        });

        $scope.check = function (user) {
            return user.email != $scope.user.email;
        };
        $scope.remove = function (index) {
            var files = [];
            angular.forEach($scope.files, function (file, key) {
                if (index != key) {
                    files.push(file);
                }
                $scope.files = files;
            })
        }

        $scope.upload = function () {
            var fd = new FormData();
            angular.forEach($scope.files, function (file) {
                fd.append('avatar', file); // when previwe on then file.file
            })
            fd.append('senderId', $scope.user._id);
            fd.append('senderName', $scope.user.name);

            if ($scope.chatIsActive === true) {
               
                fd.append('friendId', $scope.chatWithId);   //chnId 1
                $http.post('/chatFilesShare', fd, {
                    transformRequest: angular.identity,
                    headers: { 'Content-Type': undefined }
                }).then(function (d) {
                    updatechat();
                })
            }
            // else if ($scope.chatIsActive === false && $scope.groupeIsActive === true){
            //      console.log("group");
            // }
            else {
                fd.append('id', $scope.connectionId);
                fd.append('name', $scope.user.name);
                $http.post('/groupFilesShare', fd, {
                    transformRequest: angular.identity,
                    headers: { 'Content-Type': undefined }
                }).then(function (d) {
                    $http.post('/getgroupchat', { id: $scope.connectionId }).then((res) => {
                        $scope.chats = res.data[0].message;
                        socket.emit('updateGroupFiles', { members: res.data[0].members, messages: res.data[0].message });
                        scrollbottom();
                    })
                })
            }

        }
        socket.on('updateOtherMembersFiles', function (data) {
            $scope.$apply(() => {
                for (var i = 0; i < data.members.length; i++) {
                    if (data.members[i].id == $scope.user._id) {
                        $scope.chats = data.messages;
                    }
                }
            });
        })
        /*get All groups*/
        // $http.get("/getGroups/"+$rootScope.user._id)
        //     .then(function(response) {
        //         $scope.allGroups = response.data;
        //     });
        /*get All notifications*/
        $http.get("/getNotification/" + $rootScope.user._id)
            .then(function (response) {
                $scope.notifications = response.data.noti;
                $scope.notiCount = response.data.count;
            });

        $scope.groupeActive = function () {
            //$scope.chatIsActive = false;
            $scope.groupeIsActive = true;
            $scope.isChatPanel = true; 
        }

        $scope.chatActive = function (index) {
            $scope.nchatIndex==0;  $scope.gchatIndex==1;
            $scope.isGroupSelected= 0;
            $scope.groupChat = false;
            $scope.groupeIsActive = false;
            $scope.chatIsActive = true;
            $scope.groupSelected=false;
            // console.log("n: "+$scope.nchatIndex + ", g: " + $scope.gchatIndex);
        }

        $scope.groupChatActive = function () {
            $scope.nchatIndex==1;  $scope.gchatIndex==0;
            $scope.isGroupSelected= 1;
            $scope.groupChat = true;
            $scope.chatIsActive = false;
            $scope.groupeIsActive = true;
            $scope.groupSelected=true; 
            // console.log("n: "+$scope.nchatIndex + ", g: " + $scope.gchatIndex);
        }

        $scope.chatBack = function (){
           $scope.isChatPanel = false;
           $scope.isSidePanel = true;
           $scope.welcomePage = true;
           $scope.backPressed = true;

        //    console.log("n: "+$scope.nchatIndex + ", g: " + $scope.gchatIndex);
        }

        // $scope.getDataCustomFromSelect = function(selectName) {
        //     var v = document.querySelector('select[name="' + selectName + '"]')
        //       .getAttribute('index');
        //     console.log(v);
        //   }


        $scope.groupSelected=false;
        /*on click on a user this function get chat between them*/
        $scope.startChat = function (obj) {
            $scope.isSidePanel = false;  $scope.isChatPanel = true;
            $scope.isGroupSelected= 1;
            $scope.welcomePage = false;
            /*obj is an object send from view it may be a chat or a group info*/
            if (obj.type == 'chat') {
                $scope.groupSelected=false;
                $scope.selGrpMembers=[];
                $scope.sendType = 'chat';
                $scope.selUserName = obj.user.name;
                $scope.chatWithImage = obj.user.user_image;
                $scope.chatWithId = obj.user._id;
                socket.emit('change_username', { username: $rootScope.user.name, rcv_id: $scope.chatWithId });
                $scope.status = obj.user.status;
                $scope.connectionId = $scope.chatWithId; 

                //chnId 3
                $http.get('/getChat/' + $scope.user._id + '/' + $scope.chatWithId)
                .then(function (res) { 
                    $scope.groupMembers = '';
                    $scope.chats = res.data;
                    scrollbottom();
                });
            } else {  
               // $scope.groupChat = true;
               
                $scope.groupSelected=true;
                $scope.selectedGroupId = obj.group._id;
                $scope.sendType = 'group';
                $scope.connectionId = obj.group._id;
                $scope.selGroupName = obj.group.name;
                $scope.selGrpMembers=obj.group.members;
                $scope.status = ''; 
               
                $http.get('/getGroup/' + obj.group._id).then(function (groupchat) { 
                    $scope.groupchats = groupchat.data; 
                    scrollbottom();
                }) 
            }
        }
        $scope.seenNotification = () => {
            $http.post('/notificationseen', { userId: $scope.user._id }).then(function (data) {
                $scope.notiCount = 0;
            });
        }
        /* to show edit menu popup on right click on a message*/
        $scope.editMenu = function (chat) {
            $scope.editMsgIconStatus = true;
            $scope.editMsgId = chat._id;
            $rootScope.editMsgMenu1 = ($rootScope.editMsgMenu1) ? false : true;
            $scope.msgEdit = chat.message;
        }
        /* to edit message */
        $scope.editMsg = function () {
            $scope.edit = true;
            $scope.message = $scope.msgEdit;
            var ele = $('#sendMsg').emojioneArea();
            ele[0].emojioneArea.setText($scope.message);
            $rootScope.editMsgMenu1 = false;
        }
        /* disconnect the call*/
        $scope.leaveRoom = function () {
            $scope.ringbell.pause(); 
            $scope.timmerObj.stopCallTimmer(); 
            document.querySelector('.videoTab').style.display = 'none';
            document.querySelector('.audioTab').style.display = 'none';
        }

        /*disconnect the call from user side who hit the disconnect button*/
        $scope.disconnect = function (friendId) {
            //$scope.busy = false;
            $scope.setCallState(NO_CALL);
            $scope.receiveCall = false;
            $scope.leaveRoom();
            $scope.toggleBtn(false);
            if ($scope.caller == true) {
                $scope.callCancelTimmer.stopCallTimmer();
                $scope.caller = false;
            }
            //console.log(friendId,' hm ',$scope.reveiveGroupCall,' hm ',$scope.liveStream);
            if (friendId)
                socket.emit('calldisconnect', { friendId: friendId });
        }
        /*disconnect the call from other side through socket io*/
        socket.on('calldis', function (data) {
            if (data.friendId == $scope.user._id) {
                //$scope.busy = false;
                $scope.setCallState(NO_CALL);
                $scope.toggleBtn(false);
                if ($scope.receiveCall == false) {
                    $scope.audio.pause();
                    document.getElementById('incommingCall').style.display = 'none';
                } else {
                    $scope.leaveRoom();
                    $scope.receiveCall = false;
                }
                $scope.stopK();
            }
        })
        /* send message to the user group and chat both handle in this function through sendType*/
        $scope.sendMessage = function (sendType, message = 0, chkmsg = 0) {
            if (!$scope.message && chkmsg) $scope.message = chkmsg;
            else if (!$scope.message && !chkmsg) return;

            if (sendType == 'chat') {
                if (message != 0) 
                    $scope.message = 'call duration ' + $scope.timmerObj.showTime();
                 
                if ($scope.edit === true)
                    $http.post('/updateChat/' + $scope.editMsgId, { "message": $scope.message })
                    .then(function (res) {
                        $scope.message = '';
                        $scope.editMsgId = '';
                        $scope.edit = false;
                        updatechat();
                        var ele = $('#sendMsg').emojioneArea();
                        ele[0].emojioneArea.setText(''); 
                    })
                else
                    $http.post('/chat', {"isGroup":0, "senderId": $scope.user._id, "senderImage": $scope.user.user_image, "receiverImage": $scope.chatWithImage, "recevierId": $scope.chatWithId, "senderName": $scope.user.name, "message": $scope.message })
                    .then(function (res) {
                        if (res.data.length < 1) return;
                        $scope.message = ''; 
                        $scope.chats.push(res.data);
                        socket.emit('checkmsg', res.data); 
                        scrollbottom();
                        var ele = $('#sendMsg').emojioneArea();
                        ele[0].emojioneArea.setText('');
                    }) 
            } else {
                if ($scope.edit === true) 
                    $http.post('/updateGroupChat/' + $scope.editMsgId, { "message": $scope.message, groupId: $scope.connectionId })
                    .then(function (res) {
                        $scope.message = '';
                        $scope.editMsgId = '';
                        $scope.edit = false;
                        var ele = $('#sendMsg').emojioneArea();
                        ele[0].emojioneArea.setText('');
                        socket.emit('updateGroupChat', {data: res.data, case: 'del' });
                    })
                else 
                    $http.post('/groupChat', {"isGroup":1, "senderId": $scope.user._id, name: $scope.user.name, "message": $scope.message, id: $scope.connectionId })
                    .then(function (res) {
                        var last = res.data.message.length - 1;
                        var data = res.data.message[last];
                        $scope.message = '';
                        socket.emit('updateGroupChat', { id: res.data._id, data: res.data, case: 'nodel' });
                        scrollbottom();
                        var ele = $('#sendMsg').emojioneArea();
                        ele[0].emojioneArea.setText('');
                    }) 
            }
        }
        /*this array save group members*/
        $scope.members = [];
        /*to create new group*/
        $scope.addgroup = function () {
            $scope.members.push($scope.user);
            $http.post('/addgroup', { 'groupName': $scope.groupName, 'members': $scope.members }).then(function (res) {
                $scope.groupName = '';
                $scope.members = '';
            });
        }

        $scope.disableMsgEdit = function (){
            console.log("disableMsgEdit");
            if($scope.editMsgIconStatus)
                $rootScope.editMsgMenu1 = false;
        }
          
        /*logout the user and destroy the session*/
        $scope.logout = function () {
            
           $http.get('/logout/'+$scope.loggedUserId).then(function (res) {
                if (res.data.msg == "session destroy") {
                    $scope.user = undefined;
                    $location.path('/');
                }
            })
        }
        /* this function enable or disable the btns when the call receive or drop*/
        $scope.toggleBtn = function (bolean) {
            $('#call').prop('disabled', bolean);
            $('#videoCall').prop('disabled', bolean);
            $('#live').prop('disabled', bolean);
        }

        /* video calling functionality*/
        $scope.videoCall = function (type, callerId) {

            if (type == 1) {
                $scope.timmerObj = new timmer('#audioTimmer');
                document.querySelector('.audioTab').style.display = 'block';
            }
            else {
                $scope.timmerObj = new timmer('#timmer');
                document.querySelector('.videoTab').style.display = 'block';
            }

            $scope.toggleBtn(true);
            //$scope.busy   = true; // it means the user is on a call no one call this user this time 
            $scope.caller = true;
            $scope.ringbell.loop = true;
            $scope.ringbell.play();
            if ($scope.chatIsActive == true) {
                $scope.showVideo = true;
                $scope.openVoice = true;
                console.log('from ', $scope.user._id, ' to ', $scope.chatWithId);
                let userData = { friendId: $scope.chatWithId, callerName: $scope.user.name, callerId: $scope.user._id, callType: type };
                videoKCall($scope.user._id, $scope.chatWithId, userData, type);
                $scope.callCancelTimmer = new timmer('#checker');
                $scope.callCancelTimmer.startCallTimmer(); 
            } 
        }
        /* this is the main function call after time up and no one receive the call*/
        $scope.dropCall = function () { 
            $scope.callDropAfterTime($scope.chatWithId, $scope.user._id); 
        }
        /* this function drop the group call after times up and no one receive call*/
        $scope.dropGroupCallAfterTime = function (members, callerId) {
            //$scope.busy = false;
            $scope.setCallState(NO_CALL);
            $scope.toggleBtn(false);
            $scope.leaveRoom();
            socket.emit('dropTheGroupCall', { members, members, callerId: callerId });
        }
        /* this function drop the call after times up and no one receive call*/
        $scope.callDropAfterTime = function (friendId, callerId) {
            //$scope.busy = false;
            $scope.setCallState(NO_CALL);
            $scope.toggleBtn(false);
            $scope.leaveRoom();
            socket.emit('dropTheCall', { friendId, friendId, callerId: callerId });
        }
        
        /* drop the call then the user not receive the call and times up*/
        socket.on('dropeTheFriendCall', function (data) {
            $scope.$apply(function () {
                if (data.friendId == $scope.user._id) { 
                    $scope.setCallState(NO_CALL);
                    $scope.toggleBtn(false);
                    document.getElementById('incommingCall').style.display = 'none';
                    $scope.audio.pause();
                }
                if (data.callerId == $scope.user._id) {
                    $.toaster({ priority: 'danger', title: 'call drop', message: 'call drop due to time up' });
                    $scope.callCancelTimmer.stopCallTimmer();
                    console.log('Calling stop from 2');
                    $scope.stopK();
                }
            });
        })
 
        /* this function increase the user then he join the group*/
        $scope.connectUsers = function (check) {
            // if ( $scope.reveiveGroupCall == true ) 
            // socket.emit('connectUsers',{check:check,members:$scope.receiveGroupMem});
        }
        socket.on('updateConnectedUsers', function (data) {
            var i = 0;
            for (i; i < data.members.length; i++) {
                if (data.members[i].id == $scope.user._id) 
                    $scope.$apply(function () {
                        if (data.check == 'countGroupMembers') $scope.countGroupMembers += 1;
                        else  $scope.usersInGroup += 1; 
                    })
            }
        })
        /* this function downgrade the user when he left the group */
        $scope.removeconnectUser = function (check) {
            // if ( $scope.reveiveGroupCall == true && $scope.liveStream === false) 
            // socket.emit('removeconnectUser',{check:check,members:$scope.receiveGroupMem});
        }
        socket.on('deductConnectedUser', function (data) {
            var i = 0;
            for (i; i < data.members.length; i++)
                if (data.members[i].id == $scope.user._id) 
                    $scope.$apply(function () {
                        $scope.countGroupMembers -= 1;
                        if (data.check == 'afterReceive') {
                            $scope.usersInGroup -= 1;
                            if ($scope.usersInGroup == 1) {
                                if ($scope.callerId == $scope.user._id) {
                                    //$scope.busy = false;
                                    $scope.setCallState(NO_CALL);
                                    $scope.toggleBtn(false);
                                    $scope.leaveRoom();
                                }
                            }
                        }
                    }) 
        }) 
        /*show alert to the user that the person are busy on another call*/
        socket.on('userBusy', function (data) {
            if (data.callerId == $scope.user._id) {
                $scope.toggleBtn(false);
                $.toaster({ priority: 'danger', title: 'call drop', message: 'The person you are trying to call is busy at the moment' });
                webrtc = '';
                $scope.callCancelTimmer.stopCallTimmer();
                $scope.ringbell.pause();
                document.querySelector('.videoTab').style.display = 'none';
                document.querySelector('.audioTab').style.display = 'none';
                console.log('Calling stop from 3');
                $scope.stopK();
            } 
        })
        /* delete message chat and group both handle in this function*/
        $scope.deleteMsg = function (type) {
            if ($scope.sendType == 'chat')
                $scope.callModal({ 'type': 2, 'id': $scope.editMsgId, 'type2': type });
            else
                $scope.callModal({ 'type': 3, 'id': $scope.editMsgId, 'type2': type, 'connId': $scope.connectionId });
        }
        /* update chat after performing any action on reall time*/
        function updatechat(deletedItem) {
            $http.get('/getChat/' + $scope.user._id + '/' + $scope.chatWithId)
            .then(function (res) {
        
                    $scope.groupMembers = '';
                    $scope.chats = res.data;
                   
                    socket.emit('updatechat', res.data);
            });
        }
 
        /* remove user then click on cross button*/
        $scope.removeUser = (id) => {
            var obj = { 'type': 1, 'id': id };
            $scope.callModal(obj);
        }

        $scope.callModal = function (obj) {
            $scope.modalObject = obj;
            $scope.modalInst = $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                templateUrl: 'views/templates/modal.html',
                controller: 'dashController',
                // controllerAs: 'pc', 
                resolve: {
                    data: function () {
                        return obj;
                    }
                }
            });
            $scope.modalInst.result.catch(function error(error) {
                console.log('error!: ', error);
                if (error === "backdrop click") {
                    // do nothing
                } else {
                    throw error;
                }
            })

            $scope.modalInst.result.then(function (result) {
                let id = $scope.modalObject['id'];
                let type = $scope.modalObject['type'];
                if (type == 1)
                    $http.post('/removeUser', { 'id': id }).then(function (d) {
                        $.toaster({ priority: 'danger', title: 'User deleted', message: 'User and its related chat deleted' });
                        $scope.welcomePage = true;
                        $http.get("/getUsers/" + $scope.user._id)
                        .then(function (response) { 
                            $scope.allUsers = response.data;
                        });
                    });
                else if (type == 2)
                    $http.get('/deleteMsg/' + id + '/' + $scope.modalObject['type2']).then(function (res) {
                        updatechat(res);
                        $scope.editMsgId = '';
                        $rootScope.editMsgMenu1 = false;
                    })
                else if (type == 3)
                    $http.get('/deleteGroupMsg/' + id + '/' + $scope.modalObject['type2'] + '/' + $scope.modalObject['connId']).then(function (res) {
                        $scope.editMsgId = '';
                        $rootScope.editMsgMenu1 = false;
                        socket.emit('updateGroupChat', {'data':res.data, case: 'del'});
                    })
            });

            return $scope.modalInst
        }

        /* this function join the call when the user receive the call*/
        $scope.joinCall = function () {
            if ($scope.callType == 1) document.querySelector('.audioTab').style.display = 'block';
            else document.querySelector('.videoTab').style.display = 'block';
 
            socket.emit('callStart', { callerId: $scope.callerId, friendId: $scope.friendId });
            $scope.startCall(); 
            document.getElementById('incommingCall').style.display = 'none';
            $scope.audio.pause(); // stop the ring after receive
            $(".ringingBell").addClass('hidden');
        }
        /* drop call means user did not receive the call and cancel it */
        $scope.callDrop = function (check) {
            $scope.toggleBtn(false); 
            $scope.setCallState(NO_CALL);
            document.getElementById('incommingCall').style.display = 'none';
            $scope.audio.pause();
    
            $scope.removeconnectUser(check);
            setTimeout(() => {
                if ($scope.countGroupMembers == 1)
                    socket.emit('dropCall', { callerId: $scope.callerId, type: 'group' });
            }, 1000); 
        }
        socket.on('callDroped', function (data) {
            if (data.callerId == $scope.user._id) {
                $scope.toggleBtn(false);
                $scope.leaveRoom();
                $scope.callCancelTimmer.stopCallTimmer();
                $scope.ringbell.pause();
                if (data.type == 'call')
                    $.toaster({ priority: 'danger', title: 'call drop', message: 'The person you call is busy at the moment' });
                if (data.type == 'group')
                    $.toaster({ priority: 'danger', title: 'call drop', message: 'no one pick the call' }); 
                $scope.stopK();
            }
        })
        /* update the chat of the friend side after any action*/
        socket.on('updateChatAll', (conversation) => {
            var recevierId = conversation.length >= 0 ? conversation[0].recevierId : conversation.recevierId;
            var senderId = conversation.length >= 0 ? conversation[0].senderId : conversation.senderId;
            $scope.$apply(function () {
                if ($scope.user._id == recevierId && $scope.chatWithId == senderId || $scope.user._id == senderId && $scope.chatWithId == recevierId) {
                    if (conversation.length >= 0) $scope.chats = conversation;
                    else  $scope.chats = []; 
                    scrollbottom();
                }
            });
        })

        /*update the new message friend side */
        socket.on('remsg', function (msg) {
            $scope.$apply(function () {
                if ($scope.user._id == msg.recevierId && $scope.chatWithId == msg.senderId) {
                    $scope.chats.push(msg);
                    scrollbottom();
                }
                if ($scope.user._id == msg.recevierId) {
                    var audio2 = new Audio('audio/message.mp3');
                    audio2.play(); 
                }

                if (msg.id == $scope.connectionId) {
                    $scope.chats.push(msg.data);
                    scrollbottom();
                }
            });
        });
      
        socket.on('updateAllGroupChat', function (chats) {
            $scope.$apply(function () {
                if (chats.case == 'nodel') {
                  $scope.groupchats.push(chats.data);
                }
                else if (chats.case == 'del') {
                 $scope.groupchats = chats.data;
                }
                 scrollbottom();
             });
        })

        socket.on('startTimmer', function (data) {
            console.log(data.callerId, ' and ', $scope.user._id, ' and ', data.friendId);
            if (data.callerId == $scope.user._id || data.friendId == $scope.user._id) {
                $scope.timmerObj.reset();
                $scope.receiveCall = true;
                $scope.timmerObj.startCallTimmer(); 
            }
            if (data.callerId == $scope.user._id) {
                $scope.ringbell.pause();
                $scope.callCancelTimmer.stopCallTimmer();
            }
            $(".ringingBell").addClass('hidden');
        });

        $scope.onExit = function () {
            $http.get('/changeStatus').then(function (res) {
                return ('bye bye');
            })
        };

        $window.onbeforeunload = $scope.onExit;

    }, function errorCallback(response) {
        $scope.sessionDestroy = true;
        $location.path('/');
    });

    $scope.showHideDots = function (id, isShow = 0) {
        if (isShow == 1) $("#msg3dots-" + id).removeClass('hidden');
        else $("#msg3dots-" + id).addClass('hidden');
    };

    $scope.imgStDrop = function (isShow = 0) {
        if (isShow == 1) $(".stAngleDd").removeClass('hidden');
        else $(".stAngleDd").addClass('hidden');
    };

    $scope.stArr = ['activeSt', 'awaySt', 'dDisturbSt', 'invisSt','offlineSt'];
    $scope.changeSt = function (val = 0) {
        $scope.currSt = val; 
        $scope.stClass = $scope.stArr[$scope.currSt]; 
        console.log($scope.stClass);
        $http.post('/setPerStatus', { pStatus: val }).then((res) => {
            console.log(res);
            if (res.status) console.log('Changed');
        }); 
    }

    $scope.userEmailId = 0;
    $scope.checkStatus = function () {
        $http.get('/checkPerStatus').then((res) => {
            if (res.status) {
                $scope.currSt = res.data.pStatus;
                console.log('$scope.currSt ',res.data,$scope.currSt);
                $scope.stClass = $scope.stArr[$scope.currSt];
                console.log('$scope.stClass ',$scope.stClass);
                $scope.userEmailId = res.data.email;
                // $http.get($scope.sbsLink+"setChatStatus/2/"+$scope.userEmailId+"/1"); //set online
                // $http.get($scope.sbsLink+"setChatStatus/1/"+$scope.userEmailId+"/"+res.data.pStatus);
            }
        });
    }
    $scope.checkStatus();

    $scope.showDDwnSt = function () {
        $scope.showDrpDwnSt = !$scope.showDrpDwnSt;
    }

    $scope.showDDwnDisabler = function(){
        $scope.showDrpDwnSt = false;
    }
 

    var everywhere = angular.element(window.document);
    everywhere.bind('click', function (event) {
        var isButtonClick = $(event.target).is('.stAngleDd');
        if (!isButtonClick) $scope.showDrpDwnSt = false;
    });

    //Listen on typing
    socket.on('typingRec', (data) => { 
        if ($rootScope.user._id == data.rcv_id) {
            $("#isTyping").removeClass('hidden');
            $("#isTyping").html(data.username + " is typing...");
            startHideTimer();
        }
    });

    function startHideTimer() {
        setTimeout(function () {
            $("#isTyping").addClass('hidden');
        }, 5000);
    }
 
});