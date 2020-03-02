/*
 * author  => Peek International
 * designBy => Peek International
 */ 
const groupsModel = require("../model/groupsModel");
const groupCall = require("../model/groupCall"); 

module.exports = function (io, saveUser) {
  /*main router object which contain all function*/
  var router = {};

  router.createUserGroup = (req, res) => {
    let newGroup = new groupsModel(req.body.groupData);
    newGroup.save(function (err, result) {
      groupsModel
      .find({ status: 1, projectId: req.body.groupData.projectId + "" })
      .populate("members", { name: true })
      .exec(function (err, groups) {
        var tempGroups = [];
        if (err)  return console.log(err);
        var i=0, j=0;
        for (i; i < groups.length; i++) {
          j=0;
          for (j; j < groups[i].members.length; j++) {
            if (req.body.userId == groups[i].members[j]._id) tempGroups.push(groups[i]);
          }
        }
        res.send(tempGroups); // send groups list
      });
    });
  }

  router.removeGroupUser = (req, res) => {
    groupsModel.update(
      { "_id": req.body.groupId },
      { $pull: { members: req.body.memberId } }
    ).exec(function (err, result) {
      res.json(200);
    })
  }

  router.editGroupName = (req, res) => {
    groupsModel.update(
      { "_id": req.body.groupId },
      { "name": req.body.groupName }
    ).exec(function (err, result) {
      res.json(200);
    })
  }

  router.addNewMembers = (req, res) => {
    groupsModel.update(
      { '_id': req.body.groupId },
      { $push: { members: req.body.members } },
    ).exec(function (err, result) {
      res.json(200);
    })
  }

  router.getCreatedGroups = function (req, res) {
    // get all groups
    groupsModel
      .find({ status: 1, projectId: req.params.projectId })
      .populate("members")
      .exec(function (err, groups) {
        var tempGroups = [];
        if (err)  return console.log(err);
        
        var i = 0,j=0;
        for (i; i < groups.length; i++) {
          j = 0
          for (j; j < groups[i].members.length; j++) {
            if (req.params.userId == groups[i].members[j]._id)  tempGroups.push(groups[i]); 
          }
        }

        res.send(tempGroups); // send groups list
      });
  };


  // For now we will enter a group call based on hour check, need imp later on
  router.callAGroup = (req, res) => {
    groupCall
    .find({ groupId: req.body.groupId,status:1 }) // check if call is still open
    .sort({ _id: -1 }).limit(1)
    .exec(function (err, groupData) {
      console.log('groupData ',groupData);
      if(groupData.length>0){
        var hours = Math.abs(groupData[0].createdAt - new Date) / 36e5;
        if(hours>1){ //create new entry 
          new groupCall({'groupId':req.body.groupId,'createdBy':req.body.userId});
        }
        else if(req.body.userId!=groupData[0].createdBy){ //update existing one
          groupData.members.push({'userId':req.body.userId});
        } 
      }
      else{ // create new entry
        new groupCall({'groupId':req.body.groupId,'createdBy':req.body.userId});
      }
    });
  };
  // Broadcast function end ======
  return router;
};
