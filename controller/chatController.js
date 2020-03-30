/*
 * author  => Peek International
 * designBy => Peek International
 */
const userModel = require("../model/users-model");
const friendModel = require("../model/friendModel");
const chatModel = require("../model/chatModel");
const groupsModel = require("../model/groupsModel");
const groupCall = require("../model/groupCall");
const notifiModel = require("../model/notificationModel");
const projectModel = require("../model/projectModel");
const helpers = require("../helperfunctions/helpers");
const isImage = require("is-image");
const broadModel = require("../model/broadcast");

var path = require("path");

module.exports = function (io, saveUser) {
  var User;
  /*custom helper functions */
  var helper = new helpers(io);
  /*main router object which contain all function*/
  var router = {};

  router.getProjectData = function (req, res) {
    projectModel
      .findOne({ status: 1 })
      .lean()
      .exec(function (err, projData) {
        res.send(projData);
      });
  };

  router.groupChat = function (req, res) {
    var chatType = req.body.chatType;

    if (chatType == 0) {
      newMessage = new chatModel({
        groupId: req.body.id,
        senderId: req.body.senderId,
        message: req.body.message,
        isGroup: 1
      });
    } else {
      newMessage = new chatModel({
        commentId: req.body.commentId,
        chatType: chatType,
        groupId: req.body.id,
        senderId: req.body.senderId,
        message: req.body.message,
        isGroup: 1
      });
    }

    newMessage.save(function (err, data) {
      if (err) throw err;

      if (chatType == 0) {
        chatModel
          .findOne({ groupId: req.body.id, senderId: req.body.senderId })
          .populate("senderId")
          .sort({ updatedAt: -1 })
          .exec(function (err, data) {
            helper.addNewMessage(data);
            if (err) throw err;
            res.json(data);
          });
      } else {
        chatModel
          .findOne({
            commentId: req.body.commentId,
            groupId: req.body.id,
            senderId: req.body.senderId
          })
          .populate("commentId")
          .populate("senderId", { _id: true, name: true })
          .sort({ updatedAt: -1 })
          .exec(function (err, data) {
            helper.addNewMessage(data);
            res.json(data);
          });
      }
    });
  };

  router.getUsers = function (req, res) {
    function chatModelFunc(data) {
      for (let i = 0; i < data.length; i++) {
        chatModel
          .find({
            senderId: data[i]._id,
            receiverId: req.params.userId,
            isSeen: 0
          })
          .count()
          .exec(function (err, count) {
            data[i]["usCount"] = count;
            if (i == data.length - 1) res.json({ usersList: data });
          });
      }
      if (data.length == 0) res.json({ usersList: data });
    }

    if (req.params.allList == 0) {
      var friendIds = [];
      friendModel
        .find({ userId: req.params.userId, status: 1 }, { friendId: true })
        .populate({
          path: "friendId",
          populate: {
            path: "projectId",
            select: "_id, status",
            match: {
              status: 1
            }
          }
        })
        .lean()
        .exec(function (err, UserIdData) {
          // now check the userId in friendId column and populate user data
          friendModel
            .find({ friendId: req.params.userId, status: 1 }, { userId: true })
            .populate({
              path: "userId",
              populate: {
                path: "projectId",
                select: "_id, status",
                match: {
                  status: 1
                }
              }
            })
            .lean()
            .exec(function (err, friendsIdData) {
              friendsIdData.forEach(val => {
                if (val.userId && val.userId.projectId)
                  friendIds.push(val.userId);
              });
              UserIdData.forEach(val => {
                if (val.friendId && val.friendId.projectId)
                  friendIds.push(val.friendId);
              });

              //-----------------------------------------------
              userModel
                .findOne(
                  { _id: req.params.userId, isAdmin: { $ne: 1 }, status: 1 },
                  {}
                )
                .sort({ updatedByMsg: -1 })
                .lean()
                .exec(function (err, data) {
                  friendIds.push(data);
                  chatModelFunc(friendIds);
                });
            });
        });
    } else
      userModel
        .find(
          {
            _id: { $ne: req.params.userId },
            isAdmin: { $ne: 1 },
            status: 1,
            projectId: req.params.projectId
          },
          {},
          { sort: "-updatedAt" }
        )
        .lean()
        .exec(function (err, data) {
          chatModelFunc(data);
        });
  };


  router.addGroup = function (req, res) {
    var members = req.body.members;
    var obj = [];
    members.forEach(function (mem) {
      obj.push({ id: mem._id, name: mem.name, isseen: false });
    });
    var group = new groupsModel({
      members: obj,
      name: req.body.groupName
    });
    group.save(function (err, data) {
      res.json(data);
      helper.RTGU();
    });
  };

  router.getGroups = function (req, res) {
    groupsModel
      .find({ members: { $elemMatch: { id: req.params.userId } }, status: 1 })
      .lean()
      .then(function (data) {
        res.json(data);
      });
  };

  router.chat = function (req, res) {

    var chatType = req.body.msgData.chatType;
    var sender = req.body.msgData.senderId;
    var name = req.body.msgData.senderName;
    var recevier = req.body.msgData.receiverId;
    var message = req.body.msgData.message;
    var senderImage = req.body.msgData.senderImage;
    var receiverImage = req.body.msgData.receiverImage;
    var isSeen = req.body.msgData.isSeen;

    if (chatType == 0) {
      newMessage = new chatModel({
        senderId: sender,
        senderName: name,
        receiverId: recevier,
        message: message,
        isSeen: isSeen,
        senderImage: senderImage,
        receiverImage: receiverImage
      });
    } else if (chatType == 1) {
      newMessage = new chatModel({
        commentId: req.body.msgData.commentId,
        senderId: req.body.msgData.senderId,
        receiverId: req.body.msgData.receiverId,
        senderName: req.body.msgData.senderName,
        chatType: chatType,
        message: req.body.msgData.message
      });
    }
    else if (chatType == 2) {
      newMessage = new chatModel({
        senderId: req.body.msgData.senderId,
        receiverId: req.body.msgData.receiverId,
        senderName: req.body.msgData.senderName,
        chatType: chatType,
        message: req.body.msgData.message
      });
    }

    newMessage.save(function (err, data) {
      if (err) throw err;

      if (chatType != 2) {
        let date_ob = new Date();
        userModel.update(
          { _id: req.body.selectedUserData._id },
          { $set: { updatedByMsg: date_ob } }
        )
          .exec();
      }

      if (chatType == 0) {
        chatModel
          .findOne({ senderId: sender, receiverId: recevier })
          .populate("senderId", { _id: true, name: true })
          .populate("receiverId", { _id: true, name: true })
          .sort({ updatedAt: -1 })
          .exec(function (err, data) {
            helper.addNewMessage(data);
            res.json(data);
          });
      } else {
        chatModel
          .findOne({
            commentId: req.body.msgData.commentId,
            senderId: sender,
            receiverId: recevier
          })
          .populate("commentId")
          .populate("senderId", { _id: true, name: true })
          .populate("receiverId", { _id: true, name: true })
          .sort({ updatedAt: -1 })
          .exec(function (err, data) {
          //  console.log(data);
            helper.addNewMessage(data);
            res.json(data);
          });
      }
    });

    /* add notification to notification table*/
    newNotification = new notifiModel({
      senderId: sender,
      senderName: name,
      receiverId: recevier,
      message: message
    });
    newNotification.save(function (err, data) {
      if (err) throw err;
    });
  };

  router.getNotification = (req, res) => {
    var userId = req.params.userId;
    notifiModel.find({ receiverId: userId }, function (err, data) {
      if (err) throw err;
      notifiModel.count({ receiverId: userId, isseen: false }, function (
        err,
        count
      ) {
        res.json({ count: count, noti: data });
      });
    });
  };

  router.chatWithId = function (req, res) {
    var sender = req.params._id;
    userModel.update({ _id: sender }, { $set: { chatWithRefId: "" } }).exec();
  };

  router.getChat = function (req, res) {
    var sender = req.params.senderId;
    var receiver = req.params.receiverId;
    var msgCountLimit = parseInt(req.params.limit);

    chatModel
      .updateMany(
        { senderId: receiver, receiverId: sender, isSeen: 0 },
        { $set: { isSeen: 1 } }
      )
      .exec(function (err, data) {
        chatModel
          .find({
            $or: [
              { senderId: sender, receiverId: receiver },
              { senderId: receiver, receiverId: sender }
            ]
          })
          .populate("receiverId", { _id: true, name: true })
          .populate("senderId", { _id: true, name: true })
          .sort({ createdAt: -1 })
          .limit(msgCountLimit)
          .populate("commentId")
          .lean()
          .exec(function (err, data) {
            if (err) throw err;
            data.reverse();
            userModel
              .update({ _id: sender }, { $set: { chatWithRefId: receiver } })
              .exec();

            res.json(data);
          });
      });
  };

  router.getMoreChat = function (req, res) {
    var sender = req.params.senderId;
    var receiver = req.params.receiverId;
    var msgCountLimit = parseInt(req.params.limit);
    var chatTime = req.params.chatTime;

    chatModel
      .find({
        createdAt: { $lt: chatTime },
        $or: [
          { senderId: sender, receiverId: receiver },
          { senderId: receiver, receiverId: sender }
        ]
      })

      .populate("receiverId", { _id: true, name: true })
      .populate("senderId", { _id: true, name: true })
      .sort({ createdAt: -1 })
      .limit(msgCountLimit)
      .populate("commentId")
      .lean()
      .exec(function (err, data) {
        if (err) throw err;
        res.json(data);
      });
  };

  router.getGroup = function (req, res) {
    var id = req.params.groupId;
    // chatModel.find({ groupId: id }).populate('senderId').lean().then(function (data) {
    //     res.json(data);
    // })

    chatModel
      .find({ groupId: id })
      .populate("commentId")
      .populate("senderId", { _id: true, name: true })
      .exec(function (err, data) {
        res.json(data);
      });
  };

  router.getLastGroupMsg = function (req, res) {
    var id = req.body.id;
    var sid = req.body.senderId;

    chatModel
      .find({ groupId: id, senderId: sid })
      .populate("senderId")
      .lean()
      .then(function (data) {
        res.json(data);
      });
  };

  router.logout = function (req, res) {
    console.log("LOGOUT");
    console.log(req.session.user);

    if (req.session.user) {
      req.session.destroy(function (err) {
        console.log(req.params.userId);
        userModel
          .update(
            { userId: req.params.userId },
            { onlineStatus: 0, chatWithRefId: "" }
          )
          .exec(function (err, result) {
            res.status(404).send();
          });
      });
      res.json({ msg: "session destroy" });
    }
    else{
      res.json({ message: "failed to destroy session" });
    }
  };


  router.out = (req, res) => {
    console.log("GOOING OUTTT");
    console.log(req.session.user);
    // <<<<<<<<<< RECHECK NEEDED >>>>>>>>>>>>>>>>>>>
    if (!req.session.user) res.json({ message: "failed to destroy session" });

    userModel
      .update(
        { _id: req.session.user._id },
        { onlineStatus: 0, chatWithRefId: "" }
      )
      .exec(function (err, result) {
        req.session.destroy();
        res.json({ message: "session destroy" });
      });
  };

  router.set = (req, res) => {
      console.log("setting session");
      console.log(req.body.name);
    // if email is empty then check it by phone number
    if (req.body.email != "") {
      userModel
        .findOne({ email: req.body.email })
        .lean()
        .then(function (data) {
          req.session.user = data;
          chatModel
            .find({ receiverId: data._id, isSeen: 0 })
            .count()
            .exec(function (err, unreadMsgs) {
              // console.log(unreadMsgs);
              res.json({
                sessionData: req.session.user,
                unreadMsgs: unreadMsgs
              });
            });
        });
    }
    // if phone number is empty then check it by email
    else if (req.body.phone != "") {
      userModel
        .findOne({ phone: req.body.phone })
        .lean()
        .then(function (data) {
          req.session.user = data;
          chatModel
            .find({ receiverId: data._id, isSeen: 0 })
            .count()
            .exec(function (err, unreadMsgs) {
              if (data.length == 0) res.json({ usersList: data });
              res.json({
                sessionData: req.session.user,
                unreadMsgs: unreadMsgs
              });
            });
        });
    }

    else if (req.body.name != "") {
 
      userModel
        .findOne({ name: req.body.name })
        .lean()
        .then(function (data) {
          req.session.user = data;
          chatModel
            .find({ receiverId: data._id, isSeen: 0 })
            .count()
            .exec(function (err, unreadMsgs) {
              if (data.length == 0) res.json({ usersList: data });
              res.json({
                sessionData: req.session.user,
                unreadMsgs: unreadMsgs
              });
            });
        });
    }
  };


  router.get = (req, res) => {
    if (req.session.user && typeof req.session.user._id !== "undefiend") {
      helper.changeStatus(req.session.user._id, { pStatus: 0 }, function (data) {
        res.json(data);
      });
    } else res.status(401).send();
  };

  router.checkSession = function (req, res) {
    // console.log(req.session.user);
    if (req.session.user) {
      helper.changeStatus(req.session.user._id, { pStatus: 0 }, function (data) {
        res.json(data);
      });
    } else {
      res.status(401).send();
    }
  };

  router.downloadFile = function (req, res) {
    var filename = req.params.filename;
    // res.download('../kstreams/images/chatImages/' + filename);
    filepath = path.join(__dirname, "../images/chatImages") + "/" + filename;

    res.download(filepath);
    //res.sendFile(filepath);
  };

  // router.downloadFile = function(req, res){
  //     console.log(req.body);
  //     filepath = path.join('/images/'+req.body.urloffolder+'/'+req.body.filename);
  //     res.sendFile(filepath);
  // }

  router.updateUser = function (req, res) {
    var userId = req.body.id;
    var name = req.body.name;
    var image = req.body.imageName;
    var skill = req.body.skill;

    userModel
      .update(
        { userId: userId },
        { $set: { name: name, user_image: image, userTitle: skill } }
      )
      .exec(function (err, result) {
       // console.log(result);
        if (err) res.json(false);
        else {
          res.json(true);
        }
      });
  };

  router.login = function (req, res) {
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    var phone = req.body.phone;
    var userTitle = req.body.userskill;
    var userImage = req.body.userImage;
    var userProfile = req.body.userProfileUrl;

    if (email != "") {
      //console.log('if');
      helper.getData(
        userModel,
        { email: email, phone: "", password: password },
        function (user) {
          if (user._id) {
            //--------------------------------------------------------------------------------------------
            // *** for those users who are registered but these values are not updated ***
            if (userImage)
              userModel
                .update({ _id: user._id }, { $set: { user_image: userImage } })
                .exec();
            if (userTitle)
              userModel
                .update({ _id: user._id }, { $set: { userTitle: userTitle } })
                .exec();
            if (userProfile)
              userModel
                .update(
                  { _id: user._id },
                  { $set: { userProfileUrl: userProfile } }
                )
                .exec();
            //--------------------------------------------------------------------------------------------

            /*change status from offline to online*/
            helper.changeStatus(user._id, {}, function (data) {
              /*set session */
              req.session.user = user;
              /*this function use to move user info to another view*/
              saveUser(user);
              /*get users to show order by newly messages*/
              //helper.RTU();
              res.json(user);
            });
          } else res.json(null);
        }
      );
    } else if (phone != "") {
      helper.getPData(
        userModel,
        { phone: phone, email: "", password: password },
        function (user) {
          if (user) {
            //--------------------------------------------------------------------------------------------
            // *** for those users who are registered but these values are not updated ***
            if (userImage)
              userModel
                .update({ _id: user._id }, { $set: { user_image: userImage } })
                .exec();
            if (userTitle)
              userModel
                .update({ _id: user._id }, { $set: { userTitle: userTitle } })
                .exec();
            if (userProfile)
              userModel
                .update(
                  { _id: user._id },
                  { $set: { userProfileUrl: userProfile } }
                )
                .exec();
            //--------------------------------------------------------------------------------------------

            /*change status from offline to online*/
            helper.changeStatus(user._id, {}, function (data) {
              /*set session */
              req.session.user = user;
              /*this function use to move user info to another view*/
              saveUser(user);
              /*get users to show order by newly messages*/
              //helper.RTU();
              res.json(user);
            });
          } else res.json(null);
        }
      );
    }else if (name != "") {
    //  console.log("name: "+ name);
      helper.getData(
        userModel,
        { name: name, email: "", phone: "", password: password },
        function (user) {
          if (user) {
         //   console.log(user);
            //--------------------------------------------------------------------------------------------
            // *** for those users who are registered but these values are not updated ***
            if (userImage)
              userModel
                .update({ _id: user._id }, { $set: { user_image: userImage } })
                .exec();
            if (userTitle)
              userModel
                .update({ _id: user._id }, { $set: { userTitle: userTitle } })
                .exec();
            if (userProfile)
              userModel
                .update(
                  { _id: user._id },
                  { $set: { userProfileUrl: userProfile } }
                )
                .exec();
            //--------------------------------------------------------------------------------------------

            /*change status from offline to online*/
            helper.changeStatus(user._id, {}, function (data) {
              /*set session */
              req.session.user = user;
              console.log("helper session setting");
              console.log(req.session.user);
              /*this function use to move user info to another view*/
              saveUser(user);
              /*get users to show order by newly messages*/
              //helper.RTU();
              res.json(user);
            });
          } else res.json(null);
        }
      );
    }
  };
  router.createUser = function (req, res) {
    var name = req.params.name;
    var newUser = new userModel({
      name: name,
      email: name + "@gmail.com",
      password: helper.incrypt(name),
      phone: "03339876859",
      country: "pakistan"
    });
    newUser.save(function (err, data) {
      if (err) throw err;
      res.json(data);
    });
  };



  router.deleteMsg = function (req, res) {
    var msgId = req.params.msgId;
    var type = req.params.type;
    chatModel.findByIdAndUpdate(msgId, { isDeleted: 1 }, function (err, data) {
      if (err) throw err;
      res.json(data);
    });

    // chatModel.findByIdAndUpdate(msgId,{delete:type},function(err,data){
    //     if (err) throw err;
    //     res.json(data);
    // })
  };
  router.updateChat = function (req, res) {
    var chatId = req.params.id;
    var message = req.body.message;
    chatModel.findByIdAndUpdate(
      chatId,
      { message: message },
      { new: true },
      function (err, data) {
        if (err) throw err;
        helper.addNewMessage(data);
        res.json(data);
      }
    );
  };

  router.updateGroupChat = function (req, res) {
    var id = req.params.id;
    var message = req.body.message;
    var groupId = req.body.groupId;

    chatModel.findByIdAndUpdate(id, { message: message }, function (err, data) {
      if (err) throw err;
      chatModel
        .find({ groupId: groupId, isGroup: 1 })
        .populate("senderId")
        .exec(function (err, groupMsgs) {
          if (err) throw err;
          res.json(groupMsgs);
        });
    });

    // groupsModel.update({'message._id':id},{$set:{'message.$.message':message}},function(err,data){
    //     if(err) throw err;
    //     helper.getData(groupsModel,{_id:groupId},function(data){
    //         res.json(data);
    //     })
    // });
  };

  router.notificationseen = (req, res) => {
    userId = req.body.userId;
    notifiModel.update(
      { receiverId: userId },
      { isseen: true },
      { multi: true },
      function (err, data) {
        if (err) throw err;
        res.json(data);
      }
    );
  };

  router.deleteGroupMsg = function (req, res) {
    var msgId = req.params.msgId;
    var type = req.params.type;
    var groupId = req.params.groupId;

    chatModel.findByIdAndUpdate(msgId, { isDeleted: 1 }, function (err, data) {
      if (err) throw err;
      chatModel
        .find({ groupId: groupId, isGroup: 1 })
        .populate("senderId")
        .exec(function (err, groupMsgs) {
          res.json(groupMsgs);
        });
    });

    // groupsModel.update({'message._id':msgId},{$set:{'message.$.delete':type}},function(err,data){
    //     if(err) throw err;
    //     helper.getData(groupsModel,{_id:groupId},function(data){
    //         res.json(data);
    //     })
    // });
  };

  router.addfiles = function (req, res, next) {
    // var newchat = new chatModel({
    //     "senderId": req.body.senderId,
    //     "receiverId": req.body.friendId,
    //     "message": req.file.originalname,
    // });
    // newchat.save( function (err, data) {
    //     if (err) throw err;
    // })
    let isFileImage = 1;

    for (var i = 0; i < req.files.length; i++) {
      if (isImage("./images/chatImages/" + req.files[i].originalname)) {
        isFileImage = 1;
      } else {
        isFileImage = 2;
      }

      var newchat = new chatModel({
        senderId: req.body.senderId,
        receiverId: req.body.friendId,
        message: req.files[i].originalname,
        messageType: isFileImage
      });
      newchat.save(function (err, data) {
        if (err) throw err;
      });
    }
    res.send(req.files);
  };

  router.groupFilesShare = function (req, res, next) {
    let isFileImage = 1;

    for (var i = 0; i < req.files.length; i++) {
      if (isImage("./images/chatImages/" + req.files[i].originalname)) {
        isFileImage = 1;
      } else {
        isFileImage = 2;
      }

      var newchat = new chatModel({
        groupId: req.body.id,
        senderId: req.body.senderId,
        isGroup: 1,
        //  "receiverId": req.body.friendId,
        message: req.files[i].originalname,
        messageType: isFileImage
      });

      newchat.save(function (err, data) {
        if (err) throw err;

        chatModel
          .find({
            _id: data._id,
            groupId: req.body.id,
            senderId: req.body.senderId
          })
          .populate("senderId")
          .lean()
          .then(function (data) {
            res.json(data);
          });

        //   res.send(data);
      });

      // groupsModel.update({ _id: id }, { $push: { message: {isGroup:1, messageType: msgType, message: message } }, lastMsg: originalName }, function (err, data) {
      //     if (err) throw err;
      // })

      //  res.send(req.files);
    }
    // helper.RTGU();
    // res.json({ message: 'done' });
  };

  router.getgroupchat = function (req, res) {
    var id = req.body.id;
    groupsModel
      .find({ _id: id, status: 1, isGroup: 1 })
      .lean()
      .then(function (data) {
        res.json(data);
      });
  };

  router.getcurrentgroupchat = function (req, res) {
    var id = req.body.id;
    var _senderId = req.body.senderId;
    // groupsModel.find({ _id: id, senderId: _senderId, 'status': 1 }).lean().exec(function (err, data) {
    //     console.log(data);
    //     res.json(data);
    // })

    groupsModel.find({ groupId: id, senderId: _senderId }, function (err, data) {
      res.json(data);
    });
  };

  router.saveUserDataToSession = (req, res) => {
    userModel.find({ email: req.body.user_email }, (err, data) => {
      if (err) throw err;
      if (data.length > 0) {
        //do some thing if user exsist
      } else {
        var user = new userModel({
          userId: req.body.user_Id,
          name: req.body.user_firstname + req.body.user_lastname,
          email: req.body.user_email,
          user_image: req.body.user_image,
          phone: req.body.user_mobileNumber,
          address: req.body.address,
          status: 1
        });
        user.save(function (err, data) {
          if (err) console.log(err);
        });
      }

      res.json(1);
    });
  };

  router.removeUser = (req, res) => {
   // console.log("removeUser: Logic need to be updated");
    // recentModel.findOneAndDelete({_id:req.body.id},(err, data) => {
    //     if (err) throw err;
    //     chatModel.deleteMany({$or:[{senderId:data.senderId,receiverId:data.receiverId},{senderId:data.receiverId,receiverId:data.senderId}]},(err,data) => {
    //         if (err) throw err;
    //         res.json(data);
    //     })
    // });
  };
  router.updateUserImage = (req, res) => {
    userModel.findOneAndUpdate(
      { userId: req.body.id },
      { user_image: req.body.image },
      function (err, data) {
        if (err) throw err;
        res.json(req.body.id);
      }
    );
  };

  router.setPerStatus = (req, res) => {
    // console.log(
    //   "Set pStatus: ",
    //   req.session.user._id,
    //   " and ",
    //   req.body.pStatus
    // );
    if (req.session.user)
      userModel.findOneAndUpdate(
        { _id: req.session.user._id },
        { pStatus: req.body.pStatus },
        function (err, data) {
          if (err) throw err;
          res.json({ status: true, id: req.body.id });
        }
      );
    else res.json({ status: false, message: "Need authorization" });
  };

  router.checkPerStatus = (req, res) => {
    if (req.session.user)
      userModel
        .find({ _id: req.session.user._id })
        .lean()
        .then(function (result) {
          res.json({
            status: true,
            pStatus: result[0].pStatus,
            email: result[0].email
          });
        });
    else res.json({ status: false, message: "Need authorization" });
  };

  // Broadcast functions start =====
  router.startPresenter = (req, res) => {
    if (req.session.user) {
      var broad = new broadModel({
        "presenterId": req.session.user._id,
        "password": req.body.password,
      });
      broad.save(function (err, data) {
        if (err) console.log(err);
        broadModel.findOne({ 'presenterId': req.session.user._id, 'endDate': null }).sort({ _id: -1 }).limit(1).lean().exec(function (err, result) {
          res.json({ status: true, message: 'Saved successfully', 'broadcastRefId': result });
        })
      });
    }
    else
      res.json({ status: false, message: 'Need authorization' });
  }

  router.getBroadcastId = (req, res) => {
    broadModel.findOne({ 'presenterId': req.params.presenterId, 'endData': null }).sort({ _id: -1 }).limit(1).exec(function (err, result) {
      res.json({ status: true, message: 'Saved successfully', 'broadcastRefId': result });
    })
  }

  router.joinViewer = (req, res) => {
    let userBroadcastingId = req.body.preId;
    let broadcastRefId = req.body.broadcastId;

    if (req.session.user) {
      broadModel.find({ 'presenterId': req.body.preId }).sort({ _id: -1 }).limit(1).exec(updateAllFound);
      function updateAllFound(err, preData) {
        var ids = preData.map(function (item) {
          return item._id;
        });

        if (ids.length > 0) {
          broadModel.findOneAndUpdate({ _id: ids[0] }, { $push: { 'viewers': { viewerId: req.session.user } } }, function (err, data) {
            if (err) throw err;
            let newMessage = new chatModel(req.body.joinMsg);
            newMessage.save();

            broadModel.findOne({ '_id': broadcastRefId, 'presenterId': userBroadcastingId, 'endData': null }).sort({ _id: -1 }).limit(1).exec(function (err, result) {
              if (result) {
                chatModel.find({ 'chatType': 2, 'receiverId': broadcastRefId }).populate('senderId').lean().exec(function (err, data) {
                  if (err) throw err;
                  res.json(data);
                });
              }
            });
            //  res.json({ status: true, message: 'user has joined the broadcasting' });
          })
        }
        else
          res.json({ status: false, message: 'Update failed' });
      }
    }
  }

  router.stopPresenter = (req, res) => {
    if (req.session.user) {
      broadModel.find({ 'presenterId': req.session.user._id }).sort({ _id: -1 }).limit(1).exec(updateAllFound);
      function updateAllFound(err, preData) {
        var ids = preData.map(function (item) {
          return item._id;
        });
        if (ids.length > 0)
          broadModel.findOneAndUpdate({ _id: ids[0] }, { endDate: new Date() }, function (err, data) {
            if (err) throw err;
            res.json({ status: true, message: 'Date updated successfully' });
          })
        else
          res.json({ status: false, message: 'Update failed' });
      }
    }
    else
      res.json({ status: false, message: 'Need authorization' });
  }

  //  router.updateScreenshareStatus = (req, res) => {
  //     console.log ("new way");
  //     res.json(null);
  //  }

  router.stopViewer = (req, res) => {

    if (req.session.user) {
      let newMessage = new chatModel(req.body.leftMsg);
      newMessage.save();

      broadModel
        .find({ presenterId: req.body.preId })
        .sort({ _id: -1 })
        .limit(1)
        .exec(updateAllFound);
      function updateAllFound(err, preData) {
        var ids = preData.map(function (item) {
          return item._id;
        });
        if (ids.length > 0) {

          broadModel.findOneAndUpdate(
            { _id: ids[0], "viewers.viewerId": req.session.user },
            {
              $set: {
                "viewers.$.endDate": new Date()
              }
            },
            {
              sort: { "viewers.$._id": -1 } // Imp Needed: Need to update his last id
            },
            function (err, data) {
              if (err) throw err;
              res.json({ status: true, message: "Date updated successfully" });
            }
          );
        }
        else res.json({ status: false, message: "Update failed" });
      }
    } else res.json({ status: false, message: "Need authorization" });
  };
  // Broadcast function end ======
  return router;
};
