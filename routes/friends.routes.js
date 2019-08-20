const express = require('express');
const friendsRouter = express.Router();

let userModel = require('../model/friendModel');
let projectModel = require('../model/projectModel');
let friendModel = require('../model/friendModel');


friendsRouter.route('/createfriend').post(function (req, res) {
    let friendsData = req.body;

    friendModel.find({ 'userId': friendsData.userId }, { 'friendId': friendsData.friendId }).exec(function (err, result) {
        console.log(result);
        if (result.length == 0) {
            let newFriendModelData = new friendModel({ 'userId': friendsData.userId, 'friendId': friendsData.friendId });
            newFriendModelData.save().then(result => {
                res.send({ 'message': 'saved', 'status': true });
            })
        }
        else {
            for (var i = 0; i < result.length; i++) {
                if (friendsData.friendId != result[i].friendId && i == (result.length - 1)) {
                    let newFriendModelData = new friendModel({ 'userId': friendsData.userId, 'friendId': friendsData.friendId });
                    newFriendModelData.save().then(result => {
                        res.send({ 'message': 'saved', 'status': true });
                    })
                }
                else {
                    res.send({ 'message': 'already exist', 'status': false });
                    break;
                }
            }
        }

    })
})

friendsRouter.route('/unfriend').post(function (req, res) {
    let userId = req.body.userId;
    let friendId = req.body.friendId;

    friendModel.update({ 'userId': userId, 'friendId': friendId }, { 'status': 0 }).exec(function (err, result) {
        if (err) res.send(err);
        res.send({ 'message': 'unfriended', status: true })
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