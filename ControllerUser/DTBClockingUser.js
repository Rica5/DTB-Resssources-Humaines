const UserSchema = require("../models/ModelMember");
const StatusSchema = require("../models/ModelClocking");
const AbsentSchema = require("../models/ModelAbsence");
const OptSchema = require("../models/ModelApplicationSetting");
const Log = require("../models/ModelLoginHistoric");
const MOMENT = require("moment");
const globalvariable = require("../ControllerDTB/GlobaleVariable")
const Methods = require("../ControllerDTB/GlobalMethods")


// Override the moment function to always return Baghdad time  
function moment(...args) {  
  // Call the original moment function with the provided arguments  
  const localDate = MOMENT(...args);  

  // Calculate the timezone offset  
  const serverOffset = localDate.utcOffset(); // Server's timezone offset in minutes  
  const baghdadOffset = 180; // Baghdad's timezone offset in minutes  

  // Calculate the time difference in minutes  
  const offsetDifference = baghdadOffset - serverOffset;  

  // Adjust the local date by the difference to get Baghdad time  
  const baghdadTime = localDate.clone().add(offsetDifference, 'minutes');  

  return baghdadTime;  
}  


//Render employees 
const pageEmployee = async(req,res) => {
    var session = req.session;
  if (session.occupation_u == "User") {
    if (GrantedAccess(session.access.ip, session.shift, session.m_code)){
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
                //send_alert_late(session.m_code, late_confirm, globalvariable.mailing_all);
              }
            } else {
              if (opt.email_sent.includes(session.m_code)) {
              } else {
                await OptSchema.findOneAndUpdate(
                  { _id: "636247a2c1f6301f15470344" },
                  { $push: { email_sent: session.m_code } }
                );
                //send_alert_late(session.m_code, late_confirm, globalvariable.mailing_spec);
              }
            }
          }
          var another_post = "n";
          var status_poste = "n";
          var administrator = "n";
          var status_postefinance = "n";
          var occupations = await UserSchema.findOne({
            username: session.mailing,
            occupation: "Opération",
          });
          var status_occupation = await UserSchema.findOne({
            username: session.mailing,
            occupation: "Surveillant",
          });
          var status_finance = await UserSchema.findOne({
            username: session.mailing,
            occupation: "Finance",
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
          if (status_finance) {
            status_poste = "Finance";
          }
          if (session.time != "n") {
            res.render("PageEmployee/MaPointage.html", {
              user: user,
              forget: session.forget,
              latelist: late_confirm,
              another: another_post,
              status_poste: status_poste,
              status_postefinance: status_postefinance,
              administrator: administrator,
              warn_you: warn_you,
              codeUser:session.m_code
            });
          } else {
            res.render("PageEmployee/MaPointage.html", {
              user: user,
              forget: session.forget,
              latelist: late_confirm,
              another: another_post,
              status_poste: status_poste,
              status_postefinance: status_postefinance,
              administrator: administrator,
              warn_you: warn_you,
              codeUser:session.m_code
            });
          }
    }
    else {
        var new_log = {
            m_code: session.m_code,
            datetime: moment()
              .add(3, "hours")
              .format("DD/MM/YYYY HH:mm:ss"),
            ip_adress: session.access.ip,
            device: session.access.device,
            intrusion: true,
          };
          await Log(new_log).save();
            var temp_notif = {
              title:"Intrusion dans le système",
              content:  "L'agent " +
              new_log.m_code +
              " s'est connecté sur un réseaux non autorisée sur l'appareille " +
              new_log.device.split(";")[1],
              datetime:moment().format("DD/MM/YYYY hh:mm:ss"),

            }
            
            var concerned = ["Admin","Surveillant","Opération"];
            await Methods.setGlobalAdminNotifications(temp_notif,concerned,true,req);
          res.redirect("/not");
        }
  } else {
    res.redirect("/");
  }
}
// Startwork request 
const startWork = async (req,res) => {
    var session = req.session;
  if (session.occupation_u == "User") {
    await startwork(req.body.timework, req.body.locaux, req.session, res);
  } else {
    res.send("error");
  }
}
//Changing hour
const changingHour = async(req,res) => {
    var session = req.session;
  if (session.occupation_u == "User") {
    await changing(req.body.ch_hour, req.session, res);
  } else {
    res.redirect("/");
  }
}
//Update User status
const statusChange = async(req,res) =>{
    var session = req.session;
  if (session.occupation_u == "User") {
    await status_change(req.body.act_loc, req.body.act_stat, req.session, res);
  } else {
    res.send("error");
  }
}
//Notify when break exceed
const notifyExceed = async(req,res) => {
  var m_code = req.body.code;
  var contexte = req.body.contexte;
  var notification = {
    title:"Dépassement de temps",
    content:  m_code + " depasse le temp de " + contexte,
    datetime:moment().format("DD/MM/YYYY hh:mm:ss"),
  }
      var concerned = ["Admin","Surveillant","Opération"];
      await Methods.setGlobalAdminNotifications(notification,concerned,false,req);
      res.send("OK");
}
//Handling work status to change place or a PC
const handleWork = async(req,res) => {
    var session = req.session;
  if (session.occupation_u == "User") {
    await handlework(req.body.choice, req.session, res);
  } else {
    res.send("error");
  }
}
//When user end his day
const leftWork = async(req,res) => {
    var session = req.session;
  if (session.occupation_u == "User") {
    await leftwork(req.session, res);
  } else {
    res.send("error");
  }
}
//When user is on inactivity
const inactivity = async(req,res) =>{
    var session = req.session;
    if (session.occupation_u == "User") {
      await activity(req.body.activity, req.session, res);
    } else {
      res.send("error");
    }
}
//User will be absent on his worktime
const setAbsence = async(req,res) =>{
    var session = req.session;
    if (session.occupation_u == "User") {
      await absent(req.body.reason, req.body.stat, req.session, res);
    } else {
      res.send("error");
    }
}
//User forgot to left work on the page
const updateTimeForget = async(req,res) => {
    var session = req.session;
  if (session.occupation_u == "User") {
    await update_last(req.body.timeforget, req.session, res);
  } else {
    res.send("retour");
  }
}
//User is late
const delayDetected = async(req,res) => {
    var session = req.session;
    if (session.occupation_u == "User") {
      await reason_late(req.body.reason, req.session, res);
    } else {
      res.redirect("/");
    }
}
//User set his hour
const getHour = async(req,res) => {
    var session = req.session;
    if (session.occupation_u == "User") {
      await get_hour(req.body.hour, req.session, res);
    } else {
      res.redirect("/");
    }
}
//User set his time_entry
const setEntry = async(req,res) => {
    var session = req.session;
    if (session.occupation_u == "User") {
      await change_entry(req.body.entry, req.session, res);
    } else {
      res.redirect("/");
    }
}

//Methode to use on controller clocking user

//Sending alert to admin if there is 3 delays confirmed
function send_alert_late(user, raison, receiver) {
    var mailOptions = {
      from: "Solumada application",
      to: receiver,
      subject: "Retard frequent de " + user,
      html: listed(raison),
    };
  
    globalvariable.transporter.sendMail(mailOptions, function (error, info) {
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
//Working action
async function startwork(timework, locaux, session, res) {
    var date = moment().format("YYYY-MM-DD");
    var timestart = moment().format("HH:mm");
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
              delaysTime(session.new_time.entry, timestart) == "n"
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
              timestart = moment().format("HH:mm");
              session.time = delaysTime(session.new_time.entry, timestart);
              res.send(
                "retard," + delaysTime(session.new_time.entry, timestart)
              );
            }
          }
        }
  }
  //Changin hours method
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
// Update status method
async function status_change(lc, st, session, res) {
    await UserSchema.findOneAndUpdate(
      { m_code: session.m_code },
      { act_stat: st, act_loc: lc }
    );
    res.send(st + "," + moment().format("HH:mm"));
}
// Handle work (logout and resume or changing place)
async function handlework(choice, session, res) {
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

//method to use when user left
async function leftwork(session, res) {
    var timeend = moment().format("HH:mm");
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
 // Method when user in inactivity of work
 async function activity(activity, session, res) {
    if (activity != "ABSENT") {
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
            var timestart = moment().format("HH:mm");
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
            res.send("Ok");
          } else {
            res.send("Ok");
          }
    } else {
      res.send("Ok");
    }
  }
  // Method when user set an absence
  async function absent(reason, stat, session, res) {
    var timestart = moment().format("HH:mm");
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
// Method to update the time end of work forget by user
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
//Methode to use when user is late
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
function generate_text(one, two) {
return one + " (" + two + ")";
}
//Method to use when user change his time work hour
async function get_hour(h, session, res) {
    await UserSchema.findOneAndUpdate(
      { m_code: session.m_code },
      { user_ht: h }
    );
    res.send("Ok");
}
//Method to use when user set his time entry
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
//Access IP
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
        return true;
        return false;
      }
    } else {
      return true;
    }
  }
  //Calcul delay method
  function delaysTime(regular, arrived) {
    var time = 0;
    var lh = 0;
    var lm = 0;
    regular = moment(regular, "HH:mm:ss a");
    arrived = moment(arrived, "HH:mm:ss a");
    var duration = MOMENT.duration(arrived.diff(regular));
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
  //Convert minute to hour
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

module.exports = {
    pageEmployee,startWork,changingHour,statusChange,notifyExceed,handleWork,leftWork,
    inactivity,setAbsence,updateTimeForget,delayDetected,getHour,setEntry
}