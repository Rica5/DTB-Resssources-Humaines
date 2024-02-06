const mongoose = require("mongoose");
const UserSchema = require("../models/User");
const StatusSchema = require("../models/status");
const AbsentSchema = require("../models/absent");
const OptSchema = require("../models/option");
const LeaveSchema = require("../models/leave");
const LeaveRequestTest = require("../models/LeaveRequest");
const Log = require("../models/login_histo");
const nodemailer = require("nodemailer");
const extra_fs = require("fs-extra");
const crypto = require("crypto");
const moment = require("moment");
const fs = require("fs");
const Notif = require("../models/notification");

//Home page
const getHomePage = async (req,res) => {
    var session = req.session;
   if ( session.occupation_u == "User"){
        var user = await UserSchema.findOne({m_code:session.m_code});
        res.render("PageEmployee/MonEspace.html",{user:user,codeUser:session.m_code});
   }
   else {
    res.send("Bad authentification please log in");
   }
}

//For Leave Request
const getLeaveRequest = async (req,res) => {
    var session = req.session;
   if ( session.occupation_u == "User"){
    var user = await UserSchema.findOne({m_code:session.m_code});
    res.render("PageEmployee/FaireDemande.html",{user:user,codeUser:session.m_code});
   }
   else {
        res.send("Bad authentification please log in");
   }
}
// Make request
const makeLeaveRequest = async (req,res) => {
    var session = req.session;
    if ( session.occupation_u == "User"){
        try{
            var user = await UserSchema.findOne({m_code:req.body.code})
                var new_request = {
                    m_code:req.body.code,
                    num_agent:user.num_agent,
                    matr:user.matr,
                    nom:`${user.first_name} ${user.last_name}`,
                    date_start:req.body.startDate,
                    date_end:req.body.endDate,
                    hour_begin:req.body.startTime,
                    hour_end:req.body.endTime,
                    motif:req.body.motif,
                    recovery:req.body.recovery,
                    duration:req.body.duration,
                    type:"",
                    status:"pending",
                    rest:0,
                    acc:0,
                    datetime:moment().format("DD/MM/YYYY HH:mm:ss"),
                    priority:req.body.priority,
                    comment:"",
                    validation :[],
                }
             await LeaveRequestTest(new_request).save();
             await setGlobalAdminNotifications(`${new_request.m_code} à envoyé une demande d'absence pour ${new_request.duration} jour(s)`,req);
             res.send("Success")
        }
        catch(err){
            console.log(err)
            res.send("Error")
        }
    }
    else {
         res.send("Bad authentification please log in");
    }
}
//get My request
const getMyRequest = async (req,res) => {
    var session = req.session;
    if ( session.occupation_u == "User"){
        var myRequest = await LeaveRequestTest.find({m_code:req.body.code,status:{$ne:"done"}}).sort({"date_start":1});
        res.json(myRequest)
    }
}

//See pending request
const seePending = async (req,res) => {
    var session = req.session;
    if ( session.occupation_tl == "Surveillant"){
        var user = await UserSchema.find({status:"Actif",occupation:"User"}).select('m_code project');
        var notif = await Notif.findOne({ _id: "64f1e60ae3038813b45c2db1" });
        res.render("PageTL/DemandeConge.html",{users:user,notif:notif.notifications});
    }
    else if (session.occupation_op == "Opération"){
        var user = await UserSchema.find({status:"Actif",occupation:"User"}).select('m_code project');
        var notif = await Notif.findOne({ _id: "64f1e60ae3038813b45c2db1" });
        res.render("PageOperation/DemandeConge.html",{users:user,notif:notif.notifications});
    }
    else if (session.occupation_a == "Admin") {
        var user = await UserSchema.find({status:"Actif",occupation:"User"}).select('m_code project');
        noType = session.idUser == "645a417e9d34ed8965caea9e" ? true : false;
        var notif = await Notif.findOne({ _id: "64f1e60ae3038813b45c2db1" });
        res.render("PageAdministration/DemandeConge.html",{users:user,noType:noType,notif:notif.notifications});
    }
    else {
        res.send("Bad auth, please log in");
    }
}
//Every request pending
const getPending = async (req,res) => {
    var session = req.session;
    if ( session.occupation_tl == "Surveillant"){
        var allRequest = await LeaveRequestTest.find({status:{$ne:"done"},validation:[]});
        res.json(allRequest);
    }
    else if (session.occupation_op == "Opération"){
        var allRequest = await LeaveRequestTest.find({status:"progress", $expr: { $eq: [{ $size: '$validation' }, 1] }}).populate({path:"validation.user",select:'usuel'});
        res.json(allRequest);
    }
    else if (session.occupation_a == "Admin") {
            var allRequest = await LeaveRequestTest.find({status:"progress", $expr: { $eq: [{ $size: '$validation' }, 2] }}).populate({path:"validation.user",select:'usuel'});
            res.json(allRequest);
    }
    else {
        res.send("Bad auth, please log in");
    }
    
}

const answerRequest = async (req,res) => {
    var session = req.session;
    if ( session.occupation_tl == "Surveillant"){
       var id = req.body.id;
       var response = req.body.response;
       var comment = req.body.reason;
       var status = response == "true" ? "progress" : "declined";
       var approbator = {
        user:session.idUser,
        approbation :response
       }
       var thisLeave = await LeaveRequestTest.findOneAndUpdate({_id:id},{$push : {validation:approbator},comment:comment,status:status},{new:true});
       var title = `Absence pour ${thisLeave.motif}`
        var content = "";
        if (status == "declined"){
           content =  content = `Votre demande du ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} a été refuser car : <br> ${thisLeave.comment}`;
           setEachUserNotification(thisLeave.m_code,title,content,req);
        }
        const io = req.app.get("io");
        io.sockets.emit("isTreated", [id,thisLeave]);
        io.sockets.emit("tlDone", "Treated");
        res.json("Ok");
    }
    else if (session.occupation_op == "Opération"){
        var id = req.body.id;
        var response = req.body.response;
        var comment = req.body.reason;
        var status = response == "true" ? "progress" : "declined";
        var approbator = {
         user:session.idUser,
         approbation :response
        }
        var thisLeave = await LeaveRequestTest.findOneAndUpdate({_id:id},{$push : {validation:approbator},comment:comment,status:status},{new:true})
        var title = `Absence pour ${thisLeave.motif}`
        var content = "";
        if (status == "declined"){
           content =  content = `Votre demande du ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} a été refuser car : <br> ${thisLeave.comment}`;
           setEachUserNotification(thisLeave.m_code,title,content,req);
        }
        const io = req.app.get("io");
        io.sockets.emit("isTreated", [id,thisLeave]);
        io.sockets.emit("ropDone", "Treated");
         res.json("Ok");
    }
    else if (session.occupation_a == "Admin") {
        var status = "";
        var id = req.body.id;
        var response = req.body.response;
        var comment = req.body.reason;
        status = response == "true" ? "approved" : "declined";
        var type = req.body.typeleave;
        var approbator = {
            user:session.idUser,
            approbation :response
        }
        await LeaveRequestTest.findOneAndUpdate({_id:id},{$push : {validation:approbator},comment:comment,status:status,type:type})
        var thisLeave = await LeaveRequestTest.findOne({_id:id});
        var title = `Absence pour ${thisLeave.motif}`
        var content = "";
        if (status == "declined"){
           content =  content = `Votre demande du ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} a été refuser car : <br> ${thisLeave.comment}`
        }
        else {
            content = `Votre demande du ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} a été approuver`
        }
        setEachUserNotification(thisLeave.m_code,title,content,req);
        res.json(thisLeave);
    }
    else {
        res.send("Bad auth, please log in");
    }
}

//Get Notifications 
const getNotifications = async (req,res) => {
    var notifications = await UserSchema.findOne({m_code:req.body.code});
    res.json(notifications.myNotifications);
}
async function setGlobalAdminNotifications(notification,req){
    await Notif.findOneAndUpdate(
      { _id: "64f1e60ae3038813b45c2db1" },
      { $push: { notifications: notification } }
    );
    var notif = await Notif.findOne({
      _id: "64f1e60ae3038813b45c2db1",
    });
    const io = req.app.get("io");
    io.sockets.emit("notif", notif.notifications);
}

async function setEachUserNotification(code,title,content,req){
   var myNotif = {
        title:title,
        content:content,
        datetime:moment().format("DD/MM/YYYY hh:mm")
   }
   await UserSchema.findOneAndUpdate({m_code:code},{$push:{myNotifications:myNotif}})
    const io = req.app.get("io");
    io.sockets.emit(code, code);
}

module.exports = {
    getHomePage, getLeaveRequest, makeLeaveRequest, getMyRequest,seePending, getPending, answerRequest, getNotifications
}