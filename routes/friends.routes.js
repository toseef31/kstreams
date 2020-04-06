const express = require('express');
const friendsRouter = express.Router();

let userModel = require('../model/users-model');
let friendModel = require('../model/friendModel');


friendsRouter.route('/createfriend').post(function (req, res) {
    console.log(req.body);
    userModel.findOne({ 'userId': req.body.userId, 'projectId': req.body.projectId }, { password: false })
        .lean().exec(function (err, userResult) {
            console.log(userResult);
        if (!userResult) res.send({ 'message': 'User Id doesnt exist', 'status': false }); 
        else {
            // check friendId and projectId exist in userTable or not
            userModel.findOne({ 'userId': req.body.friendId, 'projectId': req.body.projectId }, { password: false })
            .lean().exec(function (err, friendResult) { 
                if (!friendResult) res.send({ 'message': 'FriendId doesnt exist', 'status': false });
                else {

//      { 'userId': userResult._id, 'friendId': friendResult._id}
                    // does userId and friendId already exist in friend table or not
                    friendModel.findOne(
                        { 
                           // $and: [
                          //  { 
                                $or: [{ 'userId': userResult._id, 'friendId': friendResult._id},
                                { 'userId': friendResult._id, 'friendId': userResult._id}] 
                    //    },
                            // { $or: [{ 'userId': friendResult._id, 'friendId': userResult._id}] }
                       // ]
                    }
                        ).exec(function (err, result) { 
                            console.log("result");
                            console.log(result);
                        if (result){
                            console.log("if create friend");
                            result.status=1;
                            //result.save();
                            userModel.update({ 'userId': req.body.userId }, { $set: { 'chatWithRefId': friendResult._id } }).exec();
                            res.send({ 'message': 'We are already friends brother', 'status': true });
                        } 
                        else {
                            console.log("else create friend");
                            // get reference ids of both iserId and friendId 
                            let newFriendModel = new friendModel({ 'userId': userResult._id, 'friendId': friendResult._id });
                            newFriendModel.save().then(reslt => { // save both ref-Ids in friend table
                                userModel.update({ 'userId': req.body.userId }, { $set: { 'chatWithRefId': friendResult._id } }).exec();
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

friendsRouter.route('/resetChatRefId').post(function (req, res) {
    var userId = req.body.userId;
    userModel.update({ 'userId': userId }, { $set: { 'chatWithRefId': '' } }).exec();
    res.send(true);
})

// performs additional functionality including creating friend, i.e. if friend's exist then registers it 
friendsRouter.route('/create_register_friend').post(function (req, res) {
   console.log('create_register_friend');
   console.log(req.body);
    userModel.findOne({ 'userId': req.body.userId, 'projectId': req.body.projectId }, { password: false })
        .lean().exec(function (err, userResult) {
        if (!userResult) res.send({ 'message': 'UserId or ProjectId doesnt exist', 'status': false }); 
        else {
            // check friendId and projectId exist in userTable or not
            userModel.findOne({ 'userId': req.body.friendId, 'projectId': req.body.projectId }, { password: false })
            .lean().exec(function (err, friendResult) { 
                console.log(friendResult);
                if (!friendResult) {
                  var friendData = req.body.friendData;
                  let newUserModel = new userModel(friendData);
                  newUserModel.save();

                  friendModel.findOne({ 
                    $or: [{ 'userId': userResult._id, 'friendId': req.body.friendId},
                    { 'userId': req.body.friendId, 'friendId': userResult._id}] 
                  }).exec(function (err, result) { 
                      console.log(result);
                  if (result){
                      result.status=1;
                      //result.save();
                      userModel.update({ 'userId': req.body.userId }, { $set: { 'chatWithRefId': req.body.friendId } }).exec();
                      res.send({ 'message': 'Already Friends - Success', 'status': true });
                  } 
                  else {
                      // get reference ids of both iserId and friendId 
                      let newFriendModel = new friendModel({ 'userId': userResult._id, 'friendId': req.body.friendId });
                      newFriendModel.save().then(reslt => { // save both ref-Ids in friend table
                          userModel.update({ 'userId': req.body.userId }, { $set: { 'chatWithRefId': req.body.friendId } }).exec();
                          res.send({ 'message': 'Friend Created - Success', 'status': true });
                      })
                  }
              }) //--- FriendModel query ends ----

                }
                else{
                    friendModel.findOne({ 
                        $or: [{ 'userId': userResult._id, 'friendId': friendResult._id},
                        { 'userId': friendResult._id, 'friendId': userResult._id}] 
                      }).exec(function (err, result) { 
                          console.log(result);
                      if (result){
                          result.status=1;
                          //result.save();
                          userModel.update({ 'userId': req.body.userId }, { $set: { 'chatWithRefId': friendResult._id } }).exec();
                          res.send({ 'message': 'Already Friends - Success', 'status': true });
                      } 
                      else {
                          // get reference ids of both iserId and friendId 
                          let newFriendModel = new friendModel({ 'userId': userResult._id, 'friendId': friendResult._id });
                          newFriendModel.save().then(reslt => { // save both ref-Ids in friend table
                              userModel.update({ 'userId': req.body.userId }, { $set: { 'chatWithRefId': friendResult._id } }).exec();
                              res.send({ 'message': 'Friend Created - Success', 'status': true });
                          })
                      }
                  }) //--- FriendModel query ends ----
                }//--- else ends ----
            })
        }
    })
})

module.exports = friendsRouter;
