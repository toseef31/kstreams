app.
factory('One2ManyCall', ['$rootScope',
    function ($rootScope) {
 

        function presenterResponse(message) {
            if (message.response != 'accepted') {
                var errorMsg = message.message ? message.message : 'Unknow error';
                console.warn('Call not accepted for the following reason: ' + errorMsg);
                dispose();
            } else {
                $rootScope.webRtcO2MPeer.processAnswer(message.sdpAnswer);
                $rootScope.presenterArr = message.data;
            }
        }

        function viewerResponse(message) {
            if (message.response != 'accepted') {
                var errorMsg = message.message ? message.message : 'Unknow error';
                console.warn('Call not accepted for the following reason: ' + errorMsg);
                dispose();
            } else {
                $rootScope.webRtcO2MPeer.processAnswer(message.sdpAnswer);
            }
        }

        function presenter() {
            if (!$rootScope.webRtcO2MPeer) {
                showSpinner($rootScope.broadCastHtml);
                var options = {
                    localVideo: $rootScope.broadCastHtml,
                    onicecandidate: onIceCandidate
                } 
                $rootScope.webRtcO2MPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function (error) {
                    if (error) return onError(error); 
                    this.generateOffer(onOfferPresenter);
                });
            }
        }

        function onOfferPresenter(error, offerSdp) {
            if (error) return onError(error);
            var message = {
                id: 'presenter',
                sdpOffer: offerSdp,
                preId: $rootScope.user._id,
                password: ($rootScope.prePassword) ? $rootScope.prePassword : 0,
                preName: $rootScope.user.name
            };
            sendMessage(message);
        }

        function getPresenterData() {
            var message = {
                id: 'presenterData'
            };
            sendMessage(message);
        }

        function viewer() {
            if (!$rootScope.webRtcO2MPeer) {
                showSpinner($rootScope.broadCastHtml);

                var options = {
                    remoteVideo: $rootScope.broadCastHtml,
                    onicecandidate: onIceCandidate
                }

                $rootScope.webRtcO2MPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function (error) {
                    if (error) return onError(error);
                    this.generateOffer(onOfferViewer);
                });
            }
        }

        function onOfferViewer(error, offerSdp) {
            if (error) return onError(error)

            var message = {
                id: 'viewer',
                sdpOffer: offerSdp,
                preId: $rootScope.connWdPreId
            }

            sendMessage(message);
        }

        function onIceCandidate(candidate) {
            var message = {
                id: 'onIceCandidate',
                candidate: candidate
            }
            sendMessage(message);
        }

        function stop() {
            if ($rootScope.webRtcO2MPeer) {
                var message = {
                    id: 'stop'
                }
                sendMessage(message);
                dispose();
            }
        }

        function dispose() {
            if ($rootScope.webRtcO2MPeer) {
                $rootScope.webRtcO2MPeer.dispose();
                $rootScope.webRtcO2MPeer = null;
            }
            hideSpinner($rootScope.broadCastHtml);
        }

        function sendMessage(message) {
            //    console.log(message);
            $rootScope.O2MSoc.$emit(JSON.stringify(message));
        }

        function showSpinner() {
            //  if (!arguments[0]) return; // included temporary to bypass error
            var i = 0;
            var lengthIs=arguments.length;
            for (i; i < lengthIs; i++) { 
                if (arguments[i] && typeof arguments[i].poster !== 'undefined') {
                    arguments[i].poster = './images/transparent-1px.png';
                    arguments[i].style.background = 'center transparent url("./images/webrtc.png") no-repeat';
                }
            }
        }

        function hideSpinner() {
            //if (!arguments[0]) return; // included temporary to bypass error
            var i = 0;
            var lengthIs=arguments.length;
            for (i; i < lengthIs; i++) { 
                if (arguments[i] && typeof arguments[i].poster !== 'undefined') {
                    arguments[i].src = '';
                    arguments[i].poster = './images/webrtc.png';
                    arguments[i].style.background = '';
                }
            }
        }

        return {
            presenterResponse: presenterResponse,
            viewerResponse: viewerResponse,
            presenter: presenter,
            onOfferPresenter: onOfferPresenter,
            viewer: viewer,
            onOfferViewer: onOfferViewer,
            dispose: dispose,
            stop: stop,
            sendMessage: sendMessage,
            onIceCandidate: onIceCandidate,
            getPresenterData: getPresenterData
        }

    }
]);