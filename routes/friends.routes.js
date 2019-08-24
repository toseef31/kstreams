const express = require('express');
const friendsRouter = express.Router();

let userModel = require('../model/users-model');
let projectModel = require('../model/projectModel');
let friendModel = require('../model/friendModel');


friendsRouter.route('/createfriend').post(function (req, res) {
   
    // check userId and projectId exist in userTable or not
    userModel.findOne({ 'userId': req.body.userId, 'projectId': req.body.projectId }, { password: false })
        .lean().exec(function (err, userResult) { 
        if (!userResult) res.send({ 'message': 'User Id doesnt exist', 'status': false }); 
        else {
            // check friendId and projectId exist in userTable or not
            userModel.findOne({ 'userId': req.body.friendId, 'projectId': req.body.projectId }, { password: false })
            .lean().exec(function (err, friendResult) { 
                if (!friendResult) res.send({ 'message': 'FriendId doesnt exist', 'status': false });
                else {
                    // does userId and friendId already exist in friend table or not
                    friendModel.findOne(
                        { 'userId': userResult._id, 'friendId': friendResult._id}
                        ).exec(function (err, result) { 
                        if (result){
                            result.status=1;
                            result.save();
                            res.send({ 'message': 'Success', 'status': true });
                        } 
                        else {
                            // get reference ids of both iserId and friendId 
                            let newFriendModel = new friendModel({ 'userId': userResult._id, 'friendId': friendResult._id });
                            newFriendModel.save().then(reslt => { // save both ref-Ids in friend table
                                res.send({ 'message': 'Success', 'status': true });
                            })
                        }
                    })
                }
            })
        }
    })
})

friendsRouter.route('/unfriend').post(function (req, res) {

    userModel.findOne({ 'userId':req.body.userId, 'projectId': req.body.projectId }, { password: false })
    .lean().exec(function (err, userResult) { 
        if (!userResult) res.send({ 'message': 'User Id doesnt exist', 'status': false }); 
        else {
            userModel.findOne({ 'userId': req.body.friendId, 'projectId': req.body.projectId }, { password: false })
            .lean().exec(function (err, friendResult) { 
                if (!friendResult) res.send({ 'message': 'Friend does not exist', 'status': false });
                else {
                    friendModel.update({ 'userId': userResult._id, 'friendId': friendResult._id }, { 'status': 0 })
                    .lean().exec(function (err, result) {
                        if (err) res.send(err);
                        res.send({ 'message': 'unfriended', status: true })
                    })
                }
            })
        }
    })
})

friendsRouter.route('/getfriends').post(function (req, res) {
    var userId = req.body.userId;
    friendModel.find({ 'userId': userId, 'status': 1 }).populate({ path: 'userId', select: { 'password': false } }).populate({ path: 'friendId', select: { 'password': false } }).exec(function (err, result) {
        if (err) res.send(err);
        res.send(result);
    })
})

module.exports = friendsRouter;
