/*
    One 2 one server ,imp updates 11/23/2019
    1- No sessionId on server end only mongo unique id
    2- Ping/Pong to check if the user is still registered, if not then it will register again
*/
app.
factory('One2OneCall', ['$rootScope',
    function($rootScope) {
 
        const NO_CALL = 0;
        const PROCESSING_CALL = 1;
        const IN_CALL = 2;
        var callState = 0

        function setCallState(nextState) {
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
            var message = {
                id : 'onIceCandidate',
                candidate : candidate,
                to:($rootScope.user._id==$rootScope.friendId)?$rootScope.callerId:$rootScope.friendId,
                from:$rootScope.user._id 
            }
            sendKMessage(message);
        }

        function sendKMessage(message){  
            $rootScope.O2OSoc.$emit(JSON.stringify(message)); 
        }
     
        function callResponse(message) {
            console.log(message);
            if (message.response != 'accepted') {
                // if (message.message != 'user declined'){
                //     $.toaster({
                //         priority: 'danger',
                //         title: 'Call Status',
                //         message: 'User is offline'
                //     });
                // }
                // else{
                //     $.toaster({
                //         priority: 'danger',
                //         title: 'Call Status',
                //         message: 'Call rejected by user'
                //     });
                // }
                console.info('Call not accepted by peer. Closing call');
                var errorMessage = message.message ? message.message
                        : 'Unknown reason for call rejection.'; 
                stopK(true);
            } else {
                setCallState(IN_CALL);
                $rootScope.webRtcO2OPeer.processAnswer(message.sdpAnswer);
            }
        }
    
        function stopK(message,friendId=0) {
            setCallState(NO_CALL); 
            if ($rootScope.webRtcO2OPeer) {
                $rootScope.webRtcO2OPeer.dispose();
                $rootScope.webRtcO2OPeer = null; 
                $rootScope.userBusy = false;
                //if (!message)  
                sendKMessage({ 
                    id : 'stop',
                    to:($rootScope.user._id==$rootScope.friendId)?$rootScope.callerId:$rootScope.friendId,
                    from:$rootScope.user._id 
                }); // if message is not 1 then send 
            } 
            $rootScope.disconnect(friendId);
        };
    
        function incomingCall(message) {  
            if (callState != NO_CALL) {
                var response = {
                    id : 'incomingCallResponse',
                    from : message.from,   //callerId
                    to:$rootScope.user._id, //calleeId
                    callResponse : 'reject',
                    message : 'bussy'
        
                };

                // ------------- Needs Recheck -------------
                if ($rootScope.userBusy){
                    $.toaster({
                        priority: 'danger',
                        title: 'Incoming Call',
                        message: 'Another user is calling you ...'
                    });
                    $rootScope.userBusyMsg();
                }
                // ------------- Needs Recheck -------------

                console.log("*********** BUSY *************");
                return sendKMessage(response);
            }
            
            $rootScope.showVideo=true;
            $rootScope.openVoice=true; 
            setCallState(PROCESSING_CALL); 
            // if ('serviceWorker' in navigator) {
            //     send(message.userData.callerName +' is calling').catch(err => console.log('incomingCall ',err));
            // } 
            $rootScope.toggleBtn(true); 
            $rootScope.callerId           = message.userData.callerId;
            $rootScope.friendId           = message.userData.friendId;
            $rootScope.callType           = message.userData.callType; 
            $rootScope.audio.loop                = true;
            $rootScope.audio.play();
            document.getElementById('incommingCall').style.display = 'block';
            document.getElementById('callerName').innerHTML =message.userData.callerName;
            $rootScope.inComCallData=message;
             
        }
    
        function startCall(){
            let localAsset=document.getElementById('local-video');
            let remoteAsset= document.getElementById('videoOutput'); 
            let medConst={};
            
            if($rootScope.callType==1){
                localAsset=document.getElementById('audioInput');
                remoteAsset= document.getElementById('audioOutput'); 
                medConst={mediaConstraints: {
                    audio: true,
                    video: false
                }}; 
            }
            let options = {
                localVideo : localAsset,
                remoteVideo : remoteAsset,
                onicecandidate : onIceCandidate,medConst
            }  
            $rootScope.webRtcO2OPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
            function(error) {
                if (error) setCallState(NO_CALL);
                
                this.generateOffer(function(error, offerSdp) {
                    if (error) setCallState(NO_CALL);
                     
                    let response = {
                        id : 'incomingCallResponse',
                        from : $rootScope.inComCallData.from, //caller Id
                        to:$rootScope.user._id, //calleeId
                        callResponse : 'accept',
                        sdpOffer:offerSdp
                    }; 

                    $rootScope.userBusy = true;
                    sendKMessage(response);
                });
            });
        }
    
        function stopCall(){
            console.log('stopCall');
            let response = {
                id : 'incomingCallResponse',
                from : $rootScope.inComCallData.from,
                to:$rootScope.user._id, //calleeId
                callResponse : 'reject',
                message : 'user declined'
            };
            sendKMessage(response);
            stopK(true);
        }
    
        function videoKCall(from,to,userData,isAudio){
            setCallState(PROCESSING_CALL); 
            let localAsset=document.getElementById('local-video');
            let remoteAsset= document.getElementById('videoOutput'); 
            let medConst={};
            
            if(isAudio==1){
                localAsset=document.getElementById('audioInput');
                remoteAsset= document.getElementById('audioOutput'); 
                medConst={mediaConstraints: {
                    audio: true,
                    video: false
                }}; 
            }
            let options = {
                localVideo : localAsset,
                remoteVideo : remoteAsset,
                onicecandidate : onIceCandidate,medConst
            } 
               
            $rootScope.webRtcO2OPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function(error) {
                if (error) setCallState(NO_CALL);
                 
                this.generateOffer(function(error, offerSdp) {
                    if (error) setCallState(NO_CALL);
                     
                    let message = {
                        id : 'call',
                        from : from,
                        to : to, 
                        userData:userData,
                        sdpOffer:offerSdp
                    };  
                    $rootScope.userBusy = true;
                    sendKMessage(message);
                });
            });
        }

        //?-- for testing purpose only -------------------------------------------------------------
        function screenshare(from,to,media){
           console.log('one1one');
            //  setCallState(PROCESSING_CALL); 
            let localAsset=document.getElementById('local-video');
            let remoteAsset= document.getElementById('videoOutput'); 
            let medConst={};
        
                // localAsset=document.getElementById('audioInput');
                // remoteAsset= document.getElementById('audioOutput'); 
                // medConst={mediaConstraints: {
                //     audio: true,
                //     video: false
                // }}; 
       
            let options = {
                localVideo : localAsset,
                remoteVideo : remoteAsset,
                onicecandidate : onIceCandidate,medConst
            } 
               
            $rootScope.webRtcO2OPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function(error) {
                if (error) setCallState(NO_CALL);
                 
                this.generateOffer(function(error, offerSdp) {
                    if (error) setCallState(NO_CALL);
                     
                    let message = {
                        id : 'screenshare',
                        from : from,
                        to : to, 
                        userData:media,
                        sdpOffer:offerSdp
                    };  
                    sendKMessage(message);
                });
            });
        }
        //?-----------------------------------------------------------------------------------------

        function startCommunication(message) {
            setCallState(IN_CALL);
            $rootScope.webRtcO2OPeer.processAnswer(message.sdpAnswer);
        }

        return {
            stopK: stopK,
            setCallState: setCallState, 
            callResponse: callResponse,
            startCommunication: startCommunication,
            incomingCall: incomingCall, 
            startCall: startCall,
            stopCall: stopCall,
            sendKMessage: sendKMessage,
            onIceCandidate: onIceCandidate,
            videoKCall: videoKCall
        }
    }
]);