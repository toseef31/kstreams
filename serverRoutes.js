/*
* author  => Peek International
* designBy => Peek International
*/

const chatController = require('./controller/chatController');
const groupController = require('./controller/groupController');
//const loginController = require('./public/controller/logincontroller')
const clientPushNotif = require('./public/client');
const multer = require('multer');
//const server = require('./public/webRtc/server');
//const upload          = multer({ dest: 'public/share' });

// ------------------- MULTER IMAGE STORING CODE --------------------------------------------------
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/chatImages/')
    },

    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
const upload = multer({
    storage: storage
})
// -----------------------------------------------------------------------------------------------

module.exports = function (app, io, saveUser) {

    /*create new object of chatController*/
    var chatCon = new chatController(io, saveUser);
    var groupCon = new groupController(io, saveUser);
    //app.post('/notification', clientPushNotif.send);
    //app.post('/notification');

    app.get('/download/:filename', chatCon.downloadFile);
    //app.post('/download', chatCon.downloadFile);
    app.post('/login', chatCon.login);
    app.post('/groupChat', chatCon.groupChat);

    app.get('/checkSession', chatCon.checkSession);
    // app.get('/checkSession/:userId',chatCon.checkSession);
    app.get('/createUser/:name', chatCon.createUser);
    app.get('/getUsers/:userId/:allList/:projectId', chatCon.getUsers);
    

    app.post('/addgroup', chatCon.addGroup);
    app.get('/getGroups/:userId', chatCon.getGroups);
    app.post('/chat', chatCon.chat);
    // app.post('/reply', chatCon.reply);

    app.post('/updateChat/:id', chatCon.updateChat);

    app.get('/getChat/:senderId/:receiverId/:limit', chatCon.getChat);
    app.get('/getMoreChat/:senderId/:receiverId/:limit/:chatTime', chatCon.getMoreChat);
    app.get('/getBroadcastId/:presenterId', chatCon.getBroadcastId)
    //app.post('/unreadMsg/:senderId/:receiverId',chatCon.unreadMsg);
    app.get('/emptyChatWithId/:_id', chatCon.chatWithId)

    //app.get('/getGroup/:groupId/:mem_id',chatCon.getGroup);
    app.get('/getGroup/:groupId', chatCon.getGroup); // it is used to get group chats only
    app.post('/getLastGroupMsg', chatCon.getLastGroupMsg);

    app.get('/deleteMsg/:msgId/:type', chatCon.deleteMsg);
    app.get('/logout/:userId', chatCon.logout);
    app.post('/updateGroupChat/:id', chatCon.updateGroupChat);
    app.get('/deleteGroupMsg/:msgId/:type/:groupId', chatCon.deleteGroupMsg);
    app.get('/getNotification/:userId', chatCon.getNotification);
    app.post('/notificationseen', chatCon.notificationseen);
    app.post('/getgroupchat', chatCon.getgroupchat);
    app.post('/getcurrentgroupchat', chatCon.getcurrentgroupchat);

    // app.post('/chatFilesShare', upload.single('file'), chatCon.addfiles);
    app.post('/chatFilesShare', upload.array('file'), chatCon.addfiles);
    app.post('/groupFilesShare', upload.array('file'), chatCon.groupFilesShare);
    // app.get('/changeStatus',chatCon.changeStatus);
    app.post('/SUDTS', chatCon.saveUserDataToSession);
    app.post('/set', chatCon.set);
    app.get('/get', chatCon.get);
    app.get('/logout', chatCon.out);

    // app.post('/recent',chatCon.recent);
    app.post('/updateUser', chatCon.updateUser);
    app.post('/removeUser', chatCon.removeUser);
    app.post('/updateUser/image', chatCon.updateUserImage);
    app.post('/setPerStatus', chatCon.setPerStatus);
    app.get('/checkPerStatus', chatCon.checkPerStatus);

    // -------------- PROJECT ROUTES--------------------------------------
    app.post('/getProject', chatCon.getProjectData);
    // app.post('/setProjectDomain', server.setProjectDomain);
    // -------------------------------------------------------------------

    // -------------- BROADCAST ROUTES------------------------------------
    app.post('/startPresenter', chatCon.startPresenter);
    app.post('/joinViewer', chatCon.joinViewer);
    app.post('/stopViewer', chatCon.stopViewer);
    app.get('/stopPresenter', chatCon.stopPresenter);

    // -------------- GROUP ROUTES---------------------------------------
    app.get('/getCreatedGroups/:userId/:projectId', groupCon.getCreatedGroups);  // it is used to get groups itself
    app.post('/createUserGroup', groupCon.createUserGroup);
    app.post('/removeGroupUser', groupCon.removeGroupUser);
    app.post('/editGroupName', groupCon.editGroupName);
    app.post('/addNewMembers', groupCon.addNewMembers);

    // -------------- GROUP CALL ROUTES---------------------------------
    app.post('/callAGroup', groupCon.callAGroup);
    app.post('/createGroupCall', groupCon.createGroupCall);
    app.post('/joinCallGroup', groupCon.joinCallGroup);
    app.post('/leaveCallGroup', groupCon.leaveCallGroup);
    app.post('/getCallGroups', groupCon.getCallGroups);
    app.post('/updateGroupCallStatus', groupCon.updateGroupCallStatus);
}