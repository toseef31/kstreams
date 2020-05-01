const express = require('express');
const groupsRouter = express.Router();
let groupModel = require('../model/groupsModel');
let userModel = require('../model/users-model');

groupsRouter.route('/addusergroup').post(function (req, res) {

    groupModel.update(
        { '_id': req.body.selectedGroupId , 'projectId': req.body.projectId},
        { $push: { members: req.body.user } },
    ).then(
        (result) => {
            var Group = groupModel;
            var User = userModel;

            Group.find({ '_id': req.body.selectedGroupId, 'projectId': req.body.projectId})
                 .populate({ path: 'members', match: { status: { $gt: 0 }, isAdmin: 0 } })
                 .populate({ path: 'projectId', match: {status: 1} ,select: {'_id': true, 'status': true}})
                 .exec(function (err, users) {
                if (err) { return console.log(err); }
                var groupUsers = users;

                User.find({ '_id': { $nin: groupUsers[0].members }, 'isAdmin': 0, 'status': {$gt : 0}, 'projectId': req.body.projectId }, {}).exec(function (err, remainingUsers) {
                    if (err) { return console.log(err); }

                    let projectIdUsers = [];
                    for (var i = 0; i < remainingUsers.length; i++) {
                        if ((remainingUsers[i].projectId+'') == (groupUsers[0].projectId._id+'')){
                            projectIdUsers.push(remainingUsers[i]);
                        }
                    }

                    res.send({ 'groupUsers': groupUsers, 'remainingUsers': projectIdUsers });
                })

            });

        }).catch(err => {
            res.send(err);
        });
});


groupsRouter.route("/deletegroupuser").post(function (req, res) {
    groupModel.update(
        { '_id': req.body.selectedGroupId, 'projectId': req.body.projectId},
        { $pull: { members: req.body.user } },
    ).then(
        (result) => {
            var Group = groupModel;
            var User = userModel;

            Group.find({ '_id': req.body.selectedGroupId, 'projectId': req.body.projectId })
                 .populate({ path: 'members', match: { status: { $gt: 0 }, isAdmin: 0 } })
                 .populate({ path: 'projectId', match: {status: 1} ,select: {'_id': true, 'status': true}})
                 .exec(function (err, users) {
                if (err) { return console.log(err); }
                var groupUsers = users;

                User.find({ '_id': { $nin: groupUsers[0].members }, 'isAdmin': 0, 'status': {$gt : 0}, 'projectId': req.body.projectId }, {}).exec(function (err, remainingUsers) {
                    if (err) { return console.log(err); }

                    let projectIdUsers = [];
                    for (var i = 0; i < remainingUsers.length; i++) {
                        if ((remainingUsers[i].projectId+'') == (groupUsers[0].projectId._id+'')){
                            projectIdUsers.push(remainingUsers[i]);
                        }
                    }

                    res.send({ 'groupUsers': groupUsers, 'remainingUsers': projectIdUsers });
                })

            });

        }).catch(err => {
            res.send(err);
        });
})

groupsRouter.route("/creategroup").post(function (req, res) {
    let newGroupModel = new groupModel(req.body);

    newGroupModel.save().then(
        reg => {
            var Group = groupModel;
            Group.find({ 'status': 1, 'projectId': req.body.projectId}, { '_id': true, 'name': true, 'status': true })
                 .populate({path: 'projectId', match: {status: 1} ,select: {'status': true}})
                 .exec(function (err, groups) {

                let projectIdGroups = [];
                for (var i = 0; i < groups.length; i++) {
                    if (groups[i].projectId != null && groups[i].projectId.status == 1)
                        projectIdGroups.push(groups[i]);
                }

                res.send(projectIdGroups);
            })
        }).catch(
            err => {
                res.status(400).send({ 'message': "unable to create group", 'status': false });
            }
        )
});

groupsRouter.route("/editgroup").post(function (req, res) {
    var Group = groupModel;
   
    Group.findByIdAndUpdate(req.body.groupId, { 'name': req.body.groupName , 'projectId': req.body.projectId}).then(
        (result) => {
            Group.find({ 'status': 1 })
            .populate({ path: 'members', match: { status: { $gt: 0 }, isAdmin: 0 }, select: { 'password': false } })
            .populate({ path: 'projectId', match: {status: 1}, select: {'status': true}})
            .exec(function (err, groups) {

           let projectIdGroups = [];
           for (var i = 0; i < groups.length; i++) {
               if (groups[i].projectId != null && groups[i].projectId.status == 1)
                   projectIdGroups.push(groups[i]);
           }
                res.send(projectIdGroups);
        }
    ).catch(err => {
        res.status(400).send({ 'message': "failed to update group", 'status': false })
    })
})
})

groupsRouter.route("/deletegroup").post(function (req, res) {
    var Group = groupModel;

    Group.findByIdAndUpdate(req.body.groupId, { 'status': 0 , 'projectId': req.body.projectId}).then(
        (result) => {
            var Group = groupModel;
            Group.find({ 'status': 1 , 'projectId': req.body.projectId})
            .populate({ path: 'members', match: { status: { $gt: 0 }, isAdmin: 0 }, select: { 'password': false } })
            .populate({ path: 'projectId', match: {status: 1}, select: {'status': true}})
            .exec(function (err, groups) {

           let projectIdGroups = [];
           for (var i = 0; i < groups.length; i++) {
               if (groups[i].projectId != null && groups[i].projectId.status == 1)
                   projectIdGroups.push(groups[i]);
           }
           res.send(projectIdGroups);
        }).catch(err => {
            res.status(400).send({ 'message': "failed to delete the group", 'status': false });
        });
})
})

groupsRouter.route("/getgroups").get(function (req, res) {
    var Groups = groupModel;

    Groups.find({ 'status': 1, 'projectId': req.body.projectId})
    .populate({ path: 'members', match: { status: { $gt: 0 }, isAdmin: 0 }, select: { 'password': false } })
    .populate({ path: 'projectId', match: {status: 1} ,select: {'status': true}})
    .exec(function (err, groups) {
      
        let projectIdGroups = [];
        for (var i = 0; i < groups.length; i++) {

            if (groups[i].projectId != null && groups[i].projectId.status == 1)
                projectIdGroups.push(groups[i]);
        }
        
        res.send(projectIdGroups);
    })
})

groupsRouter.route("/getaddedusers").post(function (req, res) {
    var Group = groupModel;
    var User = userModel;

    Group.find({ '_id': req.body.selectedGroupId, 'projectId': req.body.projectId})
    .populate({ path: 'members', match: { status: { $gt: 0 }, isAdmin: 0 } })
    .populate({ path: 'projectId', match: {status: 1} ,select: {'_id': true, 'status': true}})
    .exec(function (err, groups) {
        if (err) { return console.log(err); }
        var groupUsers = groups;
        console.log(groups);

        User.find({ '_id': { $nin: groupUsers[0].members }, 'isAdmin': 0, 'status': {$gt : 0} , 'projectId': req.body.projectId}, {}).exec(function (err, remainingUsers) {
            if (err) { return console.log(err); }
            let projectIdUsers = [];
            for (var i = 0; i < remainingUsers.length; i++) {
                if ((remainingUsers[i].projectId+'') == (groupUsers[0].projectId._id+'')){
                    projectIdUsers.push(remainingUsers[i]);
                }
            }
            res.send({ 'groupUsers': groupUsers, 'remainingUsers': projectIdUsers });
        })
    });
})


module.exports = groupsRouter;