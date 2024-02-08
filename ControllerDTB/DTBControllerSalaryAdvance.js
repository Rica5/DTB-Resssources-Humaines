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
const getSalaryAdvance = async (req,res) => {
    var session = req.session;
   if ( session.occupation_u == "User"){
        res.render("PageEmployee/AvanceSalaire.html",{codeUser:session.m_code});
   }
   else {
    res.send("Bad authentification please log in");
   }
}

module.exports = {
    getSalaryAdvance
}