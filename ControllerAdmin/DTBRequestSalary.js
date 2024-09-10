const UserSchema = require("../models/ModelMember");

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

const requestSalaryAdvance = async (req, res) =>{
    let {occupation_a, idUser, mailing} = req.session
    if (occupation_a == "Admin") {
        var dataUser = await UserSchema.findOne({ _id: idUser }).select("profil usuel myNotifications");
        var role = idUser == "645a417e9d34ed8965caea9e" ? "Gerant" : "Admin";
        
        res.render("PageAdministration/RequestSalaryAvance.html", {
            username: mailing,
            notif: dataUser.myNotifications,
            dataUser: dataUser,
            role: role
        });
        
    }else{
        res.redirect("/")
    }
}

module.exports = {
    getListSalaryAdvance, requestSalaryAdvance
}