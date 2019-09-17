/*
* author  => Peek International
* designBy => Peek International
*/
app.controller("loginController", function ($scope, $http, $location, $rootScope,$websocket) {
    $scope.notAuthorize = false; // show invalid username password message
    //$scope.testProjectId = "5d4c07fb030f5d0600bf5c03"; //5d4c07fb030f5d0600bf5c03
    $rootScope.projectData=[];
    user={};

    $http.post("/getProject").then(function (response) {
        $rootScope.projectData=response.data;  
        console.log('$rootScope.projectData ', $rootScope.projectData);

        let hostIs = location.host.split(':');
        let webSocketIp =  $rootScope.projectData.domainUrl;  //localhost || www.jobcallme.com 
        if(hostIs[0]=='localhost') webSocketIp='127.0.0.1';
        let reqUrl='wss://'+webSocketIp+':8443/one2one';
        let broadCastUrl='wss://'+webSocketIp+':8444/one2many';
        console.log('WebSocket: ',reqUrl);
        
        $rootScope.O2OSoc= $websocket.$new(reqUrl);
        $rootScope.O2OSoc.$on('$open', function () {
            console.log('O2O socket open');
            One2OneCall.sendKMessage({ id : 'register', name : $rootScope.user._id }); 
            One2OneCall.setCallState(NO_CALL); 
        })
        .$on('$message', function (message) { // it listents for 'incoming event'
            console.log('something incoming from the server: ' + message);
            var parsedMessage = JSON.parse(message);   
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
        });

        $rootScope.O2MSoc= $websocket.$new(broadCastUrl);
    });

    /*check session*/
    $http({
        method: 'GET',
        url: '/checkSession',
    }).then(function successCallback(response) { 
        $rootScope.user = response.data;
        $location.path("/dash");
    });

    /*login function*/
    $scope.login = function () {
      //  console.log($scope.email);
        $http({
            method: 'POST',
            url: '/login',
            data: { email: $scope.user.email, password: $scope.user.password }
        }).then(function successCallback(response) {
            $rootScope.user = response.data;
            $location.path("/dash");
        }, function errorCallback(response) {
            $scope.notAuthorize = true;
        });
    }

});