app.controller("dashController", function ($scope, $http, $window, $location, $rootScope, $uibModal, $websocket, $interval, One2OneCall, One2ManyCall) {
    $scope.isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));
    
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
    $scope.tempUsers = null;
    const NO_CALL = 0;
    /*save with whom user are chatting*/
    $scope.chatWithId = '';
    /*save all chats */
    $scope.chats = [];
    $scope.broadcastChats = [];
    $scope.replychats = [];
    $scope.groupchats = [];
    $scope.recentUnseenMessages = [];
    $scope.allGroups;
    $scope.editMsgIconStatus = false;
    $scope.unSeenMessages;
    $scope.isGroupChatStarted = false;
    $scope.receiverActivePanel = '';
    /*socket io connection*/

    $rootScope.audio = new Audio('audio/call.mp3');
    $scope.ringbell = new Audio('audio/ring_bells.mp3');
    // KURENTO WebRtc functions  ======================================================
    $scope.callCancelTimmer = new timmer('#checker');
    $rootScope.webRtcO2OPeer = null;
    $rootScope.webRtcO2MPeer = null;
    $rootScope.broadCastHtml = document.getElementById('broadCastVideo');
    $scope.webRtcPeer = null;

    $rootScope.timmerObj = new timmer('#timmer');
    $scope.inComCallData = 0;
    $rootScope.presenterArr = [];
    $scope.liveStreamCode = '';
    $scope.setPassword = 0;

    $scope.replyMenuStatus = true;
    $scope.replyIconId = "";
    $scope.selectedUserNo = -1;
    $scope.selectedUserData = null;
    $scope.userOrderList = 0;
    $scope.isChatFullscreen = false;
    $scope.scrollHeight = 0;
    // 0: nothing, 1: screenShare button pressed, 2: screen is sharing
    // $rootScope.incomingScreenshare = 0;
    // $scope.isReceivingSS = false;

    $http.post("/getProject").then(function (response) {
        $rootScope.projectData = response.data;
        $scope.o2oSocConnec();

        // if ($rootScope.projectData.videoCall == 1) $interval(ping, 10000);
    });


    $scope.o2oSocLoaded = false;
    $scope.o2oSocConnec = function () {
        let hostIs = location.host.split(':');
        let webSocketIp = $rootScope.projectData.domainUrl;
        if (hostIs[0] == 'localhost') webSocketIp = '127.0.0.1';
        let reqUrl = 'wss://' + webSocketIp + ':8443/one2one';
        $rootScope.O2OSoc = $websocket.$new({
            url: reqUrl
        });
        //   console.log('$scope.o2oSocConnec called= ',$scope.O2OSoc);  
        // so as the script should not load again and again
        if (!$scope.o2oSocLoaded) {
            $rootScope.O2OSoc.$on('$open', function () {
                    // console.log('O2O socket open'); 
                    if ($rootScope.user && typeof $rootScope.user._id !== "undefined")
                        One2OneCall.sendKMessage({
                            id: 'register',
                            name: $rootScope.user._id
                        });

                    One2OneCall.setCallState(NO_CALL);
                })
                .$on('$message', function (message) { // it listents for 'incoming event'
                    $rootScope.o2oSocConEst = true;
                   console.log(message);
                    var parsedMessage = JSON.parse(message);
                    
                    // console.log('something incoming from the server: ==== ' + message);  
                    switch (parsedMessage.id) {
                        case 'registerResponse':
                            break;
                        case 'callResponse':
                            One2OneCall.callResponse(parsedMessage);
                            break;
                        case 'incomingCall':
                            One2OneCall.incomingCall(parsedMessage);
                            break;
                        case 'startCommunication':
                            One2OneCall.startCommunication(parsedMessage);
                            $rootScope.callConnected();
                            break;
                        case 'stopCommunication':
                            One2OneCall.stopK(true);
                            break;
                        case 'iceCandidate':
                            $rootScope.webRtcO2OPeer.addIceCandidate(parsedMessage.candidate)
                            break;
                        default:
                            console.error('Unrecognized message', parsedMessage);
                    }
                })
                .$on('$close', function () {
                    // console.log('Socket closed trying to reconnect...');
                    $scope.o2oSocConnec();
                })
                .$on('$error', function () {
                    // console.log('Socket Error trying to reconnect...');
                    $scope.o2oSocConnec();
                })
            $scope.o2oSocLoaded = true;
        }

    }
    //checking if user is registered

    function ping() {
        if (!$rootScope.user || typeof $rootScope.user._id === "undefined") return;
        //    console.log('Ping called====');
        if (!$rootScope.o2oSocConEst) $window.location.reload();
        One2OneCall.sendKMessage({
            id: '__ping__',
            from: $rootScope.user._id
        });
    }

    // Broadcast function start===============
    var windowElement = angular.element($window);
    windowElement.on('beforeunload', function (event) {
        $http.get('/emptyChatWithId/' + $rootScope.user._id);
    });

    // initial websocket connection is in loginController   
    $scope.stopBroadCast = function () {
        One2ManyCall.stop();
        $("#videoBroadCast").addClass('hidden');
        if (!$rootScope.connWdPreId) $http.get('/stopPresenter').then();
        else
            $http.post('/stopViewer', {
                preId: $rootScope.connWdPreId
            }).then();
    }

    $scope.openssShareModal = function () {
        localStorage.setItem('tokenIs', $rootScope.user._id + '-' + $scope.chatWithId + '-' + $rootScope.user.name);
        $("#ssShareModal").modal('show');
        //startScreenshare();
    }
    $scope.openssViewerModal = function () {
        $("#ssShareModal").modal('hide');
        $("#ssViewerModal").modal('show');
    }

    $scope.openBrModal = function () {
        $scope.brErrorMsg = 0;
        $("#broadcastingModal").modal();
        $("#broadcastingModal").show();
    }

    $scope.openAvModal = function () {
        console.log("open AV Modal");
        $("#avPresenterModal").modal();
    }

    $scope.removeClasses = function (){
        $('#dropImage').hide();
    }

    $scope.fullscreenStatus = function (){
        $scope.isChatFullscreen = !$scope.isChatFullscreen;
    }
        //-----------------------------------------------------------------------------------------------
        $rootScope.showVideo = true;
        $scope.toggelVideo = function () {
            $rootScope.showVideo=!$rootScope.showVideo;
            $rootScope.webRtcO2OPeer.getLocalStream().getVideoTracks()[0].enabled = $rootScope.showVideo;
        };
    
        $rootScope.showBCVideo = true;
        $scope.toggleBCVideo = function (){
            $rootScope.showBCVideo=!$rootScope.showBCVideo;
            $rootScope.webRtcO2MPeer.getLocalStream().getVideoTracks()[0].enabled = $rootScope.showBCVideo;
        }
        // ----------------------------------------------------------------------------------------------
        $rootScope.openVoice = true;
        $scope.toggelMute = function () {
            $rootScope.openVoice=!$rootScope.openVoice;
            $rootScope.webRtcO2OPeer.getLocalStream().getAudioTracks()[0].enabled = $rootScope.openVoice;
        };
    
        $rootScope.openBCvoice = true;
        $scope.toggleBCMute = function (){
            $rootScope.openBCvoice=!$rootScope.openBCvoice;
            $rootScope.webRtcO2MPeer.getLocalStream().getAudioTracks()[0].enabled = $rootScope.openBCvoice;
        }

    
        $scope.broadCastNow=function(){
            $rootScope.prePassword=$scope.liveStreamCode;
         
            if($scope.setPassword==0) $rootScope.prePassword='';
            else if($scope.setPassword==1 && !$rootScope.prePassword){
                $scope.brErrorMsg=1;
                return;
            }
            $("#videoBroadCast").removeClass('hidden');
            $rootScope.connWdPreId=0;  
            One2ManyCall.presenter();
            $("#broadcastingModal").modal('hide');
            $http.post('/startPresenter',{ 
                password:$rootScope.prePassword
            }).then();
        }

    $scope.checkPassword = '';
    $scope.presenterPassword = '';
    $scope.brErrorMsg = 0;

    $scope.becomeViewer = function (preId, password) {
        console.log('In becomeViewer ', preId, ' and ', password);
        $("#avPresenterModal").modal('hide');
        $rootScope.connWdPreId = preId;
        if (password) {
            $scope.presenterPassword = password;
            $("#passReqPre").modal();
        } else {console.log('else'); $scope.initiateViewer();}
    }

       //-------------------------------------------------------------------------------
       $scope.activateVideoBroadcastPanel = function(){
        $scope.isBcVideoPanel = !$scope.isBcVideoPanel;

        $rootScope.prePassword=$scope.liveStreamCode;
     
        if($scope.setPassword==0) $rootScope.prePassword='';
        else if($scope.setPassword==1 && !$rootScope.prePassword){
            $scope.brErrorMsg=1;
            return;
        }
        $("#broadcastingModal").modal('hide');
        $("#broadcastingVideoModal").modal();
        
        reLoadEmoji();
        // $http.get('/getBChat'+$rootScope.connWdPreId)
        // .then(function(res){
        //     $scope.broadcastChats = res.data;
        //   //  console.log($scope.broadcastChats);
        //     scrollbottom();
        // });
        console.log('start broadcasting');
        $rootScope.connWdPreId=0;  
        One2ManyCall.presenter();
        $rootScope.broadcastRefId = '';

        $http.post('/startPresenter',{ 
            password:$rootScope.prePassword
        }).then(function(res){  
            console.log(res);
            $rootScope.broadcastRefId = res.data.broadcastRefId._id;
        });
    }

    $scope.deActivateVideoBroadcastPanel = function(){
        $scope.isBcVideoPanel = !$scope.isBcVideoPanel;
        $scope.broadcastChats = [];
        One2ManyCall.stop();

       // $rootScope.broadcastRefId = '';

        $("#broadcastingVideoModal").modal('hide');
        $("#broadcastingModal").modal('hide');
        $("#avPresenterModal").modal('hide');

        if(!$rootScope.connWdPreId)
            $http.get('/stopPresenter').then();
        else
            $http.post('/stopViewer',{ 
                preId:$rootScope.connWdPreId
            }).then();
    }

    
    $scope.closeVideoBroadcastPanel = function(){
        $scope.isBcVideoPanel = !$scope.isBcVideoPanel;
        $scope.broadcastChats = [];
        One2ManyCall.stop();

        if(!$rootScope.connWdPreId)
            $http.get('/stopPresenter').then();
        else
            $http.post('/stopViewer',{ 
                preId:$rootScope.connWdPreId
            }).then();

            //$rootScope.broadcastRefId = '';
            //console.log("stop braod");
            $("#broadcastingVideoModal").modal('hide');
            $("#avPresenterModal").modal('hide');
            $("#broadcastingModal").modal('hide');
            
    }

    $scope.initiateViewer = function () {
        $("#broadcastingVideoModal").modal();
        // $("#videoBroadCast").removeClass('hidden');
        One2ManyCall.viewer();
        reLoadEmoji();
        $http.get('/getBroadcastId/'+ $rootScope.connWdPreId).then(function(res){
           
            $rootScope.broadcastRefId = res.data.broadcastRefId._id;
            var bJoinedChat = {"senderId":{'_id':$scope.user._id, 'name': $scope.user.name},
            "receiverId":$rootScope.broadcastRefId, "message":'I have Joined', "chatType":2}
           
            socket.emit('checkmsg', bJoinedChat);
           
            $http.post('/joinViewer',{ preId:$rootScope.connWdPreId, joinMsg: bJoinedChat, broadcastId: $rootScope.broadcastRefId }).then(function (res){
                console.log(res.data);
                $scope.broadcastChats = res.data;
                
            });
        });
    }

    $scope.checkBPass = function () {
        if ($scope.presenterPassword == $scope.checkPassword) {
            $scope.brErrorMsg = 0;
            $("#avPresenterModal").modal('hide');
            $("#passReqPre").modal('hide');
            $scope.initiateViewer();
        } else $scope.brErrorMsg = 1;
    }
    // Broadcast function end================


    $scope.generateNewTimer = function () {
        $rootScope.timmerObj.reset();
        if ($rootScope.callType == 1) $rootScope.timmerObj = new timmer('#audioTimmer');
        else $rootScope.timmerObj = new timmer('#timmer');
    }
    // when the second person accept the caller call
    $rootScope.callConnected = function () {
        $scope.generateNewTimer();
        $rootScope.timmerObj.startCallTimmer();
        $("#timmer").removeClass('hidden');
    }

    $scope.stopCall = function (message = '', friendId = 0) {
        One2OneCall.stopK(message, friendId);
    }

    $rootScope.showVideo = true;
    $scope.toggelVideo = function () {
        $rootScope.showVideo = !$rootScope.showVideo;

        if (!$rootScope.showVideo) $scope.ringbell.pause();
        else $scope.ringbell.play();

        $rootScope.webRtcO2OPeer.getLocalStream().getVideoTracks()[0].enabled = $rootScope.showVideo;
    };

    $rootScope.openVoice = true;
    $scope.toggelMute = function () {
        $rootScope.openVoice = !$rootScope.openVoice;

        $rootScope.webRtcO2OPeer.getLocalStream().getAudioTracks()[0].enabled = $rootScope.openVoice;
    };


    // Kurento webrtc functions end================================================
    /*check session of the user if he is logged in or not*/
    $http({
        method: 'GET',
        url: '/get',
        xhrFields: {
            withCredentials: true
        }
    }).then(function successCallback(response) {
        $scope.loggedUserId = response.data._id;
        /* login user */
        /* store video of calling sound */
        $scope.usersInGroup = 1;
        $scope.countGroupMembers = 1;
        $scope.groupOrUser = '';
        $rootScope.user = response.data;
        localStorage.setItem('tokenData', $rootScope.user._id);
        socket.emit('user_connected', {
            userId: $rootScope.user._id
        });
        $rootScope.o2oSocConEst = false;


        $scope.receiveCall = false;
        $scope.welcomePage = true;
        $scope.caller = false;
        $scope.getmembers = [];
        $scope.files = [];

        /*get all users*/
        $http.get("/getUsers/" + response.data._id + '/' + $rootScope.projectData.allList + '/' + $rootScope.projectData._id)
            .then(function (response) {
                $scope.tempUsers = response.data.usersList; // used for user search result
                $scope.allUsers = response.data.usersList;

                $scope.selectedUserNo = 0;
                let i = 0;
                let userChatToOpen;
                for (i; i < response.data.usersList.length; i++) { // ******** RECHECK NEEDED ***********
                    $scope.allUsers[i].tempDate = new Date($scope.allUsers[i].updatedByMsg).getTime();
                    // $scope.allUsers[i].screenShareStatus = false;
                    if (response.data.usersList[i].email != $scope.user.email) $scope.getmembers.push(response.data.usersList[i]);

                    // this is for mobile, to open the chatBox of selected user directly
                    if (response.data.usersList[i]._id == $scope.user.chatWithRefId && $scope.user.chatWithRefId) {
                        userChatToOpen = {
                            'user': response.data.usersList[i],
                            'userIndex': 0,
                            'type': 1
                        };
                        $scope.allUsers[i].tempDate = new Date().getTime();

                        $scope.selectedUserNo = 0;
                        $scope.selectedUserData = $scope.user;
                        $scope.isChatPanel = true;
                        $scope.isSidePanel = false;
                    }
                }

                $scope.usersLoaded = true;
                if ($scope.user.chatWithRefId) {
                    $scope.startChat(userChatToOpen);
                } else {
                    $scope.selectedUserNo = -1;
                    $scope.selectedUserData = null;
                }
            });

        /*get all group users*/
        $http.get("/getCreatedGroups/" + $scope.user._id + "/" + $rootScope.projectData._id)
            .then(function (response) {
                $scope.allGroups = response.data;
                $scope.groupsLoaded = true;
            });

        $scope.check = function (user) {
            return user.email != $scope.user.email;
        };
        $scope.remove = function (index) {
            var files = [];
            angular.forEach($scope.files, function (file, key) {
                if (index != key) files.push(file);
                $scope.files = files;
            })
        }

        $scope.upload = function () {
            for (var i = 0; i < $scope.allUsers.length; i++) {
                // Check, to which user message has been sent, to move senderUser up in the userList
                if ($scope.selectedUserData._id == $scope.allUsers[i]._id) {
                    $scope.allUsers[i].tempDate = new Date().getTime();
                    $scope.selectedUserNo = 0;
                }
            }

            var fd = new FormData();
            angular.forEach($scope.files, function (file) {
                fd.append('file', file); // when preview on then file.file
            })
            fd.append('senderId', $scope.user._id);
            fd.append('senderName', $scope.user.name);

            if (!$scope.groupSelected) {
                fd.append('friendId', $scope.chatWithId); //chnId 1
                $http.post('/chatFilesShare', fd, {
                    transformRequest: angular.identity,
                    headers: {
                        'Content-Type': undefined
                    }
                }).then(function (d) {
                    updatechat();
                })
            } else {
                fd.append('id', $scope.connectionId);
                fd.append('name', $scope.user.name);
                $http.post('/groupFilesShare', fd, {
                    transformRequest: angular.identity,
                    headers: {
                        'Content-Type': undefined
                    }
                }).then(function (d) {
                    socket.emit('updateGroupFiles', d);
                    scrollbottom();
                })
            }
        }

        socket.on('front_user_status', function (data) {
            let i = 0;
            if ($scope.allUsers)
                for (i; i < $scope.allUsers.length; i++)
                    if ($scope.allUsers[i]._id == data.userId) {
                        $scope.allUsers[i].onlineStatus = data.status;
                        $scope.$apply();
                    }
        });


        socket.on('updateOtherMembersFiles', function (data) {
            $scope.$apply(() => {
                $scope.groupchats.push(data.data[0]);
                scrollbottom();
            });
        })

        /*get All notifications*/
        $http.get("/getNotification/" + $rootScope.user._id)
            .then(function (response) {
                $scope.notifications = response.data.noti;
                $scope.notiCount = response.data.count;
        });


        $scope.groupSelected = false;
        $scope.chatActive = function (index) {
            $scope.deActivate();
            $scope.nchatIndex = 0;
            $scope.gchatIndex = 1;
            $scope.groupSelected = false;
            $scope.isGroupChatStarted = false;
        }

        $scope.groupChatActive = function () {
            $scope.deActivate();
            $scope.nchatIndex = 1;
            $scope.gchatIndex = 0;
            $scope.groupSelected = true;
            $scope.isGroupChatStarted = false;
        }

        $scope.chatBack = function () {
            $scope.selectedUserNo = -1;
            $scope.selectedUserData = null;
            $scope.isChatPanel = false;
            $scope.isSidePanel = true;
            $scope.welcomePage = true;
            $scope.backPressed = true;

            for (var i = 0; i < $scope.allUsers.length; i++) {
                if ($scope.allUsers[i]._id == $scope.user._id) {
                    $scope.allUsers[i].chatWithRefId = '';
                    break;
                }
            }

            socket.emit('updateChatWithId', {
                userId: $scope.user._id
            });
            $http.get('/emptyChatWithId/' + $scope.user._id);

        }

        $scope.unreadMsg = function (obj) {
            for (var i = 0; i < $scope.allUsers.length; i++) {
                if ($scope.allUsers[i]._id == obj.userId) {
                    $scope.allUsers[i].usCount = 0;
                }
            }
        }

        $scope.isPagination = false;
        $scope.moreChatExist = true;
      
        $scope.getMoreChat = function () {
            if ($scope.moreChatExist) $scope.isPagination = true;
           
            $http.get('/getMoreChat/' + $scope.user._id + '/' + $scope.chatWithId + '/' + 20 + '/' + ($scope.chats[0].createdAt))
                .then(function (res) {
                  
                    for (let i = 0; i < res.data.length; i++) {
                        $scope.chats.unshift(res.data[i]);
                    }
                    if (res.data.length > 0) { $scope.moreChatExist = true; scrollCustom();}
                    else{
                        $scope.moreChatExist = false;
                    }
                   
                    // setTimeout(() => {
                        $scope.isPagination = false; 
                    // }, 100);
                });
        }

        // it is called when all chats has been rendered in ng-repeat
        $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
         if (!$scope.isLoaded){
            console.log('DONE NG-REPEAT');
            scrollbottom();
            $scope.isLoaded = true;
         }
        });

        $scope.isLoaded = true; // used to check is loading of selected user chat at first time is done

        /*on click on a user this function get chat between them*/
        $scope.startChat = function (obj) {
            resetScrollVar();
            if (!obj) return;
            $scope.selectedUserNo = obj.userIndex;
            $scope.selectedUserData = obj.user;

            $scope.deActivate();
            $scope.isSidePanel = false;
            $scope.isChatPanel = true;
            $scope.welcomePage = false;
            $scope.isLoaded = false;
            /*obj is an object send from view it may be a chat or a group info*/
            if (obj.type == 1) {
                $scope.isGroupChatStarted = false;
                $scope.groupSelected = false;
                $scope.selGrpMembers = [];
                $scope.selUserName = obj.user.name;
                $scope.userProfileUrl = obj.user.userProfileUrl;
                $scope.chatWithImage = obj.user.user_image;
                $scope.chatWithId = obj.user._id;

                socket.emit('change_username', {
                    username: $rootScope.user.name,
                    rcv_id: $scope.chatWithId
                });
                socket.emit('updateUserSelection', {
                    selectedUser: $scope.chatWithId,
                    userId: $scope.user._id
                });
                $scope.status = obj.user.status;
                $scope.connectionId = $scope.chatWithId;

                let i = 0;
                for (i; i < $scope.allUsers.length; i++)
                    if ($scope.allUsers[i]._id == obj.user._id) $scope.allUsers[i].usCount = 0;

                $http.get('/getChat/' + $scope.user._id + '/' + $scope.chatWithId + '/' + 20)
                    .then(function (res) {
                        $scope.groupMembers = '';
                        $scope.chats = res.data; //.userChat;
                        socket.emit('updateChatSeenStatus', {
                            'isChatSeen': 1,
                            '_id': $scope.user._id,
                            'chatWithId': $scope.chatWithId
                        });
                    
                       // scrollbottom();
                    });
            } else {
                $scope.isGroupChatStarted = true;
                $scope.groupSelected = true;
                $scope.selectedGroupId = obj.group._id;
                $scope.connectionId = obj.group._id;
                $scope.selGroupName = obj.group.name;
                $scope.selGrpMembers = obj.group.members;
                $scope.status = '';

                socket.emit('updateUserSelection', {
                    selectedUser: '',
                    userId: $scope.user._id
                })

                $http.get('/getGroup/' + obj.group._id).then(function (groupchat) {
                    $scope.isLoaded = false;
                    $scope.groupchats = groupchat.data;
                 //   scrollbottom();
                })
            }
        }

        $scope.seenNotification = () => {
            $http.post('/notificationseen', {
                userId: $scope.user._id
            }).then(function (data) {
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
            $rootScope.timmerObj.stopCallTimmer();
            $scope.generateNewTimer();
            $("#timmer").addClass('hidden');
            document.querySelector('.videoTabNew').style.display = 'none';
            document.querySelector('.audioTab').style.display = 'none';
        }

        /*disconnect the call from user side who hit the disconnect button*/
        $rootScope.disconnect = function (friendId) {
            One2OneCall.setCallState(NO_CALL);
            $scope.receiveCall = false;
            $scope.leaveRoom();
            $rootScope.toggleBtn(false);
            if ($scope.caller == true) {
                $scope.callCancelTimmer.stopCallTimmer();
                $scope.caller = false;
            }
            if (friendId) socket.emit('calldisconnect', {
                friendId: friendId
            });
        }
        /*disconnect the call from other side through socket io*/
        socket.on('calldis', function (data) {
            if (data.friendId == $scope.user._id) {
                One2OneCall.setCallState(NO_CALL);
                $rootScope.toggleBtn(false);
                if ($scope.receiveCall == false) {
                    $rootScope.audio.pause();
                    document.getElementById('incommingCall').style.display = 'none';
                } else {
                    $scope.leaveRoom();
                    $scope.receiveCall = false;
                }
                One2OneCall.stopK();
            }
        })

        /* send braodcast message */
        $scope.sendBCMessage = function(sendType,message,chkmsg){
            console.log("sending Broadcast message");
            if(!chkmsg || typeof chkmsg=="undefined") chkmsg=0;
            if(!message || typeof message=="undefined") message=0;

            if(!$scope.message && chkmsg) $scope.message=chkmsg;
            else if(!$scope.message && !chkmsg) return;

            console.log($rootScope.broadcastRefId);
            var msgObj = {"senderId":{'_id': $scope.user._id, 'name': $scope.user.name},
            "receiverId":$rootScope.broadcastRefId, "message":$scope.message, "chatType":2
            }

            socket.emit('checkmsg',msgObj);
            $scope.message = '';
            scrollbottom();
            var ele = $('#sendBMsg').emojioneArea();
            ele[0].emojioneArea.setText('');

            $http.post('/chat', {'msgData': msgObj})
            .then(function(res){  
                if(res.data.length<1) return; 
            })
        }

        /* send message to the user group and chat both handle in this function through sendType*/
        $scope.sendMessage = function (message = 0, chkmsg = 0) {

            if (!$scope.message && chkmsg) $scope.message = chkmsg;
            else if (!$scope.message && !chkmsg) return;

            if (!$scope.groupSelected) {
                if (message != 0) $scope.message = 'call duration ' + $rootScope.timmerObj.showTime();

                if ($scope.edit === true) {
                    $http.post('/updateChat/' + $scope.editMsgId, {
                            "message": $scope.message
                        })
                        .then(function (res) {
                            $scope.message = '';
                            $scope.editMsgId = '';
                            $scope.edit = false;
                            updatechat();
                        })
                } else {
                    var msgObj;

                    if (!$scope.isReplying)
                        msgObj = {
                            "chatType": 0,
                            "isSeen": 0,
                            "isGroup": 0,
                            "messageType": 0,
                            "senderId": $scope.user._id,
                            "senderImage": $scope.user.user_image,
                            "receiverImage": $scope.chatWithImage,
                            "receiverId": $scope.chatWithId,
                            "senderName": $scope.user.name,
                            "message": $scope.message
                        };
                    else {
                        msgObj = {
                            "commentId": $scope.commentReplyId,
                            "senderId": $scope.user._id,
                            "receiverId": $scope.chatWithId,
                            "senderName": $scope.user.name,
                            "message": $scope.message,
                            "chatType": 1
                        };

                        $scope.deActivate();
                    }

                    for (var i = 0; i < $scope.allUsers.length; i++) {
                        // Check, to which user message has been sent, to move senderUser up in the userList
                        if ($scope.selectedUserData._id == $scope.allUsers[i]._id) {
                            $scope.allUsers[i].tempDate = new Date().getTime();
                            $scope.selectedUserNo = 0;
                            scrolltopUserList();
                        }

                        if ($scope.allUsers[i]._id == $scope.chatWithId && $scope.allUsers[i].onlineStatus == 1) {
                            if ($scope.allUsers[i].chatWithRefId == msgObj.senderId) {
                                msgObj.isSeen = 1;
                                break;
                            }
                        }
                    }

                    var tempSelectedUserData = {
                        '_id': $scope.selectedUserData._id
                    };
                    $scope.message = '';

                    socket.emit('checkmsg', msgObj);

                    $http.post('/chat', {
                            'msgData': msgObj,
                            'selectedUserData': tempSelectedUserData
                        })
                        .then(function (res) {
                            $scope.chats.push(res.data);
                            scrollbottom();
                            if (res.data.length < 1) return;
                        })
                }

            } else { // if message is send in group
                if ($scope.edit === true)
                    $http.post('/updateGroupChat/' + $scope.editMsgId, {
                        "message": $scope.message,
                        groupId: $scope.connectionId
                    })
                    .then(function (res) {
                        $scope.message = '';
                        $scope.editMsgId = '';
                        $scope.edit = false;
                        socket.emit('updateGroupChat', {
                            data: res.data,
                            case: 'edit'
                        });
                    })
                else { // If message is new
                    var groupmMsgObj;

                    if (!$scope.isReplying)
                        groupmMsgObj = {
                            "chatType": 0,
                            "isGroup": 1,
                            "senderId": $scope.user._id,
                            name: $scope.user.name,
                            "message": $scope.message,
                            id: $scope.connectionId
                        };
                    else {
                        groupmMsgObj = {
                            "commentId": $scope.commentReplyId,
                            "chatType": 1,
                            "isGroup": 1,
                            "senderId": $scope.user._id,
                            name: $scope.user.name,
                            "message": $scope.message,
                            id: $scope.connectionId
                        };
                        $scope.deActivate();
                    }

                    $http.post('/groupChat', groupmMsgObj)
                        .then(function (res) {
                            //var last = res.data.message.length - 1;
                            // var data = res.data.message[last];
                            $scope.message = '';
                            socket.emit('updateGroupChat', {
                                id: res.data._id,
                                data: res.data,
                                case: 'new'
                            });
                            scrollbottom();
                        })
                }
            }

            var ele = $('#sendMsg').emojioneArea();
            ele[0].emojioneArea.setText('');
        }

        $scope.isReplying = false;
        $scope.commentReplyId = '';
        $scope.selectedMsg = null;

        $scope.activateReply = function (chat) {

            if ($scope.commentReplyId == chat._id) {
                $scope.commentReplyId = "";
                $scope.isReplying = !$scope.isReplying;
                $scope.selectedMsg = null;
                $("#applyPic").removeClass('commentReplyPanel');
                $("#sendMsgButton").removeClass('alignSendMsgButton');
                document.querySelector('.showCommentsReply').style.display = 'none';
            } else {
                $scope.commentReplyId = chat._id;
                $scope.isReplying = true;
                $scope.selectedMsg = chat;
                $("#sendMsgButton").addClass('alignSendMsgButton');
                document.querySelector('.showCommentsReply').style.display = 'block';
            }
        }

        $scope.deActivate = function () {
            $scope.commentReplyId = "";
            $scope.isReplying = false;
            $scope.selectedMsg = null;
            $("#applyPic").removeClass('commentReplyPanel');
            $("#sendMsgButton").removeClass('alignSendMsgButton');
            document.querySelector('.showCommentsReply').style.display = 'none';
        }


        /*this array save group members*/
        $scope.members = [];
        /*to create new group*/
        $scope.addgroup = function () {
            $scope.members.push($scope.user);
            $http.post('/addgroup', {
                'groupName': $scope.groupName,
                'members': $scope.members
            }).then(function (res) {
                $scope.groupName = '';
                $scope.members = '';
            });
        }

        $scope.disableMsgEdit = function () {
            if ($scope.editMsgIconStatus) $rootScope.editMsgMenu1 = false;
        }

        /*logout the user and destroy the session*/
        $scope.logout = function () {
            $http.get('/logout/' + $scope.loggedUserId).then(function (res) {
                if (res.data.msg == "session destroy") {
                    socket.emit('logoutUpdate', $scope.loggedUserId);
                    $scope.user = undefined;
                    localStorage.removeItem('ss');
                    localStorage.removeItem('tokenIs');
                    localStorage.removeItem('tokenData');
                    $location.path('/');
                }
            })
        }

        /* this function enable or disable the btns when the call receive or drop*/
        $rootScope.toggleBtn = function (bolean) {
            $('#call').prop('disabled', bolean);
            $('#videoCall').prop('disabled', bolean);
            $('#live').prop('disabled', bolean);
        }

        /* video calling functionality*/
        $scope.videoCall = function (type, callerId) {
            if (type == 1)
                document.querySelector('.audioTab').style.display = 'block';
            else
                document.querySelector('.videoTabNew').style.display = 'block';


            $rootScope.toggleBtn(true);
            $scope.caller = true;
            $scope.ringbell.loop = true;
            $scope.ringbell.play();
            if (!$scope.groupSelected) {
                $scope.callCancelTimmer.startCallTimmer();
                $rootScope.showVideo = true;
                $rootScope.openVoice = true;
                let userData = {
                    friendId: $scope.chatWithId,
                    callerName: $scope.user.name,
                    callerId: $scope.user._id,
                    callType: type
                };
                $("#timmer").addClass('hidden');
                One2OneCall.videoKCall($scope.user._id, $scope.chatWithId, userData, type);
            }
        }
        /* this is the main function call after time up and no one receive the call*/
        $scope.dropCall = function () {
            $scope.callDropAfterTime($scope.chatWithId, $scope.user._id);
        }
        /* this function drop the group call after times up and no one receive call*/
        $scope.dropGroupCallAfterTime = function (members, callerId) {
            //$scope.busy = false;
            One2OneCall.setCallState(NO_CALL);
            $rootScope.toggleBtn(false);
            $scope.leaveRoom();
            socket.emit('dropTheGroupCall', {
                members,
                members,
                callerId: callerId
            });
        }
        /* this function drop the call after times up and no one receive call*/
        $scope.callDropAfterTime = function (friendId, callerId) {
            One2OneCall.setCallState(NO_CALL);
            $rootScope.toggleBtn(false);
            $scope.leaveRoom();
            socket.emit('dropTheCall', {
                friendId,
                friendId,
                callerId: callerId
            });
        }

        /* drop the call then the user not receive the call and times up*/
        socket.on('dropeTheFriendCall', function (data) {
            $scope.$apply(function () {
                if (data.friendId == $scope.user._id) {
                    One2OneCall.setCallState(NO_CALL);
                    $rootScope.toggleBtn(false);
                    document.getElementById('incommingCall').style.display = 'none';
                    $rootScope.audio.pause();
                }
                if (data.callerId == $scope.user._id) {
                    $.toaster({
                        priority: 'danger',
                        title: 'call drop',
                        message: 'call drop due to time up'
                    });
                    $scope.callCancelTimmer.stopCallTimmer();
                    One2OneCall.stopK();
                }
            });
        })

        /* this function increase the user then he join the group*/
        $scope.connectUsers = function (check) {}

        socket.on('updateConnectedUsers', function (data) {
            var i = 0;
            for (i; i < data.members.length; i++) {
                if (data.members[i].id == $scope.user._id)
                    $scope.$apply(function () {
                        if (data.check == 'countGroupMembers') $scope.countGroupMembers += 1;
                        else $scope.usersInGroup += 1;
                    })
            }
        })
        /* this function downgrade the user when he left the group */
        $scope.removeconnectUser = function (check) {}

        socket.on('logoutStatusUpdate', function (loggedOutUserId) {
            // on user logout, update user status for other users
            let i = 0;
            if ($scope.allUsers)
                for (i; i < $scope.allUsers.length; i++)
                    if ($scope.allUsers[i]._id == loggedOutUserId) {
                        $scope.allUsers[i].chatWithRefId = "";
                        $scope.allUsers[i].onlineStatus = 0;
                        break;
                    }
        })

        socket.on('deductConnectedUser', function (data) {
            var i = 0;
            for (i; i < data.members.length; i++)
                if (data.members[i].id == $scope.user._id)
                    $scope.$apply(function () {
                        $scope.countGroupMembers -= 1;
                        if (data.check == 'afterReceive') {
                            $scope.usersInGroup -= 1;
                            if ($scope.usersInGroup == 1 && $scope.callerId == $scope.user._id) {
                                One2OneCall.setCallState(NO_CALL);
                                $rootScope.toggleBtn(false);
                                $scope.leaveRoom();
                            }
                        }
                    })
        })
        /*show alert to the user that the person are busy on another call*/
        socket.on('userBusy', function (data) {
            if (data.callerId == $scope.user._id) {
                $rootScope.toggleBtn(false);
                $.toaster({
                    priority: 'danger',
                    title: 'call drop',
                    message: 'The person you are trying to call is busy at the moment'
                });
                webrtc = '';
                $scope.callCancelTimmer.stopCallTimmer();
                $scope.ringbell.pause();
                document.querySelector('.videoTabNew').style.display = 'none';
                document.querySelector('.audioTab').style.display = 'none';
                One2OneCall.stopK();
            }
        })
        /* delete message chat and group both handle in this function*/
        $scope.deleteMsg = function (type) {
            if (!$scope.groupSelected) $scope.callModal({
                'type': 2,
                'id': $scope.editMsgId,
                'type2': type
            });
            else $scope.callModal({
                'type': 3,
                'id': $scope.editMsgId,
                'type2': type,
                'connId': $scope.connectionId
            });
        }

        //----------------- NOT USED RIGHT NOW (8-21-19) ----------------------------------------- */
        $scope.download = function (filename) {
            $http.get('/download/' + filename)
                .then(function (res) {
                    return res;
                });
        }

        /* update chat after performing any action on reall time*/
        function updatechat(deletedItem) {
            // $http.get("path", "user.id", "chatWithRefId", "how many chats to get from server")
            $http.get('/getChat/' + $scope.user._id + '/' + $scope.chatWithId + '/' + 20)
                .then(function (res) {
                    $scope.groupMembers = '';
                    $scope.chats = res.data;
                    socket.emit('updatechat', res.data);
                });
        }

        /* remove user then click on cross button*/
        $scope.removeUser = (id) => {
            var obj = {
                'type': 1,
                'id': id
            };
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
                    $http.post('/removeUser', {
                        'id': id
                    }).then(function (d) {
                        $.toaster({
                            priority: 'danger',
                            title: 'User deleted',
                            message: 'User and its related chat deleted'
                        });
                        $scope.welcomePage = true;
                        $http.get("/getUsers/" + $scope.user._id + '/' + $rootScope.projectData.allList + '/' + $rootScope.projectData._id)
                            .then(function (response) {
                                $scope.allUsers = response.data.usersList;
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
                        socket.emit('updateGroupChat', {
                            'data': res.data,
                            case: 'edit'
                        });
                    })
            });

            return $scope.modalInst
        }

        /* this function join the call when the user receive the call*/
        $scope.joinCall = function () {
            if ($scope.callType == 1) document.querySelector('.audioTab').style.display = 'block';
            else document.querySelector('.videoTabNew').style.display = 'block';
            $scope.ringbell.pause();
            $scope.chatWithId = $rootScope.callerId;
            socket.emit('callStart', {
                callerId: $scope.callerId,
                friendId: $scope.friendId
            });
            One2OneCall.startCall();
            document.getElementById('incommingCall').style.display = 'none';
            $rootScope.audio.pause(); // stop the ring after receive
            $(".ringingBell").addClass('hidden');
        }
        /* drop call means user did not receive the call and cancel it */
        $scope.callDrop = function (check) {
            $rootScope.toggleBtn(false);
            One2OneCall.setCallState(NO_CALL);
            document.getElementById('incommingCall').style.display = 'none';
            $rootScope.audio.pause();
            One2OneCall.stopCall();
            $scope.removeconnectUser(check);
            setTimeout(() => {
                if ($scope.countGroupMembers == 1)
                    socket.emit('dropCall', {
                        callerId: $scope.callerId,
                        type: 'group'
                    });
            }, 1000);
        }
        socket.on('callDroped', function (data) {
            if (data.callerId == $scope.user._id) {
                $rootScope.toggleBtn(false);
                $scope.leaveRoom();
                $scope.callCancelTimmer.stopCallTimmer();
                $scope.ringbell.pause();
                if (data.type == 'call')
                    $.toaster({
                        priority: 'danger',
                        title: 'call drop',
                        message: 'The person you call is busy at the moment'
                    });
                if (data.type == 'group')
                    $.toaster({
                        priority: 'danger',
                        title: 'call drop',
                        message: 'No one pick the call'
                    });
                One2OneCall.stopK();
            }
        })
        /* update the chat of the friend side after any action*/
        socket.on('updateChatAll', (conversation) => {

            var receiverId = conversation.length >= 0 ? conversation[0].receiverId._id : conversation.receiverId._id;
            var senderId = conversation.length >= 0 ? conversation[0].senderId._id : conversation.senderId._id;
            $scope.$apply(function () {
                if ($scope.user._id == receiverId && $scope.chatWithId == senderId || $scope.user._id == senderId && $scope.chatWithId == receiverId) {
                    if (conversation.length >= 0) $scope.chats = conversation;
                    else $scope.chats = [];
                }
            });
        })

        socket.on('receiverUserStatus', function (data) {
            for (var i = 0; i < $scope.allUsers.length; i++) {
                if ($scope.allUsers[i]._id == data.userId) {
                    $scope.allUsers[i].chatWithRefId = data.selectedUser;
                }
            }
        })

        socket.on('updateUserChatWithId', function (data) {
            //console.log('socket for mobile scene');
            for (var i = 0; i < $scope.allUsers.length; i++) {
                if (data.userId == $scope.allUsers[i]._id) {
                    $scope.allUsers[i].chatWithRefId = '';
                    break;
                }
            }
        })

        socket.on('updateMsgSeenStatus', function (data) {
            if (!$scope.user) return;

            if (data.chatWithId == $scope.user._id && data.isChatSeen == 1) {
                for (var i = 0; i < $scope.chats.length; i++) {
                    // console.log(data._id +' == '+ $scope.chats[i].receiverId._id);
                    if (data._id == $scope.chats[i].receiverId._id && $scope.chats[i].isSeen == 0) {

                        $scope.chats[i].isSeen = 1;
                    }
                }
            }
        })

      
        /*socket.on('updateScreenshareStatus', function (data) {
            console.log('444');
            if (!$scope.allUsers) return;

            if (data.toId == $rootScope.user._id) {
                $scope.$apply(function () {

                    for (var i = 0; i < $scope.allUsers.length; i++) {
                        if (data.fromId == $scope.allUsers[i]._id && data.incomingScreenshare != 0) {
                            // document.getElementById('incomingScreenshare').style.display = 'block';
                            // document.getElementById('screenerName').appendChild(document.createTextNode(data.fromName + ''));
                            document.getElementById('screenerTitle').appendChild(document.createTextNode(data.fromName + ''));
                            $("#screenShareModal").modal('show');
                            $scope.isReceivingSS = true;
                            $scope.allUsers[i].screenShareStatus = true;
                            break;
                        } else if (data.fromId == $scope.allUsers[i]._id && data.incomingScreenshare == 0) {
                            // document.getElementById('incomingScreenshare').style.display = 'none';
                            $("#screenShareModal").modal('hide');
                            $scope.isReceivingSS = false;
                            $scope.allUsers[i].screenShareStatus = false;
                            break;
                        }
                    }
                });
            }
        })*/

        socket.on('pauseChatFunctionality', function (userRefId) {
            if ($scope.user._id == userRefId) {
                $rootScope.webRtcO2OPeer = null;
                $rootScope.webRtcO2MPeer = null;

                $rootScope.audio.pause();
                $scope.ringbell.pause();

                $scope.dropCall();
            }
        })

        /*update the new message friend side */
        socket.on('remsg', function (msg) {
            $scope.$apply(function () {
                 console.log(msg.chatType);
                if (msg.chatType != 2){ // is msg not a broadcast msg

                if ($scope.user._id == msg.receiverId) {
                    if ('serviceWorker' in navigator) {
                        //   console.log("Push Notification 1");
                        send(msg.senderName + ': ' + msg.message).catch(err => console.log('New message ', err));
                    }

                    let senderIdIndex = -1;
                    for (var i = 0; i < $scope.allUsers.length; i++) {
                        if ($scope.allUsers[i]._id == msg.senderId) {
                            senderIdIndex = i;
                            break;
                        }
                    }

                    for (var j = 0; j < $scope.allUsers.length; j++) {
                        if ($scope.allUsers[j]._id == msg.receiverId && senderIdIndex != -1) {
                            if ($scope.allUsers[j].chatWithRefId != msg.senderId && $scope.allUsers[j].onlineStatus == 1) {
                                $scope.allUsers[senderIdIndex].usCount++;
                                break;
                            }
                        }
                    }

                }

                if ($scope.user._id == msg.receiverId && $scope.chatWithId == msg.senderId) {

                    if ('serviceWorker' in navigator) {
                        send(msg.senderName + ': ' + msg.message).catch(err => console.log('New message ', err));
                    }

                    $scope.chats.push(msg);
                    scrollbottom();
                }
                if ($scope.user._id == msg.receiverId) {
                    var audio2 = new Audio('audio/message.mp3');
                    audio2.play();
                }

                if (msg.id == $scope.connectionId) {
                    $scope.chats.push(msg.data);
                    scrollbottom();
                }
            }
            else{ // if it is a broadcast msg 
               
                $scope.broadcastChats.push(msg);
                console.log($scope.broadcastChats);
                scrollbottom();
            }
            
            });
        });

        socket.on('updateAllGroupChat', function (chats) {
            $scope.$apply(function () {
                if (chats.case == 'new') $scope.groupchats.push(chats.data);
                else if (chats.case == 'edit') $scope.groupchats = chats.data;
            });
        })

        socket.on('startTimmer', function (data) {

            if (data.callerId == $scope.user._id || data.friendId == $scope.user._id) {
                $scope.receiveCall = true;
            }
            if (data.callerId == $scope.user._id) {
                $scope.ringbell.pause();
                $scope.callCancelTimmer.stopCallTimmer();
                $rootScope.callConnected(); //start the timer
            }
            $(".ringingBell").addClass('hidden');
        });

    }, function errorCallback(response) {
        $scope.sessionDestroy = true;
        $location.path('/');
    });

    $scope.showHideDots = function (id, isShow = 0) {
        if (isShow == 1) $("#msg3dots-" + id).removeClass('hidden');
        else $("#msg3dots-" + id).addClass('hidden');
    };

    $scope.showReplyIcon = function (id, isShow = 0) {
        $scope.replyMenuStatus = false;
        $scope.replyIconId = id;

        if (isShow == 1) $("#replyIcon-" + id).removeClass('hidden');
        else $("#replyIcon-" + id).addClass('hidden');
    };

    $scope.imgStDrop = function (isShow = 0) {
        if (isShow == 1) $(".stAngleDd").removeClass('hidden');
        else $(".stAngleDd").addClass('hidden');
    };

    $scope.stArr = ['activeSt', 'awaySt', 'dDisturbSt', 'invisSt'];
    $scope.changeSt = function (val = 0) {
        $scope.currSt = val;
        $scope.stClass = $scope.stArr[$scope.currSt];
        $http.post('/setPerStatus', {
            pStatus: val
        }).then((res) => {
            if (res.status) console.log('Changed');
        });
    }

    $scope.userEmailId = 0;
    $scope.checkStatus = function () {
        $http.get('/checkPerStatus').then((res) => {
            if (res.status) {
                $scope.currSt = res.data.pStatus;
                $scope.stClass = $scope.stArr[$scope.currSt];
                $scope.userEmailId = res.data.email;
            }
        });
    }
    $scope.checkStatus();

    $scope.showDDwnSt = function () {
        $scope.showDrpDwnSt = !$scope.showDrpDwnSt;
    }
    $scope.showDDwnDisabler = function () {
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

    $scope.reloadCurrent = function () {
        location.reload();
    }

    // Check screenshared
    function checkssStatus() {
        if (localStorage.getItem('ss')) {
            $("#ssViewerModal").modal('show');
            localStorage.removeItem('ss');
        }
    }
    $interval(checkssStatus, 10000);
});