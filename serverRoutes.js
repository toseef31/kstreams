/*
* author  => Peek International
* designBy => Peek International
*/

const chatController = require('./controller/chatController');
const groupController = require('./controller/groupController');
const clientPushNotif = require('./public/client');
const multer = require('multer');
const auth = require('./auth');

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
    app.post('/login',auth.optional, chatCon.login);
    app.post('/groupChat', chatCon.groupChat);

    app.post('/checkSession',auth.required, chatCon.checkSession);
    app.get('/getUsers/:userId/:allList/:projectId', chatCon.getUsers);

    app.post('/addgroup', chatCon.addGroup);
    app.get('/getGroups/:userId', chatCon.getGroups);
    app.post('/chat', chatCon.chat);

    app.post('/updateChat/:id', chatCon.updateChat);

    app.get('/getChat/:senderId/:receiverId/:limit', chatCon.getChat);
    app.get('/getMoreChat/:senderId/:receiverId/:limit/:chatTime', chatCon.getMoreChat);
    app.get('/getBroadcastId/:presenterId', chatCon.getBroadcastId)
    app.get('/emptyChatWithId/:_id', chatCon.chatWithId)

    app.get('/getGroupChat/:groupId/:limit', chatCon.getGroupChat);
    app.get('/getMoreGroupChat/:groupId/:limit/:chatTime', chatCon.getMoreGroupChat);
    app.post('/getLastGroupMsg', chatCon.getLastGroupMsg);

    app.get('/deleteMsg/:msgId/:type', chatCon.deleteMsg);
    app.get('/logout/:userId', chatCon.logout);
    app.post('/updateGroupChat/:id', chatCon.updateGroupChat);
    app.get('/deleteGroupMsg/:msgId/:type/:groupId', chatCon.deleteGroupMsg);
    app.get('/getNotification/:userId', chatCon.getNotification);
    app.post('/notificationseen', chatCon.notificationseen);
    app.post('/getcurrentgroupchat', chatCon.getcurrentgroupchat);

    app.post('/chatFilesShare', upload.array('file'), chatCon.addfiles);
    app.post('/groupFilesShare', upload.array('file'), chatCon.groupFilesShare);
    app.post('/SUDTS', chatCon.saveUserDataToSession);

    app.post('/updateUser', chatCon.updateUser);
    app.post('/removeUser', chatCon.removeUser);
    app.post('/updateUser/image', chatCon.updateUserImage);
    app.post('/setPerStatus', chatCon.setPerStatus);

    // -------------- PROJECT ROUTES--------------------------------------
    app.post('/getProject', chatCon.getProjectData);
    // -------------------------------------------------------------------

    // -------------- BROADCAST ROUTES------------------------------------
    app.post('/startPresenter', chatCon.startPresenter);
    app.post('/joinViewer', chatCon.joinViewer);
    app.post('/stopViewer', chatCon.stopViewer);
    app.get('/stopPresenter/:userId', chatCon.stopPresenter);

    // -------------- GROUP ROUTES---------------------------------------
    app.get('/getCreatedGroups/:userId/:projectId', groupCon.getCreatedGroups); 
    app.post('/createUserGroup', groupCon.createUserGroup);
    app.post('/removeGroupUser', groupCon.removeGroupUser);
    app.post('/editGroupName', groupCon.editGroupName);
    app.post('/addNewMembers', groupCon.addNewMembers);
    app.post('/deleteGroup', groupCon.deleteGroup);
    // -------------- GROUP CALL ROUTES---------------------------------
    app.post('/callAGroup', groupCon.callAGroup);
    app.post('/createGroupCall', groupCon.createGroupCall);
    app.post('/joinCallGroup', groupCon.joinCallGroup);
    app.post('/leaveCallGroup', groupCon.leaveCallGroup);
    app.post('/getCallGroups', groupCon.getCallGroups);
    app.post('/updateGroupCallStatus', groupCon.updateGroupCallStatus);
}