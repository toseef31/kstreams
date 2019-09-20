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
                candidate : candidate
            }
            sendKMessage(message);
        }

        function sendKMessage(message){  
            $rootScope.O2OSoc.$emit(JSON.stringify(message)); 
        }
     
        function callResponse(message) {
            if (message.response != 'accepted') {
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
                if (!message)  sendKMessage({ id : 'stop' });
            } 
            $rootScope.disconnect(friendId);
        };
    
        function incomingCall(message) {  
            if (callState != NO_CALL) {
                var response = {
                    id : 'incomingCallResponse',
                    from : message.from,
                    callResponse : 'reject',
                    message : 'bussy'
        
                };
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
                        from : $rootScope.inComCallData.from,
                        callResponse : 'accept',
                        sdpOffer:offerSdp
                    }; 
                    sendKMessage(response);
                });
            });
        }
    
        function stopCall(){
            let response = {
                id : 'incomingCallResponse',
                from : $rootScope.inComCallData.from,
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
                    sendKMessage(message);
                });
            });
        }
        
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