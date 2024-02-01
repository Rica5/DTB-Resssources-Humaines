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
        res.render("PageEmployee/MySpace.html",{user:user});
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
    res.render("PageEmployee/LeaveRequest.html",{user:user});
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
        res.render("PageTL/DemandeConge.html",{users:user});
    }
    else if (session.occupation_op == "Opération"){
        var user = await UserSchema.find({status:"Actif",occupation:"User"}).select('m_code project');
        res.render("PageOperation/DemandeConge.html",{users:user});
    }
    else if (session.occupation_a == "Admin") {
        var user = await UserSchema.find({status:"Actif",occupation:"User"}).select('m_code project');
        res.render("PageAdministration/DemandeConge.html",{users:user});
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
        if (session.idUser == "645a417e9d34ed8965caea9e"){
            var allRequest = await LeaveRequestTest.find({status:"progress", $expr: { $eq: [{ $size: '$validation' }, 3] }}).populate({path:"validation.user",select:'usuel'});
            res.json(allRequest);
        }
        else {
            var allRequest = await LeaveRequestTest.find({status:"progress", $expr: { $eq: [{ $size: '$validation' }, 2] }}).populate({path:"validation.user",select:'usuel'});
            res.json(allRequest);
        }
       
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
       await LeaveRequestTest.findOneAndUpdate({_id:id},{$push : {validation:approbator},comment:comment,status:status})
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
        await LeaveRequestTest.findOneAndUpdate({_id:id},{$push : {validation:approbator},comment:comment,status:status})
         res.json("Ok");
    }
    else if (session.occupation_a == "Admin") {
        var status = "";
        var id = req.body.id;
        var response = req.body.response;
        var comment = req.body.reason;
        if (session.idUser == "645a417e9d34ed8965caea9e"){
            status = response == "true" ? "approved" : "declined";
        }
        else {
             status = response == "true" ? "progress" : "declined";
        }
        var approbator = {
            user:session.idUser,
            approbation :response
            }
            await LeaveRequestTest.findOneAndUpdate({_id:id},{$push : {validation:approbator},comment:comment,status:status})
            res.json("Ok");
       
    }
    else {
        res.send("Bad auth, please log in");
    }
}

module.exports = {
    getHomePage, getLeaveRequest, makeLeaveRequest, getMyRequest,seePending, getPending, answerRequest
}