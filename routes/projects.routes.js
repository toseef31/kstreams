const express = require('express');
const projectsRouter = express.Router();

let configData = require('../public/lib/js/config');
let userModel = require('../model/users-model');
let projectModel = require('../model/projectModel')

projectsRouter.route('/register-user').post(function (req, res) {
    var userData = req.body;
    let newUserModel = new userModel(userData);
    var fullUrl = req.protocol + '://' + req.get('host') + 'profilePhotos';
    console.log("REGISTERING USER");
    console.log(userData);
    userModel.findOne({ $or: [{ 'name': userData.name }, { 'email': userData.email }], 'projectId': req.body.projectId })
        .lean().exec(function (err, result) {
            console.log(result);
            if (!result) {
                newUserModel.save()
                    .then(reg => {
                        res.send({ 'message': 'User added successfully', 'status': true, 'users': userData });
                    })
                    .catch(err => {
                        res.status(400).send({ 'message': "Unable to save in database", 'status': false });
                    });
            }
            else
                res.send({ 'message': 'Username or email already exist', 'status': false, 'users': null });
        })
})

projectsRouter.route('/registerProject').post(function (req, res) {

    var projectData = req.body;
    let newProjectModel = new projectModel(projectData);

    newProjectModel.save().then(result => {
        configData.projectId = projectData.projectId; // store project Id in config-Var in library->js folder

        let newUserModel = new userModel({ 'userId': projectData.userId, 'projectId': res.projectId });
        newUserModel.save().then(result => {
            userModel.find({ 'isAdmin': 0, 'status': { $gt: 0 }, 'projectId': req.body.projectId }).populate('projects').exec(function (err, usersData) {
                (err) => res.send(err);

                res.send(usersData);
            })
        }).catch(err => {
            res.send(err);
        })
    })
})

projectsRouter.route('/getProject').get(function (req, res) {
    projectModel.findOne({'projectId': req.body.projectId, 'status': 1 })
        .lean().exec(function (err, projectData) {
            res.send(projectData);
        })
})

module.exports = projectsRouter;