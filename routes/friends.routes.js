const express = require('express');
const friendsRouter = express.Router();

let userModel = require('../model/users-model');
let projectModel = require('../model/projectModel');
let friendModel = require('../model/friendModel');


friendsRouter.route('/createfriend').post(function (req, res) {
    let userId = req.body.userId;
    let friendId = req.body.friendId;
    let projectId = req.body.projectId;

    let userRefId = req.body.userRefId;
    let friendRefId = req.body.friendRefId;

    // check userId and projectId exist in userTable or not
    userModel.find({ 'userId': { $in: [userId] }, 'projectId': projectId }, { password: false }).exec(function (err, userResult) {

        if (userResult.length == 0) res.send({ 'message': 'userId doesnt exist', 'status': false });

        else {
            // check friendId and projectId exist in userTable or not
            userModel.find({ 'userId': { $in: [friendId] }, 'projectId': projectId }, { password: false }).exec(function (err, friendResult) {

                if (friendResult.length == 0) res.send({ 'message': 'friendId doesnt exist', 'status': false });
                else {
                    // does userId and friendId already exist in friend table or not
                    friendModel.find({ 'userId': userResult[0]._id, 'friendId': friendResult[0]._id, 'status': 1 }).exec(function (err, result) {

                        if (result.length != 0) res.send({ 'message': 'friend already exist', 'status': false });
                        else {
                            // get reference ids of both iserId and friendId
                            let friendData = { 'userId': userResult[0]._id, 'friendId': friendResult[0]._id };
                            let newFriendModel = new friendModel(friendData);
                            newFriendModel.save().then(reslt => { // save both ref-Ids in friend table
                                res.send({ 'message': 'friend saved', 'status': true });
                            })
                        }
                    })
                }
            })
        }
    })
})

friendsRouter.route('/unfriend').post(function (req, res) {

    let userId = req.body.userId;
    let friendId = req.body.friendId;
    let projectId = req.body.projectId;

    userModel.find({ 'userId': { $in: [userId] }, 'projectId': projectId }, { password: false }).exec(function (err, userResult) {

        if (userResult.length == 0) res.send({ 'message': 'userId doesnt exist', 'status': false });

        else {
            userModel.find({ 'userId': { $in: [friendId] }, 'projectId': projectId }, { password: false }).exec(function (err, friendResult) {

                if (friendResult.length == 0) res.send({ 'message': 'friend doesnt exist', 'status': false });
                else {
                    friendModel.update({ 'userId': userResult[0]._id, 'friendId': friendResult[0]._id }, { 'status': 0 }).exec(function (err, result) {
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
