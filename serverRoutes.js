/*
* author  => Peek International
* designBy => Peek International
*/

const chatController  = require('./controller/chatController');
const multer          = require('multer');
const upload          = multer({ dest: 'public/share' });
module.exports = function(app,io,saveUser){

    /*create new object of chatController*/
    var chatCon = new chatController(io,saveUser);
   
    app.post('/login',chatCon.login);
    app.post('/groupChat',chatCon.groupChat);

    app.get('/checkSession',chatCon.checkSession);
    // app.get('/checkSession/:userId',chatCon.checkSession);
    app.get('/createUser/:name',chatCon.createUser);
    app.get('/getUsers/:userId',chatCon.getUsers);

    //app.get('/getCreatedGroups',chatCon.getCreatedGroups);
    app.get('/getCreatedGroups/:userId',chatCon.getCreatedGroups);

    app.post('/addgroup',chatCon.addGroup);
    app.get('/getGroups/:userId',chatCon.getGroups);
    app.post('/chat',chatCon.chat);
    app.post('/updateChat/:id',chatCon.updateChat);
    app.get('/getChat/:senderId/:recevierId',chatCon.getChat);

    //app.get('/getGroup/:groupId/:mem_id',chatCon.getGroup);
    app.get('/getGroup/:groupId',chatCon.getGroup);


    app.get('/deleteMsg/:msgId/:type',chatCon.deleteMsg);
    app.get('/logout/:userId',chatCon.logout);
    app.post('/updateGroupChat/:id',chatCon.updateGroupChat);
    app.get('/deleteGroupMsg/:msgId/:type/:groupId',chatCon.deleteGroupMsg);
    app.get('/getNotification/:userId',chatCon.getNotification);
    app.post('/notificationseen',chatCon.notificationseen);

    app.post('/getgroupchat',chatCon.getgroupchat);

    app.post('/chatFilesShare', upload.array('avatar'), chatCon.addfiles);
    app.post('/groupFilesShare', upload.array('avatar'), chatCon.groupFilesShare);
    app.get('/changeStatus',chatCon.changeStatus);
    app.post('/SUDTS',chatCon.saveUserDataToSession);
    app.post('/set',chatCon.set);
    app.get('/get',chatCon.get);
    app.get('/logout',chatCon.out);
    app.post('/recent',chatCon.recent);
    app.post('/removeUser',chatCon.removeUser);
    app.post('/updateUser/image',chatCon.updateUserImage);
    app.post('/setPerStatus',chatCon.setPerStatus);
    app.get('/checkPerStatus',chatCon.checkPerStatus); 
}