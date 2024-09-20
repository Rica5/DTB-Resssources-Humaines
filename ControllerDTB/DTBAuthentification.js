const UserSchema = require("../models/ModelMember");
const StatusSchema = require("../models/ModelClocking");
const AbsentSchema = require("../models/ModelAbsence");
const LeaveSchema = require("../models/ModelLeave");
const OptSchema = require("../models/ModelApplicationSetting");
const Log = require("../models/ModelLoginHistoric");
const crypto = require("crypto");
const moment = require("moment");
const ControllerDTBLeaveListAndCRUD = require("../ControllerAdmin/DTBLeaveListAndCRUD");
const globalVariable = require("./GlobaleVariable")
const ExcelFile = require("sheetjs-style");
const Methods = require("../ControllerDTB/GlobalMethods")
const globaleVariable = require("../ControllerDTB/GlobaleVariable");
const mongoose = require('mongoose');


//Default page according to session set 
const defaultPage = async (req, res) => {
  var session = req.session;
  if (session.occupation_u == "User") {
    res.redirect("/mySpace");
  } else if (session.occupation_a == "Admin") {
    res.redirect("/home");
  } else if (session.occupation_tl == "Surveillant") {
    res.redirect("/managementtl");
  } else if (session.occupation_op == "Opération") {
    res.redirect("/conge");
  } else {
    await daily_restart(req);
    await monthly_restart();
    // get back url
    const { back_url } = req.query;
    res.render("LoginPage/Login.html", { erreur: "", back_url });
  }
}
//Login authentification
const authSolumada = async (req, res) => {
  await login(req.body.username, req.body.pwd, req.session, res, req);
}
//Set user Ip according to apify Ip posted
const setIp = async (req, res) => {
  await set_ip(req.body.ip, req.body.device, req.session, res);
}
//When user switch interface 
const switchInterface = async (req, res) => {
  await switch_interface(req.session, req.body.mail, req.body.opt, res);
}
// Acces denied to an inauthorized IP
const notAuthorized = async (req, res) => {
  res.render("LoginPage/Interdit.html");
}
//Page change password
const changePassword = async (req, res) => {
  res.render("LoginPage/MotDePasse.html", { first: "" });
}
// Verify if email exist
const checkEmail = async (req, res) => {
  var session = req.session;
  var email = req.body.email;
  var user = await UserSchema.findOne({
    username: email,
    occupation: "User",
  });
  if (user) {
    session.mailconfirm = email;
    session.m_code_confirm = user.m_code;
    session.code = randomCode();
    Methods.sendEmail(
      session.mailconfirm,
      "Code de verification",
      htmlVerification(session.code)
    );
    res.send("done");
  } else {
    res.send("error");
  }
}
//check Code if it matched 
const checkCode = async (req, res) => {
  var session = req.session;
  if (session.code == req.body.code) {
    res.send("match");
  } else {
    res.send("error");
  }
}
//Changing password
const changePass = async (req, res) => {
  var session = req.session;
  var newpass = req.body.pass;
  let hash = crypto.createHash("md5").update(newpass).digest("hex");
  if (
    await UserSchema.findOne({
      username: session.mailconfirm,
      password: hash,
    })
  ) {
    res.send("error");
  } else {
    await UserSchema.findOneAndUpdate(
      { username: session.mailconfirm, m_code: session.m_code_confirm },
      { password: hash, change: "y" }
    );
    session.mailconfirm = null;
    session.code = null;
    res.send("Ok");
  }
}
//logout 
const logOut = async (req, res) => {
  req.session = null;
  res.redirect("/");
}

// Methode used on Login Page
//Check User and render page
async function login(username, pwd, session, res, req) {
  try {
    // back_url 
    const { back_url } = req.query;
    console.log(req.query)
    let hash = crypto.createHash("md5").update(pwd.trim()).digest("hex");
    var logger = await UserSchema.findOne({
      username: username.trim(),
      password: hash,
      status: "Actif",
    });
    if (logger) {
      session.mailing = logger.username;
      session.idUser = logger._id;
      //Tete
      if (logger.change != "n") {
        if (logger.occupation == "User") {
          var new_log = {
            m_code: logger.m_code,
            datetime: moment()
              .add(3, "hours")
              .format("DD/MM/YYYY HH:mm:ss"),
            ip_adress: session.access.ip,
            device: session.access.device,
            intrusion: false,
          };
          await Log(new_log).save();
          session.occupation_u = "User";
          session.m_code = logger.m_code;
          globalVariable.data_desired[logger.m_code] = {};
          session.entry = logger.entry;
          session.shift = logger.shift;
          session.name = logger.first_name + " " + logger.last_name;
          session.num_agent = logger.num_agent;
          session.forget = "n";
          session.time = "n";
          var forget_value = await StatusSchema.findOne(
            {
              m_code: session.m_code,
              time_end: "",
              date: {
                $ne: moment().add(3, "hours").format("YYYY-MM-DD"),
              },
            },
            { late_entry: 0 }
          );
          var startcheck = moment().add(3, "hours").format("HH:mm");
          await UserSchema.findOneAndUpdate(
            { m_code: session.m_code, act_stat: "LEFTING", late: "y" },
            { late: "n", count: 0 }
          );
          if (forget_value && check_day("05:55", startcheck) >= 0) {
            session.forget = JSON.stringify(forget_value);
            var exclude = [
              "MANAGER",
              "RH",
              "English",
              "DEVELOPPEUR",
              "COURSIER",
              "GERANT",
            ];
            await UserSchema.findOneAndUpdate(
              { m_code: session.m_code, project: { $nin: exclude } },
              {
                act_stat: "LEFTING",
                act_loc: "Not defined",
                late: "n",
                count: 0,
                entry: "",
              }
            );
            await UserSchema.findOneAndUpdate(
              { m_code: session.m_code, project: { $in: exclude } },
              {
                act_stat: "LEFTING",
                act_loc: "Not defined",
                late: "n",  
                count: 0,
              }
            );
            session.time = "n";
            logger.late = "n";
          }
          session.reason = "N/A";
          res.redirect(back_url || "/mySpace");
        } else if (logger.occupation == "Admin") {
          session.occupation_a = logger.occupation;
          globalVariable.filtrage = {};
          res.redirect("/home");
        } else if (logger.occupation == "Opération") {
          session.occupation_op = logger.occupation;
          res.redirect("/conge");
        } else {
          session.occupation_tl = "Surveillant";
          res.redirect("/managementtl");
        }
      } else {
        session.mailconfirm = logger.username;
        session.m_code_confirm = logger.m_code;
        res.render("LoginPage/MotDePasse.html", {
          first: "y",
        });
      }
      //Pied
    } else {
      res.render("LoginPage/Login.html", {
        erreur: "Email ou mot de passe incorrect",
      });
    }
  } catch (error) {
    console.log(error);
    res.render("LoginPage/Login.html", {
      erreur: "Problème sur votre login, veuillez reessayez",
    });
  }
}
//Function set ip
async function set_ip(ip_get, device, session, res) {
  var access = {
    ip: ip_get,
    device: device,
  };
  session.access = access;
  res.send("Ok");
}
// Switch Interface 
async function switch_interface(session, mail, opt, res) {
  var theUser = await UserSchema.findOne({
    username: mail,
    occupation: "User",
  })

  let userCheck = (await UserSchema.findOne({
    username: mail,
    occupation: { $in: ["Opération", "Surveillant"]},
  }));

  if (
    userCheck
    // (await UserSchema.findOne({
    //   username: mail,
    //   occupation: "Opération",
    // })) ||
    // (await UserSchema.findOne({
    //   username: mail,
    //   occupation: "Surveillant",
    // }))
  ) {
    session.idUser = userCheck._id;
    if (opt == "c") {
      session.occupation_u = null;
      session.occupation_tl = null;
      session.occupation_op = "Opération";
      res.redirect("/conge");
    } else if (opt == "p") {
      session.occupation_u = "User";
      session.occupation_op = null;
      session.occupation_tl = null;
      session.m_code = theUser.m_code;
      res.redirect("/employee");
    } else if (opt == "s") {
      session.occupation_tl = "Surveillant";
      session.occupation_op = null;
      session.occupation_u = null;
      globalVariable.data_desired[session.m_code] = {};
      res.redirect("/managementtl");
    }
  } else {
    let userAdmin = await UserSchema.findOne({ username: mail, occupation: "Admin" });
    if (userAdmin) {
      session.idUser = userAdmin._id;
      if (opt == "a") {
        session.occupation_u = null;
        session.occupation_a = "Admin";
        res.redirect("/home");
      } else {
        session.idUser = theUser._id;
        session.occupation_u = "User";
        session.occupation_a = null;
        session.m_code = theUser.m_code;
        res.redirect("/employee");
      }
    } else {
      res.redirect("/employee");
    }
  }
}

//HTML verification code
function htmlVerification(code) {
  return (
    "<center><h1>VOTRE CODE D'AUTHENTIFICATION</h1>" +
    "<h3 style='width:250px;font-size:50px;padding:8px;background-color: rgba(87,184,70, 0.8); color:white'>" +
    code +
    "<h3></center>"
  );
}
//Function Random code for verification
function randomCode() {
  var code = "";
  let v = "012345678";
  for (let i = 0; i < 6; i++) {
    // 6 characters
    let char = v.charAt(Math.random() * v.length - 1);
    code += char;
  }
  return code;
}
//Daily restart function
async function daily_restart(req) {
  var now = moment().format("dddd");
  var opt_daily = await OptSchema.findOne({
    _id: "636247a2c1f6301f15470344",
  });
  if (now != opt_daily.date_change) {
    await ControllerDTBLeaveListAndCRUD.checkleave(req);
    await ControllerDTBLeaveListAndCRUD.conge_define(req);
    await ControllerDTBLeaveListAndCRUD.leave_permission();
    await contract_expiration(req);
    globalVariable.maj_done = false;
    await OptSchema.findOneAndUpdate(
      { _id: "636247a2c1f6301f15470344" },
      { date_change: now }
    );
  } else {
    console.log("Already done");
  }
}
//Monthly restart function
async function monthly_restart() {
  var now = moment().format("MMMM");
  var now_year = moment().format("YYYY");
  var opt_daily = await OptSchema.findOne({
    _id: "636247a2c1f6301f15470344",
  });
  if (now != opt_daily.month_change) {
    await ControllerDTBLeaveListAndCRUD.addin_leave();
    await OptSchema.findOneAndUpdate(
      { _id: "636247a2c1f6301f15470344" },
      { month_change: now, email_sent: [] }
    );
    //await send_email_attachement();
  } else {
    console.log("Leave already added");
  }
  if (opt_daily.year == now_year) {
  }
}
//Contract expiration
async function contract_expiration(req) {
  var contract = await UserSchema.find({ contrat: { $ne: "CDI" } });
  for (c = 0; c < contract.length; c++) {
    var remain = Methods.date_diff(
      moment().add(3, "hours").format("YYYY-MM-DD"),
      contract[c].date_fin
    );
    if (remain <= 30 && remain > 0) {
      var temp_notif = {
        title: "Contrat expiré de " + contract[c].m_code,
        content: "Le contrat de " +
          contract[c].m_code +
          " se termine dans " +
          remain +
          "jours",
        datetime: moment().format("DD/MM/YYYY hh:mm:ss"),

      }
      var concerned = ["Admin"];
      await Methods.setGlobalAdminNotifications(temp_notif, concerned, true, req);

    } else if (remain == 0) {
      var temp_notif = {
        title: "Contrat terminée de " + contract[c].m_code,
        content: "Le contrat de " + contract[c].m_code + " se termine aujourd'hui",
        datetime: moment().format("DD/MM/YYYY hh:mm:ss"),
      }
      var concerned = ["Admin"];
      await Methods.setGlobalAdminNotifications(temp_notif, concerned, true, req);
    }
  }
}
async function send_email_attachement() {
  var newsheet = ExcelFile.utils.book_new();
  newsheet.Props = {
    Title: "Timesheets",
    Subject: "Logged Time",
    Author: "Solumada",
  };
  newsheet.SheetNames.push("TOUS LES UTILISATEURS");
  var all_employes = [];
  var date_to_get = moment().add(-1, "months").format("YYYY-MM");
  var datatowrite = await StatusSchema.find({
    $or: [{ m_code: "M-FEL" }, { m_code: "M-NAT" }, { m_code: "Charles" }],
    date: { $regex: date_to_get, $options: "i" },
  });
  var dataabsence = await AbsentSchema.find({
    $or: [{ m_code: "M-FEL" }, { m_code: "M-NAT" }, { m_code: "Charles" }],
    date: { $regex: date_to_get, $options: "i" },
  });
  var dataleave = await LeaveSchema.find({
    $or: [{ m_code: "M-FEL" }, { m_code: "M-NAT" }, { m_code: "Charles" }],
    $or: [
      { date_start: { $regex: date_to_get, $options: "i" } },
      { date_end: { $regex: date_to_get, $options: "i" } },
    ],
  });
  for (i = 0; i < datatowrite.length; i++) {
    if (all_employes.includes(datatowrite[i].m_code)) {
    } else {
      all_employes.push(datatowrite[i].m_code);
    }
    all_employes = all_employes.sort();
  }
  globaleVariable.all_datas.push(["RAPPORT GLOBALE", "", "", "", "", ""]);
  globaleVariable.all_datas.push(["", "", "", "", "", ""]);
  globaleVariable.all_datas.push([
    "Nom & Prenom",
    "M-code",
    "Totale heure travail",
    "Totale Retard",
    "Totale absence",
    "Totale congé",
  ]);
  for (e = 0; e < all_employes.length; e++) {
    var name_user = await StatusSchema.findOne({ m_code: all_employes[e] });
    globaleVariable.data.push([
      "FEUILLE DE => " + name_user.nom,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    globaleVariable.data.push(["", "", "", "", "", "", "", "", "", ""]);
    globaleVariable.data.push([
      "M-code",
      "Numéro Agent",
      "Date",
      "Locaux",
      "Entrée",
      "Début",
      "Fin",
      "Retard",
      "Heure calculer",
      "Heure choisi",
    ]);
    Methods.generate_excel(datatowrite, dataabsence, dataleave, all_employes[e]);
    if (newsheet.SheetNames.includes(all_employes[e])) {
    } else {
      newsheet.SheetNames.push(all_employes[e]);
    }
    newsheet.Sheets[all_employes[e]] = ws;
    globaleVariable.hours = 0;
    globaleVariable.minutes = 0;
    globaleVariable.data = [];
  }
  Methods.global_Report(globaleVariable.all_datas);
  newsheet.Sheets["TOUS LES UTILISATEURS"] = ws;
  globaleVariable.all_datas = [];
  var filename = "";
  if (newsheet.SheetNames.length != 0) {
    filename = "Pointage M-FEL, M-NAT, Charles.xlsx";
    ExcelFile.writeFile(newsheet, filename);
  }
  var mailOptions = {
    from: "Solumada application",
    to: "ricardoramandimbisoa@gmail.com",
    subject: "Fichier Excel de pointage pour M-FEL, M-NAT, et Charles",
    html:
      "Bonjour a vous,<br><br>" +
      "Voici le fichier excel contenant les pointages des employés avec le M-CODE : <br>" +
      " - M-FEL <br>" +
      " - M-NAT <br>" +
      "- Charles <br><br>" +
      " Cordialement",
    attachments: [
      {
        filename: filename,
        path: filename,
      },
    ],
  };

  globaleVariable.transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}
//Method to check if an user log in a day or night
function check_day(startTime, endTime) {
  startTime = moment(startTime, "HH:mm:ss a");
  endTime = moment(endTime, "HH:mm:ss a");
  var duration = moment.duration(endTime.diff(startTime));
  return duration.asHours();
}
// Update the request field 
async function setIdLeaveExist() {
  var allLeave = await LeaveSchema.find({});
  for (let index = 0; index < allLeave.length; index++) {
    const element = allLeave[index];
    var id = new mongoose.Types.ObjectId()
    console.log(id.toHexString())
    await LeaveSchema.findOneAndUpdate({ _id: element._id }, { $set: { "request": id.toHexString() } })
  }
}

async function copyCollection() {
  try {
    // Fetch all documents from the source collection
    const documents = await ActualMigration.find().lean();
    // Insert documents into the destination collection
    await StatusSchema.insertMany(documents);
    console.log('Data copied successfully.');
  } catch (error) {
    console.error('Error copying data:', error);
  }
}

async function change_admin_profil() {
  var admins = await UserSchema.find({ occupation: { $ne: "User" } });
  for (let index = 0; index < admins.length; index++) {
    const element = admins[index];
    var theUser = await UserSchema.findOne({ username: element.username })
    await UserSchema.updateMany({ username: element.username, occupation: { $ne: "User" } }, { profil: theUser.profil })
  }
  console.log("Done")
}
async function resetAll() {
  await UserSchema.updateMany({}, { act_loc: "Not defined", act_stat: "LEFTING", myNotifications: [] })
  console.log("Rese all done")
}

//change_admin_profil()

//Method that is used on this controller and in other controller
//send email verification code

module.exports = {
  authSolumada, setIp, switchInterface, changePass, checkCode, checkEmail, changePassword, notAuthorized, defaultPage,
  logOut
}