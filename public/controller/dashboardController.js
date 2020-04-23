app.controller("dashController", function ($scope, $http, $window, $location, $rootScope, $uibModal, $websocket, $interval, One2OneCall, One2ManyCall, GroupCall) {
    $scope.isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

    // REVIEW **************** GROUP CALL CODE NEEDS LITTLE OPTIMIZATION ***********************

    $scope.loggedUserId = 0; // REVIEW *** will be removed in future ***
    $scope.inComCallData = 0; // REVIEW *** will be removed in future ***

    $scope.usersLoaded = false;
    $scope.selGroupData = null;
    $scope.isChatPanel = false;
    $scope.isSidePanel = true;

    $scope.chatWithId = ''; /*save with whom user are chatting*/
    $scope.chats = []; /*save all chats */
    $scope.broadcastChats = [];
    $scope.groupchats = [];
    $scope.allGroups;
    $scope.editMsgIconStatus = false;

    $rootScope.audio = new Audio('audio/call.mp3');
    $scope.ringbell = new Audio('audio/ring_bells.mp3');

    $scope.caller = false;
    // KURENTO WebRtc  ======================================================
    const NO_CALL = 0;
    $rootScope.webRtcO2OPeer = null;
    $rootScope.webRtcO2MPeer = null;
    $rootScope.broadCastHtml = document.getElementById('broadCastVideo');
    $scope.webRtcPeer = null;
    $rootScope.presenterArr = [];
    $scope.o2oSocLoaded = false;

    //  =====================================================================

    $scope.callCancelTimmer = new timmer('#checker');
    $rootScope.timmerObj = new timmer('#timmer');

    $scope.liveStreamCode = '';
    $scope.setPassword = 0;
    $scope.replyIconId = "";
    $scope.selectedUserNo = -1;
    $scope.selectedUserData = null;
    $scope.isChatFullscreen = false;
    $scope.scrollHeight = 0;
    $scope.broadcastingStatus = 0;  //-> 0-No Broadcast, 1- Broadcasting, 2- Viewing Broadcast
    $scope.CallTitle = "";
    $scope.checkPassword = '';
    $scope.presenterPassword = '';
    $scope.brErrorMsg = 0;

    //-------------------- CREATE GROUP ------------------------------------------------------
    $scope.groupUsers = [];
    $scope.nonGroupUsers = [];
    $scope.groupErrMsg = "";
    $scope.noneSelectedErrMsg = "";
    $scope.previousValue;
    $scope.addMemberStatus = false;
    //---------- ---------------------- ------------------------------------------------------

    // ---------- TOGGLE BUTTONS --------------------------
    $rootScope.showVideo = true;
    $rootScope.showBCVideo = true;
    $rootScope.openVoice = true;
    $rootScope.openBCvoice = true;

    $rootScope.showVideo = true;
    $rootScope.openVoice = true;
    // ----------------------------------------------------
  
    var windowElement = angular.element($window);

    $http.post("/getProject").then(function (response) {
        $rootScope.projectData = response.data;
        let hostIs = location.host.split(':');
        let webSocketIp = $rootScope.projectData.domainUrl;
        if (hostIs[0] == 'localhost') webSocketIp = '127.0.0.1';
        $scope.o2oReqUrl = 'wss://' + webSocketIp + ':8443/one2one';
        $rootScope.o2oGC = 'wss://' + webSocketIp + ':8080/groupCall';

        $scope.o2oSocConnec();
        $rootScope.signaling_socket = $websocket.$new({
            url: $rootScope.o2oGC
        });

        $rootScope.signaling_socket.$on('$open', function () {
            // console.log('Group call connectected DC JS');
            $interval(GroupCall.getGroupData, 9000);
            GroupCall.getGroupData(); //call on start and then it will repeat by interval
        }).$on('$close', function () {
            // console.log("Disconnected from signaling server");
            GroupCall.closeIt();
        }).$on('$message', function (message) {
            var parsedMessage = JSON.parse(message);
            //   console.log('Received message in DC ', parsedMessage);
            switch (parsedMessage.id) {
                case 'addPeer':
                    GroupCall.addPeerEmitted(parsedMessage);
                    break;
                case 'sessionDescription':
                    GroupCall.sessionDescriptionEmitted(parsedMessage);
                    break;
                case 'iceCandidate':
                    GroupCall.iceCandidateEmitted(parsedMessage);
                    break;
                case 'removePeer':
                    GroupCall.removePeerEmitted(parsedMessage);
                    break;
                case 'groupDataResp':
                    // nothing
                    break;
                default:
                    console.error('Unrecognized message', parsedMessage);
            }
        });
        if ($rootScope.projectData.videoCall == 1) $interval(ping, 10000);
    });

    $scope.o2oSocConnec = function () {
        $rootScope.O2OSoc = $websocket.$new({
            url: $scope.o2oReqUrl
        });
        if (!$scope.o2oSocLoaded) {  // so as the script should not load again and again
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
                    var parsedMessage = JSON.parse(message);
                 //   console.log(parsedMessage);
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
                    $scope.o2oSocConnec();
                })
                .$on('$error', function () {
                    $scope.o2oSocConnec();
                })
            $scope.o2oSocLoaded = true;
        }
    }

    function ping() {
        if (!$rootScope.user || typeof $rootScope.user._id === "undefined") return;
        if (!$rootScope.o2oSocConEst) $scope.reloadCurrent();
        One2OneCall.sendKMessage({
            id: '__ping__',
            from: $rootScope.user._id
        });
    }


    $rootScope.updateGC = function () {
        //  console.log("updateGC");
        $http.post('/leaveCallGroup', {
            '_id': $scope.selGroupData.groupCallid,
            'groupId': $scope.selGroupData._id,
            'userId': $scope.user._id,
            'status': 0
        });
    }

    windowElement.on('beforeunload', function (event) {
        if ($scope.caller && $scope.myCallStatus == 0) {
            $http.post('/leaveCallGroup', {
                '_id': $scope.selGroupData.groupCallid,
                'groupId': $scope.selGroupData._id,
                'userId': $scope.user._id,
                'status': 0
            });
            userData = {
                groupCallid: $scope.selGroupData.groupCallid,
                groupId: $scope.selGroupData._id,
                callerName: $scope.user.name,
                callerId: $scope.user._id,
            };
            $.ajax({
                type: "POST",
                url: "/gCallStatus",
                data: { 'status': 2, 'userdata': userData }
            })
        }
        else if (!$scope.caller && $scope.myCallStatus == 1) {
            $http.post('/leaveCallGroup', {
                '_id': $scope.selGroupCallData.groupCallid,
                'groupId': $scope.selGroupCallData.groupId,
                'userId': $scope.user._id,
                'status': 1
            });
            userData = {
                groupCallid: $scope.selGroupCallData.groupCallid,
                groupId: $scope.selGroupCallData.groupId,
                callerName: $scope.user.name,
                callerId: $scope.user._id,
            };
            $.ajax({
                type: "POST",
                url: "/gCallStatus",
                data: { 'status': 3, 'userdata': userData }
            })
        }

        $http.get('/emptyChatWithId/' + $rootScope.user._id);
    });

    // ============================== BROADCAST ================================================
    // initial websocket connection is in loginController   
    $scope.stopBroadCast = function () {
        One2ManyCall.stop();
        $("#videoBroadCast").addClass('hidden');
        if (!$rootScope.connWdPreId) $http.get('/stopPresenter/' + $rootScope.user._id).then();
        else
            $http.post('/stopViewer', {
                'userData': $rootScope.user,
                'userId': $rootScope.user._id,
                preId: $rootScope.connWdPreId
            }).then();
    }

    $scope.openBrModal = function () {
        $scope.brErrorMsg = 0;
        $("#broadcastingModal").modal();
        $("#broadcastingModal").show();
    }

    $scope.openAvModal = function () {
        // console.log("open AV Modal");
        $("#avPresenterModal").modal();
    }

    $scope.toggleBCVideo = function () {
        $rootScope.showBCVideo = !$rootScope.showBCVideo;
        $rootScope.webRtcO2MPeer.getLocalStream().getVideoTracks()[0].enabled = $rootScope.showBCVideo;
    }
    $scope.toggleBCMute = function () {
        $rootScope.openBCvoice = !$rootScope.openBCvoice;
        $rootScope.webRtcO2MPeer.getLocalStream().getAudioTracks()[0].enabled = $rootScope.openBCvoice;
    }
    $scope.activateBCcloseModal = function () {
        $("#cBroadcastModal").modal();
        $("#cBroadcastModal").show();
    }
    $scope.deActivateBCcloseModal = function () {
        $("#cBroadcastModal").hide();
    }

    $scope.broadCastNow = function () {
        $rootScope.prePassword = $scope.liveStreamCode;

        if ($scope.setPassword == 0) $rootScope.prePassword = '';
        else if ($scope.setPassword == 1 && !$rootScope.prePassword) {
            $scope.brErrorMsg = 1;
            return;
        }
        $("#videoBroadCast").removeClass('hidden');
        $rootScope.connWdPreId = 0;
        One2ManyCall.presenter();
        $("#broadcastingModal").modal('hide');
        $http.post('/startPresenter', {
            'userId': $rootScope.user._id,
            password: $rootScope.prePassword
        }).then();
    }

    $scope.becomeViewer = function (preId, password) {
        $("#avPresenterModal").modal('hide');
        $rootScope.connWdPreId = preId;
        if (password) {
            $scope.presenterPassword = password;
            $("#passReqPre").modal();
        } else $scope.initiateViewer();
    }

    $scope.activateVideoBroadcastPanel = function () {
        $scope.isBcVideoPanel = !$scope.isBcVideoPanel;
        $scope.broadcastingStatus = 1;

        $rootScope.prePassword = $scope.liveStreamCodev;

        if ($scope.setPassword == 0) $rootScope.prePassword = '';
        else if ($scope.setPassword == 1 && !$rootScope.prePassword) {
            $scope.brErrorMsg = 1;
            return;
        }
        $("#broadcastingModal").modal('hide');
        $("#broadcastingVideoModal").modal();

        reLoadEmoji();
        $rootScope.connWdPreId = 0;
        One2ManyCall.presenter();
        $rootScope.broadcastRefId = '';

        $http.post('/startPresenter', {
            password: $rootScope.prePassword
        }).then(function (res) {
            $rootScope.broadcastRefId = res.data.broadcastRefId._id;
        });
    }

    $scope.deActivateVideoBroadcastPanel = function () {
        $scope.isBcVideoPanel = !$scope.isBcVideoPanel;
        $scope.broadcastChats = [];
        One2ManyCall.stop();
        $scope.broadcastingStatus = 0;
        $("#cBroadcastModal").hide();
        $("#broadcastingVideoModal").modal('hide');
        $("#broadcastingModal").modal('hide');
        $("#avPresenterModal").modal('hide');

        if (!$rootScope.connWdPreId)
            $http.get('/stopPresenter').then();
        else
            $http.post('/stopViewer', {
                preId: $rootScope.connWdPreId
            }).then();
    }

    $scope.closeVideoBroadcastPanel = function () {
        $scope.isBcVideoPanel = !$scope.isBcVideoPanel;
        $scope.broadcastChats = [];
        One2ManyCall.stop();
        $scope.broadcastingStatus = 0;
        $("#cBroadcastModal").hide();

        var bLeftChat = {
            "senderId": { '_id': $scope.user._id, 'name': $scope.user.name },
            "receiverId": $rootScope.broadcastRefId, "message": ($scope.user.name + ' has left'), "chatType": 2
        }
        socket.emit('checkmsg', bLeftChat);

        if (!$rootScope.connWdPreId)
            $http.get('/stopPresenter');
        else
            $http.post('/stopViewer', { preId: $rootScope.connWdPreId });

        $("#broadcastingVideoModal").modal('hide');
        $("#avPresenterModal").modal('hide');
        $("#broadcastingModal").modal('hide');
    }

    $scope.initiateViewer = function () {
        $scope.broadcastingStatus = 2;
        $("#broadcastingVideoModal").modal();
        One2ManyCall.viewer();
        reLoadEmoji();
        $http.get('/getBroadcastId/' + $rootScope.connWdPreId).then(function (res) {

            $rootScope.broadcastRefId = res.data.broadcastRefId._id;
            var bJoinedChat = {
                "senderId": { '_id': $scope.user._id, 'name': $scope.user.name },
                "receiverId": $rootScope.broadcastRefId, "message": 'I have Joined', "chatType": 2
            }

            socket.emit('checkmsg', bJoinedChat);

            $http.post('/joinViewer', { preId: $rootScope.connWdPreId, joinMsg: bJoinedChat, broadcastId: $rootScope.broadcastRefId, userData: $rootScope.user }).then(function (res) {
                //  console.log(res.data);
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
    // ============================== ========= ================================================

    // ============================== SCREENSHARE ==============================================
    $scope.openssShareModal = function () {
        if ($scope.selectedUserData.pStatus != 0) return;
        localStorage.setItem('tokenIs', $rootScope.user._id + '-' + $scope.chatWithId + '-' + $rootScope.user.name);
        $("#ssShareModal").modal('show');
    }

    $scope.openssViewerModal = function () {
        $("#ssShareModal").modal('hide');
        $("#ssViewerModal").modal('show');
    }
    // ============================== ========== ===============================================

    // ============================== CREATE GROUP =============================================
    $scope.openCreateGroupModal = function () {
        $("#createGroupModal").modal({
            backdrop: 'static',
            keyboard: false
        });
        $('#createGroupModal').show();
    }

    $scope.closeCreateGroupModal = function () {
        $('#createGroupModal').hide();
        $scope.groupName = "";
        $scope.noneSelectedErrMsg = $scope.groupErrMsg = "";
        $scope.groupUsers = [];

        for (var i = 0; i < $scope.allUsers.length; i++) {
            if ($scope.allUsers[i].isAdded) {
                $scope.allUsers[i].isAdded = false;
            }
        }
    }

    $scope.addMemberModalStatus = function () {
        $scope.groupUsers = [];

        for (var i = 0; i < $scope.allUsers.length; i++) {
            if ($scope.allUsers[i].isAdded) {
                $scope.allUsers[i].isAdded = false;
            }
        }

        $scope.addMemberStatus = !$scope.addMemberStatus;
        $scope.nonGroupUsers = [];

        var isFound = false;
        if ($scope.addMemberStatus) {
            for (var j = 0; j < $scope.allUsers.length; j++) {
                isFound = false;
                if ($scope.allUsers[j]._id != $scope.user._id) {

                    for (var i = 0; i < $scope.selGrpMembers.length; i++) {
                        if ($scope.allUsers[j]._id == $scope.selGrpMembers[i]._id) {
                            isFound = true;
                            break;
                        }

                        else if ($scope.allUsers[j]._id != $scope.selGrpMembers[i]._id && i == ($scope.selGrpMembers.length - 1) && !isFound) {
                            $scope.nonGroupUsers.push($scope.allUsers[j]);
                        }

                    }
                }
            }
        }
    }

    $scope.submitNewMember = function () {

        $scope.selGrpMembers = $scope.selGrpMembers.concat($scope.groupUsers);

        //-> (About funType) 0- updateGroup; 1- updateGroupName; 2- UpdateGroupMember; 3- RemoveGroupMember
        socket.emit('updateGroups', {
            'groupId': $scope.connectionId,
            'members': $scope.groupUsers,
            'groupData': $scope.selectedUserData,
            'funType': 2
        });

        if ($scope.groupUsers.length > 0) {
            $http.post("/addNewMembers", { 'groupId': $scope.connectionId, 'members': $scope.groupUsers }).then(function (response) {
                $scope.addMemberModalStatus();
                $scope.groupUsers = [];

                for (var i = 0; i < $scope.allUsers.length; i++) {
                    if ($scope.allUsers[i].isAdded) {
                        $scope.allUsers[i].isAdded = false;
                    }
                }
            });
        }
    }

    $scope.createGroup = function () {
       // console.log($scope.groupName);
        if (!$scope.groupName || $scope.groupName == "") {
            $scope.groupErrMsg = "please enter group name";
            return false;
        }

        if ($scope.groupUsers.length <= 0) {
            $scope.noneSelectedErrMsg = "select atleast one contact";
            return false;
        }

        if ($scope.groupName != "" && $scope.groupUsers.length > 0) {
            $scope.groupUsers.push($rootScope.user);

            var groupData = {
                'name': $scope.groupName, 'members': $scope.groupUsers, 'creatorUserId': $rootScope.user._id,
                'projectId': $rootScope.projectData._id, 'status': 1
            };

            //-> (About funType) 0- updateGroup; 1- updateGroupName; 2- UpdateGroupMember; 3- RemoveGroupMember
            socket.emit('updateGroups', { 'groupData': groupData, 'funType': 0 });
            $http.post("/createUserGroup", { 'groupData': groupData, 'userId': $rootScope.user._id }).then(function (response) {
                $scope.allGroups = response.data;
                $scope.groupsLoaded = true;

                $scope.closeCreateGroupModal();
            });
        }
    }

    $scope.groupDeleteConfirmStatus = false;
    $scope.confirmModalGroupDel = function () {
        $scope.groupDeleteConfirmStatus = !$scope.groupDeleteConfirmStatus;
        if ($scope.groupDeleteConfirmStatus) {
            $('#groupDelConfirmModal').modal();
            $('#groupDelConfirmModal').show();
        }
        else {
            $('#groupDelConfirmModal').hide();
        }
    }

    $scope.DeleteGroup = function () {
        //-> (About funType) 0- updateGroup; 1- updateGroupName; 2- UpdateGroupMember; 3- RemoveGroupMember
        socket.emit('updateGroups', { 'groupId': $scope.connectionId, 'funType': 4 });

        $http.post("/deleteGroup", { 'groupId': $scope.selGroupData._id, 'projectId': $rootScope.projectData._id }).then(function (response) {
           // console.log("group deleted");
            $scope.groupDeleteConfirmStatus = false;
            $('#groupDelConfirmModal').hide();
            $('#editGroupModal').hide();
            $scope.resetUserSelectionData();
        });
    }


    $scope.addGroupUser = function (user) {
        user.isAdded = true;
        $scope.groupUsers.push(user);
    }

    $scope.removeGroupUser = function (user) {
        user.isAdded = false;
        var index = $scope.groupUsers.indexOf(user);
        $scope.groupUsers.splice(index, 1);
    }

    $scope.openEditGroup = function () {
        $("#editGroupModal").modal({
            backdrop: 'static',
            keyboard: false
        });
        $('#editGroupModal').show();
    }
    $scope.closeEditGroup = function () {
        $('#editGroupModal').hide();
    }

    $scope.removeCreatedGroupUser = function (user) {
        var index = $scope.selGrpMembers.indexOf(user);
        $scope.selGrpMembers.splice(index, 1);

        //!**** Below socket code will be updated ****
        //-> (About funType) 0- updateGroup; 1- updateGroupName; 2- UpdateGroupMember; 3- RemoveGroupMember
        socket.emit('updateGroups', {
            'groupId': $scope.connectionId,
            'memberId': user._id,
            'userId': $scope.user._id,
            'funType': 3
        });

        $http.post("/removeGroupUser", { 'groupId': $scope.connectionId, 'memberId': user._id }).then(function (response) {
            // $scope.closeEditGroup();
        });
    }
    // ============================== ========== ===============================================

    //============= For Inline Edit of GroupName ===============================================
    $scope.edit = function () {
        $('#gnEdit').prop("disabled", false);
        $scope.editMode = true;
        previousValue = $scope.selGroupData.name;
    };
    $scope.save = function () {
        $('#gnEdit').prop("disabled", true);
        $scope.editMode = false;
       // console.log(previousValue + " != " + $scope.selGroupName);
        if (previousValue != $scope.selGroupName) {
            $scope.allGroups[$scope.selectedUserNo].name = $scope.selGroupData.name;

            var groupData = {
                'name': $scope.groupName, 'members': $scope.selGrpMembers,
                'projectId': $rootScope.projectData._id, 'status': 1
            };
            //-> (About funType) 0- updateGroup; 1- updateGroupName; 2- UpdateGroupMember; 3- RemoveGroupMember
            socket.emit('updateGroups', { 'groupId': $scope.connectionId, 'groupName': $scope.selGroupName, 'groupData': groupData, 'funType': 1 });
            $http.post("/editGroupName", { 'groupId': $scope.connectionId, 'groupName': $scope.selGroupName }).
                then(function (response) {
                });
        }
    };

    $scope.cancel = function () {
        $scope.editMode = false;
        $scope.selGroupName = previousValue;
    };

    // ============================== ========== ===============================================

    // ============================== AUDIO/VIDEO ===============================================    
    $scope.removeClasses = function () {
        $('#dropImage').hide();
    }

    $scope.fullscreenStatus = function () {
        $scope.isChatFullscreen = !$scope.isChatFullscreen;
    }

    $scope.toggelVideo = function () {
        $rootScope.showVideo = !$rootScope.showVideo;
        $rootScope.webRtcO2OPeer.getLocalStream().getVideoTracks()[0].enabled = $rootScope.showVideo;
    };

    $scope.toggelMute = function () {
        $rootScope.openVoice = !$rootScope.openVoice;
        $rootScope.webRtcO2OPeer.getLocalStream().getAudioTracks()[0].enabled = $rootScope.openVoice;
    };

    $scope.generateNewTimer = function () {
        $rootScope.timmerObj.reset();
        if ($rootScope.callType == 1) $rootScope.timmerObj = new timmer('#audioTimmer');
        else $rootScope.timmerObj = new timmer('#timmer');
    }

    $rootScope.callConnected = function () {   // when the second person accept the caller call
        $scope.generateNewTimer();
        $rootScope.timmerObj.startCallTimmer();
        $("#timmer").removeClass('hidden');
    }

    $scope.stopCall = function (message = '', friendId = 0) {
        //console.log("chatWithId: "+ $scope.chatWithId)
        let callDuration = 'Call duration: ' + $rootScope.timmerObj.showTime();
        $.toaster({
            priority: 'danger',
            title: 'call ended',
            message: callDuration
        });
        
        socket.emit('endCall', {
            callerId: $scope.user._id,
            chatWithId: $scope.chatWithId,
            type: 'one'
        });
        One2OneCall.stopK(message, friendId);
    }

    $scope.toggelVideo = function () {
        $rootScope.showVideo = !$rootScope.showVideo;

        if (!$rootScope.showVideo) $scope.ringbell.pause();
        else $scope.ringbell.play();

        $rootScope.webRtcO2OPeer.getLocalStream().getVideoTracks()[0].enabled = $rootScope.showVideo;
    };

    $scope.toggelMute = function () {
        $rootScope.openVoice = !$rootScope.openVoice;
        $rootScope.webRtcO2OPeer.getLocalStream().getAudioTracks()[0].enabled = $rootScope.openVoice;
    };

    $scope.groupCallStatus = false;
    // $scope.groupCallSection = function (){
    //     $scope.groupCallStatus = !$scope.groupCallStatus;
    // }
    // ============================== ========== ============================================
    // ============================== ========== ============================================
    // ============================== ========== ============================================

    /*check session of the user if he is logged in or not*/
    //console.log('userToken ', localStorage.getItem('userToken'));
    $http({
        method: 'POST',
        url: '/checkSession',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('userToken')
        },
        data: { '_id': localStorage.getItem('userId') },
        xhrFields: {
            withCredentials: true
        }
    }).then(function successCallback(response) {

        $scope.loggedUserId = response.data.user._id;  // REVIEW *** needs review ***
        $scope.usersInGroup = 1; // REVIEW *** needs review ***

        $scope.myCallStatus = 0; //0- calling, 1- joiner
        $scope.countGroupMembers = 1;
        $rootScope.user = response.data.user;

        $scope.currSt = response.data.user.pStatus;
        $scope.stClass = $scope.stArr[$scope.currSt]

        $scope.groupCallMinimized = false;
        $rootScope.o2oSocConEst = false;
        $scope.receiveCall = false;
        $scope.welcomePage = true;
        $rootScope.userBusy = false;

        $scope.groupSelected = false;
        $scope.bypassGroupSelected = false; //if groupCall incoming Modal is open then this becomes true
        $scope.isPagination = false;
        $scope.moreChatExist = true;
        $scope.isRepeatFinish = false;
        $scope.isScrollExecuted = false;
        $scope.showJoinedUsers = false;

        $scope.groupChatBoxActive = false;
        $scope.isReplying = false;
        $scope.allUsersLeft = 0; // * 0: nothing, 1: users left call after joining, 2: users has not left call
        $scope.commentReplyId = '';
        $scope.selectedMsg = null;
        $scope.selGroupCallData = null;

        $scope.groupCallerName = "";
        $scope.joinedUsersList = [];
        $scope.files = [];
        $scope.callingGroups = [];
        $scope.members = [];  /*this array save group members*/

        localStorage.setItem('tokenData', $rootScope.user._id);
        localStorage.setItem('userData', $rootScope.user);

        //  REVIEW -------------------- NEEDS Review -----------------
        // $scope.check = function (user) {
        //     return user.email != $scope.user.email;
        // };

        // $scope.remove = function (index) {
        //     var files = [];
        //     angular.forEach($scope.files, function (file, key) {
        //         if (index != key) files.push(file);
        //         $scope.files = files;
        //     })
        // }
        // -----------------------------------------------------------

        // REVIEW ------------ NOT USED RIGHT NOW (8-21-19) -------------------- */
        $scope.download = function (filename) {
            $http.get('/download/' + filename)
                .then(function (res) {
                    return res;
                });
        }
        // ---------------------------------------------------------------------

        // REVIEW ------------ remove user then click on cross button -------------------- */
        $scope.removeUser = (id) => {
            var obj = {
                'type': 1,
                'id': id
            };
            $scope.callModal(obj);
        }
        // ----------------------------------------------------------------------------------
       

        socket.emit('user_connected', {
            userId: $rootScope.user._id
        });

        /*get all users*/
        $http.get("/getUsers/" + response.data.user._id + '/' + $rootScope.projectData.allList + '/' + $rootScope.projectData._id)
            .then(function (response) {
                $scope.allUsers = response.data.usersList;
                $scope.selectedUserNo = 0;
                let i = 0;
                let userChatToOpen;
                for (i; i < response.data.usersList.length; i++) { // ******** RECHECK NEEDED ***********
                    $scope.allUsers[i].tempDate = new Date($scope.allUsers[i].updatedByMsg).getTime();
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

                $http.post("/getCallGroups", { 'userId': $rootScope.user._id, 'projectId': $rootScope.projectData._id })
                    .then(function (callingGroups) {
                        //  console.log("CALLING GROUPS FROM DB");
                        // REVIEW ----------------------------------------
                        if (callingGroups.data.length > 0) {
                            for (var i in $scope.allGroups) {
                                for (var j in callingGroups.data) {
                                    if (callingGroups.data[j].callerId == $rootScope.user._id) break;
                                    $scope.allGroups[i].groupCallid = callingGroups.data[j]._id;
                                    if ($scope.allGroups[i]._id == callingGroups.data[j].groupId._id) {
                                        callingGroups.data[j].groupId.groupCallid = callingGroups.data[j]._id;
                                        $scope.callingGroups.push(callingGroups.data[j].groupId);
                                        $scope.allGroups[i].joinCall = true;
                                        break;
                                    }
                                    else {
                                        $scope.allGroups[i].joinCall = false;
                                    }
                                }
                            }
                        }
                        //  console.log($scope.callingGroups);
                    })
            });

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

        $http.get("/getNotification/" + $rootScope.user._id)
            .then(function (response) {
                $scope.notifications = response.data.noti;
                $scope.notiCount = response.data.count;
            });

        $scope.gcChatBox = function (){
            $scope.groupChatBoxActive = !$scope.groupChatBoxActive;
        }

         
        $scope.activateJoinedUsers = function (){
            $scope.showJoinedUsers = !$scope.showJoinedUsers;
            if ($scope.showJoinedUsers){
                $('#joinedUsersSectionModal').modal();
                $('#joinedUsersSectionModal').show();
            }
            else{
                $('#joinedUsersSectionModal').hide();
            }
        }


        $scope.chatActive = function (isChatDocker) {
            $scope.selectedUserNo = -1;
            $scope.selectedUserData = null;

            $scope.resetUserSelectionData();

            $scope.deActivate(isChatDocker);
            $scope.groupSelected = false;
            $scope.isRepeatFinish = false;
        }

        $scope.groupChatActive = function (isChatDocker) {
            $scope.selectedUserNo = -1;
            $scope.selectedUserData = null;

            $scope.resetUserSelectionData();

            $scope.deActivate(isChatDocker);
            $scope.groupSelected = true;
            $scope.isRepeatFinish = false;
        }

        $scope.chatBack = function () {
            $scope.selectedUserNo = -1;
            $scope.selectedUserData = null;
            $scope.groupSelected = false;

            $scope.resetUserSelectionData();

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

        $scope.getMoreChat = function () {
            if ($scope.moreChatExist) $scope.isPagination = true;
            //    console.log($scope.chats);

            if (!$scope.groupSelected) {
                $http.get('/getMoreChat/' + $scope.user._id + '/' + $scope.chatWithId + '/' + 20 + '/' + ($scope.chats[0].createdAt))
                    .then(function (res) {

                        for (let i = 0; i < res.data.length; i++) {
                            $scope.chats.unshift(res.data[i]);
                        }
                        if (res.data.length > 0) { $scope.moreChatExist = true; scrollCustom(); }
                        else {
                            $scope.moreChatExist = false;
                        }
                        $scope.isPagination = false;
                    });
            }
            else {
                $http.get('/getMoreGroupChat/' + $scope.selGroupData._id + '/' + 20 + '/' + ($scope.groupchats[0].createdAt))
                    .then(function (res) {

                        for (let i = 0; i < res.data.length; i++) {
                            $scope.groupchats.unshift(res.data[i]);
                        }
                        if (res.data.length > 0) { $scope.moreChatExist = true; scrollCustom(); }
                        else {
                            $scope.moreChatExist = false;
                        }
                        $scope.isPagination = false;
                    });
            }
        }

        // --------- called from template (html) ------------------------
        $scope.ngRepeatFinish = function () {
            console.log("ngRepeatFinish");
            $scope.isRepeatFinish = true;
            var con = document.getElementsByClassName('msg_history')[0];
            var previousScrollHeight;

            if (!$scope.isScrollExecuted) {
                previousScrollHeight = con.scrollHeight - 30;
                $scope.isScrollExecuted = true;
            }
            else {
                previousScrollHeight = con.scrollHeight;
            }

            con.scrollTo(0, previousScrollHeight);
            setTimeout(() => {
                if (con.scrollHeight > previousScrollHeight) {
                    $scope.ngRepeatFinish();
                }
            }, 500);
        }

        /*on clicking a user, this function is called to get chat*/
        $scope.startChat = function (obj) {
           // console.log(obj);
            if (obj.isChatDocker == 0) resetScrollVar();
            if (!obj) return;

            // -------------- If selected one is the user -------------------
            if (obj.type == 1 && $scope.selectedUserNo == obj.userIndex) {
                $scope.selectedUserNo = -1;
                $scope.selectedUserData = null;
                $scope.resetUserSelectionData();

                return;
            }
            else if (obj.type == 1 && $scope.selectedUserNo != obj.userIndex) {
                $scope.selectedUserNo = obj.userIndex;
                $scope.selectedUserData = obj.user;
            }

            // -------------- If selected one is the group -------------------
            if (obj.type == 2 && $scope.selectedUserNo == obj.groupIndex) {
                $scope.selectedUserNo = -1;
                $scope.selectedUserData = null;
                $scope.resetUserSelectionData();

                return;
            }
            else if (obj.type == 2 && $scope.selectedUserNo != obj.groupIndex) {
                $scope.selectedUserNo = obj.groupIndex;
                $scope.selectedUserData = obj.user;
            }

            if (obj.type == 1 && obj.user.pStatus != 0) {
                $scope.CallTitle = "user is offline";
            }
            else {
                $scope.CallTitle = "";
            }

            $scope.isRepeatFinish = false;
            $scope.moreChatExist = true;
            $scope.deActivate(obj.isChatDocker);

            $scope.isSidePanel = false;
            $scope.isChatPanel = true;
            $scope.welcomePage = false;
            $scope.isLoaded = false;

            $scope.selGrpMembers = [];
            /*obj is an object send from view it may be a chat or a group info*/
            if (obj.type == 1) {
                $scope.groupSelected = false;
                //  $scope.selGrpMembers = [];
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
                        $scope.chats = res.data;
                        socket.emit('updateChatSeenStatus', {
                            'isChatSeen': 1,
                            '_id': $scope.user._id,
                            'chatWithId': $scope.chatWithId
                        });
                    });
            } else {
                $scope.selectedUserData = obj.group;
                $scope.groupSelected = true;
                $scope.selGroupData = obj.group;
                $scope.connectionId = obj.group._id;
                $scope.selGroupName = obj.group.name;
                $scope.selGrpMembers = obj.group.members;
                $scope.status = '';
              //  console.log($scope.selGrpMembers);

                socket.emit('updateUserSelection', {
                    selectedUser: '',
                    userId: $scope.user._id
                })

                $http.get('/getGroupChat/' + obj.group._id + '/' + 20).then(function (groupchat) {
                    // console.log(groupchat.data);
                    $scope.groupchats = groupchat.data;
                    $scope.chatLength = $scope.groupchats.length;
                })
            }
        }

        $scope.resetUserSelectionData = function () {
            $scope.selGrpMembers = [];
            $scope.selUserName = null;
            $scope.userProfileUrl = null;
            $scope.chatWithImage = null;
            $scope.chatWithId = null;
            $scope.status = 0;
            $scope.connectionId = 0;
            $scope.isChatPanel = false;
            $scope.welcomePage = false;
            $scope.isSidePanel = true;

            $scope.selectedGroupId = null;
            $scope.selGroupName = "";

            //*** need recheck **** */
            // $scope.selectedUserNo = -1;
            // $scope.selectedUserData = null;
         
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

            // var ele = $('#sendGMsg').emojioneArea();
            // ele[0].emojioneArea.setText($scope.message);

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

        /* send broadcast message */
        $scope.sendBCMessage = function (sendType, message, chkmsg) {
            if (!chkmsg || typeof chkmsg == "undefined") chkmsg = 0;
            if (!message || typeof message == "undefined") message = 0;

            if (!$scope.message && chkmsg) $scope.message = chkmsg;
            else if (!$scope.message && !chkmsg) return;

            var msgObj = {
                "senderId": { '_id': $scope.user._id, 'name': $scope.user.name },
                "receiverId": $rootScope.broadcastRefId, "message": $scope.message, "chatType": 2
            }

            socket.emit('checkmsg', msgObj);
            $scope.message = '';
            scrollbottom();
            var ele = $('#sendBMsg').emojioneArea();
            ele[0].emojioneArea.setText('');

            $http.post('/chat', { 'msgData': msgObj })
                .then(function (res) {
                    if (res.data.length < 1) return;
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
                            updateGroupChat();
                            // socket.emit('updateGroupChat', {
                            //     data: res.data,
                            //     case: 'edit'
                            // });
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

            // var ele = $('#sendGMsg').emojioneArea();
            // ele[0].emojioneArea.setText('');
             $('#sendGMsg').val('')
             setTimeout(() => {
                scrollGroupBottom();
             }, 500);

            var ele = $('#sendMsg').emojioneArea();
            ele[0].emojioneArea.setText('');
        }


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

        $scope.deActivate = function (isChatDocker = 0) {
            $scope.commentReplyId = "";
            $scope.isReplying = false;
            $scope.selectedMsg = null;
            $("#applyPic").removeClass('commentReplyPanel');
            $("#sendMsgButton").removeClass('alignSendMsgButton');
            if (isChatDocker == 0)
                document.querySelector('.showCommentsReply').style.display = 'none';
        }


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

        /* Video Calling Functionality */
        // -------- (About Third 'status' Param): 0- calling, 1- joining --------------- 
        $scope.videoCall = function (type, callerId, status = 0) {
    
            if ($scope.groupCallMinimized) {
                $scope.groupCallStatus = true;
                $("#groupCallModal").modal({
                    backdrop: 'static',
                    keyboard: false
                });
                $('#groupCallModal').show();
                $("#groupVideoCall").css("color", "white");
                return;
            }
           
            $("#groupVideoCall").css("color", "#ea5a5a;");
            cancelTimmer = false;
            if ($scope.groupSelected || $scope.bypassGroupSelected) {
                scrollGroupBottom();
                $scope.groupChatBoxActive = true;
                $scope.bypassGroupSelected = false;
                $('#incomingGroupCallModal').hide();
                $scope.groupCallStatus = true;
                $("#groupCallModal").modal({
                    backdrop: 'static',
                    keyboard: false
                });
                $('#groupCallModal').show();

                let userData = {};
              //  console.log($scope.allGroups);
               // console.log($scope.selGroupData);
                $scope.myCallStatus = status;
                if (status == 0) {   // a caller's area
               
                    $scope.joinedUsersList = [];
                    $http.post('/createGroupCall', {
                        'groupId': $scope.selGroupData._id,
                        'callerId': $scope.user._id,
                        'projectId': $rootScope.projectData._id
                    }).then(function (groupCallData) {
                        $scope.caller = true;
                       // console.log("5555");
                       // console.log(groupCallData);
                        for (var i in $scope.allGroups) {
                            if ($scope.allGroups[i]._id == $scope.selGroupData._id) {
                                $scope.allGroups[i].groupCallid = groupCallData.data._id;
                                $scope.callingGroups.push($scope.allGroups[i]);

                                let gData = {};
                                if ($scope.selGroupData != null) {
                                    gData = $scope.selGroupData;
                                    gData = {
                                        'groupId': gData._id,
                                        'groupCallid': gData.groupCallid,
                                        'callerId': $scope.user.name,
                                        'name': $scope.user._id
                                    }
                                    $scope.selGroupCallData = $scope.selGroupData;
                                }
                                else {
                                    gData = $scope.selGroupCallData;
                                }
                                userData = {
                                    'groupId': gData.groupId,
                                    'groupCallid': gData.groupCallid,
                                    'callerId': $scope.user._id,
                                    'name': $scope.user.name
                                    // 'videoId': videoId
                                };
                                //--- needs reChecking ---------
                                console.log("initiating groupCall");
                                GroupCall.init(userData, status);
                                break;
                            }
                        }

                    });
                    groupTimmer(30, 0);
                }

                else if (status == 1) {  // call join area
                    //  console.log("JOINING CALL- status:"+ status);
                    $('#stopGroupCallBtn').text("Leave");
                    cancelTimmer = true;
                    let gData = {};

                    if ($scope.selGroupData != null) {
                        gData = $scope.selGroupData;
                        gData = {
                            'groupId': gData._id,
                            'groupCallid': gData.groupCallid,
                            'callerId': $scope.user.name,
                            'name': $scope.user._id
                        }
                        $scope.selGroupCallData = $scope.selGroupData;
                    }
                    else {
                        gData = $scope.selGroupCallData;
                    }

                    $http.post('/joinCallGroup', {
                        '_id': gData.groupCallid,
                        'groupId': gData.groupId,
                        'userId': $scope.user._id,
                        'projectId': $rootScope.projectData._id,
                        'member': $scope.user._id
                    }).then(function (callingGroupData) {
                        // let videoId =  Math.floor(100000000 + Math.random() * 900000000);
                        //  console.log("created Rand Val: "+  videoId);
                        userData = {
                            groupId: gData.groupId,
                            groupCallid: gData.groupCallid,
                            name: $scope.user.name,
                            callerId: $scope.user._id
                            //  videoId: videoId
                        };
                        GroupCall.init(userData, status);
                    })
                }
                return;
            }


            if ($scope.selectedUserData != null && $scope.selectedUserData.pStatus != 0) return

            if ($scope.selectedUserData.onlineStatus == 0) {
                $.toaster({
                    priority: 'danger',
                    title: 'call canceled',
                    message: 'user is offline'
                });
                return;
            }

            if (type == 1) document.querySelector('.audioTab').style.display = 'block';
            else document.querySelector('.videoTabNew').style.display = 'block';

            $rootScope.toggleBtn(true);
            $scope.caller = true;
            $scope.ringbell.loop = true;
            $scope.ringbell.play();
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

        $scope.minGroupCall = function () {
            $scope.groupCallMinimized = !$scope.groupCallMinimized;
            if ($scope.groupCallMinimized) {
                $('#groupCallModal').hide();
                $("#minimizedGroupCall").modal();
                $('#minimizedGroupCall').show();

            }
            else {
                $('#minimizedGroupCall').hide();
                $("#groupCallModal").modal({
                    backdrop: 'static',
                    keyboard: false
                });
                $('#groupCallModal').show();
            }
        }

        $scope.stopGroupCall = function () {
            let userData = {};
            $scope.groupChatBoxActive = true;
            if ($scope.selGroupData != null) {
                userData = {
                    groupCallid: $scope.selGroupData.groupCallid,
                    groupId: $scope.selGroupData._id,
                    callerName: $scope.user.name,
                    callerId: $scope.user._id,
                };

                // if status: 0, then im a caller and stop the call
                // if status: 1, then im a joiner and leave the call
                $http.post('/leaveCallGroup', {
                    '_id': $scope.selGroupData.groupCallid,
                    'groupId': $scope.selGroupData.groupId,
                    'userId': $scope.user._id,
                    'status': $scope.myCallStatus
                });
            }
            else {
                // console.log("stopGroupCall- else");
                // console.log($scope.selGroupCallData);
                userData = {
                    groupCallid: $scope.selGroupCallData.groupCallid,
                    groupId: $scope.selGroupCallData.groupId,
                    callerName: $scope.user.name,
                    callerId: $scope.user._id,
                };

                $http.post('/leaveCallGroup', {
                    '_id': $scope.selGroupCallData.groupCallid,
                    'groupId': $scope.selGroupCallData.groupId,
                    'userId': $scope.user._id,
                    'status': $scope.myCallStatus
                });
            }
            // console.log(userData);

            if ($scope.myCallStatus == 0) {  // if im a caller and has ended the call
                GroupCall.stop(userData, 2);
            }
            else if ($scope.myCallStatus == 1) {  // if im a joiner and im leaving a call
                GroupCall.stop(userData, 3);
            }

            $("#groupVideoCall").css("color", "white");
            $('#groupCallModal').hide();
            $('#stopGroupCallBtn').text('Stop');
            cancelTimmer = true;
            $scope.groupCallMinimized = false;
            resetGroupTimer();
            $scope.selGroupCallData = {};
            $scope.myCallStatus = 0;
        };

        $scope.rejectIncomingGroupCall = function () {
            $scope.selGroupCallData = {};
            $scope.hasJoinedGCall = false;
            GroupCall.stop();
            $('#incomingGroupCallModal').hide();
            cancelTimmer = true;
            resetGroupTimer();
        };


        /* this is the main function call after time up and no one receive the call*/
        $scope.dropCall = function () {
            $scope.callDropAfterTime($scope.chatWithId, $scope.user._id);
        }
        /* this function drop the group call after times up and no one receive call*/
        $scope.dropGroupCallAfterTime = function (members, callerId) {
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

        // ---------- Needs ReCheck ---------------------------------
        $rootScope.userBusyMsg = function (){
            socket.emit('userBusy', {'callerId': $scope.user._id});
        }
        // ---------- Needs ReCheck ---------------------------------

        /* drop the call when user didn't received the call and times up*/
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
                        message: 'user is not available at the moment'
                    });
                    $scope.callCancelTimmer.stopCallTimmer();
                    One2OneCall.stopK();
                }
            });
        })

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

        /*show alert to the user that the person is busy on another call*/
        socket.on('_userBusy', function (data) {
            if (data.callerId == $scope.user._id) {
                $rootScope.toggleBtn(false);
                $.toaster({
                    priority: 'danger',
                    title: 'call drop',
                    message: 'User is on another call'
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
            $scope.confirmModalStatus = false;
            $('#confirmationModal').hide();

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

        /* update chat after performing any action on realtime*/
        function updatechat(deletedItem) {
            $http.get('/getChat/' + $scope.user._id + '/' + $scope.chatWithId + '/' + 20)
                .then(function (res) {
                    $scope.groupMembers = '';
                    $scope.chats = res.data;
                    socket.emit('updatechat', res.data);
                });
        }

        function updateGroupChat() {
            $http.get('/getGroupChat/' + $scope.selGroupData._id + '/' + 20).then(function (res) {
             //   console.log(res);
                $scope.groupchats = res.data;
                $scope.chatLength = $scope.groupchats.length;
                socket.emit('updateGroupChat', {
                    'data': res.data,
                    case: 'edit'
                });
                // socket.emit('updatechat', res.data);
            })
        }

        $scope.confirmModalStatus = false;
        $scope.confirmModal = function () {
            $scope.confirmModalStatus = !$scope.confirmModalStatus;
            if ($scope.confirmModalStatus) {
                $('#confirmationModal').modal();
                $('#confirmationModal').show();
            }
            else {
                $('#confirmationModal').hide();
            }
        }

        $scope.callModal = function (obj) {
            $scope.modalObject = obj;
          //  console.log($scope.modalObject);
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
                   // console.log(res);
                    updateGroupChat();
                    // socket.emit('updateGroupChat', {
                    //     'data': res.data,
                    //     case: 'edit'
                    // });
                })
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
                        message: 'User is busy'
                    });
                if (data.type == 'group')
                    $.toaster({
                        priority: 'danger',
                        title: 'call drop',
                        message: 'No one picked the call'
                    });
                One2OneCall.stopK();
            }
        })

        socket.on('_endCall', function (data) {
            if (data.callerId == $scope.chatWithId) {
                $rootScope.userBusy = false;
                let callDuration = 'Call duration: ' + $rootScope.timmerObj.showTime();
                $.toaster({
                    priority: 'danger',
                    title: 'call ended',
                    message: callDuration
                });
                $scope.chatWithId = 0;
            }
            else{
                if (data.chatWithId == $scope.user._id){
                    $rootScope.userBusy = false;
                    document.getElementById('incommingCall').style.display = 'none';
                    One2OneCall.setCallState(NO_CALL);
                    $rootScope.toggleBtn(false);
                    $scope.leaveRoom();
                }
                  
            }
        })

        socket.on("updateFriendsGroups", (gData) => {
            //delete the selected group
            if (gData.funType == 4) {
                for (var j = 0; j < $scope.allGroups.length; j++) {
                    if (gData.groupId == $scope.allGroups[j]._id) {
                        let index = $scope.allGroups.indexOf($scope.allGroups[j]);
                        $scope.allGroups.splice(index, 1);
                        break;
                    }
                }
            }
            else if (gData.funType == 3) {
                //  if ($scope.user._id == gData.userId) return true;
                // console.log(gData.funType);
                for (var l = 0; l < $scope.allGroups.length; l++) {
                    if (gData.groupId == $scope.allGroups[l]._id) {
                        for (var m = 0; m < $scope.allGroups[l].members.length; m++) {
                            if ($scope.allGroups[l].members[m]._id == gData.memberId) {
                             //   console.log($scope.allGroups[l].members[m]);
                                let memberIndex = $scope.allGroups.indexOf($scope.allGroups[l].members[m]);
                                $scope.allGroups[l].members.splice(memberIndex, 1);
                                $('#editGroupModal').hide();
                              //  console.log($scope.user._id + " == " + gData.memberId);
                                if ($scope.user._id == gData.memberId) {
                                    let groupIndex = $scope.allGroups.indexOf($scope.allGroups[l]);
                                    $scope.allGroups.splice(groupIndex, 1);
                                    break;
                                }
                            }
                        }
                    }
                }
            }// ----- if ends ------
            else {
                for (var i = 0; i < gData.groupData.members.length; i++) {
                    if (gData.funType == 0 && gData.groupData.members[i]._id == $scope.user._id) {
                        $scope.allGroups.push(gData.groupData);
                        break;
                    }
                    else if (gData.funType == 1 && gData.groupData.members[i]._id == $scope.user._id) {
                        for (var j = 0; j < $scope.allGroups.length; j++) {
                            if (gData.groupId == $scope.allGroups[j]._id) {
                                $scope.allGroups[j].name = gData.groupName;
                                break;
                            }
                        }
                    }
                    else if (gData.funType == 2 && gData.groupData.members[i]._id == $scope.user._id) {
                        $scope.allGroups.push(gData.groupData);
                        //on any issue, reCheck Needed about this below ForLoop
                        for (var k = 0; k < $scope.allGroups.length; k++) {
                            if (gData.groupId == $scope.allGroups[k]._id) {
                                $scope.allGroups[k].members.concat(gData.members);
                            }
                        }
                    }
                } // Main ForLop Ends here ----
            } // ----- Main ELSE ends -----
        })// Socket Function Ends here ----


        /* update the chat of the friend side after any action */
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
            if (!$scope.allUsers) return false;
            for (var i = 0; i < $scope.allUsers.length; i++) {
                if ($scope.allUsers[i]._id == data.userId) {
                    $scope.allUsers[i].chatWithRefId = data.selectedUser;
                }
            }
        })

        // *** socket for mobile scene ***
        socket.on('updateUserChatWithId', function (data) {
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
                    if (data._id == $scope.chats[i].receiverId._id && $scope.chats[i].isSeen == 0) {
                        $scope.chats[i].isSeen = 1;
                    }
                }
            }
        })


        socket.on('streamDataUpdater', function (data) {

        })

        $scope.receivedCallerData = null;
        // GROUP CALL SOCKET RECEIVER ----------------------------------------------------------
        socket.on('gCallStatusUpdater', function (data) {
         //   console.log("GC SOCKET:-> ");
          //  console.log(data);
            // ----- open incoming modal for all receiver users -----
            if (data.status == 0) {
                for (var g = 0; g < $scope.allGroups.length; g++) {
                    if (data.userdata.groupId == $scope.allGroups[g]._id && data.userdata.callerId != $scope.user._id && !$scope.caller && $scope.myCallStatus != 1) {
                        $scope.allGroups[g].joinCall = true;
                        $scope.allGroups[g].groupCallid = data.userdata.groupCallid;
                        $scope.bypassGroupSelected = true;
                        $scope.groupCallerName = data.userdata.callerName;
                        $('#incomingGroupCallModal').modal({
                            backdrop: 'static',
                            keyboard: false
                        })

                        $('#incomingGroupCallModal').show();
                        //   $scope.ringbell.loop = true;
                        //   $scope.ringbell.play();
                        groupTimmer(30, 1);

                        $scope.callingGroups.push($scope.allGroups[g]);
                        $scope.receivedCallerData = data;
                        $scope.selGroupCallData = data.userdata;
                        break;
                    }
                    else if (data.userdata.groupId == $scope.allGroups[g]._id && data.userdata.callerId != $scope.user._id && ($scope.caller || $scope.myCallStatus == 1)) {
                        $scope.allGroups[g].joinCall = true;
                        $scope.allGroups[g].groupCallid = data.userdata.groupCallid;
                        $scope.callingGroups.push($scope.allGroups[g]);
                        break;
                    }
                }
            }
            // -- push the joined user in array - if already added then break from loop and go on -----
            else if (data.status == 1) {

                for (var g = 0; g < $scope.callingGroups.length; g++) {
                    if (data.userdata.groupCallid == $scope.callingGroups[g].groupCallid) {
                        if ($scope.joinedUsersList.length > 0) {
                            for (var c = 0; c < $scope.joinedUsersList.length; c++) {
                                if (data.userdata.callerId == $scope.joinedUsersList[c].callerId) {
                                    break;
                                }
                                else if (data.userdata.callerId != $scope.joinedUsersList[c].callerId && c == ($scope.joinedUsersList.length - 1)) {
                                    // setTimeout(() => {
                                    //     console.log("im came here");
                                    //     console.log( $("#setVideoName"));
                                    //     $("#setVideoName").append(""+data.userdata.name);
                                    //     $scope.receivedCallerData = null;
                                    // }, 3200);

                                    $scope.allUsersLeft = 2;
                                    $scope.ringbell.pause();
                                    $scope.joinedUsersList.push(data.userdata);
                                    resetGroupTimer();
                                    groupTimmer(0, 0);
                                }
                            }
                        }
                        else {
                            // if ($scope.receivedCallerData) {
                            // console.log($scope.receivedCallerData);
                            /// ******** NEEDS CRITICAL TESTING *********
                            // setTimeout(() => {
                            //     console.log("im came here");
                            //     console.log( $("#setVideoName"));
                            //     $("#setVideoName").append(""+$scope.receivedCallerData.userdata.name);
                            //     $scope.receivedCallerData = null;
                            // }, 3200);
                            // }

                            $scope.joinedUsersList.push(data.userdata);
                            $scope.allUsersLeft = 2;
                            $scope.ringbell.pause();
                            resetGroupTimer();
                            cancelTimmer = true;
                            groupTimmer(0, 0);
                            break;
                        }
                        break;
                    }
                }
            }

            // - if caller has ended call, then show message and close groupCall Modal of all joined users-
            else if (data.status == 2) {
                // if users have not joined the call but receiving it, and caller has ended the call
                if ($scope.joinedUsersList.length == 0) {
                    for (var g = 0; g < $scope.allGroups.length; g++) {
                        if (data.userdata.groupId == $scope.allGroups[g]._id && data.userdata.callerId != $scope.user._id) {
                            $scope.allGroups[g].joinCall = false;
                            for (var c = 0; c < $scope.callingGroups.length; c++) {
                                if (data.userdata.groupCallid == $scope.callingGroups[c].groupCallid) {
                                    $scope.callingGroups.splice(c, 1);
                                    $scope.ringbell.pause();
                                    $scope.groupCallerName = "";
                                    cancelTimmer = true;

                                    resetGroupTimer();
                                    $('#incomingGroupCallTime').text('group call ended');
                                    $('#incomingGroupCallMsg').text('');
                                    setTimeout(() => {
                                        $('#incomingGroupCallModal').hide();
                                        $('#incomingGroupCallMsg').text('There is group Call Going On, want to join?');
                                    }, 2000);
                                    break;
                                }
                            }
                            break;
                        }
                    }
                }
                // if atleast one user has joined the call, and caller has ended the call
                // * then execute below "else section"
                else {
                    for (var g = 0; g < $scope.allGroups.length; g++) {
                        if (data.userdata.groupId == $scope.allGroups[g]._id && data.userdata.callerId != $scope.user._id) {
                            $scope.allGroups[g].joinCall = false;
                            for (var c = 0; c < $scope.callingGroups.length; c++) {
                                if (data.userdata.groupCallid == $scope.callingGroups[c].groupCallid) {
                                    $scope.callingGroups.splice(c, 1);
                                    $scope.myCallStatus = 0;
                                    GroupCall.stop(null, -1);
                                    cancelTimmer = true;
                                    $scope.ringbell.pause();

                                    resetGroupTimer();
                                    $('#groupCallTime').text('Group call ended');
                                    $('#stopGroupCallBtn').text('Close');
                                    break;
                                }
                            }
                            $scope.allUsersLeft = 1;
                            $scope.joinedUsersList = [];
                            break;
                        }
                    }
                }
            }
            // -- if any joined user has left the groupCall, then update it to all remaining joined users --
            else if (data.status == 3) {

                for (var c = 0; c < $scope.callingGroups.length; c++) {
                    if (data.userdata.groupCallid == $scope.callingGroups[c].groupCallid) {
                        //$scope.callingGroups.splice(c, 1);
                        for (var j = 0; j < $scope.joinedUsersList.length; j++) {
                            if (data.userdata.callerId == $scope.joinedUsersList[j].callerId) {
                                $scope.joinedUsersList.splice(j, 1);
                                if ($scope.joinedUsersList.length == 0) {
                                    $scope.allUsersLeft = 1;
                                    if ($scope.caller) {
                                        $('#groupCallModal').hide();
                                        // ---- needs rechecking -----
                                        for (var g = 0; g < $scope.allGroups.length; g++) {
                                            if (data.userdata.groupId == $scope.allGroups[g]._id) {
                                                $scope.allGroups[g].joinCall = false;
                                                break;
                                            }
                                        }
                                        resetGroupTimer();
                                        $scope.resetUserSelectionData();
                                        $http.post('/leaveCallGroup', {
                                            '_id': $scope.selGroupData.groupCallid,
                                            'groupId': $scope.selGroupData._id,
                                            'userId': $scope.user._id,
                                            'status': 0
                                        });
                                        $scope.selGroupData = null;
                                    }
                                }

                                break;
                            }
                        }
                        break;
                    }
                }
            }
            else if (data.status == 4) {
                let spanTag = $('#' + data.spanId);
               // console.log(data.id + " != " + $scope.user._id);
                if (data.id != $scope.user._id && spanTag) {
                  //  console.log(data);
                    setTimeout(() => {
                      //  console.log("i came here");
                        //console.log( $("#setVideoName"));
                        $("#setVideoName").attr("id", data.spanId);
                        setTimeout(() => {
                            // console.log(  $("id"+ data.spanId)  );
                          //  console.log(data.name);
                            $("#" + data.spanId).append("" + data.name);
                        }, 300);
                    }, 3000);
                }
            }

        })

        let gCall_sec = 0;
        let gCall_mint = 0;
        let gCall_hour = 0;
        var cancelTimmer = false;

        // status: 0- incoming GroupCall Modal 1- GroupCall Modal itself
        // * if this function receives 'callTimeLimit' zero, then timer will not end until user ends it *
        function groupTimmer(callTimeLimit, status) {
            //console.log("cancelTimmer: "+ cancelTimmer);
            if (cancelTimmer) { $scope.ringbell.pause(); cancelTimmer = false; return; }

            gCall_sec++;

            if (status == 0)
                $('#groupCallTime').text(gCall_hour + ' h ' + gCall_mint + ' m ' + gCall_sec + ' s ');
            // else if (status == 1)
            //     $('#incomingGroupCallTime').text(gCall_hour + ' h ' + gCall_mint + ' m ' + gCall_sec + ' s ');

            if (gCall_sec == 60) {
                gCall_mint++;
                gCall_sec = 0;
            }
            if (gCall_mint == 60) {
                gCall_hour++;
                gCall_mint = 0;
            }

            //  console.log(callTimeLimit +" && "+ gCall_sec +" == "+ callTimeLimit);
            if (callTimeLimit != 0 && gCall_sec == callTimeLimit) {
                $scope.ringbell.pause();
                cancelTimmer = true;

                let gData = {};

                if ($scope.selGroupData) {
                    gData = $scope.selGroupData;
                    $scope.selGroupCallData = $scope.selGroupData;
                }
                else {
                    gData = $scope.selGroupCallData;
                }

                userData = {
                    groupId: gData._id,
                    groupCallid: gData.groupCallid,
                    name: $scope.user.name,
                    callerId: $scope.user._id,
                };

                GroupCall.stop(userData, 2);
                gCall_sec = 0;
                gCall_mint = 0;
                gCall_hour = 0;


                if (status == 0 && $scope.allUsersLeft == 0) {
                    $scope.caller = false;
                    $scope.allUsersLeft = 0;
                    $('#groupCallTime').text("No one has joined your call");
                }
                else if (status == 0 && $scope.allUsersLeft == 1) {
                    $scope.caller = false;
                    $scope.allUsersLeft = 0;
                    $('#groupCallTime').text("Call Ended (All users left your call)");
                }
                else if (status == 1 && $scope.allUsersLeft == 0)
                    $('#incomingGroupCallTime').text("Call Ended");

                for (var j = 0; j < $scope.allGroups.length; j++) {
                    //  console.log($scope.selGroupCallData.groupCallid + " == " + $scope.allGroups[j]._id);
                    if ($scope.selGroupCallData.groupCallid == $scope.allGroups[j]._id)
                        $scope.allGroups[j].joinCall = false;
                }
                //  console.log($scope.selGroupCallData);
                $http.post('/leaveCallGroup', {
                    '_id': gData.groupCallid,
                    'groupId': gData._id,
                    'userId': $scope.user._id,
                    'status': 0
                });

                setTimeout(() => {
                    $('#incomingGroupCallModal').hide();
                    if (status == 0)
                        $('#groupCallTime').text("");
                    else if (status == 1)
                        $('#incomingGroupCallTime').text("");

                }, 1500);
                return;
            } else {

                setTimeout(() => {
                    // if 'joinedUsersList' length is above zero, then it means someone has joined caller
                    // * so thats why timmer will keep on running until user ends it by himself
                    // ** if callTimeLimit is zero, then it means keep the timmer running **

                    // console.log($scope.allUsersLeft + " && " + $scope.joinedUsersList.length + " && " + callTimeLimit);
                    if (($scope.allUsersLeft == 0 || $scope.allUsersLeft == 2) && callTimeLimit == 0 && $scope.joinedUsersList.length > 0) {
                        groupTimmer(0, status);
                    }
                    //  otherwise timmer will ends on value of 'callTimeLimit'
                    // REVIEW *** $scope.allUsersLeft == 1 -> needs reTest ***
                    else if (($scope.allUsersLeft == 0 || $scope.allUsersLeft == 1) && callTimeLimit != 0 && $scope.joinedUsersList.length == 0) {
                        groupTimmer(callTimeLimit, status);
                    }
                    else if ($scope.allUsersLeft == 1 && callTimeLimit == 0 && $scope.joinedUsersList.length == 0) {
                        resetGroupTimer();
                        groupTimmer(1, status);
                    }

                }, 1000);
            }
        }

        function resetGroupTimer() {
            $('#incomingGroupCallTime').text("");
            $('#groupCallTime').text("");
            gCall_sec = 0;
            gCall_mint = 0;
            gCall_hour = 0;
        }

        //Update Viewers and hide their modal + reload their iframe
        socket.on('updateScreenshareStatus', function (data) {
            // console.log(data);
            if (data.modalStatus == 0 && $scope.user._id == data.chatWithId) {
                $("#ssViewerModal").modal('hide');
                document.getElementById('viewerIframe').contentWindow.location.reload();
            }

            else if (data.modalStatus == 1 && $scope.user._id == data.chatWithId) {
                $("#ssViewerModal").modal('show');
            }
        })

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
                //console.log(msg.chatType);
                if (msg.chatType != 2) { // is msg not a broadcast msg

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
                else { // if it is a broadcast msg 
                    $scope.broadcastChats.push(msg);
                    scrollbottom();
                }

            });
        });

        socket.on('updateAllGroupChat', function (chats) {
          //  console.log(chats);
            $scope.$apply(function () {
                for (var g = 0; g < $scope.allGroups.length; g++) {
                    if ($scope.allGroups[g]._id == chats.data.groupId && $scope.selGroupData._id == chats.data.groupId){
                      //  console.log($scope.allGroups[g]);
                        if (chats.case == 'new') $scope.groupchats.push(chats.data);
                        else if (chats.case == 'edit') $scope.groupchats = chats.data;
        
                        scrollbottom();
                        break;
                    }
                }
            
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

        socket.on('_externalLogout', function (data) {
            if (data.userId == $scope.user._id) {
              //  console.log("LS cleared");
                localStorage.clear();
            }
        })

    }, function errorCallback(response) {
        $scope.sessionDestroy = true;
        $location.path('/');
    });

    $scope.showHideDots = function (id, isShow = 0) {
        if (isShow == 1) $("#msg3dots-" + id).removeClass('hidden');
        else $("#msg3dots-" + id).addClass('hidden');
    };

    $scope.showReplyIcon = function (id, isShow = 0) {
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
     //   console.log(val);
        $scope.currSt = val;
        $scope.stClass = $scope.stArr[$scope.currSt];
        $http.post('/setPerStatus', {
            pStatus: val,
            'userId': $rootScope.user._id
        }).then((res) => {
            if (res.status) {
                socket.emit('updateUserPStatus', { 'pStatus': val, 'userId': $rootScope.user._id, 'name': $rootScope.user.name })
            //    console.log('Changed');
            }
        });
    }

    socket.on('_updateUserPStatus', (data) => {
        for (var i = 0; i < $scope.allUsers.length; i++) {
            if ($scope.allUsers[i]._id == data.userId) {
                let prevPStatus = $scope.allUsers[i].pStatus;
                $scope.allUsers[i].pStatus = data.pStatus;

                if ($scope.allUsers[i]._id != $scope.user._id && prevPStatus != data.pStatus) {
                    let status = '';
                    if (data.pStatus == 0) status = "is now active";
                    if (data.pStatus == 1) status = "is away";
                    if (data.pStatus == 2) status = ": do not disturb";
                    if (data.pStatus == 3) status = ": Invisible";
                    if (data.pStatus == 4) status = "is Offline";

                    let msgNotifText = $scope.allUsers[i].name + " " + status;
                    $.toaster({
                        priority: 'danger',
                        title: 'user status',
                        message: msgNotifText
                    });
                }
                break;
            }
        }
    })

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
        $window.location.reload();
    }

});