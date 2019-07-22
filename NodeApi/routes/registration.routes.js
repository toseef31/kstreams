const express = require('express');
const registrationRoutes = express.Router();
var bcrypt = require('bcrypt');
let regModel = require('../models/registration');
var multer = require('multer');
fs = require('fs');
imageDir = '/WEB STUFF/PEEK INTERNATION/Angular Projects/VideoChatAdmin/NodeApi/assets/';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/WEB STUFF/PEEK INTERNATION/Angular Projects/VideoChatAdmin/NodeApi/assets')
    },

    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
const upload = multer({
    storage: storage
})

registrationRoutes.route("/login").post(function (req, res) {
    var User = regModel;

    User.findOne({ email: req.body.email }).then(
        (result) => {
            if (!result) {
                return res.json({ 'message': "incorrect email", 'isUserExist': false });
            }
            else {
                if (!bcrypt.compareSync(req.body.password, result.password)) {
                    return res.json({ 'message': "incorrect password", 'isUserExist': false });
                }

                var fileBuffer = null;
                // if (result.user_image != '') {
                //     fileBuffer = fs.readFileSync(imageDir + result.user_image);
                // }

                const data = { 'id': result.id, 'email': result.email, 'username': result.username };
                return res.json({ 'data': data, 'imageFile': fileBuffer, 'isUserExist': true });
            }
        }).catch(err => {
            res.status(500).send(err);
        });
});

// registrationRoutes.route("/getloggeduser").post(function (req, res) {
//     var User = regModel;

//     User.findOne({ email: req.body.email }).then(
//         (result) => {
// fs.readFile(imageDir + result.user_image, function (err, content) {
//     if (err) {
//         res.status(500).send(err);
//     } else {
//         const data = { 'id': result.id, 'email': result.email, 'username': result.username };
//         return res.json({ 'data': data, 'imageFile': content });
//     }
// });

//             const data = { 'id': result.id, 'email': result.email, 'username': result.username };
//             return res.json({ 'data': data, 'imageFile': null });

//         }).catch(err => {
//             res.status(500).send(err);
//         });
// });

registrationRoutes.post('/getusers', function (req, res) {
    var User = regModel;

    User.find({ 'isAdmin': 0, 'status': 1 }, { '_id': true, 'email': true, 'username': true, 'country': true, 'phone': true }, function (err, users) {
        res.send(users);
    });

    // User.find({ _id: { $nin: req.body._id } }, { '_id': true, 'email': true, 'username': true, 'country': true, 'phone': true }, function (err, users) {
    //     res.send(users);
    // });
});

registrationRoutes.post('/adduser', upload.single('file'), (req, res) => {

    let newUserModel = new regModel(JSON.parse(req.body.userData));
    const loggedUserId = JSON.parse(req.body.loggedUserId);

    newUserModel.save()
        .then(reg => {
            var User = regModel;
            User.find({ 'isAdmin': 0, 'status': 1 }, { '_id': true, 'email': true, 'username': true, 'country': true, 'phone': true }, function (err, users) {
                res.send({ 'message': 'user added successfully', 'status': true, 'users': users });
            });
        })
        .catch(err => {
            res.status(400).send({ 'message': "unable to save in database", 'status': false });
        });
});

registrationRoutes.post('/deleteuser', function (req, res) {
    var User = regModel;
    const loggedUserId = req.body._id;
    const userIdToBeDeleted = req.body.userId;

    User.findByIdAndUpdate(userIdToBeDeleted, {'status': 0}).then(
        (result) => {
            if (!result) {
                res.status(400).send({ 'message': "unable to delete user", 'status': false });
            }

            User.find({ 'isAdmin': 0, 'status': 1 }, { 'email': true, 'username': true, 'country': true, 'phone': true }, function (err, users) {
                res.send(users);
            })
        }
    )
});

registrationRoutes.route('/updateuser').post(function (req, res) {
    var User = regModel;

    bcrypt.hash(req.body.userData.password, 10, function (err, hash) {
        req.body.userData.password = hash;

        User.findByIdAndUpdate(req.body.userData._id, { $set: req.body.userData }).then(
            (result) => {
                var User = regModel;
                User.find({ 'isAdmin': 0, 'status': 1 }, { '_id': true, 'email': true, 'username': true, 'country': true, 'phone': true }, function (err, users) {
                    res.send({ 'message': 'user data updated successfully', 'status': true, 'users': users });
                });

            }).catch(err => {
                res.status(400).send({ 'message': "update failed", 'status': false });
            });
    });
});

module.exports = registrationRoutes;
