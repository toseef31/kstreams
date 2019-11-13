/*
* author  => Peek International
* designBy => Peek International
*/
const bcrypt      = require('bcrypt');
const userModel   = require('../model/users-model');
// const recentModel = require('../model/recent-model'); 
const groupsModel = require('../model/groupsModel');
const mongoose    = require('mongoose');

module.exports = function(io){
	var helper = {}; 
	helper.RTU = function (data){
		console.log('IN helper.RTU');
	    // recentModel.find({$or:[{senderId:data.senderId},{receiverId:data.senderId}]}).sort({updatedAt:-1}).exec(function(err,senderUsers){
	    //    recentModel.find({$or:[{receiverId:data.receiverId},{senderId:data.receiverId}]}).sort({updatedAt:-1}).exec(function(err,receiverUsers){
	    //       io.emit('getUsers',{senderUsers:senderUsers,receiverUsers:receiverUsers,senderId:data.senderId,receiverId:data.receiverId});
	    //    });
	    // });
	}

	helper.RTGU = function (){
	    groupsModel.find({},function(err,groups){
	        io.emit('groupUpdate',groups);
	    })
	    
	}

	helper.incrypt = function (pass){
	    return bcrypt.hashSync(pass,bcrypt.genSaltSync(9))
	}
	helper.updateLastMsg = function (data){ 
		console.log('IN helper.updateLastMsg');
	    /*this promise update user last msg if has else add*/
	    return new Promise((resolve,reject) =>{
	       
	        // var query = {$or:[{senderId:data.senderId,receiverId:data.receiverId},{senderId:data.receiverId,receiverId:data.senderId}],chat:{$elemMatch:{$or:[{senderId:data.senderId,receiverId:data.receiverId},{senderId:data.receiverId,receiverId:data.senderId}] }}},
	        //     update = {$set:{'chat.$._id':data._id,'chat.$.senderId':data.senderId,'chat.$.receiverId':data.receiverId,'chat.$.message':data.message,'chat.$.isseen':data.isseen,'chat.$.date':data.date }};
	        
	        // recentModel.update(query, update, function(error, result) {
	        //     if(error) reject(error);
	        //     if(result.n == 1 && result.nModified == 1 && result.ok == 1) resolve();
	        //     if (result.n == 0 && result.nModified == 0 && result.ok == 1){
	        //         recentModel.update({senderId:data.senderId,receiverId:data.receiverId}, {$push:{chat:data}}, function(error, result) {
	        //            if(error) reject('user not add');
	        //             resolve();
	        //         });
	        //     }
	        // });
	       
	    });
	    
	}
	
	helper.incrementUnReadMsg = function (data){
		console.log('IN helper.incrementUnReadMsg');
		// var updateUnReadMsgQuery = {chat:{$elemMatch:{$or:[{senderId:data.senderId,receiverId:data.receiverId},{senderId:data.receiverId,receiverId:data.senderId}]}}},
	    // 	updatedata ={$inc:{'chat.$.unreadMsg':1}};
	    // recentModel.update(updateUnReadMsgQuery,updatedata,function(err,data){
	    // 	if(err) throw err;
	    // }) 
	}
	helper.addNewMessage = function (data){
        helper.updateLastMsg(data).then(function(){
        	/*increment unread message*/
        	helper.incrementUnReadMsg(data);
                helper.RTU(data);
            }).catch((err) => console.log(err));
        	}

	helper.changeStatus = function (id,status,callback){
		if(status){
			userModel.findByIdAndUpdate(id).populate('projectId').exec(function(err,data){
				if(err) throw err;
				callback(data);
			});
		}
	}

	helper.getData = function (model,obj = 0, callback){
		if(obj != 0 && obj != null){
			if(typeof obj.password ===undefined) callback({err:err});

           if (obj.email != ''){
			model.findOne({'email':obj.email, 'status': 1, 'isAdmin': 0})
			.populate({
				path: 'projectId',
				match: {
				  status: 1 
				}
			  }).lean().exec(function(err,data){ 
				if(err || !data) callback({err:err});
				else{
					if (!bcrypt.compareSync(obj.password, data.password))  
						callback({err:err});
					else
						userModel.update({'email': obj.email}, {'onlineStatus': 1})
						.lean().exec(function (err, result) { 
						     callback(data);
						})
				}
			});	
		}
		else if (obj.phone != ''){ console.log("helper login phone")
			model.findOne({'phone':obj.phone, 'status': 1, 'isAdmin': 0})
			.populate({
				path: 'projectId',
				match: {
				  status: 1 
				}
			  }).lean().exec(function(err,data){ 
				if(err || !data) callback({err:err});
				else{
					if (!bcrypt.compareSync(obj.password, data.password))  
						callback({err:err});
					else
						userModel.update({'phone': obj.phone}, {'onlineStatus': 1})
						.lean().exec(function (err, result) { 
						     callback(data);
						})
				}
			});	
		}

		}else{
			model.find({status:1}).populate('projectId').exec(function(err,data){
				callback(data);
			});
		}
	}

	helper.getPData = function (model,obj = 0, callback){
		console.log('1');
		if(obj != 0 && obj != null){
			model.findOne({'phone':obj.phone, 'status': 1, 'isAdmin': 0})
			.populate({
				path: 'projectId',
				match: {
				  status: 1 
				}
			  }).lean().exec(function(err,data){ 
				console.log(data);
				if(err || !data) callback({err:err});
				else{
						userModel.update({'phone': obj.phone}, {'onlineStatus': 1})
						.lean().exec(function (err, result) { 
						     callback(data);
						})
				}
			});	
		}else{
			model.find({status:1}).populate('projectId').exec(function(err,data){
				callback(data);
			});
		}
	}

	return helper;
}