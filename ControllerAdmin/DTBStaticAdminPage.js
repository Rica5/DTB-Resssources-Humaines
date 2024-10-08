
const UserSchema = require("../models/ModelMember");
const StatusSchema = require("../models/ModelClocking");
const AbsentSchema = require("../models/ModelAbsence");
const moment = require("moment");

// Dashboard

const getDashboardPage = async(req,res) => {
    var session = req.session;
    if (session.occupation_a == "Admin") {
          var nbr_employe = await UserSchema.find({
            m_code: { $ne: "N/A" },
            status: "Actif",
          }).select("m_code profil");
          var nbr_actif = await UserSchema.find({
            act_stat: { $ne: "VACATION" },
            m_code: { $ne: "N/A" },
            status: "Actif",
          });
          var nbr_leave = await UserSchema.find({
            act_stat: "VACATION",
            status: "Actif",
          });
          var nbr_retard = await StatusSchema.find(
            {
              date: moment().format("YYYY-MM-DD"),
              late_entry: { $ne: "N/A" },
            },
            { late_entry: 0 }
          );
          var cdi_contract = await UserSchema.find({
            act_stat: { $ne: "VACATION" },
            m_code: { $ne: "N/A" },
            occupation:"User",
            status: "Actif",
            contrat:"CDI"
          });
          var cdd_contract = await UserSchema.find({
            m_code: { $ne: "N/A" },
            occupation:"User",
            status: "Actif",
            contrat:"CDD"
          });
          var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
          
           var role = session.idUser == "645a417e9d34ed8965caea9e" ? "Gerant" : "Admin";
          res.render("PageAdministration/Dashboard.html", {
            notif: dataUser.myNotifications,
            username: session.mailing,
            nbr_emp: nbr_employe,
            nbr_act: nbr_actif.length,
            nbr_leave: nbr_leave,
            nbr_retard: nbr_retard,
            cdi:cdi_contract.length,
            cdd:cdd_contract.length,
            dataUser:dataUser,
            role:role
          });
    } else {
      res.redirect("/");
    }
}
//Status user
const getPageStatusUser = async(req,res) =>{
    var session = req.session;
  if (session.occupation_a == "Admin") {
    session.filtrage = null;
        var alluser = await UserSchema.find({
          m_code: { $ne: "N/A" },
          status: "Actif",
        });
        var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
         var role = session.idUser == "645a417e9d34ed8965caea9e" ? "Gerant" : "Admin";
        res.render("PageAdministration/Status.html", {
          users: alluser,
          username: session.mailing,
          notif: dataUser.myNotifications,
          role:role,
          dataUser:dataUser
        });
  } else {
    res.redirect("/");
  }
}
// Absence list
const getPageAbsenceList = async(req,res) => {
    var session = req.session;
  if (session.occupation_a == "Admin") {
    var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
        var role = session.idUser == "645a417e9d34ed8965caea9e" ? "Gerant" : "Admin"
        res.render("PageAdministration/ListeAbsence.html", {
          notif: dataUser.myNotifications,
          username: session.mailing,
          role:role,
          dataUser:dataUser
        });
  } else {
    res.redirect("/");
  }
}
// Get all absence list
const getAbsenceList = async(req,res) => {
    var session = req.session;
    if (
      session.occupation_a == "Admin" ||
      session.occupation_tl == "Surveillant"
    ) {
          var absent = await AbsentSchema.find({});
          res.send(absent);
    } else {
      res.redirect("/");
    }
}

const getPageFinance = async(req,res) => {
  var session = req.session;
  if (session.occupation_f == "Finance") {
        var alluser = await UserSchema.find({
          m_code: { $ne: "N/A" },
          status: "Actif",
        });
        var show_another = "n";
        var occupations = await UserSchema.findOne({
          username: session.mailing,
          occupation: "Finance",
        });
        if (occupations) {
          show_another = occupations.occupation;
        }
        var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
        var role = "Finance";
        res.render("PageFinance/DemandeAvance.html", {
          role: role, 
          dataUser:dataUser,
          username: session.mailing,
        });
  } else {
    res.redirect("/");
  }
}

const getListAvanceFinance = async(req,res) => {
  var session = req.session;
  if (session.occupation_f == "Finance") {
        var alluser = await UserSchema.find({
          m_code: { $ne: "N/A" },
          status: "Actif",
        });
        var show_another = "n";
        var occupations = await UserSchema.findOne({
          username: session.mailing,
          occupation: "Finance",
        });
        if (occupations) {
          show_another = occupations.occupation;
        }
        var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
        var role = "Finance";
        res.render("PageFinance/ListAvance.html", {
          role: role, 
          dataUser:dataUser,
          username: session.mailing,
        });
  } else {
    res.redirect("/");
  }
}
//Get page status tl
const getPageTl = async(req,res) => {
  var session = req.session;
  if (session.occupation_tl == "Surveillant") {
        var alluser = await UserSchema.find({
          m_code: { $ne: "N/A" },
          status: "Actif",
        });
        var show_another = "n";
        var occupations = await UserSchema.findOne({
          username: session.mailing,
          occupation: "Opération",
        });
        if (occupations) {
          show_another = occupations.occupation;
        }
        var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
        var role = "Surveillant";
        res.render("PageTL/StatusTL.html", {
          users: alluser,
          notif: dataUser.myNotifications,
          username: session.mailing,
          show_another: show_another,
          role:role,
          dataUser:dataUser
        });
  } else {
    res.redirect("/");
  }
}
// Get absence TL
const pageAbsenceTL = async(req,res) => {
  var session = req.session;
  if (session.occupation_tl == "Surveillant") {
    var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
        var occupations = await UserSchema.findOne({
          username: session.mailing,
          occupation: "Opération",
        });
        var show_another = "n";
        if (occupations) {
          show_another = occupations.occupation;
        }
        var role = "Surveillant"
        res.render("PageTL/ListeAbsenceTL.html", {
          notif: dataUser.myNotifications,
          username: session.mailing,
          show_another: show_another,
          role:role,
          dataUser:dataUser
        });
  } else {
    res.redirect("/");
  }
}

module.exports = {
  getDashboardPage,getPageStatusUser,getPageAbsenceList,getAbsenceList,getPageTl,pageAbsenceTL,getPageFinance,getListAvanceFinance
}