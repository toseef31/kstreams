
**********
/////////
function
////////
**********

getData(modelName of mongoose,optional pass null or 0 || object which you wana find {name:"name"} );

Video calling:
= User will initiate $scope.videoCall, it will emit videoCall in sbs.js
= sbs.js will emit videoCallToFriend in dashboardController.js and audio played on friend end
= On friend 'incommingCall' in dash.html is displayed
= User can "joinCall();connectUsers('updateconnectusers')" or "callDrop('notReceive')"
    - On join 'videoTab' is displayed and user enters into joinRoom