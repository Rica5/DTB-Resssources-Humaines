const UserSchema = require("../models/ModelMember");
const StatusSchema = require("../models/ModelClocking");

//The logic
const getLateValidationAdmin = async(req,res) => {
    var session = req.session;
  if (session.occupation_a == "Admin") {
    session.filtrage = null;
    var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
         var role = session.idUser == "645a417e9d34ed8965caea9e" ? "Gerant" : "Admin"
        res.render("PageAdministration/ValidationRetards.html", {
          notif: dataUser.myNotifications,
          username: session.mailing,
          role:role,
          dataUser:dataUser
        });
  } else {
    res.redirect("/");
  }
}
// Get late validation page
const getlateValidationTL = async(req,res) => {
  var session = req.session;
  if (session.occupation_tl == "Surveillant") {
    session.filtrage = null;
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
        res.render("PageTL/ValidationRetardsTL.html", {
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
//Get all delays to be validated
const allDelays = async(req,res) => {
  var session = req.session;
  if (
    session.occupation_a == "Admin" ||
    session.occupation_tl == "Surveillant"
  ) {
    session.filtrage = null;
        var latelist = await StatusSchema.find({ late_entry: { $ne: "N/A" } });
        res.send(latelist);
  } else {
    res.redirect("/");
  }
}
//Confirm delay 
const confirmDelay = async(req,res) => {
  var session = req.session;
  if (
    session.occupation_a == "Admin" ||
    session.occupation_tl == "Surveillant"
  ) {
    var id = req.body.id;
        var last = await StatusSchema.findOne({ _id: id });
        last = last.late_entry + " Confirmer";
        await StatusSchema.findOneAndUpdate({ _id: id }, { late_entry: last });
        res.send("Demande traités avec succés");
  } else {
    res.redirect("/");
  }
}
const confirmMultiple = async(req,res) => {
  var session = req.session;
  if (
    session.occupation_a == "Admin" ||
    session.occupation_tl == "Surveillant"
  ) {
    var items = req.body.items.split(",");
        for (it = 0; it < items.length; it++) {
          var last = await StatusSchema.findOne({ _id: items[it] });
          last = last.late_entry + " Confirmer";
          await StatusSchema.findOneAndUpdate(
            { _id: items[it] },
            { late_entry: last }
          );
        }
        //await LateSchema.findOneAndDelete({ _id: id });
        res.send("Demande traités avec succés");
  } else {
    res.send("retour");
  }
}
// Mark as exception a delay
const exceptionDelay = async(req,res) => {
  var session = req.session;
  if (
    session.occupation_a == "Admin" ||
    session.occupation_tl == "Surveillant"
  ) {
    var id = req.body.id;
        var last = await StatusSchema.findOne({ _id: id });
        var entry = last.entry;
        last = last.late_entry + " Exception";
        await StatusSchema.findOneAndUpdate(
          { _id: id },
          { late_entry: last, time_start: entry }
        );
        res.send("Demande traités avec succés");
  } else {
    res.redirect("/");
  }
}
const exceptionMultiple = async(req,res) => {
  var session = req.session;
  if (
    session.occupation_a == "Admin" ||
    session.occupation_tl == "Surveillant"
  ) {
    var items = req.body.items.split(",");
        for (it = 0; it < items.length; it++) {
          var lasts = await StatusSchema.findOne({ _id: items[it] });
          var last = lasts.late_entry + " Exception";
          await StatusSchema.findOneAndUpdate(
            { _id: items[it] },
            { late_entry: last, time_start: lasts.entry }
          );
        }
        //await LateSchema.findOneAndDelete({ _id: id });
        res.send("Demande traités avec succés");
  } else {
    res.send("retour");
  }
}
//Abort delay
const abortDelay = async(req,res) => {
  var session = req.session;
  if (
    session.occupation_a == "Admin" ||
    session.occupation_tl == "Surveillant"
  ) {
    var id = req.body.id;
        var last = await StatusSchema.findOne({ _id: id });
        last = last.late_entry + " Annuler";
        await StatusSchema.findOneAndUpdate({ _id: id }, { late_entry: last });
        res.send("Demande traités avec succés");
  } else {
    res.send("retour");
  }
}
const abortMultiple = async(req,res) => {
  var session = req.session;
  if (
    session.occupation_a == "Admin" ||
    session.occupation_tl == "Surveillant"
  ) {
    var items = req.body.items.split(",");
        for (it = 0; it < items.length; it++) {
          var last = await StatusSchema.findOne({ _id: items[it] });
          last = last.late_entry + " Annuler";
          await StatusSchema.findOneAndUpdate(
            { _id: items[it] },
            { late_entry: last }
          );
        }
        res.send("Demande traités avec succés");
  } else {
    res.send("retour");
  }
}
module.exports = {
  getLateValidationAdmin,getlateValidationTL,allDelays,confirmDelay,confirmMultiple,exceptionDelay,exceptionMultiple,abortDelay,abortMultiple
}