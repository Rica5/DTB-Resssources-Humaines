const express = require("express");
const routeExp = express.Router();
const mongoose = require("mongoose");
const UserSchema = require("../models/User");
const StatusSchema = require("../models/status");
const AbsentSchema = require("../models/absent");
const OptSchema = require("../models/option");
const LeaveSchema = require("../models/leave");
const Log = require("../models/login_histo");
const nodemailer = require("nodemailer");
const extra_fs = require("fs-extra");
const crypto = require("crypto");
const moment = require("moment");
const { PDFNet } = require("@pdftron/pdfnet-node");
const ExcelFile = require("sheetjs-style");
const fs = require("fs");
const Notif = require("../models/notification");

//Variables globales
var date_data = [];
var data = [];
var all_datas = [];
var num_file = 1;
var hours = 0;
var minutes = 0;

var data_desired = {};
var monthly_leave = [];
var maternity = [];
var filtrage = {};
var maj_done = false;
var deduire = ["Mise a Pied", "Absent", "Congé sans solde"];
var ws_leave;
var ws_left;
var ws_individual;
var datestart_leave;
var dateend_leave;
var mailing_all =
  "naval.solumada@gmail.com,claudia.solumada@gmail.com,m.tsi.tsiory.optimumsolutions@gmail.com,mdg.tafita@gmail.com,mdg.patricia@gmail.com,natacha.solumada@gmail.com,rojovola@solumada.com,m.saf.safidy.optimumsolutions@gmail.com,mdg.ovamampianina@gmail.com,mdg.sehenoemma@gmail.com,m.toe.tojoeric.optimumsolutions@gmail.com";
var mailing_spec = "naval.solumada@gmail.com,claudia.solumada@gmail.com";

//Mailing
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "SolumadaApplication@gmail.com",
    pass: "goidhbxdisdsgowu",
  },
});
async function ProjectFromTools() {
  const firstConnection = mongoose.createConnection(
    "mongodb+srv://solumada:solumada@cluster0.xdzjimf.mongodb.net/?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );
  const agent = mongoose.Schema({
    name: String,
    usualName: String,
    mcode: String,
    number: String,
    shift: String,
    project: Array,
    site: String,
    quartier: String,
    tel: String,
    // level: String
  });
  const ProjectModel = firstConnection.model("Agent", agent);

  var FromTools = await ProjectModel.find({});
  return FromTools;
}
function sliceProject(project) {
  var ProjectString = "";
  for (i = 0; i < project.length; i++) {
    if (project[i] == "Team leader") {
      project[i] = "TL";
    }
    ProjectString += project[i];
    if (i + 1 < project.length) {
      ProjectString += " / ";
    }
  }
  return ProjectString;
}
function shift_rename(shift, project) {
  if (shift == "WE") {
    return "SHIFT WEEKEND";
  } else if (shift == "" && project == "TL") {
    return "TL";
  } else if (shift == "" && project == "DEVELOPPEUR") {
    return "DEV";
  } else if (shift == "PleinTemps") {
    return "Plein temps";
  } else {
    return "SHIFT " + shift;
  }
}
async function daily_restart(req) {
  
      var now = moment().format("dddd");
      var opt_daily = await OptSchema.findOne({
        _id: "636247a2c1f6301f15470344",
      });
      if (now != opt_daily.date_change) {
        await Notif.findOneAndUpdate(
          { _id: "64f1e60ae3038813b45c2db1" },
          { notifications: [] }
        );
        await conge_define(req);
        await checkleave();
        await leave_permission();
        await contract_expiration();
        maj_done = false;
        await OptSchema.findOneAndUpdate(
          { _id: "636247a2c1f6301f15470344" },
          { date_change: now }
        );
      } else {
        console.log("Already done");
      }
}
async function monthly_restart() {
      var now = moment().format("MMMM");
      var now_year = moment().format("YYYY");
      var opt_daily = await OptSchema.findOne({
        _id: "636247a2c1f6301f15470344",
      });
      if (now != opt_daily.month_change) {
        await addin_leave();
        //await send_email_attachement();
        await OptSchema.findOneAndUpdate(
          { _id: "636247a2c1f6301f15470344" },
          { month_change: now, email_sent: [] }
        );
      } else {
        console.log("Leave already added");
      }
      if (opt_daily.year == now_year) {
      }
}
async function switch_Solde() {
    var user = await UserSchema.find({status:"Actif"});
    for (let index = 0; index < user.length; index++) {
      const element = user[index];
      if (element.shift == "SHIFT WEEKEND"){
        await UserSchema.findOneAndUpdate({m_code:element.m_code},{remaining_leave:element.leave_taked - 0.75})
      }
      else {
        await UserSchema.findOneAndUpdate({m_code:element.m_code},{remaining_leave:element.leave_taked - 2.5})
      }
      
    }
}
async function arrange_leave_year(){
    var user = await UserSchema.find({status:"Actif",m_code:{$ne:"N/A"}});
    for (let index = 0; index < user.length; index++) {
      const element = user[index];
      console.log(element.m_code)
      var leave_specific = await LeaveSchema.find({
        m_code: element.m_code,
        validation: false,
        date_start: {
          $regex: "2024-"
        },
      }).sort({
        date_start: 1,
      });
      var accs = element.leave_taked;
      var rests = element.remaining_leave;
      for(l=0;l < leave_specific.length;l++){
        const leave = leave_specific[l];
        if (leave.type.includes("Congé Payé")){
          if (l==0){
            await LeaveSchema.findOneAndUpdate({_id:leave._id},{acc:accs,rest:rests});
            accs = accs - leave.duration;
            rests = rests - leave.duration;
          }
          else {
            accs = accs - leave.duration;
            rests = rests - leave.duration;
            await LeaveSchema.findOneAndUpdate({_id:leave._id},{acc:accs,rest:rests});
          }
        }
        else {
            await LeaveSchema.findOneAndUpdate({_id:leave._id},{acc:accs,rest:rests});
        }
      }
      console.log("Done")
      
    }
}
async function arrangeAccumulate(code, leavestart) {
      var user = await UserSchema.findOne({ m_code: code });
      var leave_specific = await LeaveSchema.find({
        m_code: code,
        validation: false,
        date: {
          $regex: moment(leavestart).format("YYYY"),
          $options: "i",
        },
      }).sort({
        date_start: -1,
      });
      var last_rest = user.leave_taked;
      for (l = 0; l < leave_specific.length; l++) {
        if (leave_specific[l].type.includes("Congé Payé")) {
          await LeaveSchema.findOneAndUpdate(
            { _id: leave_specific[l]._id },
            { acc: last_rest }
          );
          last_rest = last_rest + leave_specific[l].duration;
        } else {
          await LeaveSchema.findOneAndUpdate(
            { _id: leave_specific[l]._id },
            { acc: last_rest }
          );
        }
      }
}

async function addin_leave() {
      var all_user = await UserSchema.find({ status: "Actif" });
      for (u = 0; u < all_user.length; u++) {
        if (all_user[u].shift != "SHIFT WEEKEND") {
          await UserSchema.findOneAndUpdate(
            { m_code: all_user[u].m_code },
            { $inc: { leave_taked: 2.5 } }
          );
        } else {
          await UserSchema.findOneAndUpdate(
            { m_code: all_user[u].m_code },
            { $inc: { leave_taked: 0.75 } }
          );
        }
      }
}
// mongoose
//   .connect(
//     "mongodb+srv://Rica:Ryane_1888@cluster0.z3s3n.mongodb.net/Pointage?retryWrites=true&w=majority",
//     {
//       useUnifiedTopology: true,
//       UseNewUrlParser: true,
//     }
//   )
//   .then(async () => {
//     var todays_time = await StatusSchema.find({ date: moment().format("YYYY-MM-DD") });
//     for (t = 0; t < todays_time.length; t++){
//       var log = await Log.findOne({ m_code: todays_time[t].m_code, datetime: { $regex: "30/10/2023", $options: "i" }, intrusion: false });
//       log = log.datetime.split(" ")[1];
//       log = log.split(":");
//       log = log[0]+":"+log[1]
//       await StatusSchema.findOneAndUpdate({ m_code: todays_time[t].m_code, date: moment().format("YYYY-MM-DD") }, { time_start: moment(log, "HH:mm").add(1, "hours").format("HH:mm") })
//     }
//   })
async function contract_expiration() {
      var contract = await UserSchema.find({ contrat: { $ne: "CDI" } });
      for (c = 0; c < contract.length; c++) {
        var remain = date_diff(
          moment().add(3, "hours").format("YYYY-MM-DD"),
          contract[c].date_fin
        );
        if (remain <= 30 && remain > 0) {
          var temp_notif =
            "Le contrat de " +
            contract[c].m_code +
            " se termine dans " +
            remain +
            "jours";
          await Notif.findOneAndUpdate(
            { _id: "64f1e60ae3038813b45c2db1" },
            { $push: { notifications: temp_notif } }
          );
        } else if (remain == 0) {
          var temp_notif =
            "Le contrat de " + contract[c].m_code + " se termine aujourd'hui";
          await Notif.findOneAndUpdate(
            { _id: "64f1e60ae3038813b45c2db1" },
            { $push: { notifications: temp_notif } }
          );
        }
      }
}
//Page route
routeExp.route("/").get(async function (req, res) {
  var session = req.session;
  if (session.occupation_u == "User") {
    res.redirect("/employee");
  } else if (session.occupation_a == "Admin") {
    res.redirect("/home");
  } else if (session.occupation_tl == "Surveillant") {
    res.redirect("/managementtl");
  } else if (session.occupation_op == "Opération") {
    res.redirect("/conge");
  } else {
    await daily_restart(req);
    await monthly_restart();
    res.render("LoginPage/Login.html", { erreur: "" });
  }
});

//Post ip
routeExp.route("/getip").post(async function (req, res) {
  var session = req.session;
  await set_ip(req.body.ip, req.body.device, req.session, res);
});
//Function set ip
async function set_ip(ip_get, device, session, res) {
  var access = {
    ip: ip_get,
    device: device,
  };
  session.access = access;
  res.send("Ok");
}
routeExp.route("/not").get(async function (req, res) {
  res.render("LoginPage/Interdit.html");
});
//Login post
routeExp.route("/login").post(async function (req, res) {
  var session = req.session;
  await login(req.body.username, req.body.pwd, req.session, res, req);
});
routeExp.route("/change_interface").post(async function (req, res) {
  await switch_interface(req.session, req.body.mail, req.body.opt, res);
});
async function switch_interface(session, mail, opt, res) {
      if (
        (await UserSchema.findOne({
          username: mail,
          occupation: "Opération",
        })) ||
        (await UserSchema.findOne({
          username: mail,
          occupation: "Surveillant",
        }))
      ) {
        if (opt == "c") {
          session.occupation_u = null;
          session.occupation_tl = null;
          session.occupation_op = "Opération";
          res.redirect("/conge");
        } else if (opt == "p") {
          session.occupation_u = "User";
          session.occupation_op = null;
          session.occupation_tl = null;
          session.m_code = session.m_code;
          res.redirect("/employee");
        } else if (opt == "s") {
          session.occupation_tl = "Surveillant";
          session.occupation_op = null;
          session.occupation_u = null;
          session.m_code = session.m_code;
          data_desired[session.m_code] = {};
          res.redirect("/managementtl");
        }
      } else if (
        await UserSchema.findOne({ usename: mail, occupation: "Admin" })
      ) {
        if (opt == "a") {
          session.occupation_u = null;
          session.occupation_a = "Admin";
          res.redirect("/home");
        } else {
          session.occupation_u = "User";
          session.occupation_a = null;
          res.redirect("/employee");
        }
      } else {
        res.redirect("/employee");
      }
}
//Access
function GrantedAccess(ipProvided, shift, excludeCode) {
  var ip = [
    "41.63.146.186",
    "41.74.26.229",
    "41.74.26.230",
    "102.16.26.115",
    "102.16.26.233",
    "102.16.44.83",
    "154.126.86.190",
    "154.126.86.243",
    "154.126.86.128",
    "154.126.86.89",
    "41.74.210.56",
  ];
  var Exclude = ["M-VO", "M-RMI", "M-JHU"];
  var shiftBlocked = ["SHIFT 1", "SHIFT 2", "DEV"];
  if (
    shiftBlocked.includes(shift) &&
    !Exclude.includes(excludeCode) &&
    !ipProvided.includes("197.149") &&
    !ipProvided.includes("154.126")
  ) {
    if (ip.includes(ipProvided)) {
      return true;
    } else {
      return false;
    }
  } else {
    return true;
  }
}
//Function login
async function login(username, pwd, session, res, req) {
      try {
        let hash = crypto.createHash("md5").update(pwd.trim()).digest("hex");
        var logger = await UserSchema.findOne({
          username: username.trim(),
          password: hash,
          status: "Actif",
        });
        if (logger) {
          session.mailing = logger.username;
          //Tete
          if (logger.change != "n") {
            if (logger.occupation == "User") {
              if (
                GrantedAccess(session.access.ip, logger.shift, logger.m_code)
              ) {
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
                data_desired[logger.m_code] = {};
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
                if (logger.act_stat == "VACATION" && logger.project != "RH") {
                  req.session = null;
                  res.render("LoginPage/Login.html", {
                    erreur: "Vous êtes en congé prenez votre temps",
                  });
                } else {
                  session.reason = "N/A";
                  res.redirect("/employee");
                }
              } else {
                var new_log = {
                  m_code: logger.m_code,
                  datetime: moment()
                    .add(3, "hours")
                    .format("DD/MM/YYYY HH:mm:ss"),
                  ip_adress: session.access.ip,
                  device: session.access.device,
                  intrusion: true,
                };
                await Log(new_log).save();
                var temp_notif =
                  "L'agent " +
                  new_log.m_code +
                  " s'est connecté sur un réseaux non autorisée sur l'appareille " +
                  new_log.device.split(";")[1];
                await Notif.findOneAndUpdate(
                  { _id: "64f1e60ae3038813b45c2db1" },
                  { $push: { notifications: temp_notif } }
                );
                var notif = await Notif.findOne({
                  _id: "64f1e60ae3038813b45c2db1",
                });
                const io = req.app.get("io");
                io.sockets.emit("notif", notif.notifications);
                res.redirect("/not");
              }
            } else if (logger.occupation == "Admin") {
              session.occupation_a = logger.occupation;
              filtrage = {};
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
//Page change password
routeExp.route("/changepassword").get(async function (req, res) {
  res.render("LoginPage/MotDePasse.html", { first: "" });
});
//Check email
routeExp.route("/checkmail").post(async function (req, res) {
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
        sendEmail(
          session.mailconfirm,
          "Code de verification",
          htmlVerification(session.code)
        );
        res.send("done");
      } else {
        res.send("error");
      }
});
// Check code
routeExp.route("/checkcode").post(async function (req, res) {
  var session = req.session;
  if (session.code == req.body.code) {
    res.send("match");
  } else {
    res.send("error");
  }
});
// update password
routeExp.route("/changepass").post(async function (req, res) {
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
});

//Section user
//Forgot to say goodbye
routeExp.route("/forget").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_u == "User") {
    await update_last(req.body.timeforget, req.session, res);
  } else {
    res.send("retour");
  }
});
// function update last
async function update_last(time_given, session, res) {
      var user = await UserSchema.findOne({ m_code: session.m_code });
      var last_time = await StatusSchema.findOne({
        m_code: session.m_code,
        time_end: "",
        date: { $ne: moment().format("YYYY-MM-DD") },
      });
      if (parseInt(user.user_ht) != 0) {
        if (last_time) {
          session.forget = "n";
          await StatusSchema.findOneAndUpdate(
            {
              m_code: session.m_code,
              time_end: "",
              date: { $ne: moment().format("YYYY-MM-DD") },
            },
            { time_end: time_given }
          );
          var left_data = await StatusSchema.find({
            m_code: session.m_code,
            time_end: "",
          });
          for (i = 0; i < left_data.length; i++) {
            await StatusSchema.findOneAndUpdate(
              { _id: left_data[i]._id },
              {
                time_end: calculate(
                  left_data[i].time_start,
                  parseInt(left_data[i].worktime)
                ),
              }
            );
          }
          res.send("Ok");
        } else {
          session.forget = "n";
          res.send("Ok");
        }
      } else {
        await StatusSchema.findOneAndUpdate(
          {
            m_code: session.m_code,
            time_end: "",
            date: { $ne: moment().format("YYYY-MM-DD") },
          },
          { time_end: time_given }
        ).sort({ _id: -1 });
        var left_data = await StatusSchema.find({
          m_code: session.m_code,
          time_end: "",
        });
        for (i = 0; i < left_data.length; i++) {
          await StatusSchema.findOneAndUpdate(
            { _id: left_data[i]._id },
            { time_end: calculate(left_data[i].time_start, 8) }
          );
        }
        session.forget = "n";
        res.send("Ok");
      }
  function calculate(begin, total) {
    return moment(begin, "HH:mm").add(total, "hours").format("HH:mm");
  }
}
routeExp.route("/reason").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_u == "User") {
    await reason_late(req.body.reason, req.session, res);
  } else {
    res.redirect("/");
  }
});
function generate_text(one, two) {
  return one + " (" + two + ")";
}
//reason late
async function reason_late(reason, session, res) {
      session.reason = generate_text(session.time, reason);
      session.time = "n";
      await UserSchema.findOneAndUpdate(
        { m_code: session.m_code },
        {
          late: "y",
          user_ht: session.new_time.worktime,
          act_stat: "WORKING",
          act_loc: session.new_time.locaux,
        }
      );
      session.new_time.late_entry = session.reason;
      await StatusSchema(session.new_time).save();
      res.send("Ok");
}
// get hour
routeExp.route("/gethour").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_u == "User") {
    await get_hour(req.body.hour, req.session, res);
  } else {
    res.redirect("/");
  }
});
// change_entry
routeExp.route("/change_entry").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_u == "User") {
    await change_entry(req.body.entry, req.session, res);
  } else {
    res.redirect("/");
  }
});
async function get_hour(h, session, res) {
      await UserSchema.findOneAndUpdate(
        { m_code: session.m_code },
        { user_ht: h }
      );
      res.send("Ok");
}
async function change_entry(h, session, res) {
      session.entry = h;
      await UserSchema.findOneAndUpdate(
        { m_code: session.m_code },
        { entry: h }
      );
      var date = moment(session.entry, "HH:mm:ss a");
      if (date == "Moment<Invalid date>") {
        res.send("No");
      } else {
        res.send("Ok");
      }
}
//Sending page for user
routeExp.route("/employee").get(async function (req, res) {
  var session = req.session;
  if (session.occupation_u == "User") {
        var user = await UserSchema.findOne(
          { m_code: session.m_code },
          { adresse: 0 }
        );
        var your_latelist = await StatusSchema.find({
          m_code: session.m_code,
          late_entry: { $regex: "Confirmer", $options: "i" },
          date: { $regex: moment().format("YYYY-MM"), $options: "i" },
        });
        var opt = await OptSchema.findOne({ _id: "636247a2c1f6301f15470344" });
        var late_confirm = [];
        for (i = 0; i < your_latelist.length; i++) {
          var str = your_latelist[i].late_entry;
          var openParenIndex = str.indexOf("(");
          var closeParenIndex = str.indexOf(")", openParenIndex);
          var value = str.substring(openParenIndex + 1, closeParenIndex);
          late_confirm.push(
            "Le " +
              moment(your_latelist[i].date).format("DD/MM/YYYY") +
              " avec raison " +
              value
          );
        }
        if (late_confirm.length >= 3) {
          if (
            session.shift.includes("SHIFT") ||
            session.shift.includes("DEV") ||
            session.shift.includes("IT")
          ) {
            if (opt.email_sent.includes(session.m_code)) {
            } else {
              await OptSchema.findOneAndUpdate(
                { _id: "636247a2c1f6301f15470344" },
                { $push: { email_sent: session.m_code } }
              );
              //send_alert_late(session.m_code, late_confirm, mailing_all);
            }
          } else {
            if (opt.email_sent.includes(session.m_code)) {
            } else {
              await OptSchema.findOneAndUpdate(
                { _id: "636247a2c1f6301f15470344" },
                { $push: { email_sent: session.m_code } }
              );
              //send_alert_late(session.m_code, late_confirm, mailing_spec);
            }
          }
        }
        var another_post = "n";
        var status_poste = "n";
        var administrator = "n";
        var occupations = await UserSchema.findOne({
          username: session.mailing,
          occupation: "Opération",
        });
        var status_occupation = await UserSchema.findOne({
          username: session.mailing,
          occupation: "Surveillant",
        });
        var administrator_occ = await UserSchema.findOne({
          username: session.mailing,
          occupation: "Admin",
        });
        var warn_you =
          (await OptSchema.find({ warn_user: { $in: session.m_code } }))
            .length != 0
            ? "y"
            : "n";
        if (occupations) {
          another_post = occupations.occupation;
        }
        if (status_occupation) {
          status_poste = "Surveillant";
        }
        if (administrator_occ) {
          administrator = "Admin";
        }
        if (session.time != "n") {
          res.render("PageEmployee/Pointage.html", {
            user: user,
            forget: session.forget,
            latelist: late_confirm,
            another: another_post,
            status_poste: status_poste,
            administrator: administrator,
            warn_you: warn_you,
          });
        } else {
          res.render("PageEmployee/Pointage.html", {
            user: user,
            forget: session.forget,
            latelist: late_confirm,
            another: another_post,
            status_poste: status_poste,
            administrator: administrator,
            warn_you: warn_you,
          });
        }
  } else {
    res.redirect("/");
  }
});
function send_alert_late(user, raison, receiver) {
  var mailOptions = {
    from: "Solumada application",
    to: receiver,
    subject: "Retard frequent de " + user,
    html: listed(raison),
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
  function listed(all_reason) {
    var html_value =
      "Bonjour à vous,<br><br>Pour ce mois-ci l'utilisateur avec la M-CODE <b>" +
      user +
      "</b> est enregistré avec les retards ci-dessous : <br>";
    all_reason.forEach((element) => {
      html_value += "- " + element + "<br>";
    });
    html_value += "<br><br>Mes salutations";
    return html_value;
  }
}
//Getting user change
//Startwork
routeExp.route("/startwork").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_u == "User") {
    await startwork(req.body.timework, req.body.locaux, req.session, res);
  } else {
    res.send("error");
  }
});
//startwork
async function startwork(timework, locaux, session, res) {
  var date = moment().format("YYYY-MM-DD");
  var timestart = moment().add(3, "hours").format("HH:mm");
  session.new_time = {
    m_code: session.m_code,
    num_agent: session.num_agent,
    date: date,
    time_start: timestart,
    entry: session.entry,
    time_end: "",
    worktime: timework,
    start_lunch: "?",
    end_lunch: "?",
    start_break: "?",
    end_break: "?",
    nom: session.name,
    locaux: locaux,
    late_entry: session.reason,
  };
      var last = await StatusSchema.findOne({
        m_code: session.m_code,
        date: moment().format("YYYY-MM-DD"),
      });
      if (last) {
        if (last.time_end != "") {
          var another_last = await StatusSchema.findOne({
            m_code: session.m_code,
            time_end: "",
          });
          await AbsentSchema.findOneAndUpdate(
            {
              m_code: session.m_code,
              return: "Not come back",
              date: moment().format("YYYY-MM-DD"),
            },
            { return: timestart }
          );
          if (another_last) {
            //Nothing to do
          } else {
            session.new_time.late_entry = "N/A";
            var new_data = await StatusSchema(session.new_time).save();
          }
        }

        await StatusSchema.findOneAndUpdate(
          {
            m_code: session.m_code,
            date: moment().format("YYYY-MM-DD"),
            end_lunch: "?",
            start_lunch: { $ne: "?" },
          },
          { end_lunch: timestart }
        );
        await StatusSchema.findOneAndUpdate(
          {
            m_code: session.m_code,
            date: moment().format("YYYY-MM-DD"),
            end_break: "?",
            start_break: { $ne: "?" },
          },
          { end_break: timestart }
        );
        await UserSchema.findOneAndUpdate(
          { m_code: session.m_code },
          {
            late: "y",
            user_ht: timework,
            act_stat: "WORKING",
            act_loc: session.new_time.locaux,
          }
        );
        res.send(last.time_start + "," + last.entry);
      } else {
        var shift3 = await StatusSchema.findOne({
          m_code: session.m_code,
          time_end: "",
        });
        if (shift3) {
          await UserSchema.findOneAndUpdate(
            { m_code: session.m_code },
            {
              late: "y",
              user_ht: timework,
              act_stat: "WORKING",
              act_loc: session.new_time.locaux,
            }
          );
          res.send(shift3.time_start + "," + shift3.entry);
        } else {
          var status = await UserSchema.findOne({ m_code: session.m_code });
          var already_time = await StatusSchema.findOne({
            m_code: session.m_code,
            time_end: "",
          });
          var no_late = ["M-CL", "M-NA", "M-TF", "M-SAF"];
          if (
            already_time ||
            no_late.includes(session.m_code) ||
            status.late == "y" ||
            calcul_retard(session.new_time.entry, timestart) == "n"
          ) {
            session.time = "n";
            session.reason = "N/A";
            session.new_time.late_entry = "N/A";
            var new_data = await StatusSchema(session.new_time).save();
            await UserSchema.findOneAndUpdate(
              { m_code: session.m_code },
              {
                late: "y",
                user_ht: timework,
                act_stat: "WORKING",
                act_loc: session.new_time.locaux,
              }
            );
            res.send(new_data.time_start + "," + new_data.entry);
          } else {
            session.reason = "N/A";
            timestart = moment().add(3, "hours").format("HH:mm");
            session.time = calcul_retard(session.new_time.entry, timestart);
            res.send(
              "retard," + calcul_retard(session.new_time.entry, timestart)
            );
          }
        }
      }
}
// function check_night(startTime, endTime) {
//   startTime = moment(startTime, "HH:mm:ss a");
//   endTime = moment(endTime, "HH:mm:ss a");
//   var duration = moment.duration(endTime.diff(startTime));
//   return duration.asHours();
// }
function check_day(startTime, endTime) {
  startTime = moment(startTime, "HH:mm:ss a");
  endTime = moment(endTime, "HH:mm:ss a");
  var duration = moment.duration(endTime.diff(startTime));
  return duration.asHours();
}
// //locaux check
// function loc_check(l, n) {
//   if ((l == n || l.includes(n)) && n != "Not defined") {
//     return l;
//   }
//   else if (l != n && n != "Not defined") {
//     return l + "/" + n;
//   }
//   else {
//     return l;
//   }
// }
// function hour_not_null(h, oh) {
//   if (h && h != "") {
//     return h;
//   }
//   else {
//     return oh;
//   }
// }
//Change hour
routeExp.route("/changing").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_u == "User") {
    await changing(req.body.ch_hour, req.session, res);
  } else {
    res.redirect("/");
  }
});
async function changing(ch, session, res) {
      await UserSchema.findOneAndUpdate(
        { m_code: session.m_code },
        { user_ht: ch }
      );
      await StatusSchema.findOneAndUpdate(
        { m_code: session.m_code, time_end: "" },
        { worktime: ch }
      );
      var last = await StatusSchema.findOne({
        m_code: session.m_code,
        time_end: "",
      });
      res.send(last.entry);
}

//Change status
routeExp.route("/statuschange").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_u == "User") {
    await status_change(req.body.act_loc, req.body.act_stat, req.session, res);
  } else {
    res.send("error");
  }
});
async function status_change(lc, st, session, res) {
      await UserSchema.findOneAndUpdate(
        { m_code: session.m_code },
        { act_stat: st, act_loc: lc }
      );
      res.send(st + "," + moment().add(3, "hours").format("HH:mm"));
}
routeExp.route("/notify").post(async function (req, res) {
  var session = req.session;
  var m_code = req.body.code;
  var notification = m_code + " depasse le temp de pause";
      await Notif.findOneAndUpdate(
        { _id: "64f1e60ae3038813b45c2db1" },
        { $push: { notifications: notification } }
      );
      var notif = await Notif.findOne({
        _id: "64f1e60ae3038813b45c2db1",
      });
      const io = req.app.get("io");
      io.sockets.emit("notif", notif.notifications);
      res.send("OK");
});
//handleWork
routeExp.route("/handlework").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_u == "User") {
    await handlework(req.body.locaux, req.body.choice, req.session, res);
  } else {
    res.send("error");
  }
});
async function handlework(locaux, choice, session, res) {
      var date = moment().format("YYYY-MM-DD");
      var last = await StatusSchema.findOne({
        m_code: session.m_code,
        date: date,
        time_end: "",
      });
      if (choice != "POSTE") {
        await StatusSchema.findOneAndUpdate(
          { m_code: session.m_code, date: date, time_end: "" },
          { locaux: last.locaux + " / " + choice }
        );
        await UserSchema.findOneAndUpdate(
          { m_code: session.m_code },
          { act_loc: choice, late: "y" }
        );
      }
      res.redirect("/exit_u");
}
//Left work
routeExp.route("/leftwork").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_u == "User") {
    await leftwork(req.body.locaux, req.session, res);
  } else {
    res.send("error");
  }
});
async function leftwork(locaux, session, res) {
  var timeend = moment().add(3, "hours").format("HH:mm");
      await StatusSchema.findOneAndUpdate(
        { m_code: session.m_code, time_end: "" },
        { time_end: timeend }
      ).sort({
        _id: -1,
      });
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
          late: "n",
          count: 0,
          act_stat: "LEFTING",
          act_loc: "Not defined",
          entry: "",
        }
      );
      await UserSchema.findOneAndUpdate(
        { m_code: session.m_code, project: { $in: exclude } },
        { late: "n", count: 0, act_stat: "LEFTING", act_loc: "Not defined" }
      );
      res.send("Ok");
}
//activity
routeExp.route("/activity").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_u == "User") {
    await activity(req.body.activity, req.session, req, res);
  } else {
    res.send("error");
  }
});
async function activity(activity, session, req, res) {
  if (activity != "ABSENT") {
    var counter = 0;
    switch (activity) {
      case "BREAK":
        counter = 1200000;
        session.place = "petit break";
        break;
      case "DEJEUNER":
        counter = 2400000;
        session.place = "Déjeuner";
        break;
      case "PAUSE":
        counter = 1800000;
        session.place = "Pause";
        break;
    }
        if (
          (await StatusSchema.findOne({
            m_code: session.m_code,
            date: moment().format("YYYY-MM-DD"),
            start_lunch: "?",
          })) ||
          (await StatusSchema.findOne({
            m_code: session.m_code,
            date: moment().format("YYYY-MM-DD"),
            start_break: "?",
          }))
        ) {
          var timestart = moment().add(3, "hours").format("HH:mm");
          await UserSchema.findOneAndUpdate(
            { m_code: session.m_code },
            { $inc: { count: 1 }, take_break: "n" }
          );
          if (activity == "DEJEUNER") {
            await StatusSchema.findOneAndUpdate(
              {
                m_code: session.m_code,
                date: moment().format("YYYY-MM-DD"),
                start_lunch: "?",
              },
              { start_lunch: timestart, end_lunch: "?" }
            );
          } else if (activity == "PAUSE") {
            await StatusSchema.findOneAndUpdate(
              {
                m_code: session.m_code,
                date: moment().format("YYYY-MM-DD"),
                start_break: "?",
              },
              { start_break: timestart, end_break: "?" }
            );
          }
          // var counts = await UserSchema.findOne({ m_code: session.m_code });
          // if (counts.count > 6) {
          //   var temp_notif =
          //     session.name + " quitte son poste trop frequement ";
          //   await Notif.findOneAndUpdate(
          //     { _id: "64f1e60ae3038813b45c2db1" },
          //     { $push: { notifications: temp_notif } }
          //   );
          //   var notif = await Notif.findOne({
          //     _id: "64f1e60ae3038813b45c2db1",
          //   });
          //   const io = req.app.get("io");
          //   io.sockets.emit("notif", notif.notifications);
          // }
          // setTimeout(async function () {
          //   var count_async = await UserSchema.findOne({
          //     m_code: session.m_code,
          //   });
          //   if (count_async.take_break == "n") {
          //     var temp_notif =
          //       session.name + " prend trop de temp au " + session.place;
          //     await Notif.findOneAndUpdate(
          //       { _id: "64f1e60ae3038813b45c2db1" },
          //       { $push: { notifications: temp_notif } }
          //     );
          //     var notif = await Notif.findOne({
          //       _id: "64f1e60ae3038813b45c2db1",
          //     });
          //     const io = req.app.get("io");
          //     io.sockets.emit("notif", notif.notifications);
          //   }
          // }, counter);
          res.send("Ok");
        } else {
          res.send("Ok");
        }
  } else {
    res.send("Ok");
  }
}
//Take break
routeExp.route("/takebreak").post(async function (req, res) {
  var session = req.session;
  await take_break(req.session);
  res.send("Ok");
});
async function take_break(session) {
      await UserSchema.findOneAndUpdate(
        { m_code: session.m_code },
        { take_break: "y" }
      );
}
// Remarques
routeExp.route("/rem").post(async function (req, res) {
      var new_rem = {
        m_code: req.body.m_code,
        date: moment().format("YYYY-MM-DD"),
        remarques: req.body.rem,
      };
      await RemSchema(new_rem).save();
      res.send("Ok");
});
// Disconnect_user
routeExp.route("/exit_u").get(function (req, res) {
  req.session = null;
  res.redirect("/");
});
// Administrator parts
//Page home
routeExp.route("/home").get(async function (req, res) {
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
        var notif = await Notif.findOne({ _id: "64f1e60ae3038813b45c2db1" });
        res.render("PageAdministration/Dashboard.html", {
          notif: notif.notifications,
          username: session.mailing,
          nbr_emp: nbr_employe,
          nbr_act: nbr_actif.length,
          nbr_leave: nbr_leave,
          nbr_retard: nbr_retard,
        });
  } else {
    res.redirect("/");
  }
});
//Page status
routeExp.route("/management").get(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin") {
    session.filtrage = null;
        var alluser = await UserSchema.find({
          m_code: { $ne: "N/A" },
          status: "Actif",
        });
        var notif = await Notif.findOne({ _id: "64f1e60ae3038813b45c2db1" });
        res.render("PageAdministration/Status.html", {
          users: alluser,
          username: session.mailing,
          notif: notif.notifications,
        });
  } else {
    res.redirect("/");
  }
});
//Page statustl
routeExp.route("/managementtl").get(async function (req, res) {
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
        var notif = await Notif.findOne({ _id: "64f1e60ae3038813b45c2db1" });
        res.render("PageTL/StatusTL.html", {
          users: alluser,
          notif: notif.notifications,
          username: session.mailing,
          show_another: show_another,
        });
  } else {
    res.redirect("/");
  }
});
routeExp.route("/pointagetl").get(async function (req, res) {
  var session = req.session;
  if (session.occupation_tl == "Surveillant") {
        var occupations = await UserSchema.findOne({
          username: session.mailing,
          occupation: "Opération",
        });
        var show_another = "n";
        if (occupations) {
          show_another = occupations.occupation;
        }
        if (session.filtrage == "" && data_desired[session.m_code]) {
          session.filtrage = null;
          var notif = await Notif.findOne({ _id: "64f1e60ae3038813b45c2db1" });
          res.render("PageTL/TableauPointageTL.html", {
            timesheets: data_desired[session.m_code].datatowrite,
            username: session.mailing,
            notif: notif.notifications,
            show_another: show_another,
          });
        } else {
          data_desired[session.m_code] = {};
          var timesheets = await StatusSchema.find({
            date: moment().format("YYYY-MM-DD"),
          });
          data_desired[session.m_code].datatowrite = timesheets;
          data_desired[session.m_code].dataabsence = await AbsentSchema.find({
            date: moment().format("YYYY-MM-DD"),
          });
          data_desired[session.m_code].dataleave = await LeaveSchema.find({
            $or: [
              { date_start: moment().format("YYYY-MM-DD") },
              { date_start: moment().format("YYYY-MM-DD") },
            ],
          });
          var notif = await Notif.findOne({ _id: "64f1e60ae3038813b45c2db1" });
          res.render("PageTL/TableauPointageTL.html", {
            timesheets: timesheets,
            username: session.mailing,
            notif: notif.notifications,
            show_another: show_another,
          });
        }
  } else {
    res.redirect("/");
  }
});
var pointage_journalier = [];
//GEnerate daily excel
routeExp.route("/generatetl").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_tl == "Surveillant") {
    var newsheet = ExcelFile.utils.book_new();
    newsheet.Props = {
      Title: "Timesheets",
      Subject: "Logged Time",
      Author: "Solumada",
    };
    newsheet.SheetNames.push("TOUS LES EMPLOYER");
        pointage_journalier.push([
          "RAPPORT POINTAGE JOURNALIER",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]);
        pointage_journalier.push(["", "", "", "", "", "", "", "", "", "", ""]);
        pointage_journalier.push([
          "M-code",
          "A Shift",
          "Entrée/Locaux",
          "Début Shift",
          "Fin Shift",
          "Heure calculer",
          "Heure à travailler",
          "Pause 15 mn",
          "Pause déjeuner",
          "Retard enregistré",
          "Absence enregistré",
        ]);
        var pointages = data_desired[session.m_code].datatowrite;
        var abs = data_desired[session.m_code].dataabsence;
        var users = await UserSchema.find({
          occupation: "User",
        });
        for (i = 0; i < pointages.length; i++) {
          const absFound = abs.find(
            (item) =>
              item.date === pointages[i].date &&
              item.m_code === pointages[i].m_code
          );
          if (absFound) {
            var shifts = retrieve_shift(users, pointages[i].m_code);
            pointage_journalier.push([
              pointages[i].m_code,
              shifts,
              `${pointages[i].entry} / ${pointages[i].locaux}`,
              pointages[i].time_start,
              pointages[i].time_end,
              calcul_timediff_principletl(
                pointages[i].time_start,
                pointages[i].time_end
              ),
              `${pointages[i].worktime} heures`,
              render_lunch(
                pointages[i].start_break,
                pointages[i].end_break,
                shifts,
                20,
                15
              ),
              render_lunch(
                pointages[i].start_lunch,
                pointages[i].end_lunch,
                shifts,
                40,
                30
              ),
              pointages[i].late_entry,
              render_absence(
                absFound.time_start,
                absFound.return,
                absFound.reason
              ),
            ]);
          } else {
            var shifts = retrieve_shift(users, pointages[i].m_code);
            pointage_journalier.push([
              pointages[i].m_code,
              shifts,
              `${pointages[i].entry} / ${pointages[i].locaux}`,
              pointages[i].time_start,
              pointages[i].time_end,
              calcul_timediff_principletl(
                pointages[i].time_start,
                pointages[i].time_end
              ),
              `${pointages[i].worktime} heures`,
              render_lunch(
                pointages[i].start_break,
                pointages[i].end_break,
                shifts,
                20,
                15
              ),
              render_lunch(
                pointages[i].start_lunch,
                pointages[i].end_lunch,
                shifts,
                40,
                30
              ),
              pointages[i].late_entry,
              "N/A",
            ]);
          }
        }
        pointage_journalier.sort((a, b) => {
          const nameA = a[1].toLowerCase();
          const nameB = b[1].toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });
        global_ReportTl(pointage_journalier);
        newsheet.Sheets["TOUS LES EMPLOYER"] = ws;
        pointage_journalier = [];
        if (newsheet.SheetNames.length != 0) {
          session.filename = "N°" + num_file + " Pointage.xlsx";
          num_file++;
          ExcelFile.writeFile(newsheet, session.filename);
          delete filtrage.searchit;
          delete filtrage.date;
          delete filtrage.search;
        }
        res.send("Done");
  } else {
    res.redirect("/");
  }
});
function retrieve_shift(users, code) {
  var shift_change = ["SHIFT 1", "SHIFT 2", "SHIFT 3"];
  const shiftFound = users.find((item) => item.m_code === code);
  if (shift_change.includes(shiftFound.shift)) {
    return shiftFound.shift;
  } else {
    return "SHIFT AUTRES";
  }
}
function render_absence(start_abs, end_abs, reason) {
  return `${start_abs} - ${end_abs} ( ${reason} ) ${duration_abs(
    start_abs,
    end_abs
  )}`;
}
function duration_abs(start_abs, end_abs) {
  if (end_abs == "Not come back") {
    return " et ne s'est pas repointer";
  } else {
    return `pour une durée de ${calcul_timediff_absencetl(
      start_abs,
      end_abs
    )} `;
  }
}
function render_lunch(start, end, shift, late, delay) {
  var shift_change = ["SHIFT 1", "SHIFT 2", "SHIFT 3"];
  if (shift_change.includes(shift)) {
    return `${start} - ${end} ${give_late(
      calcul_timediff_lunchtl(start, end, late, delay)
    )}`;
  } else {
    return `${start} - ${end} ${calcul_timediff_lunchtl(start, end)}`;
  }
}
function give_late(given, lates, delay) {
  var string = given;
  var late = parseInt(given.split(" ")[0]);
  if (late >= lates) {
    string += ` (${late - delay} minutes de retard)`;
  }
  return string;
}
function calcul_timediff_lunchtl(startTime, endTime) {
  if (startTime != "?" && endTime != "?") {
    startTime = moment(startTime, "HH:mm:ss a");
    endTime = moment(endTime, "HH:mm:ss a");
    var duration = moment.duration(endTime.diff(startTime));
    var minutes_fictif = 0;

    // duration in minutes
    minutes_fictif += parseInt(duration.asMinutes());
    return minutes_fictif + " minutes";
  } else {
    return "0";
  }
}
function global_ReportTl(all_data) {
  ws = ExcelFile.utils.aoa_to_sheet(all_data);
  ws["!cols"] = [
    { wpx: 50 },
    { wpx: 80 },
    { wpx: 150 },
    { wpx: 60 },
    { wpx: 50 },
    { wpx: 90 },
    { wpx: 80 },
    { wpx: 150 },
    { wpx: 150 },
    { wpx: 265 },
    { wpx: 265 },
  ];
  var row_property = [];
  ws["!rows"] = row_property;
  const merge = [{ s: { r: 0, c: 0 }, e: { r: 1, c: 10 } }];
  ws["!merges"] = merge;
  style6();
}

routeExp.route("/all_userstl").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_tl == "Surveillant") {
        var users = await UserSchema.find({ occupation: "User" })
          .select("m_code shift act_loc act_stat status")
          .sort({
            m_code: 1,
          });
        var data_status = await StatusSchema.find({
          date: moment().format("YYYY-MM-DD"),
        });
        res.send([users, data_status]);
  } else {
    res.redirect("/");
  }
});
routeExp.route("/absencetl").get(async function (req, res) {
  var session = req.session;
  if (session.occupation_tl == "Surveillant") {
        var notif = await Notif.findOne({ _id: "64f1e60ae3038813b45c2db1" });
        var occupations = await UserSchema.findOne({
          username: session.mailing,
          occupation: "Opération",
        });
        var show_another = "n";
        if (occupations) {
          show_another = occupations.occupation;
        }
        res.render("PageTL/ListeAbsenceTL.html", {
          notif: notif.notifications,
          username: session.mailing,
          show_another: show_another,
        });
  } else {
    res.redirect("/");
  }
});
//Listuser
routeExp.route("/userlist").get(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin") {
    session.filtrage = null;
        if (maj_done == false) {
          var FromTools = await ProjectFromTools();
          for (p = 0; p < FromTools.length; p++) {
            await UserSchema.findOneAndUpdate(
              { m_code: FromTools[p].mcode },
              {
                project: sliceProject(FromTools[p].project),
                shift: shift_rename(FromTools[p].shift, FromTools[p].project),
                phone: FromTools[p].tel,
                adresse: FromTools[p].quartier,
              }
            );
          }
          maj_done = true;
        }
        var notif = await Notif.findOne({ _id: "64f1e60ae3038813b45c2db1" });
        res.render("PageAdministration/ListeUtilisateurs.html", {
          notif: notif.notifications,
          username: session.mailing,
        });
  } else {
    res.redirect("/");
  }
});
routeExp.route("/list_employee").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin") {
        var users = await UserSchema.find({}).sort({
          first_name: 1,
        });
        res.send(users);
  }
});

//Add employee
routeExp.route("/addemp").post(async function (req, res) {
  var email = req.body.email;
  var name = req.body.name;
  var last_name = req.body.last_name;
  var usuel = req.body.usuel;
  var mcode = req.body.mcode;
  var num_agent = req.body.num_agent;
  var matricule = req.body.matricule;
  var fonction = req.body.function_choosed;
  var occupation = req.body.occupation;
  var save_at = req.body.enter_date;
  var cin = req.body.cin;
  var sexe = req.body.gender;
  var situation = req.body.situation;
  var location = req.body.location;
  var num_cnaps = req.body.num_cnaps;
  var classification = req.body.classification;
  var contrat = req.body.contrat;
  var date_fin = req.body.datefin;
  var change = "n";
  var late = "n";
      if (
        (await UserSchema.findOne({
          $or: [
            { m_code: mcode },
            { num_agent: num_agent },
            { matr: matricule },
          ],
        })) &&
        mcode != "N/A"
      ) {
        res.send("already");
      } else {
        var passdefault = randomPassword();
        let hash = crypto.createHash("md5").update(passdefault).digest("hex");
        var new_emp = {
          username: email,
          last_name: last_name,
          first_name: name,
          password: hash,
          m_code: mcode,
          num_agent: num_agent,
          occupation: occupation,
          change: change,
          act_stat: "LEFTING",
          act_loc: "Not defined",
          shift: fonction,
          late: late,
          count: 0,
          take_break: "n",
          remaining_leave: 0,
          leave_taked: 0,
          leave_stat: "n",
          save_at: moment(save_at).format("YYYY-MM-DD"),
          sexe: sexe,
          situation: situation,
          user_ht: 0,
          project: "",
          matr: matricule,
          usuel: usuel,
          cin: cin,
          adresse: location,
          cnaps_num: num_cnaps,
          classification: classification,
          contrat: contrat,
          date_fin: return_date(date_fin),
          entry: "08:00",
          status: "Actif",
          profil: "avatar.png",
          phone: "",
        };
        await UserSchema(new_emp).save();
        sendEmail(
          email,
          "Authentification Solumada",
          htmlRender(email, passdefault, occupation)
        );

        res.send(email + "," + occupation);
      }
});
function return_date(date_given) {
  if (moment(date_given).format("YYYY-MM-DD") == "Invalid date") {
    return "";
  } else {
    return moment(date_given).format("YYYY-MM-DD");
  }
}
//getuser
routeExp.route("/getuser").post(async function (req, res) {
  var id = req.body.id;
      var user = await UserSchema.findOne({ _id: id });
      res.send(
        user.username +
          "," +
          user.first_name +
          "," +
          user.last_name +
          "," +
          user.usuel +
          "," +
          user.m_code +
          "," +
          user.num_agent +
          "," +
          user.matr +
          "," +
          user.shift +
          "," +
          user.occupation +
          "," +
          user.save_at +
          "," +
          user.cin +
          "," +
          user.sexe +
          "," +
          user.situation +
          "," +
          user.adresse +
          "," +
          user.cnaps_num +
          "," +
          user.classification +
          "," +
          user.contrat +
          "," +
          user.date_fin +
          "," +
          user.profil +
          "," +
          user.project +
          "," +
          user.phone
      );
});
//Update User
routeExp.route("/updateuser").post(async function (req, res) {
  var id = req.body.id;
  var email = req.body.email;
  var name = req.body.name;
  var last_name = req.body.last_name;
  var usuel = req.body.usuel;
  var fonction = req.body.function_choosed;
  var occupation = req.body.occupation;
  var save_at = req.body.enter_date;
  var cin = req.body.cin;
  var sexe = req.body.gender;
  var situation = req.body.situation;
  var location = req.body.location;
  var num_cnaps = req.body.num_cnaps;
  var classification = req.body.classification;
  var contrat = req.body.contrat;
  var date_fin = req.body.datefin;
      var user = await UserSchema.findOne({ _id: id });
      await StatusSchema.updateMany(
        { m_code: user.m_code },
        { nom: name + " " + last_name }
      );
      await UserSchema.findOneAndUpdate(
        { _id: id },
        {
          username: email,
          first_name: name,
          last_name: last_name,
          usuel: usuel,
          occupation: occupation,
          shift: fonction,
          save_at: moment(save_at).format("YYYY-MM-DD"),
          cin: cin,
          sexe: sexe,
          situation: situation,
          adresse: location,
          cnaps_num: num_cnaps,
          classification: classification,
          contrat: contrat,
          date_fin: return_date(date_fin),
        }
      );
      res.send("Ok");
});
//update project
routeExp.route("/update_project").post(async function (req, res) {
  var choice = req.body.choice.split(",");
  var owner = req.body.owner;
  var combined = "";
  for (i = 0; i < choice.length; i++) {
    if (i == 0) {
      combined += choice[i];
    } else {
      combined += "/" + choice[i];
    }
  }
      await UserSchema.findOneAndUpdate(
        { m_code: owner },
        { project: combined }
      );
      res.send("ok");
});
//Drop user
routeExp.route("/dropuser").post(async function (req, res) {
  var names = req.body.fname;
  names = names.split(" ");
      var concern = await UserSchema.findOne({ _id: names });
      if (concern.occupation != "User") {
        await UserSchema.findOneAndDelete({ _id: names });
        res.send("L'Administrateur a été supprimer avec succés");
      } else {
        await UserSchema.findOneAndUpdate(
          { _id: names },
          { status: "Quitter", act_stat: "LEFTING", act_loc: "Not defined" }
        );
        res.send("L'utilisateur a été archiver avec succés");
      }
    
});
routeExp.route("/reactivate").post(async function (req, res) {
  var names = req.body.fname;
  names = names.split(" ");
      await UserSchema.findOneAndUpdate(
        { _id: names, shift: { $ne: "SHIFT WEEKEND" } },
        {
          status: "Actif",
          leave_permission: "n",
          save_at: moment().format("YYYY-MM-DD"),
          leave_taked: 2.5,
          remaining_leave: 0,
          act_stat: "LEFTING",
          act_loc: "Not defined",
        }
      );
      await UserSchema.findOneAndUpdate(
        { _id: names, shift: "SHIFT WEEKEND" },
        {
          status: "Actif",
          leave_permission: "n",
          save_at: moment().format("YYYY-MM-DD"),
          leave_taked: 0.75,
          remaining_leave: 0,
          act_stat: "LEFTING",
          act_loc: "Not defined",
        }
      );
      var user = UserSchema.findOneAndUpdate({ _id: names });
      await LeaveSchema.updateMany(
        { m_code: user.m_code },
        { validation: true }
      );
      res.send("L'utilisateur a été réintegré avec succés");
});
//Sheets
routeExp.route("/details").get(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin") {
        if (session.filtrage == "" && data_desired[session.m_code]) {
          session.filtrage = null;
          var notif = await Notif.findOne({ _id: "64f1e60ae3038813b45c2db1" });
          res.render("PageAdministration/TableauPointage.html", {
            timesheets: data_desired[session.m_code].datatowrite,
            username: session.mailing,
            notif: notif.notifications,
          });
        } else {
          data_desired[session.m_code] = {};
          var timesheets = await StatusSchema.find({
            date: moment().format("YYYY-MM-DD"),
          });
          data_desired[session.m_code].datatowrite = timesheets;
          data_desired[session.m_code].dataabsence = await AbsentSchema.find({
            date: moment().format("YYYY-MM-DD"),
          });
          data_desired[session.m_code].dataleave = await LeaveSchema.find({
            $or: [
              { date_start: moment().format("YYYY-MM-DD") },
              { date_start: moment().format("YYYY-MM-DD") },
            ],
          });
          var notif = await Notif.findOne({ _id: "64f1e60ae3038813b45c2db1" });
          res.render("PageAdministration/TableauPointage.html", {
            timesheets: timesheets,
            username: session.mailing,
            notif: notif.notifications,
          });
        }
  } else {
    res.redirect("/");
  }
});
//Filter sheets
routeExp.route("/filter").post(async function (req, res) {
  var session = req.session;
  if (
    session.occupation_a == "Admin" ||
    session.occupation_tl == "Surveillant"
  ) {
    session.filtrage = "";
    data_desired[session.m_code] = {};
    var searchit = req.body.searchit;
    var period = req.body.period;
    var datestart = "";
    var dateend = "";
    if (period == "t") {
      datestart = moment().format("YYYY-MM-DD");
    } else if (period == "tw") {
      datestart = moment().startOf("week").format("YYYY-MM-DD");
      dateend = moment().endOf("week").format("YYYY-MM-DD");
    } else if (period == "tm") {
      datestart = moment().startOf("month").format("YYYY-MM-DD");
      dateend = moment().endOf("month").format("YYYY-MM-DD");
    } else if (period == "spec") {
      datestart = req.body.datestart;
      dateend = req.body.dateend;
    } else {
      datestart = "";
      dateend = "";
    }
    var datecount = [];
    var datatosend = [];
        var absent_temp = [];
        var temp_leave = [];
        absent_temp.push([]);
        temp_leave.push([]);
        datestart == "" ? "" : datecount.push(1);
        dateend == "" ? "" : datecount.push(2);
        searchit == "" ? delete filtrage.search : (filtrage.search = searchit);
        if (datecount.length == 2) {
          var day = moment
            .duration(
              moment(dateend, "YYYY-MM-DD").diff(
                moment(datestart, "YYYY-MM-DD")
              )
            )
            .asDays();
          var getdata;
          var getdataabsence;
          var getdataleave;
          for (i = 0; i <= day; i++) {
            filtrage.date = datestart;
            date_data.push(filtrage.date);
            if (filtrage.search) {
              getdata = await StatusSchema.find({
                $or: [
                  { m_code: { $regex: searchit, $options: "i" } },
                  { nom: { $regex: searchit, $options: "i" } },
                  { locaux: { $regex: searchit, $options: "i" } },
                ],
                date: filtrage.date,
              }).sort({
                _id: -1,
              });
              getdataabsence = await AbsentSchema.find({
                date: filtrage.date,
              }).sort({
                _id: -1,
              });
              getdataleave = await LeaveSchema.find({
                date_start: filtrage.date,
              }).sort({
                _id: -1,
              });
            } else {
              getdata = await StatusSchema.find({ date: filtrage.date });
              getdataabsence = await AbsentSchema.find({ date: filtrage.date });
              getdataleave = await LeaveSchema.find({
                date_start: filtrage.date,
              });
            }

            if (getdata.length != 0) {
              datatosend.push(getdata);
            }
            var addday = moment(datestart, "YYYY-MM-DD")
              .add(1, "days")
              .format("YYYY-MM-DD");
            datestart = addday;
            if (getdataabsence.length != 0) {
              for (ab = 0; ab < getdataabsence.length; ab++) {
                absent_temp[0].push(getdataabsence[ab]);
              }
            }
            if (getdataleave.length != 0) {
              for (lv = 0; lv < getdataleave.length; lv++) {
                temp_leave[0].push(getdataleave[lv]);
              }
            }
          }

          for (i = 1; i < datatosend.length; i++) {
            for (d = 0; d < datatosend[i].length; d++) {
              datatosend[0].push(datatosend[i][d]);
            }
          }
          if (datatosend.length != 0) {
            data_desired[session.m_code].datatowrite = datatosend[0];
            data_desired[session.m_code].dataabsence = absent_temp[0];
            data_desired[session.m_code].dataleave = temp_leave[0];
            res.send(datatosend[0]);
          } else {
            data_desired[session.m_code].datatowrite = datatosend;
            data_desired[session.m_code].dataabsence = [];
            data_desired[session.m_code].dataleave = [];
            res.send(datatosend);
          }
        } else if (datecount.length == 1) {
          if (datecount[0] == 1) {
            filtrage.date = datestart;
            if (filtrage.search) {
              datatosend = await StatusSchema.find({
                $or: [
                  { m_code: { $regex: searchit, $options: "i" } },
                  { nom: { $regex: searchit, $options: "i" } },
                  { locaux: { $regex: searchit, $options: "i" } },
                ],
                date: filtrage.date,
              }).sort({
                _id: -1,
              });
              data_desired[session.m_code].dataabsence =
                await AbsentSchema.find({ date: filtrage.date }).sort({
                  _id: -1,
                });
              data_desired[session.m_code].dataleave = await LeaveSchema.find({
                date_start: filtrage.date,
              }).sort({
                _id: -1,
              });
            } else {
              datatosend = await StatusSchema.find({ date: filtrage.date });
              data_desired[session.m_code].dataabsence =
                await AbsentSchema.find({ date: filtrage.date });
              data_desired[session.m_code].dataleave = await LeaveSchema.find({
                date_start: filtrage.date,
              });
            }
            data_desired[session.m_code].datatowrite = datatosend;
            session.searchit = searchit;
            res.send(datatosend);
          } else {
            filtrage.date = dateend;
            if (filtrage.search) {
              datatosend = await StatusSchema.find({
                $or: [
                  { m_code: { $regex: searchit, $options: "i" } },
                  { nom: { $regex: searchit, $options: "i" } },
                  { locaux: { $regex: searchit, $options: "i" } },
                ],
                date: filtrage.date,
              }).sort({
                _id: -1,
              });
              data_desired[session.m_code].dataabsence =
                await AbsentSchema.find({ date: filtrage.date }).sort({
                  _id: -1,
                });
              data_desired[session.m_code].dataleave = await LeaveSchema.find({
                date_start: filtrage.date,
              }).sort({
                _id: -1,
              });
            } else {
              datatosend = await StatusSchema.find({ date: filtrage.date });
            }
            data_desired[session.m_code].datatowrite = datatosend;
            session.searchit = searchit;
            res.send(datatosend);
          }
        } else {
          delete filtrage.date;
          datatosend = await StatusSchema.find({
            $or: [
              { m_code: { $regex: searchit, $options: "i" } },
              { nom: { $regex: searchit, $options: "i" } },
              { locaux: { $regex: searchit, $options: "i" } },
            ],
          }).sort({ _id: -1 });
          data_desired[session.m_code].datatowrite = datatosend;
          data_desired[session.m_code].dataabsence = await AbsentSchema.find(
            {}
          ).sort({
            _id: -1,
          });
          data_desired[session.m_code].dataleave = await LeaveSchema.find(
            {}
          ).sort({
            _id: -1,
          });
          session.searchit = searchit;
          res.send(datatosend);
        }
  } else {
    res.send("error");
  }
});
routeExp.route("/absent").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_u == "User") {
    await absent(req.body.reason, req.body.stat, req.session, res);
  } else {
    res.send("error");
  }
});
//Absent
async function absent(reason, stat, session, res) {
  var timestart = moment().add(3, "hours").format("HH:mm");
  var new_abs = {
    m_code: session.m_code,
    num_agent: session.num_agent,
    date: moment().format("YYYY-MM-DD"),
    nom: session.name,
    time_start: timestart,
    return: "Not come back",
    reason: reason,
    validation: true,
    status: "Accepter",
  };
      await AbsentSchema(new_abs).save();
      await StatusSchema.findOneAndUpdate(
        {
          m_code: session.m_code,
          date: moment().format("YYYY-MM-DD"),
          time_end: "",
        },
        { time_end: timestart }
      );
      await UserSchema.findOneAndUpdate(
        { m_code: session.m_code },
        { act_loc: "Not defined", act_stat: "LEFTING", late: "n" }
      );
      res.send(stat);
}
routeExp.route("/absencelist").get(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin") {
        var notif = await Notif.findOne({ _id: "64f1e60ae3038813b45c2db1" });
        res.render("PageAdministration/ListeAbsence.html", {
          notif: notif.notifications,
          username: session.mailing,
        });
  } else {
    res.redirect("/");
  }
});
routeExp.route("/absences").post(async function (req, res) {
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
});
//Validation
routeExp.route("/validate_a").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin") {
    var id = req.body.id;
        await AbsentSchema.findOneAndUpdate(
          { _id: id },
          { validation: true, status: "Accepter" }
        );
        res.send("Demande traité avec succés");
  } else {
    res.redirect("/");
  }
});
routeExp.route("/validatea_all").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin") {
    var items = req.body.items.split(",");
        for (it = 0; it < items.length; it++) {
          await AbsentSchema.findOneAndUpdate(
            { _id: items[it] },
            { validation: true, status: "Accepter" }
          );
        }
        res.send("Demande traité avec succés");
  } else {
    res.redirect("/");
  }
});
//Denied
routeExp.route("/denied_a").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin") {
    var id = req.body.id;
    console.log("False " + id);
        await AbsentSchema.findOneAndUpdate(
          { _id: id },
          { status: "Non communiqué" }
        );
        res.send("Demande traité avec succés");
  } else {
    res.send("retour");
  }
});
routeExp.route("/denieda_all").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin") {
    var items = req.body.items.split(",");
        for (it = 0; it < items.length; it++) {
          await AbsentSchema.findOneAndUpdate(
            { _id: items[it] },
            { status: "Non communiqué" }
          );
        }

        res.send("Demande traité avec succés");
  } else {
    res.send("retour");
  }
});
//Validation page
routeExp.route("/validelate").get(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin") {
    session.filtrage = null;
        var notif = await Notif.findOne({ _id: "64f1e60ae3038813b45c2db1" });
        res.render("PageAdministration/ValidationRetards.html", {
          notif: notif.notifications,
          username: session.mailing,
        });
  } else {
    res.redirect("/");
  }
});
routeExp.route("/validelatetl").get(async function (req, res) {
  var session = req.session;
  if (session.occupation_tl == "Surveillant") {
    session.filtrage = null;
        var notif = await Notif.findOne({ _id: "64f1e60ae3038813b45c2db1" });
        var occupations = await UserSchema.findOne({
          username: session.mailing,
          occupation: "Opération",
        });
        var show_another = "n";
        if (occupations) {
          show_another = occupations.occupation;
        }
        res.render("PageTL/ValidationRetardsTL.html", {
          notif: notif.notifications,
          username: session.mailing,
          show_another: show_another,
        });
  } else {
    res.redirect("/");
  }
});
routeExp.route("/lates").post(async function (req, res) {
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
});
//Validation
routeExp.route("/validate").post(async function (req, res) {
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
});
routeExp.route("/exception").post(async function (req, res) {
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
});
routeExp.route("/exception_all").post(async function (req, res) {
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
});
routeExp.route("/valide_all").post(async function (req, res) {
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
});
//Denied
routeExp.route("/denied").post(async function (req, res) {
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
});
routeExp.route("/denied_all").post(async function (req, res) {
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
});
//Page Leave
routeExp.route("/leave").get(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin") {
        var alluser = await UserSchema.find(
          { occupation: "User", status: "Actif" },
          { adresse: 0, password: 0, username:0,phone:0 }
        ).sort({
          m_code: 1,
        });
        var leave_in_progress = await LeaveSchema.find({status:"en cours"})
        var notif = await Notif.findOne({ _id: "64f1e60ae3038813b45c2db1" });
        res.render("PageAdministration/CongeEmployer.html", {
          users: alluser,
          username: session.mailing,
          notif: notif.notifications,
          leave_in_progress:leave_in_progress
        });
  } else {
    res.redirect("/");
  }
});
routeExp.route("/conge").get(async function (req, res) {
  var session = req.session;
  if (session.occupation_op == "Opération") {
        var another_post = "n";
        var occupations = await UserSchema.findOne({
          username: session.mailing,
          occupation: "Surveillant",
        });
        if (occupations) {
          another_post = occupations.occupation;
        }
        res.render("PageOperation/CongeOperation.html", {
          another: another_post,
          username: session.mailing,
        });
  } else {
    res.redirect("/");
  }
});

//List leave
routeExp.route("/leavelist").get(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin") {
        var notif = await Notif.findOne({ _id: "64f1e60ae3038813b45c2db1" });
        res.render("PageAdministration/ListeConges.html", {
          notif: notif.notifications,
          username: session.mailing,
        });
  } else {
    res.redirect("/");
  }
});
routeExp.route("/list_leave").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin" || session.occupation_op == "Opération") {
        var all_leave = await LeaveSchema.find({}).sort({
          m_code: 1,
          date_start: 1,
          validation: false,
        });
        var users = await UserSchema.find({
          m_code: { $ne: "N/A" },
          status: "Actif",
        })
          .select(
            "profil m_code remaining_leave leave_stat leave_taked project"
          )
          .sort({
            m_code: 1,
          });
        res.send([all_leave, users]);
  } else {
    res.redirect("/");
  }
});
//take leave
// mongoose
//     .connect(
//       "mongodb+srv://Rica:Ryane_1888@cluster0.z3s3n.mongodb.net/Pointage?retryWrites=true&w=majority",
//       {
//         useUnifiedTopology: true,
//         UseNewUrlParser: true,
//       }
//     )
//     .then(async () => {
//      var user = await UserSchema.find({status:"Actif",profil:"avatar.png",occupation:"User"})
//       for(u=0;u<user.length;u++){
//         await OptSchema.findOneAndUpdate(
//           { _id: "636247a2c1f6301f15470344" },
//           { $push: { warn_user: user[u].m_code } }
//         );
//       }
//       console.log("Done")
//     })

routeExp.route("/takeleave").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin") {
    var code = req.body.code;
    var type = req.body.type;
    var leavestart = req.body.leavestart;
    var leaveend = req.body.leaveend;
    var hour_begin = req.body.begin;
    var hour_end = req.body.end;
    var val = req.body.court;
    var motif = req.body.motif;
    var deduction = " ( rien à deduire )";
        var user = await UserSchema.findOne({ m_code: code });
        var taked;
        var leave_specific = await LeaveSchema.find({
          m_code: user.m_code,
          date_start: {
            $regex: moment(leavestart).format("YYYY"),
            $options: "i",
          },
          validation: false,
        }).sort({
          date_start: 1,
        });
        if (
          checkduplicata(leave_specific, leavestart, leaveend) &&
          (val == "n" || val == "1")
        ) {
          res.send("duplicata");
        } else {
          if (val == "n") {
            taked = date_diff(leavestart, leaveend) + 1;
          } else {
            if (val == 0.5) {
              leaveend = leavestart;
              taked = val;
            } else {
              leaveend = leavestart;
              taked = val;
            }
          }
          var last_acc = 0;
          if (user.leave_stat == "y" && type == "Congé Payé") {
            if (deduire.includes(type)) {
              deduction = " ( a déduire sur salaire )";
            }
            var day_control = "Terminée";
            if (taked >= 1) {
              day_control = "en attente";
            }
            //ARRANge
            var rest = "";
            var accs = -taked;
            var indice_change = [];
            for (c = 0; c < leave_specific.length; c++) {
              if (date_diff(leavestart, leave_specific[c].date_start) > 0) {
                if (leave_specific[c - 1]) {
                  if (rest == "") {
                    rest = leave_specific[c - 1].rest - taked;
                    last_acc = leave_specific[c - 1].acc - taked
                  }
                } else {
                  if (rest == "") {
                    if (leave_specific[c].type.includes("Congé Payé")) {
                      rest =
                        leave_specific[c].rest +
                        leave_specific[c].duration -
                        taked;
                        last_acc = leave_specific[c].acc + leave_specific[c].duration - taked
                    } else {
                      rest = leave_specific[c].rest - taked;
                      last_acc = leave_specific[c - 1].acc - taked
                    }
                  }
                }
                indice_change.push(c);
              }
            }
            if (rest == "") {
              rest = user.remaining_leave - taked;
              last_acc = user.leave_taked - taked
            }
            var new_leave = {
              m_code: user.m_code,
              num_agent: user.num_agent,
              nom: user.first_name + " " + user.last_name,
              date_start: leavestart,
              date_end: leaveend,
              duration: taked,
              hour_begin: hour_begin,
              hour_end: hour_end,
              type: type + deduction,
              status: day_control,
              rest: rest,
              motif: motif,
              validation: false,
              acc: last_acc,
            };
            var last_rest = rest;
            indice_change.forEach(async (change) => {
              if (leave_specific[change].type.includes("Congé Payé")) {
                last_rest = last_rest - leave_specific[change].duration;
                await LeaveSchema.findOneAndUpdate(
                  { _id: leave_specific[change]._id },
                  { rest: last_rest,
                  $inc:{acc : accs} },
                );
              } else {
                await LeaveSchema.findOneAndUpdate(
                  { _id: leave_specific[change]._id },
                  { rest: last_rest ,
                    $inc:{acc : accs}}
                );
              }
            });
            await UserSchema.findOneAndUpdate(
              { m_code: user.m_code },
              { $inc: { remaining_leave: -taked, leave_taked: -taked } }
            );
            var d1 = moment(leavestart).format("YYYY-MM-DD");
            var d2 = moment(leaveend).format("YYYY-MM-DD");
            if (split_date(d1, d2) && type != "Congé de maternité") {
              var first = first_part(d1);
              var second = second_part(d1, d2);
              new_leave.date_start = first[0];
              new_leave.date_end = first[1];
              new_leave.duration = first[2];
              new_leave.rest = new_leave.rest + second[2];
              new_leave.acc = new_leave.acc + second[2];
              await LeaveSchema(new_leave).save();
              new_leave.date_start = second[0];
              new_leave.date_end = second[1];
              new_leave.duration = second[2];
              new_leave.rest = new_leave.rest - second[2];
              new_leave.acc = new_leave.acc - second[2];
              await LeaveSchema(new_leave).save();
              //await arrangeAccumulate(code, leavestart);
              await conge_define(req);
              await checkleave();
              res.send("Ok");
            } else {
              await LeaveSchema(new_leave).save();
              //await arrangeAccumulate(code, leavestart);
              await conge_define(req);
              await checkleave();
              res.send("Ok");
            }
          } else if (
            type == "Mise a Pied" ||
            type == "Permission exceptionelle" ||
            type == "Repos Maladie" ||
            type == "Congé de maternité" ||
            type == "Absent" ||
            type == "Congé sans solde"
          ) {
            if (deduire.includes(type)) {
              deduction = " ( a déduire sur salaire )";
            }
            var day_control = "Terminée";
            if (taked >= 1) {
              day_control = "en attente";
            }
            var rest = "";
            for (c = 0; c < leave_specific.length; c++) {
              if (date_diff(leavestart, leave_specific[c].date_start) > 0) {
                if (leave_specific[c - 1]) {
                  if (rest == "") {
                    rest = leave_specific[c - 1].rest;
                    last_acc = leave_specific[c - 1].acc
                  }
                } else {
                  if (rest == "") {
                    if (leave_specific[c].type.includes("Congé Payé")) {
                      rest =
                        leave_specific[c].rest + leave_specific[c].duration;
                        last_acc = leave_specific[c].acc + leave_specific[c].duration
                    } else {
                      rest = leave_specific[c].rest;
                      last_acc = leave_specific[c].acc
                    }
                  }
                }
              }
            }
            if (rest == "") {
              rest = user.remaining_leave;
              last_acc = user.leave_taked
            }
            var new_leave = {
              m_code: user.m_code,
              num_agent: user.num_agent,
              nom: user.first_name + " " + user.last_name,
              date_start: leavestart,
              date_end: leaveend,
              duration: taked,
              hour_begin: hour_begin,
              hour_end: hour_end,
              type: type + deduction,
              status: day_control,
              rest: rest,
              motif: motif,
              validation: false,
              acc: last_acc,
            };
            var d1 = moment(leavestart).format("YYYY-MM-DD");
            var d2 = moment(leaveend).format("YYYY-MM-DD");
            if (split_date(d1, d2) && type != "Congé de maternité") {
              var first = first_part(d1);
              var second = second_part(d1, d2);
              new_leave.date_start = first[0];
              new_leave.date_end = first[1];
              new_leave.duration = first[2];
              await LeaveSchema(new_leave).save();
              new_leave.date_start = second[0];
              new_leave.date_end = second[1];
              new_leave.duration = second[2];
              await LeaveSchema(new_leave).save();
              //await arrangeAccumulate(code, leavestart);
              await conge_define(req);
              await checkleave();

              res.send("Ok");
            } else {
              await LeaveSchema(new_leave).save();
              //await arrangeAccumulate(code, leavestart);
              await conge_define(req);
              await checkleave();
              res.send("Ok");
            }
          } else {
            res.send("not authorized");
          }
        }
  } else {
    res.redirect("/");
  }
});
function split_date(date1, date2) {
  var month1 = date1.split("-")[1];
  var month2 = date2.split("-")[1];
  if (month1 != month2) {
    return true;
  } else {
    return false;
  }
}
function first_part(date1) {
  var date = [];
  var length = 0;
  var month = date1.split("-")[1];
  date.push(date1);
  while (month == date1.split("-")[1]) {
    length++;
    date1 = moment(date1).add(1, "days").format("YYYY-MM-DD");
  }
  date.push(moment(date1).add(-1, "days").format("YYYY-MM-DD"));
  date.push(length);
  return date;
}
function second_part(date1, date2) {
  var date = [];
  var length = 1;
  var month = date2.split("-")[1];
  while (date1 != date2) {
    if (date1.split("-")[1] == month) {
      length++;
      date.length == 0 ? date.push(date1) : "";
    }
    date1 = moment(date1).add(1, "days").format("YYYY-MM-DD");
  }
  length == 1 ? date.push(date2) : "";
  date.push(date2);
  date.push(length);
  return date;
}
routeExp.route("/editleave").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin") {
    var code = req.body.code;
    var type = req.body.type;
    var leavestart = req.body.leavestart;
    var leaveend = req.body.leaveend;
    var val = req.body.court;
    var hour_begin = req.body.begin;
    var hour_end = req.body.end;
    var motif = req.body.motif;
    var id = req.body.id;
    var deduction = " ( rien à deduire )";
        var user = await UserSchema.findOne({ m_code: code });
        var taked;
        var leave_edit = await LeaveSchema.findOne({ _id: id });
        var leave_specific = await LeaveSchema.find({
          m_code: user.m_code,
          validation: false,
          date_start: {
            $regex: moment(leavestart).format("YYYY"),
            $options: "i",
          },
        }).sort({
          date_start: 1,
        });
        if (
          checkduplicata2(
            leave_specific,
            leavestart,
            leaveend,
            leave_edit.date_start,
            leave_edit.date_end
          ) &&
          (val == "n" || val == "1")
        ) {
          res.send("duplicata");
        } else {
          if (val == "n") {
            taked = date_diff(leavestart, leaveend) + 1;
          } else {
            if (val == 0.5) {
              leaveend = leavestart;
              taked = val;
            } else {
              leaveend = leavestart;
              taked = val;
            }
          }
          var last_acc = 0;
          if (user.leave_stat == "y" && type == "Congé Payé") {
            await LeaveSchema.findOneAndDelete({ _id: id });
            leave_specific = await LeaveSchema.find({
              m_code: user.m_code,
              date_start: { $regex: moment().format("YYYY"), $options: "i" },
            }).sort({
              date_start: 1,
            });
            if (leave_edit.type.includes("Congé Payé")) {
              user = await UserSchema.findOneAndUpdate(
                { m_code: user.m_code },
                {
                  $inc: {
                    remaining_leave: leave_edit.duration,
                    leave_taked: leave_edit.duration,
                  },
                },
                { new: true, useFindAndModify: false }
              );
            }
            if (deduire.includes(type)) {
              deduction = " ( a déduire sur salaire )";
            }
            var day_control = "Terminée";
            if (taked >= 1) {
              day_control = "en attente";
            }
            //ARRANge
            var rest = "";
            var accs = leave_edit.duration - taked;
            var indice_change = [];
            for (c = 0; c < leave_specific.length; c++) {
              if (date_diff(leavestart, leave_specific[c].date_start) > 0) {
                if (leave_specific[c - 1]) {
                  if (rest == "") {
                    if (
                      leave_edit.type.includes("Congé Payé") &&
                      date_diff(leave_edit.date_start, leavestart) > 0
                    ) {
                      rest =
                        leave_specific[c - 1].rest +
                        leave_edit.duration -
                        taked;
                        last_acc =
                        leave_specific[c - 1].acc +
                        leave_edit.duration -
                        taked;
                      //console.log("Azo " + rest + " " + leave_specific[c-1].date_start)
                    } else {
                      rest = leave_specific[c - 1].rest - taked;
                      last_acc = leave_specific[c - 1].last_acc - taked;
                      //console.log("Azo " + rest + " " + leave_specific[c-1].date_start)
                    }
                  }
                } else {
                  if (rest == "") {
                    if (leave_specific[c].type.includes("Congé Payé")) {
                      rest =
                        leave_specific[c].rest +
                        leave_specific[c].duration +
                        leave_edit.duration -
                        taked;
                        last_acc =
                        leave_specific[c].acc +
                        leave_specific[c].duration +
                        leave_edit.duration -
                        taked;
                      //console.log("Azo " + rest + " " + leave_specific[c].date_start)
                    } else {
                      rest =
                        leave_specific[c].rest - taked + leave_edit.duration;
                        last_acc =
                        leave_specific[c].acc - taked + leave_edit.duration;
                      //console.log("Azo " + rest + " " + leave_specific[c].date_start)
                    }
                  }
                }

                indice_change.push(c);
              } else {
                var year_change = await LeaveSchema.find({
                  m_code: user.m_code,
                  date_start: {
                    $regex: moment().add(1, "years").format("YYYY"),
                    $options: "i",
                  },
                })
                  .sort({
                    date_start: 1,
                  })
                  .limit(1);
                if (year_change) {
                  if (rest == "") {
                    leave_specific[leave_specific.length - 1].rest - taked;
                  }
                }
              }
              if (
                leave_edit.type.includes("Congé Payé") &&
                date_diff(leave_edit.date_start, leave_specific[c].date_start) >
                  0
              ) {
                await LeaveSchema.findOneAndUpdate(
                  { _id: leave_specific[c]._id },
                  { rest: leave_specific[c].rest + leave_edit.duration, $inc:{acc:accs} }
                );
              }
            }
            if (rest == "") {
              rest = user.remaining_leave - taked;
              last_acc = user.leave_taked - taked;
            }
            var new_leave = {
              m_code: user.m_code,
              num_agent: user.num_agent,
              nom: user.first_name + " " + user.last_name,
              date_start: leavestart,
              date_end: leaveend,
              duration: taked,
              hour_begin: hour_begin,
              hour_end: hour_end,
              type: type + deduction,
              status: day_control,
              rest: rest,
              motif: motif,
              validation: false,
              acc: last_acc,
            };
            var last_rest = rest;
            indice_change.forEach(async (change) => {
              if (leave_specific[change].type.includes("Congé Payé")) {
                last_rest = last_rest - leave_specific[change].duration;
                await LeaveSchema.findOneAndUpdate(
                  { _id: leave_specific[change]._id },
                  { rest: last_rest , $inc:{acc:accs}}
                );
              } else {
                await LeaveSchema.findOneAndUpdate(
                  { _id: leave_specific[change]._id },
                  { rest: last_rest , $inc:{acc:accs} }
                );
              }
            });
            await UserSchema.findOneAndUpdate(
              { m_code: user.m_code },
              { $inc: { remaining_leave: -taked, leave_taked: -taked } }
            );
            var d1 = moment(leavestart).format("YYYY-MM-DD");
            var d2 = moment(leaveend).format("YYYY-MM-DD");
            if (split_date(d1, d2) && type != "Congé de maternité") {
              var first = first_part(d1);
              var second = second_part(d1, d2);
              new_leave.date_start = first[0];
              new_leave.date_end = first[1];
              new_leave.duration = first[2];
              new_leave.rest = new_leave.rest + second[2];
              new_leave.acc = new_leave.acc + second[2];
              await LeaveSchema(new_leave).save();
              new_leave.date_start = second[0];
              new_leave.date_end = second[1];
              new_leave.duration = second[2];
              new_leave.rest = new_leave.rest - second[2];
              new_leave.acc = new_leave.acc - second[2];
              await LeaveSchema(new_leave).save();
              //await arrangeAccumulate(code, leavestart);
              await conge_define(req);
              await checkleave();
              res.send("Ok");
            } else {
              await LeaveSchema(new_leave).save();
              //await arrangeAccumulate(code, leavestart);
              await conge_define(req);
              await checkleave();
              res.send("Ok");
            }
          } else if (
            type == "Mise a Pied" ||
            type == "Permission exceptionelle" ||
            type == "Repos Maladie" ||
            type == "Congé de maternité" ||
            type == "Absent" ||
            type == "Congé sans solde"
          ) {
            await LeaveSchema.findOneAndDelete({ _id: id });
            leave_specific = await LeaveSchema.find({
              m_code: user.m_code,
              date_start: { $regex: moment().format("YYYY"), $options: "i" },
            }).sort({
              date_start: 1,
            });
            if (leave_edit.type.includes("Congé Payé")) {
              user = await UserSchema.findOneAndUpdate(
                { m_code: user.m_code },
                {
                  $inc: {
                    remaining_leave: leave_edit.duration,
                    leave_taked: leave_edit.duration,
                  },
                },
                { new: true, useFindAndModify: false }
              );
            }
            if (deduire.includes(type)) {
              deduction = " ( a déduire sur salaire )";
            }
            var day_control = "Terminée";
            if (taked >= 1) {
              day_control = "en attente";
            }
            var rest = "";
            for (c = 0; c < leave_specific.length; c++) {
              if (date_diff(leavestart, leave_specific[c].date_start) > 0) {
                if (leave_specific[c - 1]) {
                  if (rest == "") {
                    rest = leave_specific[c - 1].rest;
                    last_acc = leave_specific[c - 1].acc;
                  }
                } else {
                  if (rest == "") {
                    if (leave_specific[c].type.includes("Congé Payé")) {
                      rest =
                        leave_specific[c].rest + leave_specific[c].duration;
                        last_acc =
                        leave_specific[c].last_acc + leave_specific[c].duration;
                    } else {
                      rest = leave_specific[c].rest;
                      last_acc = leave_specific[c].last_acc;
                    }
                  }
                }
                if (
                  leave_edit.type.includes("Congé Payé") &&
                  date_diff(
                    leave_edit.date_start,
                    leave_specific[c].date_start
                  ) > 0
                ) {
                  await LeaveSchema.findOneAndUpdate(
                    { _id: leave_specific[c]._id },
                    { rest: leave_specific[c].rest + leave_edit.duration }
                  );
                }
              } else {
                var year_change = await LeaveSchema.find({
                  m_code: user.m_code,
                  date_start: {
                    $regex: moment().add(1, "years").format("YYYY"),
                    $options: "i",
                  },
                })
                  .sort({
                    date_start: 1,
                  })
                  .limit(1);
                if (year_change) {
                  if (rest == "") {
                    leave_specific[leave_specific.length - 1].rest;
                  }
                }
              }
            }
            if (rest == "") {
              rest = user.remaining_leave;
              last_acc = user.leave_taked;
            }
            var new_leave = {
              m_code: user.m_code,
              num_agent: user.num_agent,
              nom: user.first_name + " " + user.last_name,
              date_start: leavestart,
              date_end: leaveend,
              duration: taked,
              hour_begin: hour_begin,
              hour_end: hour_end,
              type: type + deduction,
              status: day_control,
              rest: rest,
              motif: motif,
              validation: false,
              acc: last_acc,
            };
            var d1 = moment(leavestart).format("YYYY-MM-DD");
            var d2 = moment(leaveend).format("YYYY-MM-DD");
            if (split_date(d1, d2) && type != "Congé de maternité") {
              var first = first_part(d1);
              var second = second_part(d1, d2);
              new_leave.date_start = first[0];
              new_leave.date_end = first[1];
              new_leave.duration = first[2];
              await LeaveSchema(new_leave).save();
              new_leave.date_start = second[0];
              new_leave.date_end = second[1];
              new_leave.duration = second[2];
              await LeaveSchema(new_leave).save();
              //await arrangeAccumulate(code, leavestart);
              await conge_define(req);
              await checkleave();
              res.send("Ok");
            } else {
              await LeaveSchema(new_leave).save();
              //await arrangeAccumulate(code, leavestart);
              await conge_define(req);
              await checkleave();
              res.send("Ok");
            }
          } else {
            res.send("not authorized");
          }
        }
  } else {
    res.redirect("/");
  }
});

routeExp.route("/delete_leave").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin") {
    var code = req.body.code;
    var id = req.body.id;
        var user = await UserSchema.findOne({ m_code: code });
        var leave_delete = await LeaveSchema.findOne({ _id: id });
        await LeaveSchema.findOneAndDelete({ _id: id });
        var leave_specific = await LeaveSchema.find({
          m_code: user.m_code,
          validation: false,
          date_start: {
            $regex: moment(leave_delete.date_start).format("YYYY"),
            $options: "i",
          },
        }).sort({
          date_start: 1,
        });
        if (leave_delete.type.includes("Congé Payé")) {
          await UserSchema.findOneAndUpdate(
            { m_code: user.m_code },
            {
              $inc: {
                remaining_leave: leave_delete.duration,
                leave_taked: leave_delete.duration,
              },
            }
          );
        }
        for (c = 0; c < leave_specific.length; c++) {
          if (
            date_diff(leave_delete.date_start, leave_specific[c].date_start) >
              0 &&
            leave_delete.type.includes("Congé Payé")
          ) {
            await LeaveSchema.findOneAndUpdate(
              { _id: leave_specific[c]._id },
              { $inc: { rest: leave_delete.duration } }
            );
          }
        }
        await arrangeAccumulate(code, leave_delete.date_start);
        res.send("Ok");
  } else {
    res.redirect("/");
  }
});

function checkduplicata(leave, st, ed) {
  var value = false;
  for (l = 0; l < leave.length; l++) {
    var all_date = date_concerning(
      moment(leave[l].date_start).format("YYYY-MM-DD"),
      moment(leave[l].date_end).format("YYYY-MM-DD")
    );
    if (
      all_date.includes(moment(st).format("YYYY-MM-DD")) ||
      all_date.includes(moment(ed).format("YYYY-MM-DD"))
    ) {
      value = true;
    }
  }
  return value;
}
function date_concerning(date1, date2) {
  var all_date = [];
  if (date2 == date1) {
    date1 = moment(date1).format("YYYY-MM-DD");
    all_date.push(date1);
    return all_date;
  } else {
    date1 = moment(date1).format("YYYY-MM-DD");
    date2 = moment(date2).format("YYYY-MM-DD");
    while (date1 != date2) {
      all_date.push(date1);
      date1 = moment(date1).add(1, "days").format("YYYY-MM-DD");
    }
    all_date.push(date2);
    return all_date;
  }
}
function checkduplicata2(leave, st, ed, st1, ed1) {
  var value = false;
  var all_date = date_concerning2(
    moment(st).format("YYYY-MM-DD"),
    moment(ed).format("YYYY-MM-DD"),
    moment(st1).format("YYYY-MM-DD"),
    moment(ed1).format("YYYY-MM-DD")
  );
  for (l = 0; l < leave.length; l++) {
    if (
      all_date.includes(moment(leave[l].date_start).format("YYYY-MM-DD")) ||
      all_date.includes(moment(leave[l].date_end).format("YYYY-MM-DD"))
    ) {
      value = true;
    }
  }
  return value;
}
function date_concerning2(date1, date2, date3, date4) {
  var all_date = [];
  var not_in = date_concerning(date3, date4);
  if (date2 == date1) {
    date1 = moment(date1).format("YYYY-MM-DD");
    if (not_in.includes(date1)) {
    } else {
      all_date.push(date1);
    }

    return all_date;
  } else {
    date1 = moment(date1).format("YYYY-MM-DD");
    date2 = moment(date2).format("YYYY-MM-DD");

    while (date1 != date2) {
      if (not_in.includes(date1)) {
        date1 = moment(date1).add(1, "days").format("YYYY-MM-DD");
      } else {
        all_date.push(date1);
        date1 = moment(date1).add(1, "days").format("YYYY-MM-DD");
      }
    }
    if (not_in.includes(date2)) {
    } else {
      all_date.push(date2);
    }

    return all_date;
  }
}
async function leave_permission() {
      var user_allowed = await UserSchema.find({});
      for (a = 0; a < user_allowed.length; a++) {
        if (
          difference_year(user_allowed[a].save_at) &&
          user_allowed[a].leave_stat == "n"
        ) {
          await UserSchema.findOneAndUpdate(
            { m_code: user_allowed[a].m_code },
            { leave_stat: "y" }
          );
        }
      }
}
async function conge_define(req) {
      try {
        var all_leave1 = await LeaveSchema.find({ status: "en attente" });
        for (i = 0; i < all_leave1.length; i++) {
          if (moment().format("YYYY-MM-DD") == all_leave1[i].date_start) {
            if (all_leave1[i].duration >= 1) {
              await UserSchema.findOneAndUpdate(
                { m_code: all_leave1[i].m_code },
                { act_stat: "VACATION", act_loc: "Not defined" }
              );
              await LeaveSchema.findOneAndUpdate(
                { _id: all_leave1[i]._id },
                { status: "en cours" }
              );
              const io = req.app.get("io");
              io.sockets.emit(
                "status",
                "VACATION" + "," + all_leave1[i].m_code
              );
            } else {
              await LeaveSchema.findOneAndUpdate(
                { _id: all_leave1[i]._id },
                { status: "Terminée" }
              );
            }
          } else if (
            date_diff(moment().format("YYYY-MM-DD"), all_leave1[i].date_start) <
            0
          ) {
            if (
              date_diff(
                moment().format("YYYY-MM-DD"),
                all_leave1[i].date_start
              ) *
                -1 <
                all_leave1[i].duration &&
              all_leave1[i].duration > 1
            ) {
              await UserSchema.findOneAndUpdate(
                { m_code: all_leave1[i].m_code },
                { act_stat: "VACATION", act_loc: "Not defined" }
              );
              await LeaveSchema.findOneAndUpdate(
                { _id: all_leave1[i]._id },
                { status: "en cours" }
              );
              const io = req.app.get("io");
              io.sockets.emit(
                "status",
                "VACATION" + "," + all_leave1[i].m_code
              );
            } else {
              await LeaveSchema.findOneAndUpdate(
                { _id: all_leave1[i]._id },
                { status: "Terminée" }
              );
            }
          }
        }
      } catch (error) {
        await conge_define(req);
      }
}
//checkleave
async function checkleave() {
      try {
        var all_leave2 = await LeaveSchema.find({ status: "en cours" });
        for (j = 0; j < all_leave2.length; j++) {
          if (
            date_diff(moment().format("YYYY-MM-DD"), all_leave2[j].date_end) < 0
          ) {
            await UserSchema.findOneAndUpdate(
              { m_code: all_leave2[j].m_code },
              { act_stat: "LEFTING" }
            );
            await LeaveSchema.findOneAndUpdate(
              { _id: all_leave2[j]._id },
              { status: "Terminée" }
            );
            var temp_notif = all_leave2[j].nom + " devrait revenir du congé";
            await Notif.findOneAndUpdate(
              { _id: "64f1e60ae3038813b45c2db1" },
              { $push: { notifications: temp_notif } }
            );
          }
        }
      } catch (error) {
        await checkleave();
      }
}
routeExp.route("/fiche").get(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin") {
        var opt = await OptSchema.findOne({ _id: "636247a2c1f6301f15470344" });
        var notif = await Notif.findOne({ _id: "64f1e60ae3038813b45c2db1" });
        res.render("PageAdministration/CalculPaie.html", {
          opt: opt,
          username: session.mailing,
          notif: notif.notifications,
        });
  } else {
    res.redirect("/");
  }
});
//Profil_change
routeExp.route("/profil").post(async function (req, res) {
  await put_profil(req.files["fileup"], req.body.names, req.session, res);
});
async function put_profil(file, name, session, res) {
      try {
        file.mv("public/Profil/" + change_to_mcode(name, session.m_code));
        await UserSchema.findOneAndUpdate(
          { m_code: session.m_code },
          { profil: change_to_mcode(name, session.m_code) }
        );
        await OptSchema.findOneAndUpdate(
          { _id: "636247a2c1f6301f15470344" },
          { $pull: { warn_user: session.m_code } }
        );
        res.send("Ok");
      } catch (error) {
        res.send("error");
      }
}
function change_to_mcode(namefile, mcode) {
  namefile = namefile.split(".");
  return mcode + "." + namefile[1];
}
//Paie code
routeExp.route("/paie").post(function (req, res) {
  // When a file has been uploaded
  var start = req.body.start;
  var end = req.body.end;
  var ouvrable = req.body.ouvrable;
  var ouvre = req.body.ouvre;
  var calendaire = req.body.calendaire;
  var sme = req.body.sme;
  var transport = req.body.transport;
  var repas = req.body.repas;
  req.files["fileup"].mv(req.files["fileup"].name);
  setTimeout(() => {
    readfile(
      req.files["fileup"].name,
      res,
      start,
      end,
      ouvrable,
      ouvre,
      calendaire,
      sme,
      repas,
      transport
    );
  }, 3000);
});
async function readfile(
  name_file,
  res,
  start,
  end,
  ouvrable,
  ouvres,
  calendaire,
  sme,
  rep,
  trans
) {
      await OptSchema.findOneAndUpdate(
        { _id: "636247a2c1f6301f15470344" },
        { sme_cnaps: sme, lunch_value: rep, transport_value: trans }
      );
      const file = ExcelFile.readFile(name_file);
      let data = [];
      const temp = ExcelFile.utils.sheet_to_json(
        file.Sheets[file.SheetNames[0]]
      );
      temp.forEach((res) => {
        data.push(res);
      });
      list_paie = [];
      fs.unlink(name_file, function (err) {
        if (err) {
          console.error(err);
        }
        console.log("Excel file deleted");
      });
      test_paie(
        data,
        0,
        res,
        start,
        end,
        ouvrable,
        ouvres,
        calendaire,
        sme,
        rep,
        trans
      );
}
var list_paie = [];
var excel_paie = [];
function test_paie(
  data,
  number,
  res,
  start,
  end,
  ouvrable,
  ouvres,
  calendaire,
  sme,
  rep,
  trans
) {
  try {
    var m_code = data[number]["M-Code"];
    var nom = data[number]["Nom & Prénoms"];
    var salaire = parseFloat(data[number]["Salaire De Base"]);
    var salaire_brut = parseFloat(data[number]["Salaire Brute"]);
    var hs30 = parseFloat(data[number]["Heure Supple 30"]);
    var hs50 = parseFloat(data[number]["Heure Supple 50"]);
    var hs100 = parseFloat(data[number]["Heure Supple 100"]);
    // var nuit_occ = parseFloat(data[number]["NUIT OCCASIONNELLE"]);
    var rendement = parseFloat(data[number]["RENDEMENT"]);
    var soir = parseFloat(data[number]["Total Maj Nuit"]);
    // var ferie = parseFloat(data[number]["TOTAL MAJ FERIE"]);
    var weekend = parseFloat(data[number]["Total Maj Week End"]);
    var transport = parseFloat(data[number]["Déplacement"]);
    var repas = parseFloat(data[number]["Nombre Repas"]);
    var autres_exceptionelle = parseFloat(
      data[number]["Autres ou Exceptionnelles"]
    );
    var gratification = parseFloat(data[number]["Gratification"]);
    var conge_payes = parseFloat(data[number]["Nombre Congé"]);
    var conge_avg = parseFloat(data[number]["Congé Moyenne"]);
    //var maladie = parseFloat(data[number]["Maladie"]);
    var salaire_imposable = 0;
    var abbatement_enfant = parseFloat(data[number]["Enfant"]);
    var irsa = 0;
    var irsa_brut = 0;
    sme = ((sme * 8) / 100) * 2;
    var rest_co = 0;
    //Variable stockage
    var gain_base = 0;
    var gain_hs30 = 0;
    var gain_hs50 = 0;
    var gain_cp = 0;
    var gain_hs100 = 0;
    var gain_transport = 0;
    var gain_repas = 0;
    //var gain_maladie = 0
    var gain_soir = 0;
    var rendement = 0;
    // var gain_occ;
    var gain_week;
    // var gain_ferie;

    var ret_cnaps_ostie = 0;
    var gain_enf = 0;
    var ret_avance = parseFloat(data[number]["Avance"]);
    var gain_remb = parseFloat(data[number]["Remboursement"]);
    var ret_remb = parseFloat(data[number]["Réajustement"]);
    // var ret_base = 0;

    gains_global(salaire, conge_payes, conge_avg);
    heure_supp130(salaire, hs30);
    heure_supp150(salaire, hs50);
    heure_supp200(salaire, hs100);
    transport_func(transport);
    repas_func(repas);
    //calcul_maladie(maladie);
    maj_nuit(salaire, soir);
    // nuit_occasionel(salaire, nuit_occ);
    // maj_ferie(salaire, ferie);
    maj_weekend(salaire, weekend);
    calcul_rendement(salaire_brut, gain_base, gain_transport, gain_repas);
    abbatement_enfant_func(abbatement_enfant);
    var total_gain =
      gain_base +
      gain_cp +
      gain_hs30 +
      gain_hs50 +
      gain_hs100 +
      gain_transport +
      rendement +
      gain_repas +
      autres_exceptionelle +
      gratification +
      gain_soir +
      gain_week +
      gain_remb;

    cnaps_ostie(total_gain);
    salaire_imposable = total_gain - ret_cnaps_ostie;
    calcul_irsa(salaire_imposable);
    var total_ret = ret_cnaps_ostie + ret_avance + parseFloat(irsa) + ret_remb;
    var final = arrondir(
      parseFloat((total_gain - total_ret + rest_co).toFixed(0))
    );
    //Replace PDF
    const replaceText = async () => {
      try {
        const pdfdoc = await PDFNet.PDFDoc.createFromFilePath("Template.pdf");
        await pdfdoc.initSecurityHandler();
        const replacer = await PDFNet.ContentReplacer.create();
        const page = await pdfdoc.getPage(1);
        //En tête
        var user_get = await UserSchema.findOne({ m_code: m_code });
        //Via base de donnée
        if (user_get) {
        } else {
          user_get = {
            matr: "_____________",
            usuel: "_____________",
            project: "_____________",
            cin: "_____________",
            adresse: "_____________",
            cnaps_num: "_____________",
            save_at: "_____________",
            classification: "_____________",
            contrat: "_____________",
            leave_taked: "__",
            remaining_leave: "__",
            date_fin: "__________",
          };
        }
        await replacer.addString("matr", getting_null(user_get.matr));
        await replacer.addString("name_user", nom);
        await replacer.addString("first_name", getting_null(user_get.usuel));
        await replacer.addString("m_code", getting_null(m_code));
        await replacer.addString("occ_user", getting_null(user_get.project));
        await replacer.addString("cin_user", getting_null(user_get.cin));
        await replacer.addString("adr_user", getting_null(user_get.adresse));
        await replacer.addString("num_cnaps", getting_null(user_get.cnaps_num));
        await replacer.addString("enter_user", getting_null(user_get.save_at));
        await replacer.addString(
          "class_user",
          getting_null(user_get.classification)
        );
        await replacer.addString(
          "contract_user",
          getting_null(user_get.contrat)
        );
        await replacer.addString("start_d", moment(start).format("DD/MM/YYYY"));
        await replacer.addString("fin_d", moment(end).format("DD/MM/YYYY"));
        await replacer.addString("fin_c", user_get.date_fin);
        await replacer.addString("nbr_o1", ouvrable);
        await replacer.addString("nbr_o2", ouvres);
        await replacer.addString("nbr_ca", calendaire);
        await replacer.addString("irsa_brut", null_value(irsa_brut.toFixed(2)));
        await replacer.addString(
          "conge_ac",
          getting_null(parseFloat(user_get.leave_taked))
        );
        await replacer.addString("an_act", moment().format("YYYY"));
        await replacer.addString("c_r", getting_null(user_get.remaining_leave));
        //Corps
        await replacer.addString("basic_sal", null_value(salaire.toFixed(0)));

        await replacer.addString(
          "somme_gain",
          null_value(gain_base.toFixed(2))
        );
        await replacer.addString("ret_base", "");

        await replacer.addString("nbr_hs30", null_value(hs30.toFixed(1)));
        await replacer.addString("gain_hs30", null_value(gain_hs30.toFixed(2)));

        await replacer.addString("nbr_hs50", null_value(hs50.toFixed(1)));
        await replacer.addString("gain_hs50", null_value(gain_hs50.toFixed(2)));

        await replacer.addString("nbr_hs100", null_value(hs100.toFixed(1)));
        await replacer.addString(
          "gain_hs100",
          null_value(gain_hs100.toFixed(2))
        );

        await replacer.addString("nbr_trans", null_value(transport.toFixed(1)));
        await replacer.addString(
          "gain_trans",
          null_value(gain_transport.toFixed(2))
        );

        await replacer.addString("nbr_repas", null_value(repas.toFixed(1)));
        await replacer.addString(
          "gain_repas",
          null_value(gain_repas.toFixed(2))
        );

        await replacer.addString("gain_rend", null_value(rendement.toFixed(2)));

        await replacer.addString("nbr_soir", null_value(soir.toFixed(1)));
        await replacer.addString("gain_soir", null_value(gain_soir.toFixed(2)));

        await replacer.addString(
          "gain_divers",
          null_value((autres_exceptionelle + gratification).toFixed(2))
        );

        // await replacer.addString("nbr_ferie", null_value(ferie.toFixed(1)));
        // await replacer.addString("gain_ferie", null_value(gain_ferie.toFixed(2)));

        await replacer.addString("nbr_week", null_value(weekend.toFixed(1)));
        await replacer.addString("gain_week", null_value(gain_week.toFixed(2)));

        await replacer.addString("nbr_cp", null_value(conge_payes.toFixed(1)));
        await replacer.addString("gain_cp", null_value(gain_cp.toFixed(2)));

        await replacer.addString("gain_préavis", "");
        await replacer.addString("ret_preavis", "");

        await replacer.addString(
          "ret_cnaps",
          null_value((ret_cnaps_ostie / 2).toFixed(2))
        );
        await replacer.addString(
          "ret_ostie",
          null_value((ret_cnaps_ostie / 2).toFixed(2))
        );

        await replacer.addString(
          "sal_impos",
          null_value(salaire_imposable.toFixed(2))
        );

        await replacer.addString(
          "nbr_enfant",
          null_value(abbatement_enfant.toFixed(0))
        );
        await replacer.addString("gain_enf", null_value(gain_enf.toFixed(2)));

        await replacer.addString("ret_irsa", null_value(irsa.toFixed(2)));
        await replacer.addString(
          "ret_avance",
          null_value(ret_avance.toFixed(0))
        );

        await replacer.addString("gain_remb", null_value(gain_remb.toFixed(2)));
        await replacer.addString("ret_remb", null_value(ret_remb.toFixed(2)));

        await replacer.addString("tot_gain", null_value(total_gain.toFixed(2)));
        await replacer.addString("tot_ret", null_value(total_ret.toFixed(2)));
        await replacer.addString("sal_fin", null_value(final.toFixed(0)));

        await replacer.process(page);
        var output_path = "./public/Paie/" + m_code + ".pdf";

        pdfdoc.save(output_path, PDFNet.SDFDoc.SaveOptions.e_linearized);
        //excel_paie.push([nom,m_code,num_agent,gain_soir.toFixed(2),gain_occ.toFixed(2),gain_week.toFixed(2),gain_ferie.toFixed(2),gain_hs30.toFixed(2),gain_hs50.toFixed(2),gain_hs100.toFixed(2),gain_repas.toFixed(2),gain_transport.toFixed(2),rendement.toFixed(2),])
      } catch (error) {
        console.log(error);
        res.send("Erreur sur " + data[number]["M-CODE"]);
        number = data * 2;
      }
    };
    PDFNet.runWithCleanup(
      replaceText,
      "demo:ricardoramandimbisoa@gmail.com:7afedebe02000000000e72b195b776c08a802c3245de93b77462bc8ad6"
    ).then(() => {
      list_paie.push([m_code, nom]);
      if (number + 1 < data.length) {
        test_paie(
          data,
          number + 1,
          res,
          start,
          end,
          ouvrable,
          ouvres,
          calendaire,
          sme,
          rep,
          trans
        );
      } else {
        if (number == data.length * 2) {
        } else {
          PDFNet.shutdown();
          update_opt_paie("y", "add", list_paie);
          res.send(list_paie);
        }
      }
    });
  } catch (error) {
    console.log(error);
    res.send("Erreur veuillez réessayer ou contactez le développeur");
  }

  //Function
  function getting_null(val) {
    if (val) {
      return val + "";
    } else {
      return "aucun(e)";
    }
  }
  function gains_with(salaire_base, conge_payer) {
    return (hour_calculator(conge_payer) * salaire_base) / 173.33;
  }
  function hour_calculator(nbr) {
    return 6 * nbr;
  }
  function gains_global(salaire_base, conge_payer, conge_avg) {
    if (conge_payer == 0 || conge_avg == 0) {
      gain_base = salaire_base;
      gain_cp = 0;
      return salaire_base;
    } else {
      gain_cp = (conge_avg / 30) * conge_payer;
      gain_base = salaire_base - gains_with(300000, conge_payer);
      return gain_base;
    }
  }
  function maj_nuit(salaire_base, nuit) {
    gain_soir = (((salaire_base / 173.33) * 30) / 100) * nuit;
    return (((salaire_base / 173.33) * 30) / 100) * nuit;
  }
  function maj_weekend(salaire_base, week) {
    gain_week = (((salaire_base / 173.33) * 50) / 100) * week;
    return (((salaire_base / 173.33) * 50) / 100) * week;
  }
  function calcul_maladie(nbr) {
    gain_maladie = nbr * 15000;
    return nbr * 15000;
  }
  function maj_ferie(salaire_base, ferie) {
    gain_ferie = (((salaire_base / 173.33) * 100) / 100) * ferie;
    return (((salaire_base / 173.33) * 100) / 100) * ferie;
  }
  function heure_supp130(salaire_base, supp) {
    gain_hs30 = (((salaire_base / 173.33) * 130) / 100) * supp;
    return (((salaire_base / 173.33) * 130) / 100) * supp;
  }
  function heure_supp150(salaire_base, supp) {
    gain_hs50 = (((salaire_base / 173.33) * 150) / 100) * supp;
    return (((salaire_base / 173.33) * 150) / 100) * supp;
  }
  function heure_supp200(salaire_base, supp) {
    gain_hs100 = (((salaire_base / 173.33) * 100) / 100) * supp;
    return (((salaire_base / 173.33) * 200) / 100) * supp;
  }
  function repas_func(nbr_repas) {
    gain_repas = nbr_repas * rep;
    return nbr_repas * rep;
  }
  function transport_func(nbr_transport) {
    gain_transport = nbr_transport * trans;
    return nbr_transport * trans;
  }
  function cnaps_ostie(total_salaire) {
    ret_cnaps_ostie = (total_salaire / 100) * 2;
    if (ret_cnaps_ostie > sme) {
      rest_co = ret_cnaps_ostie - sme;
      ret_cnaps_ostie = sme;
      return sme;
    } else {
      return ret_cnaps_ostie;
    }
  }
  function abbatement_enfant_func(ab_enf) {
    gain_enf = ab_enf * 2000;
    return ab_enf * 2000;
  }
  function calcul_irsa(base_imp) {
    var t1 = 2500;
    var t2 = 10000;
    var t3 = 15000;

    if (base_imp <= 350000) {
      irsa = 3000 - gain_enf;
      irsa_brut = 3000;
      return 3000;
    } else if (base_imp >= 350001 && base_imp <= 400000) {
      irsa = (base_imp - 350000) * 0.05 - gain_enf;
      irsa_brut = (base_imp - 350001) * 0.05;
      return (base_imp - 350000) * 0.05;
    } else if (base_imp >= 400001 && base_imp <= 500000) {
      irsa = (base_imp - 400000) * 0.1 + t1 - gain_enf;
      irsa_brut = (base_imp - 400000) * 0.1 + t1;
      return (base_imp - 400000) * 0.1 + t1;
    } else if (base_imp >= 500001 && base_imp <= 600000) {
      irsa = (base_imp - 500000) * 0.15 + t1 + t2 - gain_enf;
      irsa_brut = (base_imp - 500000) * 0.15 + t1 + t2;
      return (base_imp - 500000) * 0.15 + t1 + t2;
    } else {
      irsa = (base_imp - 600000) * 0.2 + t1 + t2 + t3 - gain_enf;
      irsa_brut = (base_imp - 600000) * 0.2 + t1 + t2 + t3;
      return (base_imp - 600000) * 0.2 + t1 + t2 + t3;
    }
  }
  function calcul_rendement(brute, salaire_correspondant, depl, rep) {
    if (brute != 0) {
      rendement = brute - (salaire_correspondant + depl + rep);
    }
    return rendement;
  }
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }
  function null_value(given) {
    if (given == 0 || given == "0") {
      return " ";
    } else {
      return numberWithCommas(parseFloat(given));
    }
  }
  function arrondir(nbr) {
    var string_number = nbr + "";
    var last_num = parseFloat(
      string_number[string_number.length - 2] +
        "" +
        string_number[string_number.length - 1]
    );
    if (last_num > 50) {
      return nbr + (100 - last_num);
    } else if (last_num < 50) {
      return nbr - last_num;
    } else {
      return nbr;
    }
  }
}
// Empty folder
routeExp.route("/empty").get(async function (req, res) {
  await update_opt_paie("n", "delete", "");
  extra_fs.emptyDirSync("./public/Paie");
  res.redirect("/fiche");
});
async function update_opt_paie(opt_value, action, list_paie) {
      if (action == "add") {
        await OptSchema.findOneAndUpdate(
          { _id: "636247a2c1f6301f15470344" },
          { paie_generated: opt_value, list_paie: JSON.stringify(list_paie) }
        );
      } else {
        await OptSchema.findOneAndUpdate(
          { _id: "636247a2c1f6301f15470344" },
          { paie_generated: opt_value, list_paie: "" }
        );
      }
}
//Fin Paie code

//getuser
routeExp.route("/getuser_leave").post(async function (req, res) {
  var code = req.body.code;
      var user = await UserSchema.find(
        { status: "Actif", occupation: "User" },
        { adresse: 0, password: 0 }
      ).sort({
        m_code: 1,
      });
      var last = await LeaveSchema.findOne({
        m_code: code,
        status: "Terminée",
      }).sort({
        date_start: -1,
      });
      var upcoming = await LeaveSchema.findOne({
        m_code: code,
        status: { $ne: "Terminée" },
      }).sort({
        date_start: 1,
      });
      res.send([user, last, upcoming]);
});

//Filter leave
routeExp.route("/monthly_leave").post(async function (req, res) {
  var session = req.session;
  monthly_leave = [];
  datestart_leave = moment(req.body.datestart).format("YYYY-MM-DD");
  dateend_leave = moment(req.body.dateend).format("YYYY-MM-DD");
  if (session.occupation_a == "Admin") {
        maternity = await LeaveSchema.find({
          type: "Congé de maternité ( rien à deduire )",
          status: "en cours",
        });
        var next_date = datestart_leave;
        var last_month = moment(next_date)
          .add(-1, "months")
          .format("YYYY-MM-DD");
        while (
          dateend_leave !=
          moment(next_date).add(-1, "days").format("YYYY-MM-DD")
        ) {
          var leave_spec = await LeaveSchema.find({ date_start: next_date });
          var leave_spec2 = await LeaveSchema.find({
            date_end: next_date,
            date_start: {
              $regex: last_month.split("-")[0] + "-" + last_month.split("-")[1],
              $options: "i",
            },
          });
          monthly_leave.push(leave_spec);
          monthly_leave.push(leave_spec2);
          next_date = moment(next_date).add(1, "days").format("YYYY-MM-DD");
        }
        for (i = 1; i < monthly_leave.length; i++) {
          for (d = 0; d < monthly_leave[i].length; d++) {
            monthly_leave[0].push(monthly_leave[i][d]);
          }
        }
        monthly_leave = monthly_leave[0];
        res.send("Ok");
  } else {
    res.send("error");
  }
});
routeExp.route("/leave_report").post(async function (req, res) {
  var session = req.session;
  var month = req.body.month;
  var year = req.body.year;
  if (session.occupation_a == "Admin") {
        monthly_leave = await LeaveSchema.find({
          date_start: { $regex: year + "-" + month, $options: "i" },
          date_end: { $regex: year + "-" + month, $options: "i" },
        });
        var getting = ["en cours"];
        maternity = await LeaveSchema.find({
          type: "Congé de maternité ( rien à deduire )",
          status: { $in: getting },
        });
        var newsheet_leave = ExcelFile.utils.book_new();
        var m_leave = [];
        var leave_report = [];
        var merging = [];
        newsheet_leave.Props = {
          Title: "Rapport de congé",
          Subject: "Rapport de congé",
          Author: "Solumada",
        };
        leave_report.push([
          "Les absences et Congés " +
            moment(`${year}-${month}-01`).locale("Fr").format("MMMM YYYY"),
          "",
          "",
          "",
          "",
          "",
          "",
        ]);
        var months = moment(`${year}-${month}-01`)
          .locale("Fr")
          .format("MMMM YYYY");
        leave_report.push([
          "Numbering agent",
          "M-CODE",
          "Nombre de jours à payer et / ou de déduction sur salaire " + months,
          "",
          "",
          "",
          "Motifs - observations ou remarques",
        ]);
        leave_report.push([
          "",
          "",
          "CONGES PAYES à \n calculer par RH \n Mada car base de \n calcul sur les 12 \n derniers mois de \n salaire brut",
          "PERMISIION \n EXCEPTIONELLE \n ET/OU FERIE A \n PAYER à calculer par \n RH Maurice car \n salaire minimal",
          "REPOS MALADIE A \n PAYER à calculer par \n RH Maurice ca salaire \n minimal",
          "CONGES SANS SOLDE \n OU ABSENCE A \n DEDUIRE SUR SALAIRE \n à calculer par RH \n Maurice car salaire \n minimal",
          "",
        ]);
        newsheet_leave.SheetNames.push("Conge " + months);
        for (i = 0; i < monthly_leave.length; i++) {
          if (m_leave.includes(monthly_leave[i].num_agent)) {
          } else {
            m_leave.push(monthly_leave[i].num_agent);
          }
        }
        m_leave = m_leave.sort();
        for (m = 0; m < m_leave.length; m++) {
          var count = 0;
          for (i = 0; i < monthly_leave.length; i++) {
            if (monthly_leave[i].num_agent == m_leave[m]) {
              count++;
              if (monthly_leave[i].type.includes("Congé de maternité")) {
              } else {
                leave_report.push([
                  monthly_leave[i].num_agent,
                  monthly_leave[i].m_code,
                  conge_payer(
                    monthly_leave[i].type,
                    monthly_leave[i].duration,
                    monthly_leave[i].hour_begin,
                    monthly_leave[i].hour_end
                  ),
                  permission_exceptionelle(
                    monthly_leave[i].type,
                    monthly_leave[i].duration,
                    monthly_leave[i].hour_begin,
                    monthly_leave[i].hour_end
                  ),
                  repos_maladie(
                    monthly_leave[i].type,
                    monthly_leave[i].duration,
                    monthly_leave[i].hour_begin,
                    monthly_leave[i].hour_end
                  ),
                  sans_solde(
                    monthly_leave[i].type,
                    monthly_leave[i].duration,
                    monthly_leave[i].hour_begin,
                    monthly_leave[i].hour_end
                  ),
                  monthly_leave[i].duration == 0.25
                    ? monthly_leave[i].type +
                      motif_rendered(monthly_leave[i].motif) +
                      date_rendered(
                        monthly_leave[i].date_start,
                        monthly_leave[i].date_end,
                        monthly_leave[i].duration,
                        monthly_leave[i].hour_begin,
                        monthly_leave[i].hour_end
                      )
                    : monthly_leave[i].duration +
                      " jour(s) de " +
                      monthly_leave[i].type +
                      motif_rendered(monthly_leave[i].motif) +
                      date_rendered(
                        monthly_leave[i].date_start,
                        monthly_leave[i].date_end,
                        monthly_leave[i].duration,
                        monthly_leave[i].hour_begin,
                        monthly_leave[i].hour_end
                      ),
                ]);
              }
            }
          }
          merging.push([m, count]);
        }
        leave_report.push(["", "", "", "", "", "", ""]);
        leave_report.push(["", "", "", "", "", "", ""]);
        for (mat = 0; mat < maternity.length; mat++) {
          leave_report.push([
            maternity[mat].num_agent,
            maternity[mat].m_code,
            "Congé de maternité depuis " +
              moment(maternity[mat].date_start).format("DD/MM/YYYY") +
              " jusqu'au " +
              moment(maternity[mat].date_end).format("DD/MM/YYYY"),
          ]);
        }
        leave_report.push(["", "", ""]);
        ws_leave = ExcelFile.utils.aoa_to_sheet(leave_report);
        ws_leave["!cols"] = [
          { wpx: 100 },
          { wpx: 60 },
          { wpx: 110 },
          { wpx: 110 },
          { wpx: 110 },
          { wpx: 110 },
          { wpx: 550 },
        ];
        var row_property = [];
        for (r = 0; r < leave_report.length; r++) {
          if (r == 2) {
            row_property.push({ hpt: 90 });
          } else {
            row_property.push({ hpt: 25 });
          }
        }
        ws_leave["!rows"] = row_property;
        var merge = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
          { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } },
          { s: { r: 1, c: 1 }, e: { r: 2, c: 1 } },
          { s: { r: 1, c: 2 }, e: { r: 1, c: 5 } },
          { s: { r: 1, c: 6 }, e: { r: 2, c: 6 } },
        ];
        var last = 0;
        var field = 0;
        for (mr = 0; mr < merging.length; mr++) {
          if (merging[mr][1] > 1) {
            // merge.push({ s: { r: merging[mr][0] + 3 + last, c: 0 }, e: { r: merging[mr][0] + 3 + last + merging[mr][1] - 1, c: 0 } });
            // merge.push({ s: { r: merging[mr][0] + 3 + last, c: 1 }, e: { r: merging[mr][0] + 3 + last + merging[mr][1] - 1, c: 1 } });
            last = last + merging[mr][1] - 1;
            field++;
          }
        }
        ws_leave["!merges"] = merge;
        style3(last, maternity.length, field);
        newsheet_leave.Sheets["Conge " + months] = ws_leave;
        session.filename = "Rapport congé " + months + ".xlsx";
        ExcelFile.writeFile(newsheet_leave, session.filename);
        res.send("Ok");
  } else {
    res.send("error");
  }
});
//Leave restants
routeExp.route("/leave_left").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin") {
    var newsheet_left = ExcelFile.utils.book_new();
    var leave_left = [];
    var months = moment(datestart_leave).locale("Fr").format("MMMM YYYY");
    newsheet_left.Props = {
      Title: "Congé restants",
      Subject: "Congé restants",
      Author: "Solumada",
    };
    newsheet_left.SheetNames.push("Conge " + months);
        leave_left.push([
          "CONGES PAYES ARRETES DU MOIS DE " + months,
          "",
          "",
          "",
          "",
          "",
          "",
        ]);
        leave_left.push([
          "Nom & Prénom",
          "Numbering Agent",
          "M-code",
          "Embauche",
          "Projet(s)",
          "Congés restants",
          "Congés ouvert",
        ]);
        var data_leave_left = await UserSchema.find({
          occupation: "User",
        }).sort({
          first_name: 1,
        });
        for (dl = 0; dl < data_leave_left.length; dl++) {
          leave_left.push([
            data_leave_left[dl].first_name +
              " " +
              data_leave_left[dl].last_name,
            data_leave_left[dl].num_agent,
            data_leave_left[dl].m_code,
            moment(data_leave_left[dl].save_at).format("DD/MM/YYYY"),
            data_leave_left[dl].project,
            data_leave_left[dl].leave_taked,
            data_leave_left[dl].remaining_leave,
          ]);
        }
        leave_left.push(["", "", "", "", "", "", ""]);
        ws_left = ExcelFile.utils.aoa_to_sheet(leave_left);
        ws_left["!cols"] = [
          { wpx: 325 },
          { wpx: 125 },
          { wpx: 85 },
          { wpx: 125 },
          { wpx: 300 },
          { wpx: 125 },
          { wpx: 125 },
        ];
        var row_property = [];
        for (r = 0; r < leave_left.length; r++) {
          row_property.push({ hpt: 30 });
        }
        ws_left["!rows"] = row_property;
        const merge = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
        ws_left["!merges"] = merge;
        style4(leave_left);
        newsheet_left.Sheets["Conge " + months] = ws_left;
        session.filename = "CONGE PAYES DU MOIS " + months + ".xlsx";
        ExcelFile.writeFile(newsheet_left, session.filename);
        res.send("Ok");
  } else {
    res.send("error");
  }
});
function conge_payer(motif, number, hb, he) {
  if (motif.includes("Congé Payé")) {
    if (number == 0.25) {
      return calcul_timediff_absencereport(hb, he);
    } else {
      return number.toString().replace(".", ",") + "j";
    }
  } else {
    return "";
  }
}
function permission_exceptionelle(motif, number, hb, he) {
  if (motif.includes("Permission exceptionelle")) {
    if (number == 0.25) {
      return calcul_timediff_absencereport(hb, he);
    } else {
      return number.toString().replace(".", ",") + "j";
    }
  } else {
    return "";
  }
}
function repos_maladie(motif, number, hb, he) {
  if (motif.includes("Repos Maladie")) {
    if (number == 0.25) {
      return calcul_timediff_absencereport(hb, he);
    } else {
      return number.toString().replace(".", ",") + "j";
    }
  } else {
    return "";
  }
}
function sans_solde(motif, number, hb, he) {
  if (
    motif.includes("Absent") ||
    motif.includes("Mise a Pied") ||
    motif.includes("Congé sans solde")
  ) {
    if (number == 0.25) {
      return calcul_timediff_absencereport(hb, he);
    } else {
      return number.toString().replace(".", ",") + "j";
    }
  } else {
    return "";
  }
}
function motif_rendered(mt) {
  if (mt == "") {
    return "";
  } else {
    return " pour " + mt;
  }
}
function date_rendered(d1, d2, number, hb, he) {
  if (d1 == d2) {
    if (number == 0.25) {
      return (
        " le " +
        moment(d1).format("DD/MM/YYYY") +
        " de durée de " +
        calcul_timediff_absencereport(hb, he)
      );
    } else {
      return " le " + moment(d1).format("DD/MM/YYYY");
    }
  } else {
    return (
      " du " +
      moment(d1).format("DD/MM/YYYY") +
      " au " +
      moment(d2).format("DD/MM/YYYY")
    );
  }
}
function calcul_timediff_absencereport(startTime, endTime) {
  startTime = moment(startTime, "HH:mm:ss a");
  endTime = moment(endTime, "HH:mm:ss a");
  var duration = moment.duration(endTime.diff(startTime));
  //duration in hours
  var hours_fictif = 0;
  var minutes_fictif = 0;
  hours_fictif += parseInt(duration.asHours());

  // duration in minutes
  minutes_fictif += parseInt(duration.asMinutes()) % 60;
  if (minutes_fictif < 0) {
    hours_fictif = hours_fictif - 1;
    minutes_fictif = 60 + minutes_fictif;
  }
  while (minutes_fictif > 60) {
    hours_fictif += 1;
    minutes_fictif = minutes_fictif - 60;
  }
  if (hours_fictif < 0) {
    hours_fictif = hours_fictif + 24;
  }
  if (hours_fictif == 0) {
    return minutes_fictif + "'";
  } else if (minutes_fictif == 0) {
    return hours_fictif + "h";
  } else {
    return hours_fictif + "h" + minutes_fictif + "'";
  }
}
var individual_live = [];
//Leave stat
routeExp.route("/absence_stat").post(async function (req, res) {
  var session = req.session;
  var id = req.body.id;
  var an = req.body.an;

  var january;
  var february;
  var march;
  var april;
  var may;
  var june;
  var july;
  var august;
  var september;
  var october;
  var november;
  var december;
  var total_jouissance = 0;
  var total_conge_paye = 0;
  var total_sans_solde = 0;
  var total_ostie = 0;
  var total_permission_exceptionelle = 0;
  var total_absence = 0;
  var another = [
    "Mise a Pied ( a déduire sur salaire )",
    "Congé de maternité ( rien à deduire )",
    "Absent ( a déduire sur salaire )",
  ];
  var render_month = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "May",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  if (session.occupation_a == "Admin") {
        var user = await UserSchema.findOne({ _id: id });
        var newsheets_individual = ExcelFile.utils.book_new();
        newsheets_individual.Props = {
          Title: "Etat absence",
          Subject: "Etat absence",
          Author: "Solumada",
        };
        newsheets_individual.SheetNames.push(user.last_name);
        january = await LeaveSchema.find({
          m_code: user.m_code,
          date_start: { $regex: an + "-01", $options: "i" },
        });
        february = await LeaveSchema.find({
          m_code: user.m_code,
          date_start: { $regex: an + "-02", $options: "i" },
        });
        march = await LeaveSchema.find({
          m_code: user.m_code,
          date_start: { $regex: an + "-03", $options: "i" },
        });
        april = await LeaveSchema.find({
          m_code: user.m_code,
          date_start: { $regex: an + "-04", $options: "i" },
        });
        may = await LeaveSchema.find({
          m_code: user.m_code,
          date_start: { $regex: an + "-05", $options: "i" },
        });
        june = await LeaveSchema.find({
          m_code: user.m_code,
          date_start: { $regex: an + "-06", $options: "i" },
        });
        july = await LeaveSchema.find({
          m_code: user.m_code,
          date_start: { $regex: an + "-07", $options: "i" },
        });
        august = await LeaveSchema.find({
          m_code: user.m_code,
          date_start: { $regex: an + "-08", $options: "i" },
        });
        september = await LeaveSchema.find({
          m_code: user.m_code,
          date_start: { $regex: an + "-09", $options: "i" },
        });
        october = await LeaveSchema.find({
          m_code: user.m_code,
          date_start: { $regex: an + "-10", $options: "i" },
        });
        november = await LeaveSchema.find({
          m_code: user.m_code,
          date_start: { $regex: an + "-11", $options: "i" },
        });
        december = await LeaveSchema.find({
          m_code: user.m_code,
          date_start: { $regex: an + "-12", $options: "i" },
        });
        individual_live.push([
          user.first_name,
          user.last_name,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]);
        individual_live.push([
          "Année",
          an,
          "",
          "M-code : ",
          user.m_code,
          "Numéro d'agent : ",
          user.num_agent,
          "",
          "",
          "",
          "",
          "",
        ]);
        individual_live.push([
          "Date",
          "Période sollicitée",
          "",
          "Droit",
          "",
          "",
          "Congé Payé",
          "Congé sans solde",
          "OSTIE",
          "Pérmission Exceptionelle",
          "Absent et autres",
          "Observations",
        ]);
        individual_live.push([
          "",
          "Début",
          "Fin",
          "Acquisition",
          "Jouissance",
          "Reste",
          "",
          "",
          "",
          "",
          "",
          "",
        ]);
        var maternite = [];
        var months_to_write = [
          january,
          february,
          march,
          april,
          may,
          june,
          july,
          august,
          september,
          october,
          november,
          december,
        ];
        for (i = 0; i < 12; i++) {
          for (m = 0; m < months_to_write[i].length; m++) {
            if (
              months_to_write[i][m].type ==
              "Congé de maternité ( rien à deduire )"
            ) {
              maternite = [
                "Congé Maternité",
                "Congé Maternité",
                "Congé Maternité",
              ];
            }
            individual_live.push([
              convert_date1(months_to_write[i][m].date_start),
              convert_date2(months_to_write[i][m].date_start),
              convert_date2(months_to_write[i][m].date_end),
              "",
              jouissance(
                months_to_write[i][m].type,
                months_to_write[i][m].duration
              ),
              months_to_write[i][m].rest,
              another_conge_payer(
                months_to_write[i][m].type,
                months_to_write[i][m].duration
              ),
              another_sans_solde(
                months_to_write[i][m].type,
                months_to_write[i][m].duration
              ),
              ostie(months_to_write[i][m].type, months_to_write[i][m].duration),
              another_permission_exceptionelle(
                months_to_write[i][m].type,
                months_to_write[i][m].duration
              ),
              absence(
                months_to_write[i][m].type,
                months_to_write[i][m].duration
              ),
              write_maternity(maternite, months_to_write[i][m].type),
            ]);
          }
          individual_live.push([
            "Fin " + render_month[i],
            "",
            "",
            "2.5",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            write_maternity(maternite, ""),
          ]);
          maternite.pop();
        }
        individual_live.push([
          "Fin " + "Année",
          "-",
          "-",
          "30",
          total_jouissance,
          user.remaining_leave + 30,
          total_conge_paye,
          total_sans_solde,
          total_ostie,
          total_permission_exceptionelle,
          total_absence,
          "Fin",
        ]);
        ws_individual = ExcelFile.utils.aoa_to_sheet(individual_live);
        ws_individual["!cols"] = [
          { wpx: 90 },
          { wpx: 90 },
          { wpx: 90 },
          { wpx: 90 },
          { wpx: 90 },
          { wpx: 90 },
          { wpx: 90 },
          { wpx: 125 },
          { wpx: 90 },
          { wpx: 125 },
          { wpx: 125 },
          { wpx: 225 },
        ];
        var row_property = [];
        for (r = 0; r < individual_live.length; r++) {
          row_property.push({ hpt: 30 });
        }
        ws_individual["!rows"] = row_property;
        const merge = [
          { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
          { s: { r: 2, c: 1 }, e: { r: 2, c: 2 } },
          { s: { r: 2, c: 3 }, e: { r: 2, c: 5 } },
          { s: { r: 2, c: 6 }, e: { r: 3, c: 6 } },
          { s: { r: 2, c: 7 }, e: { r: 3, c: 7 } },
          { s: { r: 2, c: 8 }, e: { r: 3, c: 8 } },
          { s: { r: 2, c: 9 }, e: { r: 3, c: 9 } },
          { s: { r: 2, c: 10 }, e: { r: 3, c: 10 } },
        ];
        ws_individual["!merges"] = merge;
        style5();
        newsheets_individual.Sheets[user.last_name] = ws_individual;
        session.filename = user.last_name + ".xlsx";
        ExcelFile.writeFile(newsheets_individual, session.filename);
        individual_live = [];
        res.send("Ok");
  } else {
    res.redirect("/");
  }
  function jouissance(type, value) {
    if (type == "Congé Payé ( rien à deduire )") {
      total_jouissance = total_jouissance + value;
      return value;
    } else {
      return 0;
    }
  }
  function write_maternity(matern, obs) {
    if (matern[0]) {
      return matern[0];
    } else {
      return obs;
    }
  }
  function another_conge_payer(type, value) {
    if (type == "Congé Payé ( rien à deduire )") {
      total_conge_paye = total_conge_paye + value;
      return value;
    } else {
      return "";
    }
  }
  function another_sans_solde(type, value) {
    if (type == "Congé sans solde ( a déduire sur salaire )") {
      total_sans_solde = total_sans_solde + value;
      return value;
    } else {
      return "";
    }
  }
  function ostie(type, value) {
    if (type == "Repos Maladie ( rien à deduire )") {
      total_ostie = total_ostie + value;
      return value;
    } else {
      return "";
    }
  }
  function another_permission_exceptionelle(type, value) {
    if (type == "Permission exceptionelle ( rien à deduire )") {
      total_permission_exceptionelle = total_permission_exceptionelle + value;
      return value;
    } else {
      return "";
    }
  }
  function absence(type, value) {
    if (another.includes(type)) {
      total_absence = total_absence + value;
      return value;
    } else {
      return "";
    }
  }
});
function convert_date1(d1) {
  return moment(d1).format("DD/MM/YYYY");
}
function convert_date2(d2) {
  return moment(d2).locale("Fr").format("DD MMMM");
}

routeExp.route("/session_end").get(async function (req, res) {
  res.render("LoginPage/SessionPerdu.html");
});
//Generate excel file
routeExp.route("/generate").post(async function (req, res) {
  var session = req.session;
  if (session.occupation_a == "Admin") {
    var newsheet = ExcelFile.utils.book_new();
    newsheet.Props = {
      Title: "Timesheets",
      Subject: "Logged Time",
      Author: "Solumada",
    };
    newsheet.SheetNames.push("TOUS LES UTILISATEURS");
        var all_employes = [];
        for (i = 0; i < data_desired[session.m_code].datatowrite.length; i++) {
          if (
            all_employes.includes(
              data_desired[session.m_code].datatowrite[i].m_code
            )
          ) {
          } else {
            all_employes.push(
              data_desired[session.m_code].datatowrite[i].m_code
            );
          }
          all_employes = all_employes.sort();
        }
        all_datas.push(["RAPPORT GLOBALE", "", "", "", "", ""]);
        all_datas.push(["", "", "", "", "", ""]);
        all_datas.push([
          "Nom & Prenom",
          "M-code",
          "Totale heure travail",
          "Totale Retard",
          "Totale absence",
          "Totale congé",
        ]);
        for (e = 0; e < all_employes.length; e++) {
          var name_user = await StatusSchema.findOne({
            m_code: all_employes[e],
          });
          data.push([
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
          data.push(["", "", "", "", "", "", "", "", "", ""]);
          data.push([
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
          generate_excel(
            data_desired[session.m_code].datatowrite,
            data_desired[session.m_code].dataabsence,
            data_desired[session.m_code].dataleave,
            all_employes[e]
          );
          if (newsheet.SheetNames.includes(all_employes[e])) {
          } else {
            newsheet.SheetNames.push(all_employes[e]);
          }
          newsheet.Sheets[all_employes[e]] = ws;
          hours = 0;
          minutes = 0;
          data = [];
        }
        global_Report(all_datas);
        newsheet.Sheets["TOUS LES UTILISATEURS"] = ws;
        all_datas = [];
        if (newsheet.SheetNames.length != 0) {
          if (all_employes.length <= 1) {
            session.filename =
              "N°" + num_file + " " + all_employes[0] + ".xlsx";
            num_file++;
          } else {
            session.filename = "N°" + num_file + " Pointage.xlsx";
            num_file++;
          }
          ExcelFile.writeFile(newsheet, session.filename);
          delete filtrage.searchit;
          delete filtrage.date;
          delete filtrage.search;
          data_desired[session.m_code].datatowrite = await StatusSchema.find(
            {}
          );
        }
        res.send("Done");
  } else {
    res.redirect("/");
  }
});
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
      all_datas.push(["RAPPORT GLOBALE", "", "", "", "", ""]);
      all_datas.push(["", "", "", "", "", ""]);
      all_datas.push([
        "Nom & Prenom",
        "M-code",
        "Totale heure travail",
        "Totale Retard",
        "Totale absence",
        "Totale congé",
      ]);
      for (e = 0; e < all_employes.length; e++) {
        var name_user = await StatusSchema.findOne({ m_code: all_employes[e] });
        data.push([
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
        data.push(["", "", "", "", "", "", "", "", "", ""]);
        data.push([
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
        generate_excel(datatowrite, dataabsence, dataleave, all_employes[e]);
        if (newsheet.SheetNames.includes(all_employes[e])) {
        } else {
          newsheet.SheetNames.push(all_employes[e]);
        }
        newsheet.Sheets[all_employes[e]] = ws;
        hours = 0;
        minutes = 0;
        data = [];
      }
      global_Report(all_datas);
      newsheet.Sheets["TOUS LES UTILISATEURS"] = ws;
      all_datas = [];
      var filename = "";
      if (newsheet.SheetNames.length != 0) {
        filename = "Pointage M-FEL, M-NAT, Charles.xlsx";
        ExcelFile.writeFile(newsheet, filename);
      }
      var mailOptions = {
        from: "Solumada application",
        to: "naval.solumada@gmail.com,claudia.solumada@gmail.com",
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

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
}

routeExp.route("/download").get(async function (req, res) {
  var session = req.session;
  if (
    session.occupation_a == "Admin" ||
    session.occupation_tl == "Surveillant"
  ) {
    res.download(session.filename, function (err) {
      fs.unlink(session.filename, function (err) {
        if (err) {
          console.error(err);
        }
        console.log("File has been Deleted");
      });
    });
  }
});
//logout
routeExp.route("/exit_a").get(function (req, res) {
  req.session = null;
  res.redirect("/");
});
routeExp.route("/checkPoste").post(async function (req, res) {
      var exclude = [
        "MANAGER",
        "RH",
        "IT",
        "English",
        "REPORTING OPERATIONNEL",
        "DEVELOPPEUR",
        "COURSIER",
        "TL",
      ];
      var location = ["Tana Water Front", "IKANO"];
      var present = [];
      var active_today = await StatusSchema.find({
        date: moment().format("YYYY-MM-DD"),
        locaux: { $in: location },
        time_end: "",
      });
      for (let index = 0; index < active_today.length; index++) {
        present.push(active_today[index].m_code);
      }
      var TANA = await UserSchema.find({
        m_code: { $in: present },
        project: { $nin: exclude },
        act_loc: "Tana Water Front",
      }).sort({ m_code: 1 });
      var IKANO = await UserSchema.find({
        m_code: { $in: present },
        project: { $nin: exclude },
        act_loc: "IKANO",
      }).sort({ m_code: 1 });
      var given = {
        TWF: TANA.length,
        IKANO: IKANO.length,
      };
      res.json(given);
});
routeExp.route("/exit_tl").get(function (req, res) {
  req.session = null;
  res.redirect("/");
});
function htmlVerification(code) {
  return (
    "<center><h1>VOTRE CODE D'AUTHENTIFICATION</h1>" +
    "<h3 style='width:250px;font-size:50px;padding:8px;background-color: rgba(87,184,70, 0.8); color:white'>" +
    code +
    "<h3></center>"
  );
}
function htmlRender(username, password, occupation) {
  var html =
    "<center><h1>Solumada Authentification</h1>" +
    '<table border="1" style="border-collapse:collapse;width:50%;border-color: lightgrey;">' +
    '<thead style="background-color: rgba(87,184,70, 0.8);color:white;font-weight:bold;">' +
    "<tr>" +
    '<td align="center">Nom utilisateur</td>' +
    '<td align="center">Mot de passe</td>' +
    '<td align="center">Occupation</td>' +
    "</tr>" +
    "</thead>" +
    "<tbody>" +
    "<tr>" +
    '<td align="center">' +
    username +
    "</td>" +
    '<td align="center">' +
    password +
    "</td>" +
    '<td align="center">' +
    occupation +
    "</td>" +
    "</tr>" +
    "</tbody>" +
    "</table>" +
    "<p>Lien vers l'application https://pointage.solumada.mg/</p>" +
    "<p><b>Lors de votre première connexion vous serez redirigé vers la page changement de mot de passe</b></p><br>" +
    "Mes salutations";
  return html;
}
function randomPassword() {
  var code = "";
  let v = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!é&#";
  for (let i = 0; i < 8; i++) {
    // 6 characters
    let char = v.charAt(Math.random() * v.length - 1);
    code += char;
  }
  return code;
}
function sendEmail(receiver, subject, text) {
  var mailOptions = {
    from: "Timesheets Optimum solution",
    to: receiver,
    subject: subject,
    html: text,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
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
function calcul_timediff_principle(startTime, endTime) {
  if (endTime != "") {
    startTime = moment(startTime, "HH:mm:ss a");
    endTime = moment(endTime, "HH:mm:ss a");
    var duration = moment.duration(endTime.diff(startTime));
    //duration in hours
    var hours_fictif = 0;
    var minutes_fictif = 0;
    hours_fictif += parseInt(duration.asHours());

    // duration in minutes
    minutes_fictif += parseInt(duration.asMinutes()) % 60;
    if (minutes_fictif < 0) {
      hours_fictif = hours_fictif - 1;
      minutes_fictif = 60 + minutes_fictif;
    }
    while (minutes_fictif > 60) {
      hours_fictif += 1;
      minutes_fictif = minutes_fictif - 60;
    }
    if (hours_fictif < 0) {
      hours_fictif = hours_fictif + 24;
    }
    hours += hours_fictif;
    minutes += minutes_fictif;
    return hours_fictif + "H " + minutes_fictif + "MN";
  } else {
    return "non terminée";
  }
}
function calcul_timediff_principletl(startTime, endTime) {
  if (endTime != "") {
    startTime = moment(startTime, "HH:mm:ss a");
    endTime = moment(endTime, "HH:mm:ss a");
    var duration = moment.duration(endTime.diff(startTime));
    //duration in hours
    var hours_fictif = 0;
    var minutes_fictif = 0;
    hours_fictif += parseInt(duration.asHours());

    // duration in minutes
    minutes_fictif += parseInt(duration.asMinutes()) % 60;
    if (minutes_fictif < 0) {
      hours_fictif = hours_fictif - 1;
      minutes_fictif = 60 + minutes_fictif;
    }
    while (minutes_fictif > 60) {
      hours_fictif += 1;
      minutes_fictif = minutes_fictif - 60;
    }
    if (hours_fictif < 0) {
      hours_fictif = hours_fictif + 24;
    }
    if (hours_fictif < 10) {
      hours_fictif = "0" + hours_fictif;
    }
    if (minutes_fictif < 10) {
      minutes_fictif = "0" + minutes_fictif;
    }
    return hours_fictif + ":" + minutes_fictif;
  } else {
    return "non terminée";
  }
}
function calcul_timediff_absence(startTime, endTime) {
  startTime = moment(startTime, "HH:mm:ss a");
  endTime = moment(endTime, "HH:mm:ss a");
  var duration = moment.duration(endTime.diff(startTime));
  //duration in hours
  var hours_fictif = 0;
  var minutes_fictif = 0;
  hours_fictif += parseInt(duration.asHours());

  // duration in minutes
  minutes_fictif += parseInt(duration.asMinutes()) % 60;
  if (minutes_fictif < 0) {
    hours_fictif = hours_fictif - 1;
    minutes_fictif = 60 + minutes_fictif;
  }
  while (minutes_fictif > 60) {
    hours_fictif += 1;
    minutes_fictif = minutes_fictif - 60;
  }
  if (hours_fictif < 0) {
    hours_fictif = hours_fictif + 24;
  }
  return hours_fictif + " H " + minutes_fictif + " MN";
}
function calcul_timediff_absencetl(startTime, endTime) {
  startTime = moment(startTime, "HH:mm:ss a");
  endTime = moment(endTime, "HH:mm:ss a");
  var duration = moment.duration(endTime.diff(startTime));
  //duration in hours
  var hours_fictif = 0;
  var minutes_fictif = 0;
  hours_fictif += parseInt(duration.asHours());

  // duration in minutes
  minutes_fictif += parseInt(duration.asMinutes()) % 60;
  if (minutes_fictif < 0) {
    hours_fictif = hours_fictif - 1;
    minutes_fictif = 60 + minutes_fictif;
  }
  while (minutes_fictif > 60) {
    hours_fictif += 1;
    minutes_fictif = minutes_fictif - 60;
  }
  if (hours_fictif < 0) {
    hours_fictif = hours_fictif + 24;
  }
  return hours_fictif + ":" + minutes_fictif;
}
function hour_diff(startday, endday) {
  startday = moment(startday, "HH:mm:ss a");
  endday = moment(endday, "HH:mm:ss a");
  var duration = moment.duration(endday.diff(startday));
  var hour_fictif = parseInt(duration.asHours());
  var minutes_fictif = parseInt(duration.asMinutes());
  if (hour_fictif < 0) {
    hour_fictif = 24 + hour_fictif;
  }
  if (minutes_fictif < 0) {
  }

  return hour_fictif;
}

function convert_to_hour(mins) {
  var hc = 0;
  while (mins > 60) {
    hc += 1;
    mins = mins - 60;
  }
  if (hc == 0) {
    return mins + " minutes";
  } else {
    return hc + " heures et " + mins + " minutes";
  }
}
function difference_year(starting) {
  var startings = moment(moment(starting)).format("YYYY-MM-DD");
  var nows = moment(moment().format("YYYY-MM-DD"), "YYYY-MM-DD");
  var duration = moment.duration(nows.diff(startings));
  var years = duration.years();
  return years;
}
function time_passed(starting) {
  var startings = moment(moment(starting)).format("YYYY-MM-DD");
  var nows = moment(moment().format("YYYY-MM-DD"), "YYYY-MM-DD");
  var duration = moment.duration(nows.diff(startings));
  var years = duration.years();
  var months = duration.months();
  var days = duration.days();
  while (days > 30) {
    days = days - 30;
  }
  var tp = years + " an(s) " + months + " mois " + days + " jour(s)";
  return tp;
}
function date_diff(starting, ending) {
  var startings = moment(moment(starting)).format("YYYY-MM-DD");
  var endings = moment(ending, "YYYY-MM-DD");
  var duration = moment.duration(endings.diff(startings));
  var dayl = duration.asDays();
  return parseInt(dayl.toFixed(0));
}
function calcul_retard(regular, arrived) {
  var time = 0;
  var lh = 0;
  var lm = 0;
  regular = moment(regular, "HH:mm:ss a");
  arrived = moment(arrived, "HH:mm:ss a");
  var duration = moment.duration(arrived.diff(regular));
  //duration in hours
  lh = parseInt(duration.asHours());
  // duration in minutes
  lm = parseInt(duration.asMinutes()) % 60;
  while (lm > 60) {
    lh += 1;
    lm = lm - 60;
  }
  lh = lh * 60;
  time = lh + lm;

  if (time < 8) {
    return "n";
  } else {
    return convert_to_hour(time);
  }
}
function style() {
  var cellule = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  for (c = 0; c < cellule.length; c++) {
    for (i = 1; i <= data.length; i++) {
      if (ws[cellule[c] + "" + i]) {
        if (i == 1 || i == 2) {
          ws[cellule[c] + "" + i].s = {
            font: {
              name: "Segoe UI Black",
              bold: true,
              color: { rgb: "398C39" },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        } else if (i == 3) {
          ws[cellule[c] + "" + i].s = {
            fill: {
              patternType: "solid",
              fgColor: { rgb: "398C39" },
              bgColor: { rgb: "398C39" },
            },
            font: {
              name: "Segoe UI Black",
              bold: true,
              color: { rgb: "F5F5F5" },
            },
            border: {
              left: { style: "hair" },
              right: { style: "hair" },
              top: {
                style: "hair",
                bottom: { style: "hair" },
              },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        } else {
          ws[cellule[c] + "" + i].s = {
            font: {
              name: "Verdana",
              color: { rgb: "777777" },
            },
            border: {
              left: { style: "hair" },
              right: { style: "hair" },
              top: {
                style: "hair",
                bottom: { style: "hair" },
              },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        }
      }
    }
  }
}
function style3(last, maternity, field) {
  var cellule = ["A", "B", "C", "D", "E", "F", "G"];
  var color = {
    A: "FFFFFF",
    B: "FFFFFF",
    C: "FFFFFF",
    D: "00CCFF",
    E: "FF99CC",
    F: "99CC00",
    G: "FFFFFF",
  };
  for (c = 0; c < cellule.length; c++) {
    for (i = 1; i <= monthly_leave.length + last + maternity + field; i++) {
      if (ws_leave[cellule[c] + "" + i]) {
        if (i == 1) {
          ws_leave[cellule[c] + "" + i].s = {
            font: {
              name: "Calibri",
              bold: true,
              sz: 18,
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        } else if (i == 2 || i == 3) {
          ws_leave[cellule[c] + "" + i].s = {
            fill: {
              patternType: "solid",
              fgColor: { rgb: color[cellule[c]] },
              bgColor: { rgb: color[cellule[c]] },
            },
            font: {
              name: "Calibri",
              sz: 11,
              bold: true,
            },
            border: {
              left: { style: "thin" },
              right: { style: "thin" },
              top: {
                style: "thin",
                bottom: { style: "thin" },
              },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
          if (cellule[c] == "C") {
            color["C"] = "FFFF00";
          }
        } else if (cellule[c] == "G") {
          ws_leave[cellule[c] + "" + i].s = {
            font: {
              name: "Calibri",
              sz: 11,
            },
            border: {
              left: { style: "thin" },
              right: { style: "thin" },
              top: {
                style: "thin",
                bottom: { style: "thin" },
              },
            },
            alignment: {
              vertical: "left",
              horizontal: "left",
            },
          };
        } else {
          if (
            ws_leave[cellule[c] + "" + i].v != "" &&
            ws_leave[cellule[c] + "" + i].v.includes("Congé") === false
          ) {
            ws_leave[cellule[c] + "" + i].s = {
              fill: {
                patternType: "solid",
                fgColor: { rgb: color[cellule[c]] },
                bgColor: { rgb: color[cellule[c]] },
              },
              font: {
                name: "Calibri",
                sz: 11,
              },
              border: {
                left: { style: "thin" },
                right: { style: "thin" },
                top: {
                  style: "thin",
                  bottom: { style: "thin" },
                },
              },
              alignment: {
                vertical: "center",
                horizontal: "center",
              },
            };
          } else {
            ws_leave[cellule[c] + "" + i].s = {
              font: {
                name: "Calibri",
                sz: 11,
              },
              border: {
                left: { style: "thin" },
                right: { style: "thin" },
                top: {
                  style: "thin",
                  bottom: { style: "thin" },
                },
              },
              alignment: {
                vertical: "center",
                horizontal: "center",
              },
            };
          }
        }
      }
    }
  }
}
function style4(leave_left) {
  var cellule = ["A", "B", "C", "D", "E", "F", "G"];
  for (c = 0; c < cellule.length; c++) {
    for (i = 1; i <= leave_left.length; i++) {
      if (ws_left[cellule[c] + "" + i]) {
        if (i == 1) {
          ws_left[cellule[c] + "" + i].s = {
            font: {
              name: "Calibri",
              bold: true,
              sz: 18,
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        } else if (i == 2) {
          ws_left[cellule[c] + "" + i].s = {
            fill: {
              patternType: "solid",
              fgColor: { rgb: "FFFFFF" },
              bgColor: { rgb: "FFFFFF" },
            },
            font: {
              name: "Calibri",
              sz: 14,
              bold: true,
            },
            border: {
              left: { style: "thin" },
              right: { style: "thin" },
              top: {
                style: "thin",
                bottom: { style: "thin" },
              },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        } else {
          ws_left[cellule[c] + "" + i].s = {
            font: {
              name: "Calibri",
              sz: 14,
            },
            border: {
              left: { style: "thin" },
              right: { style: "thin" },
              top: {
                style: "thin",
                bottom: { style: "thin" },
              },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        }
      }
    }
  }
}
function style2() {
  var cellule = ["A", "B", "C", "D", "E", "F", "G"];
  for (c = 0; c < cellule.length; c++) {
    for (i = 1; i <= all_datas.length; i++) {
      if (ws[cellule[c] + "" + i]) {
        if (i == 1 || i == 2) {
          ws[cellule[c] + "" + i].s = {
            font: {
              name: "Segoe UI Black",
              bold: true,
              color: { rgb: "398C39" },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        } else if (i == 3) {
          ws[cellule[c] + "" + i].s = {
            fill: {
              patternType: "solid",
              fgColor: { rgb: "398C39" },
              bgColor: { rgb: "398C39" },
            },
            font: {
              name: "Segoe UI Black",
              bold: true,
              color: { rgb: "F5F5F5" },
            },
            border: {
              left: { style: "hair" },
              right: { style: "hair" },
              top: {
                style: "hair",
                bottom: { style: "hair" },
              },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        } else {
          ws[cellule[c] + "" + i].s = {
            font: {
              name: "Verdana",
              color: { rgb: "777777" },
            },
            border: {
              left: { style: "hair" },
              right: { style: "hair" },
              top: {
                style: "hair",
                bottom: { style: "hair" },
              },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        }
      }
    }
  }
}
function style6() {
  var cellule = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
  for (c = 0; c < cellule.length; c++) {
    for (i = 1; i <= pointage_journalier.length; i++) {
      if (ws[cellule[c] + "" + i]) {
        if (i == 1 || i == 2) {
          ws[cellule[c] + "" + i].s = {
            font: {
              name: "Segoe UI Black",
              bold: true,
              sz: 9,
              color: { rgb: "398C39" },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        } else if (i == 3) {
          ws[cellule[c] + "" + i].s = {
            fill: {
              patternType: "solid",
              fgColor: { rgb: "398C39" },
              bgColor: { rgb: "398C39" },
            },
            font: {
              name: "Segoe UI Black",
              bold: true,
              sz: 9,
              color: { rgb: "F5F5F5" },
            },
            border: {
              left: { style: "hair" },
              right: { style: "hair" },
              top: {
                style: "hair",
                bottom: { style: "hair" },
              },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        } else {
          ws[cellule[c] + "" + i].s = {
            font: {
              name: "Verdana",
              sz: 9,
              color: { rgb: "777777" },
            },
            border: {
              left: { style: "hair" },
              right: { style: "hair" },
              top: {
                style: "hair",
                bottom: { style: "hair" },
              },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        }
      }
    }
  }
}
function style5() {
  var cellule = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  for (c = 0; c < cellule.length; c++) {
    for (i = 1; i <= individual_live.length; i++) {
      if (ws_individual[cellule[c] + "" + i]) {
        if (i == 1 || i == 2) {
          ws_individual[cellule[c] + "" + i].s = {
            font: {
              name: "Arial",
              sz: 10,
              bold: true,
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        } else if (cellule[c] == "H") {
          if (
            ws_individual[cellule[c] + "" + i].v == "" ||
            ws_individual[cellule[c] + "" + i].v == "Congé sans solde"
          ) {
            ws_individual[cellule[c] + "" + i].s = {
              font: {
                name: "Arial",
                sz: 10,
                color: { rgb: "F7931A" },
              },
              border: {
                left: { style: "hair" },
                right: { style: "hair" },
                top: {
                  style: "hair",
                  bottom: { style: "hair" },
                },
              },
              alignment: {
                vertical: "center",
                horizontal: "center",
              },
            };
          } else if (i == individual_live.length) {
            ws_individual[cellule[c] + "" + i].s = {
              fill: {
                patternType: "solid",
                fgColor: { rgb: "BFBFBF" },
                bgColor: { rgb: "BFBFBF" },
              },
              font: {
                name: "Arial",
                sz: 10,
                color: { rgb: "F7931A" },
              },
              border: {
                left: { style: "hair" },
                right: { style: "hair" },
                top: {
                  style: "hair",
                  bottom: { style: "hair" },
                },
              },
              alignment: {
                vertical: "center",
                horizontal: "center",
              },
            };
          } else {
            ws_individual[cellule[c] + "" + i].s = {
              font: {
                name: "Arial",
                sz: 10,
                color: { rgb: "F7931A" },
                bold: true,
              },
              border: {
                left: { style: "hair" },
                right: { style: "hair" },
                top: {
                  style: "hair",
                  bottom: { style: "hair" },
                },
              },
              alignment: {
                vertical: "center",
                horizontal: "center",
              },
            };
          }
        } else if (cellule[c] == "I") {
          if (
            ws_individual[cellule[c] + "" + i].v == "" ||
            ws_individual[cellule[c] + "" + i].v == "OSTIE"
          ) {
            ws_individual[cellule[c] + "" + i].s = {
              font: {
                name: "Arial",
                sz: 10,
                color: { rgb: "FF2AE0" },
              },
              border: {
                left: { style: "hair" },
                right: { style: "hair" },
                top: {
                  style: "hair",
                  bottom: { style: "hair" },
                },
              },
              alignment: {
                vertical: "center",
                horizontal: "center",
              },
            };
          } else if (i == individual_live.length) {
            ws_individual[cellule[c] + "" + i].s = {
              fill: {
                patternType: "solid",
                fgColor: { rgb: "BFBFBF" },
                bgColor: { rgb: "BFBFBF" },
              },
              font: {
                name: "Arial",
                sz: 10,
                color: { rgb: "FF2AE0" },
              },
              border: {
                left: { style: "hair" },
                right: { style: "hair" },
                top: {
                  style: "hair",
                  bottom: { style: "hair" },
                },
              },
              alignment: {
                vertical: "center",
                horizontal: "center",
              },
            };
          } else {
            ws_individual[cellule[c] + "" + i].s = {
              font: {
                name: "Arial",
                sz: 10,
                color: { rgb: "FF2AE0" },
                bold: true,
              },
              border: {
                left: { style: "hair" },
                right: { style: "hair" },
                top: {
                  style: "hair",
                  bottom: { style: "hair" },
                },
              },
              alignment: {
                vertical: "center",
                horizontal: "center",
              },
            };
          }
        } else if (cellule[c] == "J") {
          if (
            ws_individual[cellule[c] + "" + i].v == "" ||
            ws_individual[cellule[c] + "" + i].v == "Pérmission Exceptionelle"
          ) {
            ws_individual[cellule[c] + "" + i].s = {
              font: {
                name: "Arial",
                sz: 10,
                color: { rgb: "5A9966" },
              },
              border: {
                left: { style: "hair" },
                right: { style: "hair" },
                top: {
                  style: "hair",
                  bottom: { style: "hair" },
                },
              },
              alignment: {
                vertical: "center",
                horizontal: "center",
              },
            };
          } else if (i == individual_live.length) {
            ws_individual[cellule[c] + "" + i].s = {
              fill: {
                patternType: "solid",
                fgColor: { rgb: "BFBFBF" },
                bgColor: { rgb: "BFBFBF" },
              },
              font: {
                name: "Arial",
                sz: 10,
                color: { rgb: "5A9966" },
              },
              border: {
                left: { style: "hair" },
                right: { style: "hair" },
                top: {
                  style: "hair",
                  bottom: { style: "hair" },
                },
              },
              alignment: {
                vertical: "center",
                horizontal: "center",
              },
            };
          } else {
            ws_individual[cellule[c] + "" + i].s = {
              font: {
                name: "Arial",
                sz: 10,
                color: { rgb: "5A9966" },
                bold: true,
              },
              border: {
                left: { style: "hair" },
                right: { style: "hair" },
                top: {
                  style: "hair",
                  bottom: { style: "hair" },
                },
              },
              alignment: {
                vertical: "center",
                horizontal: "center",
              },
            };
          }
        } else if (cellule[c] == "K") {
          if (
            ws_individual[cellule[c] + "" + i].v == "" ||
            ws_individual[cellule[c] + "" + i].v == "Absent et autres"
          ) {
            ws_individual[cellule[c] + "" + i].s = {
              font: {
                name: "Arial",
                sz: 10,
                color: { rgb: "0066BC" },
              },
              border: {
                left: { style: "hair" },
                right: { style: "hair" },
                top: {
                  style: "hair",
                  bottom: { style: "hair" },
                },
              },
              alignment: {
                vertical: "center",
                horizontal: "center",
              },
            };
          } else if (i == individual_live.length) {
            ws_individual[cellule[c] + "" + i].s = {
              fill: {
                patternType: "solid",
                fgColor: { rgb: "BFBFBF" },
                bgColor: { rgb: "BFBFBF" },
              },
              font: {
                name: "Arial",
                sz: 10,
                color: { rgb: "0066BC" },
              },
              border: {
                left: { style: "hair" },
                right: { style: "hair" },
                top: {
                  style: "hair",
                  bottom: { style: "hair" },
                },
              },
              alignment: {
                vertical: "center",
                horizontal: "center",
              },
            };
          } else {
            ws_individual[cellule[c] + "" + i].s = {
              font: {
                name: "Arial",
                sz: 10,
                color: { rgb: "0066BC" },
                bold: true,
              },
              border: {
                left: { style: "hair" },
                right: { style: "hair" },
                top: {
                  style: "hair",
                  bottom: { style: "hair" },
                },
              },
              alignment: {
                vertical: "center",
                horizontal: "center",
              },
            };
          }
        } else if (ws_individual[cellule[c] + "" + i].v == "Fin Année") {
          ws_individual[cellule[c] + "" + i].s = {
            fill: {
              patternType: "solid",
              fgColor: { rgb: "BFBFBF" },
              bgColor: { rgb: "BFBFBF" },
            },
            font: {
              name: "Arial",
              sz: 10,
              bold: true,
            },
            border: {
              left: { style: "hair" },
              right: { style: "hair" },
              top: {
                style: "hair",
                bottom: { style: "hair" },
              },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        } else if (ws_individual[cellule[c] + "" + i].v == "Congé Maternité") {
          ws_individual[cellule[c] + "" + i].s = {
            fill: {
              patternType: "solid",
              fgColor: { rgb: "25AFF3" },
              bgColor: { rgb: "25AFF3" },
            },
            font: {
              name: "Arial",
              sz: 10,
              color: { rgb: "FFFFFF" },
              bold: true,
            },
            border: {
              left: { style: "hair" },
              right: { style: "hair" },
              top: {
                style: "hair",
                bottom: { style: "hair" },
              },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        } else if (
          ws_individual[cellule[c] + "" + i].v ==
          "Mise a Pied ( a déduire sur salaire )"
        ) {
          ws_individual[cellule[c] + "" + i].s = {
            fill: {
              patternType: "solid",
              fgColor: { rgb: "E00012" },
              bgColor: { rgb: "E00012" },
            },
            font: {
              name: "Arial",
              sz: 10,
              bold: true,
            },
            border: {
              left: { style: "hair" },
              right: { style: "hair" },
              top: {
                style: "hair",
                bottom: { style: "hair" },
              },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        } else if (
          ws_individual[cellule[c] + "" + i].v ==
          "Repos Maladie ( rien à deduire )"
        ) {
          ws_individual[cellule[c] + "" + i].s = {
            fill: {
              patternType: "solid",
              fgColor: { rgb: "FF2AE0" },
              bgColor: { rgb: "FF2AE0" },
            },
            font: {
              name: "Arial",
              sz: 10,
              bold: true,
            },
            border: {
              left: { style: "hair" },
              right: { style: "hair" },
              top: {
                style: "hair",
                bottom: { style: "hair" },
              },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        } else if (
          ws_individual[cellule[c] + "" + i].v ==
          "Absent ( a déduire sur salaire )"
        ) {
          ws_individual[cellule[c] + "" + i].s = {
            fill: {
              patternType: "solid",
              fgColor: { rgb: "0066BC" },
              bgColor: { rgb: "0066BC" },
            },
            font: {
              name: "Arial",
              sz: 10,
              bold: true,
            },
            border: {
              left: { style: "hair" },
              right: { style: "hair" },
              top: {
                style: "hair",
                bottom: { style: "hair" },
              },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        } else if (
          ws_individual[cellule[c] + "" + i].v ==
          "Permission exceptionelle ( rien à deduire )"
        ) {
          ws_individual[cellule[c] + "" + i].s = {
            fill: {
              patternType: "solid",
              fgColor: { rgb: "5A9966" },
              bgColor: { rgb: "5A9966" },
            },
            font: {
              name: "Arial",
              sz: 10,
              bold: true,
            },
            border: {
              left: { style: "hair" },
              right: { style: "hair" },
              top: {
                style: "hair",
                bottom: { style: "hair" },
              },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        } else if (
          ws_individual[cellule[c] + "" + i].v ==
          "Congé sans solde ( a déduire sur salaire )"
        ) {
          ws_individual[cellule[c] + "" + i].s = {
            fill: {
              patternType: "solid",
              fgColor: { rgb: "F7931A" },
              bgColor: { rgb: "F7931A" },
            },
            font: {
              name: "Arial",
              sz: 10,
              bold: true,
            },
            border: {
              left: { style: "hair" },
              right: { style: "hair" },
              top: {
                style: "hair",
                bottom: { style: "hair" },
              },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        } else if (i == individual_live.length) {
          if (cellule[c] == "G") {
            ws_individual[cellule[c] + "" + i].s = {
              fill: {
                patternType: "solid",
                fgColor: { rgb: "BFBFBF" },
                bgColor: { rgb: "BFBFBF" },
              },
              font: {
                name: "Arial",
                sz: 10,
                color: { rgb: "000000" },
                bold: true,
              },
              border: {
                left: { style: "hair" },
                right: { style: "hair" },
                top: {
                  style: "hair",
                  bottom: { style: "hair" },
                },
              },
              alignment: {
                vertical: "center",
                horizontal: "center",
              },
            };
          } else {
            ws_individual[cellule[c] + "" + i].s = {
              fill: {
                patternType: "solid",
                fgColor: { rgb: "BFBFBF" },
                bgColor: { rgb: "BFBFBF" },
              },
              font: {
                name: "Arial",
                sz: 10,
                color: { rgb: "000000" },
                bold: true,
              },
              border: {
                left: { style: "hair" },
                right: { style: "hair" },
                top: {
                  style: "hair",
                  bottom: { style: "hair" },
                },
              },
              alignment: {
                vertical: "center",
                horizontal: "center",
              },
            };
          }
        } else {
          ws_individual[cellule[c] + "" + i].s = {
            font: {
              name: "Arial",
              sz: 10,
              color: { rgb: "000000" },
            },
            border: {
              left: { style: "hair" },
              right: { style: "hair" },
              top: {
                style: "hair",
                bottom: { style: "hair" },
              },
            },
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          };
        }
      }
    }
  }
}
//Fonction generate excel
function generate_excel(datatowrites, absent, conge, code) {
  var counter = 0;
  var cumg = 0;
  var cum_tot = "";
  var cum_abs = "";
  var cum_del = 0;
  var nom = "";
  var m_codes = "";
  for (i = 0; i < datatowrites.length; i++) {
    if (datatowrites[i].m_code == code) {
      counter++;
      var ligne = [
        datatowrites[i].m_code,
        datatowrites[i].num_agent,
        moment(datatowrites[i].date).format("DD/MM/YYYY"),
        datatowrites[i].locaux,
        datatowrites[i].entry,
        datatowrites[i].time_start,
        datatowrites[i].time_end,
        datatowrites[i].late_entry,
        calcul_timediff_principle(
          datatowrites[i].time_start,
          datatowrites[i].time_end
        ),
        datatowrites[i].worktime,
      ];
      if (
        datatowrites[i].late_entry != "" &&
        datatowrites[i].late_entry != "N/A" &&
        datatowrites[i].late_entry.includes(" Confirmer")
      ) {
        cum_del++;
      }
      nom = datatowrites[i].nom;
      m_codes = datatowrites[i].m_code;
      data.push(ligne);
    }
  }
  while (minutes >= 60) {
    hours = hours + 1;
    minutes = minutes - 60;
  }
  totaltime = hours + "H " + minutes + "MN";
  data.push(["", "", "", "", "", "TOTALE", totaltime, "", "", ""]);
  cum_tot = totaltime;
  data.push(["", "", "", "", "", "", "", "", "", ""]);
  hours = 0;
  minutes = 0;
  if (absent.length != 0) {
    var latelignent = [];
    var lateligne = [];
    for (i = 0; i < absent.length; i++) {
      if (absent[i].return != "Not come back" && absent[i].m_code == code) {
        lateligne.push([
          absent[i].m_code,
          absent[i].num_agent,
          moment(absent[i].date).format("DD/MM/YYYY"),
          absent[i].reason,
          absent[i].time_start,
          absent[i].return,
          absent[i].status,
          "",
          "",
          "",
        ]);
        calcul_timediff_absence(absent[i].time_start, absent[i].return);
      } else {
        if (absent[i].m_code == code) {
          latelignent.push([
            absent[i].m_code,
            absent[i].num_agent,
            moment(absent[i].date).format("DD/MM/YYYY"),
            absent[i].reason,
            absent[i].time_start,
            "n'a pas retourner",
            absent[i].status,
            "",
            "",
            "",
          ]);
        }
      }
    }
    while (minutes >= 60) {
      hours = hours + 1;
      minutes = minutes - 60;
    }
    totaltime = hours + "H " + minutes + "MN";
    cum_abs = totaltime;
    if (lateligne.length > 0) {
      data.push(["", "", "", "", "", "", "", "", "", ""]);
      data.push(["", "", "", "ABSENCE AVEC RETOUR", "", "", "", "", "", ""]);
      data.push([
        "M-code",
        "Numéro Agent",
        "Date",
        "Raison",
        "Début",
        "Retourner",
        "Status",
        "",
        "",
        "",
      ]);
      lateligne.forEach((element) => {
        data.push(element);
      });
      data.push(["", "", "", "", "", "TOTAL", totaltime, "", "", ""]);
    }
    if (latelignent.length > 0) {
      data.push(["", "", "", "", "ABSENCE SANS RETOUR", "", "", "", "", ""]);
      data.push([
        "M-code",
        "Numéro Agent",
        "Date",
        "Raison",
        "Début",
        "Retour",
        "Status",
        "",
        "",
        "",
      ]);
      latelignent.forEach((element) => {
        data.push(element);
      });
    }
  }
  if (conge.length != 0) {
    for (i = 0; i < conge.length; i++) {
      if (conge[i].m_code == code) {
        var lateligne = [
          conge[i].m_code,
          conge[i].num_agent,
          moment(conge[i].date_start).format("DD/MM/YYYY"),
          moment(conge[i].date_end).format("DD/MM/YYYY"),
          conge[i].duration + " jour(s)",
          conge[i].type,
          "",
          "",
          "",
          "",
        ];
        data.push(["", "", "", "", "", "", "", "", "", ""]);
        data.push(["", "", "", "", "RAPPORT CONGE", "", "", "", "", ""]);
        data.push([
          "M-code",
          "Numéro agent",
          "Date Début",
          "Date Fin",
          "Nombre jour",
          "Type",
          "",
          "",
          "",
          "",
        ]);
        data.push(lateligne);
        cumg += conge[i].duration;
      }
    }
    if (cumg != 0) {
      data.push(["", "", "", "", "", "TOTAL", cumg + " jour(s)", "", "", ""]);
    }
  }
  each_data = [
    nom,
    m_codes,
    cum_tot,
    cum_del + " fois",
    cum_abs,
    cumg + " jour(s)",
  ];
  all_datas.push(each_data);
  ws = ExcelFile.utils.aoa_to_sheet(data);

  ws["!cols"] = [
    { wpx: 80 },
    { wpx: 100 },
    { wpx: 200 },
    { wpx: 250 },
    { wpx: 80 },
    { wpx: 80 },
    { wpx: 80 },
    { wpx: 250 },
    { wpx: 120 },
    { wpx: 120 },
  ];
  var row_property = [];
  for (r = 0; r < data.length; r++) {
    row_property.push({ hpt: 30 });
  }
  ws["!rows"] = row_property;
  const merge = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 9 } },
    { s: { r: 3, c: 0 }, e: { r: counter + 2, c: 0 } },
    { s: { r: 3, c: 1 }, e: { r: counter + 2, c: 1 } },
    { s: { r: counter + 5, c: 0 }, e: { r: counter + 5, c: 9 } },
  ];
  ws["!merges"] = merge;
  style();
}
function global_Report(all_data) {
  ws = ExcelFile.utils.aoa_to_sheet(all_data);
  ws["!cols"] = [
    { wpx: 230 },
    { wpx: 80 },
    { wpx: 150 },
    { wpx: 150 },
    { wpx: 150 },
    { wpx: 150 },
    { wpx: 150 },
  ];
  var row_property = [];
  for (r = 0; r < all_data.length; r++) {
    row_property.push({ hpt: 30 });
  }
  ws["!rows"] = row_property;
  const merge = [{ s: { r: 0, c: 0 }, e: { r: 1, c: 5 } }];
  ws["!merges"] = merge;
  style2();
}


module.exports = routeExp;
