const express = require('express');
const registrationRoutes = express.Router();
var bcrypt = require('bcrypt');
var multer = require('multer');
let regModel = require('../model/users-model');
let configData = require('../public/lib/js/config')


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
    let myProjectId = configData.projectId; // getting the stored projectId in configVar

    User.findOne({ email: req.body.email }).then(
        (result) => {
            if (!result) {
                return res.json({ 'message': "Incorrect email", 'isUserExist': false });
            }
            else {
                if (!bcrypt.compareSync(req.body.password, result.password)) {
                    return res.json({ 'message': "Incorrect password", 'isUserExist': false });
                }

                // var fileBuffer = null;
                // if (result.user_image != '') {
                //     fileBuffer = fs.readFileSync(imageDir + result.user_image);
                // }

                var imageFile = "";
                if (result.user_image != '') {
                    var imageFile = fullUrl + result.user_image;
                }

                const data = { 'id': result.id, 'email': result.email, 'name': result.name };
                return res.json({ 'data': data, 'imageFile': imageFile, 'isUserExist': true });
            }
        }).catch(err => {
            res.status(500).send(err);
        });
});

registrationRoutes.route("/getloggeduser").post(function (req, res) {
    var User = regModel;
    var fullUrl = req.protocol + '://' + req.get('host') + '/profilePhotos/';

    User.findOne({ email: req.body.email }).then(
        (result) => {

            // var fileBuffer = null;
            // if (result.user_image != '') {
            //     fileBuffer = fs.readFileSync(imageDir + result.user_image);
            // }
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

    User.find({ 'isAdmin': 0, 'status': {$gt : 0} }, { 'password': false }, function (err, users) {
        var tempUsers = users;

        for (var i = 0; i < tempUsers.length; i++) {
            if (tempUsers[i].user_image != "")
                tempUsers[i] = {
                    "_id": tempUsers[i]._id,
                    "name": tempUsers[i].name,
                    "email": tempUsers[i].email,
                    "country": tempUsers[i].country,
                    "phone": tempUsers[i].phone,
                    "user_image": tempUsers[i].user_image,
                    "status": tempUsers[i].status,
                    "userImageLink": (fullUrl + tempUsers[i].user_image)
                };
        }

        res.send(tempUsers);
    });
});


registrationRoutes.post('/adduser', upload.single('file'), (req, res) => {

    let newUserModel = new regModel(JSON.parse(req.body.userData));
    var userData = JSON.parse(req.body.userData);
    let userModel = regModel;
    var fullUrl = req.protocol + '://' + req.get('host') + '/profilePhotos/';
   
    userModel.find({ 'email': userData.email }, {'email':true}, function (err, result) {
     
        if (result.length == 0) {
            newUserModel.save()
                .then(reg => {
                    var User = regModel;

                    User.find({ 'isAdmin': 0, 'status': {$gt : 0} }, { 'password': false }, function (err, users) {
                        var tempUsers = users;
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
                                    "userImageLink": (fullUrl + tempUsers[i].user_image)
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
            res.send({ 'message': 'email already exist', 'status': false , 'users': null});
        }
    }).catch(err => {
        res.send({ 'message': 'operation failed', 'status': false });
    });


});

registrationRoutes.post('/updateuser', upload.single('file'), (req, res) => {
    var User = regModel;
    var newUserModel = new regModel(JSON.parse(req.body.userData));
    var fullUrl = req.protocol + '://' + req.get('host') + '/profilePhotos/';

    // if (req.body.userData.password != ""){
    bcrypt.hash(newUserModel.password, 10, function (err, hash) {
        newUserModel.password = hash;

        User.findByIdAndUpdate(newUserModel._id, { $set: newUserModel }).then(
            (result) => {

                var User = regModel;
                User.find({ 'isAdmin': 0, 'status': {$gt : 0} }, { 'password': false }, function (err, users) {
                    var tempUsers = users;
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
                                "userImageLink": (fullUrl + tempUsers[i].user_image)
                            };
                        }

                    }
                    res.send({ 'message': 'user data updated successfully', 'status': true, 'users': tempUsers });
                });

            }).catch(err => {
                res.status(400).send({ 'message': "update failed", 'status': false });
            });
    });
});


registrationRoutes.post('/deleteuser', function (req, res) {
    var User = regModel;
    //const loggedUserId = req.body._id;
    const userIdToBeDeleted = req.body.userId;
    var fullUrl = req.protocol + '://' + req.get('host') + '/profilePhotos/';

    User.findByIdAndUpdate(userIdToBeDeleted, { 'status': 0 }).then(
        (result) => {
            if (!result) {
                res.status(400).send({ 'message': "unable to delete user", 'status': false });
            }

            User.find({ 'isAdmin': 0, 'status': {$gt : 0} }, { 'password': false }, function (err, users) {
                var tempUsers = users;
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
                            "userImageLink": (fullUrl + tempUsers[i].user_image)
                        };
                    }

                }
                res.send(tempUsers);
            })
        }
    )
});



module.exports = registrationRoutes;
