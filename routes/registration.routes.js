const express = require('express');
const registrationRoutes = express.Router();
var bcrypt = require('bcrypt');
var multer = require('multer');
let regModel = require('../model/users-model');
let projectModel = require('../model/projectModel');

// ------------------- MULTER IMAGE STORING CODE --------------------------------------------------
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/')
    },

    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
const upload = multer({
    storage: storage
})
// -----------------------------------------------------------------------------------------------

registrationRoutes.route("/login").post(function (req, res) {
    var User = regModel;
    var fullUrl = req.protocol + '://' + req.get('host') + '/profilePhotos/';

    projectModel.findOne({ status: 1 }).exec(function (err, projectData) {
        //  { $or:[ {'email':req.body.email}, {'phone':req.body.phone} ]}
        console.log(req.body);
        if (req.body.email != ''){   
            User.findOne({'email':req.body.email}).then(
                (result) => {
                   
                    if (!result) {     console.log('if email');
                        return res.json({ 'message': "Incorrect email", 'isUserExist': false });
                    }
                    else {
                      //  console.log('else email');
                        if (!bcrypt.compareSync(req.body.password, result.password)) {
                            return res.json({ 'message': "Incorrect password", 'isUserExist': false });
                        }
                      //  console.log('pswd passed');
                        var imageFile = "";
                        if (result.user_image != '') {
                            var imageFile = fullUrl + result.user_image;
                        }
    
                         req.session.user = result;
                        // req.session.save();
                        // console.log(req.session.user);
                      //  saveUser(user);

                        const data = { 'id': result.id, 'email': result.email, 'name': result.name };
                        return res.json({ 'data': data, 'imageFile': imageFile, 'isUserExist': true });
                    }
                }).catch(err => {
                    res.status(500).send(err);
                });
        }
        else{
            User.findOne({'phone':req.body.phone}).then(
                (result) => {
                
                    if (!result) {     console.log('if phone');
                        return res.json({ 'message': "Incorrect phone", 'isUserExist': false });
                    }
                    else {
                      //  console.log('else phone');
                        if (!bcrypt.compareSync(req.body.password, result.password)) {
                            return res.json({ 'message': "Incorrect password", 'isUserExist': false });
                        }
                      //  console.log('pswd passed');
                        var imageFile = "";
                        if (result.user_image != '') {
                            var imageFile = fullUrl + result.user_image;
                        }
                        
                        req.session.user = result;
                        console.log(req.session.user);

                        const data = { 'id': result.id, 'email': result.email, 'name': result.name };
                        return res.json({ 'data': data, 'imageFile': imageFile, 'isUserExist': true });
                    }
                }).catch(err => {
                    res.status(500).send(err);
                });
        }
      
    })
});

registrationRoutes.route("/getloggeduser").post(function (req, res) {
    var User = regModel;
    var fullUrl = req.protocol + '://' + req.get('host') + '/profilePhotos/';

    User.findOne({ email: req.body.email }).then(
        (result) => {
            var imageFile = "";
            if (result.user_image != '') {
                var imageFile = fullUrl + result.user_image;
            }

            const data = { 'id': result.id, 'email': result.email, 'name': result.name };
            return res.json({ 'data': data, 'imageFile': imageFile });

        }).catch(err => {
            res.status(500).send(err);
        });
});

registrationRoutes.post('/getusers', function (req, res) {
    var User = regModel;
    var fullUrl = req.protocol + '://' + req.get('host') + '/profilePhotos/';
    var activeProjectUsers = [];

    User.find({ 'isAdmin': 0, 'status': { $gt: 0 } }, { 'password': false }).populate('projectId').exec(function (err, users) {

        for (var i = 0; i < users.length; i++) {
            if (users[i].user_image != "")
                users[i]['userImageLink'] = (fullUrl + users[i].user_image);

            if (users[i].projectId.status == 1)
                activeProjectUsers.push(users[i]);
        }
        res.send(activeProjectUsers);
    });
});


registrationRoutes.post('/adduser', upload.single('file'), (req, res) => {

    var userData = JSON.parse(req.body.userData);
    let userModel = regModel;
    var fullUrl = req.protocol + '://' + req.get('host') + '/profilePhotos/';
    var activeProjectUsers = [];

    userModel.find({ 'email': userData.email }, { 'email': true }, function (err, result) {

        if (result.length == 0) {
            projectModel.findOne({ status: 1 }, { projetId: true }).exec(function (err, resultpid) {
                userData.projectId = resultpid._id;
                let newUserModel = new regModel(userData);

                newUserModel.save()
                    .then(reg => {
                        var User = regModel;

                        User.find({ 'isAdmin': 0, 'status': { $gt: 0 } }, { 'password': false }).populate('projectId').exec(function (err, users) {
                            for (var i = 0; i < users.length; i++) {
                                if (users[i].user_image != "")
                                    users[i]['userImageLink'] = (fullUrl + users[i].user_image);

                                if (users[i].projectId.status == 1)
                                    activeProjectUsers.push(users[i]);
                            }
                            res.send({ 'message': 'user added successfully', 'status': true, 'users': activeProjectUsers });
                        });
                    })
                    .catch(err => {
                        res.status(400).send({ 'message': "unable to save in database", 'status': false });
                    });
            })
        }
        else {
            res.send({ 'message': 'email already exist', 'status': false, 'users': null });
        }
    }).catch(err => {
        res.send({ 'message': 'operation failed', 'status': false });
    });
});

registrationRoutes.post('/updateuser', upload.single('file'), (req, res) => {
    var User = regModel;
    var newUserModel = new regModel(JSON.parse(req.body.userData));
    var fullUrl = req.protocol + '://' + req.get('host') + '/profilePhotos/';
    var activeProjectUsers = [];

    bcrypt.hash(newUserModel.password, 10, function (err, hash) {
        newUserModel.password = hash;

        User.findByIdAndUpdate(newUserModel._id, { $set: newUserModel }).then(
            (result) => {
                var User = regModel;
                User.find({ 'isAdmin': 0, 'status': { $gt: 0 } }, { 'password': false }).populate('projectId').exec(function (err, users) {

                    for (var i = 0; i < users.length; i++) {
                        if (users[i].user_image != "")
                            users[i]['userImageLink'] = (fullUrl + users[i].user_image);

                        if (users[i].projectId.status == 1)
                            activeProjectUsers.push(users[i]);
                    }
                    res.send({ 'message': 'user data updated successfully', 'status': true, 'users': activeProjectUsers });
                });

            }).catch(err => {
                res.status(400).send({ 'message': "update failed", 'status': false });
            });
    });
});


registrationRoutes.post('/deleteuser', function (req, res) {
    var User = regModel;
    const userIdToBeDeleted = req.body.userId;
    var fullUrl = req.protocol + '://' + req.get('host') + '/profilePhotos/';
    var activeProjectUsers = [];

    User.findByIdAndUpdate(userIdToBeDeleted, { 'status': 0 }).then(
        (result) => {
            if (!result) {
                res.status(400).send({ 'message': "unable to delete user", 'status': false });
            }

            User.find({ 'isAdmin': 0, 'status': { $gt: 0 } }, { 'password': false }).populate('projectId').exec(function (err, users) {
                for (var i = 0; i < users.length; i++) {
                    if (users[i].user_image != "")
                        users[i]['userImageLink'] = (fullUrl + users[i].user_image);

                    if (users[i].projectId.status == 1)
                        activeProjectUsers.push(users[i]);
                }
                res.send(activeProjectUsers);
            })
        }
    )
});



module.exports = registrationRoutes;
