var mongoose = require('mongoose');

const projectSchema = mongoose.Schema({
    "name": String,
    "metaTitle": String,
    "logo": String,
    "color1": String,
    "color2": String,
    "profileImgLocation": String,
    "domainUrl": { type: String, default: 'localhost'},
    //--------------------------------------------------------------------------------------------------
    "siteIntegration": { type: Number, default: 0 },
    //1=Yes, then on session logout show session destroyed + do not show login page and logout button 
    //0=Show login page, logout button and redirect to login page on logout      
    //--------------------------------------------------------------------------------------------------
    "allList": { type: Number, default: 0 }, //1=Show complete list in recent chat / 0=Show only friends     
    "groups": { type: Number, default: 0 },  //1=Show , 0=Hide     
    "broadcasting": { type: Number, default: 0 }, //1=Show /0=Hide             
    "status": { type: Number, default: 0 },  //1=Active /0=Inactive
},
    { timestamps: true });

module.exports = mongoose.model('projects', projectSchema);