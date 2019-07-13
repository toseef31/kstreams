const express = require('express');
const groupsRouter = express.Router();
let groupModel = require('../models/groups');

groupsRouter.route('/storegroup').post(function (req, res) {
    var Group = groupModel;

    console.log(req.body);

    //  let newGroupModel = new groupModel(req.body);
    // newGroupModel.save()
 
    groupModel.update(
        { $push: { members: req.body.id }, name: req.body.name, status: req.body.status },
        // { name: req.body.name },
        // { status: req.body.status }
    ).then(
        (result) => {
            res.send(result);
        }).catch(err => {
            res.send(err);
        });
});

module.exports = groupsRouter;