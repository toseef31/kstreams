app.controller("muazController", function ($scope, $http, $window, $location, $rootScope, $uibModal) {

    var videosContainer = document.getElementById("videos-container") || document.body;
    var roomsList = document.getElementById('rooms-list');

    var screensharing = new Screen();

    var channel = location.href.replace(/\/|:|#|%|\.|\[|\]/g, '');
    var sender = Math.round(Math.random() * 999999999) + 999999999;

 
    var SIGNALING_SERVER ="https://"+window.location.hostname+':22000/';
    console.log( SIGNALING_SERVER);
    //var SIGNALING_SERVER = 'https://socketio-over-nodejs2.herokuapp.com:443/';
    //var SIGNALING_SERVER = 'https://localhost:22000/';
    // io.connect(SIGNALING_SERVER).emit('new-channel', {
    //     channel: channel,
    //     sender: sender
    // });

    // var socket = io.connect(SIGNALING_SERVER + channel);
    var socket = io.connect();
    socket.on('connect', function () {
        console.log('MUAZ Socket CONN EST');
        // setup peer connection & pass socket object over the constructor!
    });

    socket.send = function (message) {
        if (!$rootScope.incomingScreenshare) {
            console.log("000");
            socket.emit('emitScreenshareStatus', {
                'fromId': $rootScope.user._id,
                'toId': $scope.chatWithId
            });

            //$rootScope.changeScreenshareStatus({'fromId': $rootScope.user._id,'toid': $scope.chatWithId});
        }

        socket.emit('message', {
            sender: sender,
            fromId: $rootScope.user._id,
            toid: $scope.chatWithId,
            data: message
        });
    };

    screensharing.openSignalingChannel = function (callback) {
        return socket.on('message', callback);
    };

    screensharing.onscreen = function (_screen) {
        if (_screen.toId == $rootScope.user._id) {
            console.log("some one is sharing screen with you");

            console.log($scope.chatWithId + ' == ' + _screen.fromId);
            if ($scope.chatWithId == _screen.fromId) {

                var alreadyExist = document.getElementById(_screen.userid);
                if (alreadyExist) return;

                if (typeof roomsList === 'undefined') roomsList = document.body;

                var tr = document.createElement('tr');

                tr.id = _screen.userid;
                tr.innerHTML = '<td>' + _screen.userid + ' shared his screen.</td>' +
                    '<td><button class="join">View</button></td>';
                roomsList.insertBefore(tr, roomsList.firstChild);

                var button = tr.querySelector('.join');
                button.setAttribute('data-userid', _screen.userid);
                button.setAttribute('data-roomid', _screen.roomid);
                button.onclick = function () {
                    var button = this;
                    button.disabled = true;

                    var _screen = {
                        userid: button.getAttribute('data-userid'),
                        roomid: button.getAttribute('data-roomid')
                    };
                    screensharing.view(_screen);
                };
            } else {

            }
        }
    };

    // on getting each new screen
    screensharing.onaddstream = function (media) {
        media.video.id = media.userid;

        var video = media.video;
        videosContainer.insertBefore(video, videosContainer.firstChild);
        rotateVideo(video);

        var hideAfterJoin = document.querySelectorAll('.hide-after-join');
        for (var i = 0; i < hideAfterJoin.length; i++) {
            hideAfterJoin[i].style.display = 'none';
        }

        if (media.type === 'local') {
            addStreamStopListener(media.stream, function () {
                location.reload();
            });
        }
    };

    // using firebase for signaling
    // screen.firebase = 'signaling';

    // if someone leaves; just remove his screen
    screensharing.onuserleft = function (userid) {
        $rootScope.incomingScreenshare = false;
        var video = document.getElementById(userid);
        if (video && video.parentNode) video.parentNode.removeChild(video);

        // location.reload();
    };

    // check pre-shared screens
    screensharing.check();

    document.getElementById('share-screen').onclick = function () {
        var username = document.getElementById('userNameSS');
        username.disabled = this.disabled = true;

        screensharing.isModerator = true;
        screensharing.userid = username.value;
        // screensharing.fromId = $rootScope.user._id;
        // screensharing.toId = $scope.chatWithId;
        screensharing.share(null, $rootScope.user._id, $scope.chatWithId);
    };

    function rotateVideo(video) {
        video.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(0deg)';
        setTimeout(function () {
            video.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(360deg)';
        }, 1000);
    }

    (function () {
        var uniqueToken = document.getElementById('unique-token');
        if (uniqueToken)
            if (location.hash.length > 2) uniqueToken.parentNode.parentNode.parentNode.innerHTML = '<h2 style="text-align:center; display: block"><a href="' + location.href + '" target="_blank">Right click to copy & share this private link</a></h2>';
            else uniqueToken.innerHTML = uniqueToken.parentNode.parentNode.href = '#' + (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace(/\./g, '-');
    })();

    screensharing.onNumberOfParticipantsChnaged = function (numberOfParticipants) {
        if (!screensharing.isModerator) return;

        document.title = numberOfParticipants + ' users are viewing your screen!';
        var element = document.getElementById('number-of-participants');
        if (element) {
            element.innerHTML = numberOfParticipants + ' users are viewing your screen!';
        }
    };
});