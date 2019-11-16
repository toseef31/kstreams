/*
* author  => Peek International
* designBy => Peek International
*/

  var socket = io.connect();
  var timmerObj;
  var callCancelTimmer;
  var webrtc;
  var connectUsers = 0;


  const createRoom = (type,roomName,brod = 0) => { 
    callCancelTimmer = new timmer('#checker');
    if(brod === 0){
      callCancelTimmer.startCallTimmer();
    }
    if(type == 'audio'){ 
      timmerObj = new timmer('#audioTimmer');
      webrtc = new SimpleWebRTC({
          autoRequestMedia: false,
          receiveMedia: {
              offerToReceiveAudio: true,
              offerToReceiveVideo: false
          },
          media: {
              audio: true,
              video: false
          }
      });
    }else{
      timmerObj = new timmer('#timmer');
      // eslint-disable-next-line no-console
       webrtc = new SimpleWebRTC({
        // the id/element dom element that will hold "our" video
        localVideoEl: 'local-video',
        // the id/element dom element that will hold remote videos
        remoteVideosEl: '',
        // immediately ask for camera access
        autoRequestMedia: true,
        
        debug: false,
        detectSpeakingEvents: true,
        autoAdjustMic: false,
      });
        webrtc.on('videoAdded', function (video, peer) {
        //console.log('video added', peer);
        var remotes = document.getElementById('remotes');
        if (remotes) {
            var d = document.createElement('div');
            d.className = 'videoContainer';
            d.id = 'container_' + webrtc.getDomId(peer);
            d.appendChild(video);
            var vol = document.createElement('div');
            vol.id = 'volume_' + peer.id;
            vol.className = 'volume_bar';
            /*video.onclick = function () {
                video.style.width = video.videoWidth + 'px';
                video.style.height = video.videoHeight + 'px';
            };*/
            d.appendChild(vol);
            remotes.appendChild(d);
        }
      });

      webrtc.on('videoRemoved',function(video,peer){
        var removeVideoId = webrtc.getDomId(peer);
        $(`#container_${removeVideoId}`).remove();
      });
    }
    
    webrtc.createRoom(roomName, (err, name) => {
     
    });

  };

  const joinRoom = (type,roomName) => {
    if(type == 'audio'){
     timmerObj = new timmer('#audioTimmer');
      webrtc = new SimpleWebRTC({
          autoRequestMedia: true,
          receiveMedia: {
              offerToReceiveAudio: true,
              offerToReceiveVideo: false
          },
          media: {
              audio: true,
              video: false
          }
      });
    }else{
     timmerObj = new timmer('#timmer');
      // eslint-disable-next-line no-console
       webrtc = new SimpleWebRTC({
        // the id/element dom element that will hold "our" video
        localVideoEl: 'local-video',
        // the id/element dom element that will hold remote videos
        remoteVideosEl: '',
        // immediately ask for camera access
        autoRequestMedia: true,
        
        debug: false,
        detectSpeakingEvents: true,
        autoAdjustMic: false,
      });

    webrtc.on('videoAdded', function (video, peer) {
      //console.log('video added', peer);
      /* call angular function from out side*/
      /* call angular function from out side*/
      /*var scope = angular.element(document.getElementById("MainWrap")).scope();
      scope.$apply(function () {
        scope.connectUsers();
      });*/
      
     var remotes = document.getElementById('remotes');
     if (remotes) {
         var d = document.createElement('div');
         d.className = 'videoContainer';
         d.id = 'container_' + webrtc.getDomId(peer);
         d.appendChild(video);
         var vol = document.createElement('div');
         vol.id = 'volume_' + peer.id;
         vol.className = 'volume_bar';
         /*video.onclick = function () {
             video.style.width = video.videoWidth + 'px';
             video.style.height = video.videoHeight + 'px';
         };*/
         d.appendChild(vol);
         remotes.appendChild(d);
     }
     });

    webrtc.on('videoRemoved',function(video,peer){
      var removeVideoId = webrtc.getDomId(peer);
      $(`#container_${removeVideoId}`).remove();
    });

    }
    
    // webrtc.joinRoom(roomName,function(err,roominfo){
    //   //socket.emit('callStart');
    // });

  };
  const joinLiveStream = (type,roomName) => {
    if(type == 'audio'){
      timmerObj = new timmer('#audioTimmer');
       webrtc = new SimpleWebRTC({
           autoRequestMedia: false,
           receiveMedia: {
               offerToReceiveAudio: true,
               offerToReceiveVideo: false
           },
           media: {
               audio: true,
               video: false
           }
       });
    }else{
      timmerObj = new timmer('#timmer');
       // eslint-disable-next-line no-console
        webrtc = new SimpleWebRTC({
         // the id/element dom element that will hold "our" video
         localVideoEl: '',
         // the id/element dom element that will hold remote videos
         remoteVideosEl: '',
         // immediately ask for camera access
         autoRequestMedia: false,
         autoRemoveVideos:true,
         debug: false,
         detectSpeakingEvents: true,
         autoAdjustMic: false,
       });
    webrtc.on('videoAdded', function (video, peer) {
     var remotes = document.getElementById('liveVideo');
     if (remotes) {
         var d = document.createElement('div');
         d.className = 'liveVideo';
         d.id = 'container_' + webrtc.getDomId(peer);
         d.appendChild(video);
         var vol = document.createElement('div');
         vol.id = 'volume_' + peer.id;
         vol.className = 'volume_bar';
         d.appendChild(vol);
         remotes.appendChild(d);
     }
     });
    }
    webrtc.on('videoRemoved',function(video,peer){
      var removeVideoId = webrtc.getDomId(peer);
      $(`#container_${removeVideoId}`).remove();
    });
    
     webrtc.joinRoom(roomName,function(err,roominfo){
      console.log(roominfo);
    });
  }
  const pauseVideo = () => {
    webrtc.pauseVideo();
  }
  const resumeVideo = () => {
    webrtc.resumeVideo();
  }

  const mute = () => {
    webrtc.mute();
  }

  const unmute = () => {
    webrtc.unmute();
  }
  
  const shareScreen = () => {
    webrtc.shareScreen();
  }

  
