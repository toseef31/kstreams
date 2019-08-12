/*
* author  => Peek International
* designBy => Peek International
*/
const userModel = require('../model/users-model');
// const recentModel = require('../model/recent-model');
const chatModel = require('../model/chatModel');
const groupsModel = require('../model/groupsModel');
const notifiModel = require('../model/notificationModel');
const mongoose = require('mongoose');
const helpers = require('../helperfunctions/helpers');

var sbs = require('../sbs')

module.exports = function (io, saveUser) {
    var User;
    /*custom helper functions */
    var helper = new helpers(io);
    /*main router object which contain all function*/
    var router = {};

    router.groupChat = function (req, res) {

        newMessage = new chatModel({
            "groupId": req.body.id,
            "senderId": req.body.senderId,
            "message": req.body.message,
            "isGroup": 1
        });

        newMessage.save(function (err, data) {
            if (err) throw err;
            chatModel.findOne({ groupId: req.body.id, senderId: req.body.senderId }).populate('senderId').sort({ updatedAt: -1 }).exec(function (err, data) {
                helper.addNewMessage(data);
                if (err) throw err;
                res.json(data);
            })
        })

        // groupsModel.update({_id:id},{$push:{message:{name:name,sender:senderId,message:message,msgType:msgType}},lastMsg:message},function(err,data){
        //     if(err) throw err;
        //     groupsModel.findOne({_id:id}).limit(1).exec(function(err,data){
        //         if(err) throw err;
        //         res.json(data);
        //         helper.RTGU();
        //     })
        // })
    }

    router.getUsers = function (req, res) {
        userModel.find({ _id: { $ne: req.params.userId }, isAdmin: { $ne: 1 }, status: 1 },
            {}, { sort: '-updatedAt' })
            .lean()
            .exec(function (err, data) {
                res.json(data);
            });
    }


    router.getCreatedGroups = function (req, res) {
        // get all groups 
        groupsModel.find({ 'status': 1 }).populate('members', { 'name': true }).exec(function (err, groups) {
            var tempGroups = [];
            if (err) { return console.log(err); }
            for (var i = 0; i < groups.length; i++) {
                for (var j = 0; j < groups[i].members.length; j++) {
                    // console.log(req.params.userId +" == "+ groups[i].members[j]._id);
                    if (req.params.userId == groups[i].members[j]._id) {
                        tempGroups.push(groups[i]);
                        // break;
                    }
                }
            }
            res.send(tempGroups); // send groups list
        })
    }

    router.addGroup = function (req, res) {
        var members = req.body.members;
        var obj = [];
        members.forEach(function (mem) {
            obj.push({ id: mem._id, name: mem.name, isseen: false });
        });
        var group = new groupsModel({
            'members': obj,
            'name': req.body.groupName,
        });
        group.save(function (err, data) {
            res.json(data);
            helper.RTGU();
        })

    }

    router.getGroups = function (req, res) {

        groupsModel.find({ members: { $elemMatch: { id: req.params.userId } }, 'status': 1 })
            .lean().then(function (data) {

                res.json(data);
            });
    }

    router.chat = function (req, res) {
        var sender = req.body.senderId;

        var name = req.body.senderName;
        var recevier = req.body.recevierId;
        var message = req.body.message;
        var senderImage = req.body.senderImage;
        var receiverImage = req.body.receiverImage;
        newMessage = new chatModel({
            "senderId": sender,
            "senderName": name,
            "recevierId": recevier,
            "message": message,
            "msgType": "message",
            "senderImage": senderImage,
            "receiverImage": receiverImage,
        });
        newMessage.save(function (err, data) {
            if (err) throw err;
            chatModel.findOne({ senderId: sender, recevierId: recevier }).sort({ updatedAt: -1 }).exec(function (err, data) {
                helper.addNewMessage(data);
                res.json(data);
            })

        })
        /* add notification to notification table*/
        newNotification = new notifiModel({
            "senderId": sender,
            "senderName": name,
            "recevierId": recevier,
            "message": message,
        });
        newNotification.save(function (err, data) {
            if (err) throw err;
        })
    }
    router.getNotification = (req, res) => {
        var userId = req.params.userId;
        notifiModel.find({ recevierId: userId }, function (err, data) {
            if (err) throw err;
            notifiModel.count({ recevierId: userId, isseen: false }, function (err, count) {
                res.json({ count: count, noti: data });
            })
        })
    }
    router.getChat = function (req, res) {
        var sender = req.params.senderId;
        var receiver = req.params.recevierId;

        // var updateUnReadMsgQuery = {chat:{$elemMatch:{$or:[{senderId:receiver,recevierId:sender},{senderId:sender,revevierId:receiver}]}}},
        //     updatedata ={$set:{'chat.$.unreadMsg':0}};
        //     recentModel.update(updateUnReadMsgQuery,updatedata,function(err,data){
        //     	helper.RTU({senderId:sender,recevierId:receiver});
        //     })
        chatModel.find({ $or: [{ senderId: sender, recevierId: receiver }, { senderId: receiver, recevierId: sender }] })
            // .populate('senderInfo')
            // .populate('receiverInfo')
            .lean()
            .exec(function (err, data) {
                if (err) throw err;
                res.json(data);
            });
    }

    router.getGroup = function (req, res) {
        var id = req.params.groupId;
        chatModel.find({ groupId: id }).populate('senderId').lean().then(function (data) {
            res.json(data);
        })

        //    groupsModel.update({_id:id,members:{$elemMatch:{id:memId}}},{$set:{'members.$.isSeen':true}},function(err,data){
        //     if(err) throw err;
        //     helper.getData(groupsModel,{_id:id},function(data){
        //         helper.RTGU();
        //         res.json(data);
        //     })
        //    })

    }
    router.out = (req, res) => {
        req.session.destroy();
        res.header('Access-Control-Allow-Origins', 'https://jobcallme.com, https://localhost:22000');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.json({ message: "session destroy" });
    }
    router.set = (req, res) => {
        userModel.find({ email: req.body.email })
            .lean()
            .then(function (data) {
                req.session.user = data[0];
                res.header('Access-Control-Allow-Origin', 'https://jobcallme.com , https://localhost:22000');
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
                res.header('Access-Control-Allow-Credentials', 'true');
                res.json(req.session.user);
            })
    }
    router.get = (req, res) => {
        res.header('Access-Control-Allow-Origin', 'https://jobcallme.com,https://localhost:22000');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');
        // console.log(sbs.authUser);
        if (req.session.user && typeof req.session.user._id !== 'undefiend') {
            helper.changeStatus(req.session.user._id, { pStatus: 0 }, function (data) {  
                res.json(data);
            });
        }
        else{
            res.status(401).send();
            // userModel.update({'_id': sbs.authUser._id}, {'onlineStatus': 0}).exec(function (err, result) {
            //     res.status(401).send();
            //  })
        }
    }
    router.checkSession = function (req, res) {
        res.header('Access-Control-Allow-Origin', 'https://jobcallme.com,https://localhost:22000');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');

        if (req.session.user) {
            helper.changeStatus(req.session.user._id, { pStatus: 0 }, function (data) {
                res.json(data);
            });

        } else {
            res.status(401).send();
        }
    }

    router.login = function (req, res) {
        var email = req.body.email;
        var password = req.body.password;

        helper.getData(userModel, { 'email': email, 'password': password }, function (user) {
            if (user.length > 0) {
                let User = user[0];
                /*change status from offline to online*/
                helper.changeStatus(User._id, { }, function (data) {
                    /*set session */
                    req.session.user = User;
                    /*this function use to move user info to another view*/
                    saveUser(User);
                    /*get users to show order by newly messages*/
                    //helper.RTU();
                    res.json(User);
                });
            }
            else
                res.status(401).send();

        });
    }
    router.createUser = function (req, res) {
        var name = req.params.name;
        var newUser = new userModel({
            "name": name,
            "email": name + "@gmail.com",
            "password": helper.incrypt(name),
            "phone": '03339876859',
            "country": "pakistan"
        });
        newUser.save(function (err, data) {
            if (err) throw err;
            res.json(data);
        })
    }

    router.logout = function (req, res) {
        if (req.session.user) {
            req.session.destroy(function (err) 
            {
                userModel.update({ '_id': req.params.userId }, { 'onlineStatus': 0 }).exec(function (err, result) {
                    res.status(404).send();
                })

                // res.status(404).send();
            })

            res.json({ msg: "session destroy" })
        }
    }

    router.deleteMsg = function (req, res) {
        var msgId = req.params.msgId;
        var type = req.params.type;
        chatModel.findByIdAndUpdate(msgId, { isDeleted: 1 }, function (err, data) {
            if (err) throw err;
            res.json(data);
        })

        // chatModel.findByIdAndUpdate(msgId,{delete:type},function(err,data){
        //     if (err) throw err;
        //     res.json(data);
        // })
    }
    router.updateChat = function (req, res) {
        var chatId = req.params.id;
        var message = req.body.message;
        chatModel.findByIdAndUpdate(chatId, { message: message }, { new: true }, function (err, data) {
            if (err) throw err;
            helper.addNewMessage(data);
            res.json(data);
        })
    }

    router.updateGroupChat = function (req, res) {
        var id = req.params.id;
        var message = req.body.message;
        var groupId = req.body.groupId;

        chatModel.findByIdAndUpdate(id, { message: message }, function (err, data) {
            if (err) throw err;
            chatModel.find({ 'groupId': groupId, isGroup: 1 }).populate('senderId').exec(function (err, groupMsgs) {
                if (err) throw err;
                res.json(groupMsgs);
            })
        });

        // groupsModel.update({'message._id':id},{$set:{'message.$.message':message}},function(err,data){
        //     if(err) throw err;
        //     helper.getData(groupsModel,{_id:groupId},function(data){
        //         res.json(data);
        //     })
        // });
    }

    router.notificationseen = (req, res) => {
        userId = req.body.userId;
        notifiModel.update({ recevierId: userId }, { isseen: true }, { multi: true }, function (err, data) {
            if (err) throw err;
            res.json(data);
        })
    }

    router.deleteGroupMsg = function (req, res) {
        var msgId = req.params.msgId;
        var type = req.params.type;
        var groupId = req.params.groupId;

        chatModel.findByIdAndUpdate(msgId, { isDeleted: 1 }, function (err, data) {
            if (err) throw err;
            chatModel.find({ 'groupId': groupId, isGroup: 1 }).populate('senderId').exec(function (err, groupMsgs) {
                res.json(groupMsgs);
            })
        })

        // groupsModel.update({'message._id':msgId},{$set:{'message.$.delete':type}},function(err,data){
        //     if(err) throw err;
        //     helper.getData(groupsModel,{_id:groupId},function(data){
        //         res.json(data);
        //     })
        // });
    }

    router.addfiles = function (req, res, next) {
        for (var i = 0; i < req.files.length; i++) {
            var type = req.files[i].mimetype;
            var spliceType = type.split('/');
            var newchat = new chatModel({
                "senderId": req.body.senderId,
                "senderName": req.body.senderName,
                "recevierId": req.body.friendId,
                "message": req.files[i].filename,
                "originalName": req.files[i].originalname,
                "msgType": spliceType[1]
            });
            newchat.save(function (err, data) {
                if (err) throw err;

            })
        }
        res.send(req.files);
    }
    router.groupFilesShare = function (req, res, next) {
        for (var i = 0; i < req.files.length; i++) {
            var type = req.files[i].mimetype;
            var spliceType = type.split('/');
            var id = req.body.id;
            var senderId = req.body.senderId;
            var name = req.body.name;
            var message = req.files[i].filename;
            var originalName = req.files[i].originalname;
            var msgType = spliceType[1];
            groupsModel.update({ _id: id }, { $push: { message: { name: name, originalName: originalName, sender: senderId, message: message, msgType: msgType } }, lastMsg: originalName }, function (err, data) {
                if (err) throw err;
            })
        }
        helper.RTGU();
        res.json({ message: 'done' });
    }

    router.getgroupchat = function (req, res) {
        var id = req.body.id;
        groupsModel.find({ _id: id, 'status': 1 }).lean().then(function (data) {
            res.json(data);
        })
    }
  
    router.saveUserDataToSession = (req, res) => {
        userModel.find({ email: req.body.user_email }, (err, data) => {
            if (err) throw err;
            if (data.length > 0) {
                //do some thing if user exsist
            } else {

                var user = new userModel({
                    "userId": req.body.user_Id,
                    "name": req.body.user_firstname + req.body.user_lastname,
                    "email": req.body.user_email,
                    "user_image": req.body.user_image,
                    "phone": req.body.user_mobileNumber,
                    "address": req.body.address,
                    "status": 1
                });
                user.save(function (err, data) {
                    if (err) console.log(err);
                })
            }

            res.json(1);
        });
    }

    router.removeUser = (req, res) => {
        console.log('removeUser: Logic need to be updated');
        // recentModel.findOneAndDelete({_id:req.body.id},(err, data) => {
        //     if (err) throw err;
        //     chatModel.deleteMany({$or:[{senderId:data.senderId,recevierId:data.receiverId},{senderId:data.receiverId,recevierId:data.senderId}]},(err,data) => {
        //         if (err) throw err;
        //         res.json(data);
        //     })
        // });
    }
    router.updateUserImage = (req, res) => {
        userModel.findOneAndUpdate({ userId: req.body.id }, { user_image: req.body.image }, function (err, data) {
            if (err) throw err;
            res.json(req.body.id);
        })
    }

    router.setPerStatus = (req, res) => {
        console.log('Set pStatus: ', req.session.user._id, ' and ', req.body.pStatus);
        if (req.session.user)
            userModel.findOneAndUpdate(
                { _id: req.session.user._id },
                { pStatus: req.body.pStatus }, function (err, data) {
                    if (err) throw err;
                    res.json({ status: true, id: req.body.id });
                })
        else
            res.json({ status: false, message: 'Need authorization' });
    }

    router.checkPerStatus = (req, res) => {
        if (req.session.user)
            userModel.find({ _id: req.session.user._id })
                .lean()
                .then(function (result) {
                    res.json({ status: true, 'pStatus': result[0].pStatus, 'email': result[0].email });
                })
        else
            res.json({ status: false, message: 'Need authorization' });
    }

    return router;
}
