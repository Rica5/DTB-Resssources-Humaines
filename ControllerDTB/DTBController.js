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
                    datetime:moment().add(3, "hours").format("DD/MM/YYYY HH:mm:ss"),
                    priority:req.body.priority,
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
//See and act with request 
const seeRequest = async (req,res) => {
    var session = req.session;
    if ( session.occupation_a == "Admin"){
        var myRequest = await LeaveRequestTest.find({m_code:req.body.code,status:{$ne:"done"}}).sort({"date_start":1});
        res.render("PageAdministration/DemandeConge.html",{myRequest:myRequest});
    }
}

module.exports = {
    getHomePage, getLeaveRequest, makeLeaveRequest, getMyRequest, seeRequest
}