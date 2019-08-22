const express = require('express');
const projectsRouter = express.Router();

let configData = require('../public/lib/js/config');
let userModel = require('../model/users-model');
let projectModel = require('../model/projectModel')

projectsRouter.route('/register-user').post(function (req, res) {
 
    var userData = req.body;
    let newUserModel = new userModel(userData);
    var fullUrl = req.protocol + '://' + req.get('host') + 'profilePhotos';
   
    userModel.find({ $or: [{ 'email': userData.email }, { 'userId': userData.userId }] }).exec(function (err, result) {

        if (result.length == 0) {
            newUserModel.save()
                .then(reg => {
                    // Remember: There are three types of user's status -> (0- Deleted, 1- Active, 2-inActive)
                    userModel.find({ 'isAdmin': 0, 'status': { $gt: 0 } }, { 'password': false }, function (err, users) {
                        var tempUsers = users;
                        // Below loop for custom appending of new property in received user data from db query
                        for (var i = 0; i < users.length; i++) {
                            if (users[i].user_image != "") {
                                tempUsers[i] = {
                                    "_id": tempUsers[i]._id,
                                    "name": tempUsers[i].name,
                                    "email": tempUsers[i].email,
                                    "country": tempUsers[i].country,
                                    "phone": tempUsers[i].phone,
                                    "status": tempUsers[i].status,
                                    "user_image": tempUsers[i].user_image,
                                    "userImageLink": (fullUrl + tempUsers[i].user_image) // new property appended
                                };
                            }

                        }
                        res.send({ 'message': 'user added successfully', 'status': true, 'users': tempUsers });
                    });
                })
                .catch(err => {
                    res.status(400).send({ 'message': "unable to save in database", 'status': false });
                });
        }
        else {
            res.send({ 'message': 'user already exist', 'status': false, 'users': null });
        }
    })
})

projectsRouter.route('/registerProject').post(function (req, res) {

    var projectData = req.body;
    let newProjectModel = new projectModel(projectData);

    newProjectModel.save().then(result => {
        configData.projectId = projectData.projectId; // store project Id in config-Var in library->js folder

        let newUserModel = new userModel({ 'userId': projectData.userId, 'projectId': res.projectId });
        newUserModel.save().then(result => {
            userModel.find({ 'isAdmin': 0, 'status': { $gt: 0 } }).populate('projects').exec(function (err, usersData) {
                (err) => res.send(err);

                res.send(usersData);
            })
        }).catch(err => {
            res.send(err);
        })
    })
})

projectsRouter.route('/getProjects').post(function (req, res) {
    var projectId = req.body.projectId;
    projectModel.find({ '_id': projectId }).exec(function (err, projectData) {
        res.send(projectData);
    })
})

module.exports = projectsRouter;