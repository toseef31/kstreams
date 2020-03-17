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
          if (err) return console.log(err);
          var i = 0, j = 0;
          for (i; i < groups.length; i++) {
            j = 0;
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
        if (err) return console.log(err);

        var i = 0, j = 0;
        for (i; i < groups.length; i++) {
          j = 0
          for (j; j < groups[i].members.length; j++) {
            if (req.params.userId == groups[i].members[j]._id) tempGroups.push(groups[i]);
          }
        }

        res.send(tempGroups); // send groups list
      });
  };

  // ********************************** *****************************************************
  // ********************************** GROUP CALL [IN PROGRESS] *******************************
  // ********************************** *****************************************************

  // For now we will enter a group call based on hour check, need imp later on
  router.callAGroup = (req, res) => {
    groupCall
      .find({ groupId: req.body.groupId, status: 1 }) // check if call is still open
      .sort({ _id: -1 }).limit(1)
      .exec(function (err, groupData) {
        // console.log('groupData ', groupData);

        if (groupData.length > 0) {
          var hours = Math.abs(groupData[0].createdAt - new Date) / 36e5;
          if (hours > 1) { //create new entry 
            //  console.log("create new entry");
            new groupCall({ 'groupId': req.body.groupId, 'createdBy': req.body.userId });
          }
          else if (req.body.userId != groupData[0].createdBy) { //update existing one
            //  console.log("update existing one");
            groupData.members.push({ 'userId': req.body.userId });
          }
        }
        else { // create new entry
          new groupCall({ 'groupId': req.body.groupId, 'createdBy': req.body.userId });
        }

      });
  };

  router.createGroupCall = (req, res) => {
    //console.log(req.body);
    let newGroupCall = new groupCall(req.body);
    newGroupCall.save(function (err, result) {
      if (err) return;// console.log(err);

      groupCall.findOne({status: 1}, {}, { sort: { 'created_at' : -1 } }).populate('groupId'). exec(function (err, groupC) {
        console.log(groupC);
        res.send(groupC);
      });

    //  console.log('saved');
    //  console.log(result);
     // res.json(200);
    });
  }

  router.joinCallGroup = (req, res) => {
    console.log(req.body);

    groupCall.update(
      { '_id': req.body._id, "members": { "$ne": req.body.userId }},
      { $push: { members: req.body.member } },
    ).exec(function (err, result) {
      if (err) return; //console.log(err);
    
      groupCall.findOne({'_id': req.body._id ,status: 1, projectId: req.body.projectId })
              .populate('members', {name:true, _id:true})
              .populate('groupId')
              .exec(function (err, callingGroup) {
                if (err) return; console.log(err);
                res.send(callingGroup);
      })

      
      // res.json(200);
    })
  }

  router.leaveCallGroup = (req, res) => {
    console.log(req.body._id);

    if (req.body.status == 0) { // call is ended
      const date = new Date().getTime();
      groupCall.update(
        { '_id': req.body._id },
        { $set: { 'status': 0 , 'closedAt': date} },
      ).exec(function (err, result) {
        res.send(result);
        //res.json(200);
      })
    }
    else { // user has left the call
      console.log("left the call");
      groupCall.update(
        { '_id': req.body._id },
        { $pull: { members: req.body.userId } },
      ).exec(function (err, result) {
        if (err) return console.log(err);
     //   console.log(result);
        res.send(result);
        //res.json(200);
      })
    }
  }

  router.getCallGroups = (req, res) => {
    // get all groups who are in calling state
    groupCall.find({ status: 1, projectId: req.body.projectId }).populate('members', {name:true, _id:true}).populate('groupId').exec(function (err, callingGroups) {

        var tempGroups = [];
        if (err) return console.log(err);

        var i = 0, j = 0;
        for (i; i < callingGroups.length; i++) {
          j = 0
          for (j; j < callingGroups[i].groupId.members.length; j++) {
            if (req.body.userId == callingGroups[i].groupId.members[j]._id) tempGroups.push(callingGroups[i]);
          }
        }

        res.send(tempGroups); // send all group list who are in calling state
    });
  }

  router.updateGroupCallStatus = (req, res) => {
    // --- if group call started or ended then update its status here ...
  }

  // Broadcast function end ======
  return router;
};
