const mongoose = require("mongoose");
const UserSchema = require("../models/ModelMember");
const StatusSchema = require("../models/ModelClocking");
const AbsentSchema = require("../models/ModelAbsence");
const OptSchema = require("../models/ModelApplicationSetting");
const LeaveSchema = require("../models/ModelLeave");
const LeaveRequestTest = require("../models/ModelLeaveRequest");
const Log = require("../models/ModelLoginHistoric");
const nodemailer = require("nodemailer");
const extra_fs = require("fs-extra");
const crypto = require("crypto");
const moment = require("moment");
const fs = require("fs");

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