const express = require('express');
const projectsRouter = express.Router();

let configData = require('../public/lib/js/config');
let userModel = require('../model/users-model');
let projectModel = require('../model/projectModel')

projectsRouter.route('/register-user').post(function (req, res) {
 
    var userData = req.body;
    let newUserModel = new userModel(userData);
    var fullUrl = req.protocol + '://' + req.get('host') + 'profilePhotos';
   
    if (userData.email != ''){
        userModel.findOne({ 'email': userData.email })
        .lean().exec(function (err, result) { 
            if (!result) {
                newUserModel.save()
                    .then(reg => {
                         res.send({ 'message': 'User added successfully', 'status': true, 'users': userData });
                    })
                    .catch(err => {
                        res.status(400).send({ 'message': "unable to save in database", 'status': false });
                    });
            }
            else 
                res.send({ 'message': 'User Id or email already exist', 'status': false, 'users': null }); 
        })
    }
    else{
        userModel.findOne({ 'userId': userData.userId })
        .lean().exec(function (err, result) { 
            if (!result) {
                newUserModel.save()
                    .then(reg => {
                         res.send({ 'message': 'User added successfully', 'status': true, 'users': userData });
                    })
                    .catch(err => {
                        res.status(400).send({ 'message': "unable to save in database", 'status': false });
                    });
            }
            else 
                res.send({ 'message': 'User Id or email already exist', 'status': false, 'users': null }); 
        })
    }
    
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

projectsRouter.route('/getProject').post(function (req, res) { 

    projectModel.findOne({ 'status':1})
    .lean().exec(function (err, projectData) { 
        res.send(projectData);
    })
})

module.exports = projectsRouter;