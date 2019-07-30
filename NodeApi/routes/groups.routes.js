const express = require('express');
const groupsRouter = express.Router();
let groupModel = require('../models/groups');
let userModel = require('../models/registration');

groupsRouter.route('/addusergroup').post(function (req, res) {

    groupModel.update(
        { '_id': req.body.selectedGroupId },
        { $push: { members: req.body.user } },
    ).then(
        (result) => {
            var Group = groupModel;
            var User = userModel;

            Group.find({ '_id': req.body.selectedGroupId }).populate({ path: 'members', match: { status: { $eq: 1 }, isAdmin: 0 } }).exec(function (err, users) {
                if (err) { return console.log(err); }
                var groupUsers = users;

                User.find({ '_id': { $nin: groupUsers[0].members }, 'isAdmin': 0, 'status': 1 }, {}).exec(function (err, remainingUsers) {
                    if (err) { return console.log(err); }

                    res.send({ 'groupUsers': groupUsers, 'remainingUsers': remainingUsers });
                })

            });

        }).catch(err => {
            res.send(err);
        });
});


groupsRouter.route("/deletegroupuser").post(function (req, res) {
    groupModel.update(
        { '_id': req.body.selectedGroupId },
        { $pull: { members: req.body.user } },
    ).then(
        (result) => {
            var Group = groupModel;
            var User = userModel;

            Group.find({ '_id': req.body.selectedGroupId }).populate({ path: 'members', match: { status: { $eq: 1 }, isAdmin: 0 } }).exec(function (err, users) {
                if (err) { return console.log(err); }
                var groupUsers = users;

                User.find({ '_id': { $nin: groupUsers[0].members }, 'isAdmin': 0, 'status': 1 }, {}).exec(function (err, remainingUsers) {
                    if (err) { return console.log(err); }

                    res.send({ 'groupUsers': groupUsers, 'remainingUsers': remainingUsers });
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
            Group.find({ 'status': 1 }, { '_id': true, 'name': true, 'status': true }, function (err, groups) {
                res.send(groups);
            })
        }).catch(
            err => {
                res.status(400).send({ 'message': "unable to create group", 'status': false });
            }
        )
});

groupsRouter.route("/editgroup").post(function (req, res) {
    var Group = groupModel;
   
    Group.findByIdAndUpdate(req.body.groupId, { 'name': req.body.groupName }).then(
        (result) => {
            Group.find({ 'status': 1 }).populate({ path: 'members', match: { status: { $eq: 1 }, isAdmin: 0 }, select: { '_id': true, 'email': true, 'username': true, 'status': true } }).exec(function (err, groups) {
                res.send(groups);
            })
        }
    ).catch(err => {
        res.status(400).send({ 'message': "failed to update group", 'status': false })
    })
})

groupsRouter.route("/deletegroup").post(function (req, res) {
    var Group = groupModel;

    Group.findByIdAndUpdate(req.body.groupId, { 'status': 0 }).then(
        (result) => {
            var Group = groupModel;
            Group.find({ 'status': 1 }).populate({ path: 'members', match: { status: { $eq: 1 }, isAdmin: 0 }, select: { '_id': true, 'email': true, 'username': true, 'status': true } }).exec(function (err, groups) {
                res.send(groups);
            })

        }).catch(err => {
            res.status(400).send({ 'message': "failed to delete the group", 'status': false });
        });
})

groupsRouter.route("/getgroups").get(function (req, res) {
    var Groups = groupModel;

    Groups.find({ 'status': 1 }).populate({ path: 'members', match: { status: { $eq: 1 }, isAdmin: 0 }, select: { '_id': true, 'email': true, 'username': true, 'status': true } }).exec(function (err, groups) {
        res.send(groups);
    })
})

groupsRouter.route("/getaddedusers").post(function (req, res) {
    var Group = groupModel;
    var User = userModel;

    Group.find({ '_id': req.body.selectedGroupId }).populate({ path: 'members', match: { status: { $eq: 1 }, isAdmin: 0 } }).exec(function (err, users) {
        if (err) { return console.log(err); }
        var groupUsers = users;

        User.find({ '_id': { $nin: groupUsers[0].members }, 'isAdmin': 0, 'status': 1 }, {}).exec(function (err, remainingUsers) {
            if (err) { return console.log(err); }

            res.send({ 'groupUsers': groupUsers, 'remainingUsers': remainingUsers });
        })
    });
})


module.exports = groupsRouter;