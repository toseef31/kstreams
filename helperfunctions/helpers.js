/*
* author  => Peek International
* designBy => Peek International
*/
const bcrypt      = require('bcrypt');
const userModel   = require('../model/users-model');
const recentModel = require('../model/recent-model'); 
const groupsModel = require('../model/groupsModel');
const mongoose    = require('mongoose');

module.exports = function(io){
	var helper = {}; 
	helper.RTU = function (data){
	    recentModel.find({$or:[{senderId:data.senderId},{receiverId:data.senderId}]}).sort({updatedAt:-1}).exec(function(err,senderUsers){
	       recentModel.find({$or:[{receiverId:data.recevierId},{senderId:data.recevierId}]}).sort({updatedAt:-1}).exec(function(err,receiverUsers){
	          io.emit('getUsers',{senderUsers:senderUsers,receiverUsers:receiverUsers,senderId:data.senderId,receiverId:data.recevierId});
	       });
	    });
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
		console.log('updateLastMsg: ',data);
	    /*this promise update user last msg if has else add*/
	    return new Promise((resolve,reject) =>{
	       
	        var query = {$or:[{senderId:data.senderId,receiverId:data.recevierId},{senderId:data.recevierId,receiverId:data.senderId}],chat:{$elemMatch:{$or:[{senderId:data.senderId,recevierId:data.recevierId},{senderId:data.recevierId,recevierId:data.senderId}] }}},
	            update = {$set:{'chat.$._id':data._id,'chat.$.senderId':data.senderId,'chat.$.recevierId':data.recevierId,'chat.$.message':data.message,'chat.$.isseen':data.isseen,'chat.$.date':data.date }};
	        
	        recentModel.update(query, update, function(error, result) {
	            if(error) reject(error);
	            if(result.n == 1 && result.nModified == 1 && result.ok == 1) resolve();
	            if (result.n == 0 && result.nModified == 0 && result.ok == 1){
	                recentModel.update({senderId:data.senderId,receiverId:data.recevierId}, {$push:{chat:data}}, function(error, result) {
	                   if(error) reject('user not add');
	                    resolve();
	                });
	            }
	        });
	       
	    });
	    
	}
	
	helper.incrementUnReadMsg = function (data){
		var updateUnReadMsgQuery = {chat:{$elemMatch:{$or:[{senderId:data.senderId,recevierId:data.recevierId},{senderId:data.recevierId,recevierId:data.senderId}]}}},
	    	updatedata ={$inc:{'chat.$.unreadMsg':1}};
	    recentModel.update(updateUnReadMsgQuery,updatedata,function(err,data){
	    	if(err) throw err;
	    })

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
			userModel.findByIdAndUpdate(id,{$set:status}).exec(function(err,data){
				if(err) throw err;
				callback(data);
			});
		}
	}

	helper.getData = function (model,obj = 0, callback){
		if(obj != 0 && obj != null){
			model.find(obj).exec(function(err,data){
				if(err){
					callback({err:err});
				}else{
					callback(data);
				}
			});	
		}else{
			model.find({status:1}).exec(function(err,data){
				callback(data);
			});
		}
		
	}
	return helper;
}