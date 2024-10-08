const UserSchema = require("../models/ModelMember");
const StatusSchema = require("../models/ModelClocking");
const moment = require("moment");

const getListSalaryAdvance = async (req, res) => {
    let {occupation_a, idUser, mailing} = req.session
    
    if (occupation_a == "Admin") {
        
        var dataUser = await UserSchema.findOne({ _id: idUser }).select("profil usuel myNotifications");
        var role = idUser == "645a417e9d34ed8965caea9e" ? "Gerant" : "Admin";
        
        res.render("PageAdministration/AvanceSalary.html", {
            username: mailing,
            notif: dataUser.myNotifications,
            dataUser: dataUser,
            role: role
        });
    } else {
        res.redirect("/");
    }

}

const getAccesUrgentSalary = async (req, res) => {
    let {occupation_a, idUser, mailing} = req.session
    
    if (occupation_a == "Admin") {
        
        var dataUser = await UserSchema.findOne({ _id: idUser }).select("profil usuel myNotifications");
        var role = idUser == "645a417e9d34ed8965caea9e" ? "Gerant" : "Admin";
        var allUsers = await UserSchema.find({
            m_code: {
                $ne: 'N/A'
            }
        });
        
        res.render("PageAdministration/SalaryUrgence.html", {
            username: mailing,
            notif: dataUser.myNotifications,
            dataUser: dataUser,
            role: role,
            users: allUsers
        });
    } else {
        res.redirect("/");
    }
}

const requestSalaryAdvance = async (req, res) =>{
    let {occupation_a, idUser, mailing} = req.session
    if (occupation_a == "Admin") {
        var dataUser = await UserSchema.findOne({ _id: idUser }).select("profil usuel myNotifications");
        
        var role = idUser == "645a417e9d34ed8965caea9e" ? "Gerant" : "Admin";
        // var getNotif = await getNotif()
                
        res.render("PageAdministration/RequestSalaryAvance.html", {
            username: mailing,
            notif: dataUser.myNotifications,
            dataUser: dataUser,
            role: role,
            idUser: idUser,
        });
        
    }else{
        res.redirect("/")
    }
}

module.exports = {
    getListSalaryAdvance, requestSalaryAdvance,
    getAccesUrgentSalary
}