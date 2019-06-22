/*
* author  => Peek International
* designBy => Peek International
*/

  var socket = io.connect();
  var timmerObj;
  var callCancelTimmer;
  var webrtc = new SimpleWebRTC({});
  var connectUsers = 0;
  var videoAddedCalled1=false;
  var videoAddedCalled2=false; 

  var createRoom = (type,roomName,brod = 0) => { 
    callCancelTimmer = new timmer('#checker');
    if(brod === 0){
      callCancelTimmer.startCallTimmer();
    }
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
    }
    else{
      window.videoAddedCalled1=false;
      timmerObj = new timmer('#timmer');
      console.log('Calling callWebRtc 1');
      callWebRtc(1);
      setInterval(function(){ callWebRtc(1); }, 5000);
      
      webrtc.on('videoAdded', function (video, peer) {
        console.log('video added1 ', video);
        console.log('video added1 ', peer);
        if(window.videoAddedCalled1) return;
        window.videoAddedCalled1=true;
        var remotes = document.getElementById('remotes');
        if (remotes) {
            $(".videoContainer").remove();
            var d = document.createElement('div');
            d.className = 'videoContainer';
            d.id = 'container_' + webrtc.getDomId(peer);
            d.appendChild(video);
            var vol = document.createElement('div');
            vol.id = 'volume_' + peer.id;
            vol.className = 'volume_bar';
            video.onclick = function () {
                video.style.width = video.videoWidth + 'px';
                video.style.height = video.videoHeight + 'px';
            };
            d.appendChild(vol);
            remotes.appendChild(d);
        }
      });

      // webrtc.on('videoRemoved',function(video,peer){
      //   console.log('Video to be removed 1');
      //   var removeVideoId = webrtc.getDomId(peer);
      //   $(`#container_${removeVideoId}`).remove();
      // });
    }
    
    webrtc.createRoom(roomName, (err, name) => { 
      console.log('room created');
      console.log(name);
    });

  };

  function callWebRtc(type=0){
    console.log('callWebRtc ',type,' hmmm ',window.videoAddedCalled1,' hmmm ',window.videoAddedCalled2);
    if(type==1 && window.videoAddedCalled1) return;
    if(type==2 && window.videoAddedCalled2) return; 
    console.log('In callWebRtc ',type);
    webrtc = new SimpleWebRTC({
      // the id/element dom element that will hold "our" video
      localVideoEl: 'local-video',
      // the id/element dom element that will hold remote videos
      /* remoteVideosEl: 'remotes',*/
      // immediately ask for camera access
      autoRequestMedia: true,
      /*autoRemoveVideos:true,*/
      debug: false,
      detectSpeakingEvents: true,
      autoAdjustMic: false,
    });
  }

  var joinRoom = (type,roomName) => {
    console.log('roomName');
    console.log(roomName);
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
      window.videoAddedCalled2=false;
      timmerObj = new timmer('#timmer');
      console.log('Calling callWebRtc 2');
      callWebRtc(2);
      setInterval(function(){ callWebRtc(2); }, 5000);
      webrtc.on('videoAdded', function (video, peer) {
        console.log('video added2 ', video);
        console.log('video added2 ', peer);
        if(window.videoAddedCalled2) return;
        window.videoAddedCalled2=true;
      
        var remotes = document.getElementById('remotes');
        if (remotes) {
            $(".videoContainer").remove();
            var d = document.createElement('div');
            d.className = 'videoContainer';
            d.id = 'container_' + webrtc.getDomId(peer);
            d.appendChild(video);
            var vol = document.createElement('div');
            vol.id = 'volume_' + peer.id;
            vol.className = 'volume_bar';
            video.onclick = function () {
                video.style.width = video.videoWidth + 'px';
                video.style.height = video.videoHeight + 'px';
            };
            d.appendChild(vol);
            remotes.appendChild(d);
        }
      });

      // webrtc.on('videoRemoved',function(video,peer){
      //   console.log('Video to be removed 2');
      //   var removeVideoId = webrtc.getDomId(peer);
      //   $(`#container_${removeVideoId}`).remove();
      // });

    }
    
    webrtc.joinRoom(roomName,function(err,roominfo){
      console.log('roominfo room joined');
      console.log(roominfo);
    });

  };

  var joinLiveStream = (type,roomName) => {
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
         autoRequestMedia: true,
         autoRemoveVideos:true,
         debug: false,
         detectSpeakingEvents: true,
         autoAdjustMic: false,
       });
      
    webrtc.on('videoAdded', function (video, peer) {
      console.log('video added3 ', video);
      console.log('video added3 ', peer); 

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
    // webrtc.on('videoRemoved',function(video,peer){
    //   console.log('Video to be removed 3');
    //   var removeVideoId = webrtc.getDomId(peer);
    //   $(`#container_${removeVideoId}`).remove();
    // });
    
    webrtc.joinRoom(roomName,function(err,roominfo){
      console.log(roominfo);
    });
  }
  var pauseVideo = () => {
    webrtc.pauseVideo();
  }
  var resumeVideo = () => {
    webrtc.resumeVideo();
  }

  var mute = () => {
    webrtc.mute();
  }

  var unmute = () => {
    webrtc.unmute();
  }
  
  var shareScreen = () => {
    webrtc.shareScreen();
  }

  
