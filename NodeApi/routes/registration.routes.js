const express = require('express');
const registrationRoutes = express.Router();
var bcrypt = require('bcrypt');
let regModel = require('../models/registration');
var multer = require('multer');
url = require('url');
fs = require('fs');
path = require('path'),
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

// registrationRoutes.get('/assets', function (req, res) {
//     var User = regModel;
//     path.j
//     var v = 'http://localhost:4000/53b.jpg';
//    res.json(v);
// });

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

registrationRoutes.route("/getloggeduser").post(function (req, res) {
    var User = regModel;

    User.findOne({ email: req.body.email }).then(
        (result) => {
            fs.readFile(imageDir + result.user_image, function (err, content) {
                if (err) {
                    console.log("1 error");
                } else {
                    const data = { 'id': result.id, 'email': result.email, 'username': result.username };
                    return res.json({ 'data': data, 'imageFile': content });
                }
            });

        }).catch(err => {
            res.status(500).send(err);
        });
});

registrationRoutes.post('/getusers', function (req, res) {
    var User = regModel;

    User.find({ _id: { $nin: req.body._id } }, { '_id': true, 'email': true, 'username': true, 'country': true, 'phone': true }, function (err, users) {
        res.send(users);
    });
});

registrationRoutes.post('/adduser', upload.single('file'), (req, res) => {
    //const filename = req.file.userImage;
    let newUserModel = new regModel(JSON.parse(req.body.userData));
    const loggedUserId = JSON.parse(req.body.loggedUserId);

    newUserModel.save()
        .then(reg => {
            var User = regModel;
            User.find({ _id: { $nin: loggedUserId } }, { '_id': true, 'email': true, 'username': true, 'country': true, 'phone': true }, function (err, users) {
                res.send({ 'message': 'user added successfully', 'status': true, 'users': users });
            });
        })
        .catch(err => {
            res.status(400).send({ 'message': "unable to save in database", 'status': false });
        });
});

registrationRoutes.post('/deleteuser', function (req, res) {
    var User = regModel;

    User.findByIdAndDelete(req.body.userId).then(
        (result) => {
            if (!result) {
                res.status(400).send({ 'message': "unable to delete user", 'status': false });
            }

            User.find({}, { 'email': true, 'username': true, 'country': true, 'phone': true }, function (err, users) {
                res.send(users);
            })

        }
    )
});

registrationRoutes.route('/updateuser').post(function (req, res) {
    var User = regModel;
    console.log(req.body.loggedUserId);
    User.findByIdAndUpdate(req.body.userData._id, { $set: req.body.userData }).then(
        (result) => {
            var User = regModel;
            // console.log(result);
            User.find({ _id: { $nin: req.body.loggedUserId } }, { '_id': true, 'email': true, 'username': true, 'country': true, 'phone': true }, function (err, users) {
                res.send({ 'message': 'user data updated successfully', 'status': true, 'users': users });
            });

        }).catch(err => {
            res.status(400).send({ 'message': "update failed", 'status': false });
        });
});

// // function to create file from base64 encoded string
// function base64_decode(base64str, file) {
//     // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
//     var bitmap = new Buffer(base64str, 'base64');
//     fs.writeFileSync(file, bitmap);     // write buffer to file
// }
// function base64_encode(file) {
//     var bitmap = fs.readFileSync(file);   // read binary data
//     return new Buffer(bitmap).toString('base64');  // convert binary data to base64 encoded string
// }

module.exports = registrationRoutes;
