const UserSchema = require("../models/ModelMember");
const moment = require("moment");
const ExcelFile = require("sheetjs-style");
const globaleVariable = require("../ControllerDTB/GlobaleVariable")


function sendEmail(receiver, subject, text) {
  var mailOptions = {
    from: "Timesheets Optimum solution",
    to: receiver,
    subject: subject,
    html: text,
  };

  globaleVariable.transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}
async function setGlobalAdminNotifications(notification, concerned, spec, req) {
  await UserSchema.updateMany({ occupation: { $in: concerned }, _id: { $ne: "645a417e9d34ed8965caea9e" } }, { $push: { myNotifications: notification } });
  var idNotif = await UserSchema.findOne({ occupation: { $in: concerned } });
  if (spec) {
    concerned.push("Gerant")
    var otherId = await UserSchema.findOneAndUpdate({ _id: "645a417e9d34ed8965caea9e" }, { $push: { myNotifications: notification } }, { new: true });
    notification.otherId = otherId.myNotifications[otherId.myNotifications.length - 1]._id
  }
  var idNotif = await UserSchema.findOne({ occupation: { $in: concerned } });
  idNotif ? notification.idNotif = idNotif.myNotifications[idNotif.myNotifications.length - 1]._id : notification.idNotif = ""
  const io = req.app.get("io");
  io.sockets.emit("notif", [concerned, notification]);
}
async function setEachUserNotification(code, title, content, req) {
  var myNotif = {
    title: title,
    content: content,
    datetime: moment().format("DD/MM/YYYY hh:mm"),
    isSeen: false
  }
  await UserSchema.findOneAndUpdate({ m_code: code }, { $push: { myNotifications: myNotif } }, { new: true })
  const io = req.app.get("io");
  io.sockets.emit(code, myNotif);
}
function date_diff(starting, ending) {
  var startings = moment(moment(starting)).format("YYYY-MM-DD");
  var endings = moment(ending, "YYYY-MM-DD");
  var duration = moment.duration(endings.diff(startings));
  var dayl = duration.asDays();
  return parseInt(dayl.toFixed(0));
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
      globaleVariable.data.push(ligne);
    }
  }
  while (globaleVariable.minutes >= 60) {
    globaleVariable.hours = globaleVariable.hours + 1;
    globaleVariable.minutes = globaleVariable.minutes - 60;
  }
  totaltime = globaleVariable.hours + "H " + globaleVariable.minutes + "MN";
  globaleVariable.data.push(["", "", "", "", "", "TOTALE", totaltime, "", "", ""]);
  cum_tot = totaltime;
  globaleVariable.data.push(["", "", "", "", "", "", "", "", "", ""]);
  globaleVariable.hours = 0;
  globaleVariable.minutes = 0;
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
    while (globaleVariable.minutes >= 60) {
      globaleVariable.hours = globaleVariable.hours + 1;
      globaleVariable.minutes = globaleVariable.minutes - 60;
    }
    totaltime = globaleVariable.hours + "H " + globaleVariable.minutes + "MN";
    cum_abs = totaltime;
    if (lateligne.length > 0) {
      globaleVariable.data.push(["", "", "", "", "", "", "", "", "", ""]);
      globaleVariable.data.push(["", "", "", "ABSENCE AVEC RETOUR", "", "", "", "", "", ""]);
      globaleVariable.data.push([
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
        globaleVariable.data.push(element);
      });
      globaleVariable.data.push(["", "", "", "", "", "TOTAL", totaltime, "", "", ""]);
    }
    if (latelignent.length > 0) {
      globaleVariable.data.push(["", "", "", "", "ABSENCE SANS RETOUR", "", "", "", "", ""]);
      globaleVariable.data.push([
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
        globaleVariable.data.push(element);
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
        globaleVariable.data.push(["", "", "", "", "", "", "", "", "", ""]);
        globaleVariable.data.push(["", "", "", "", "RAPPORT CONGE", "", "", "", "", ""]);
        globaleVariable.data.push([
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
        globaleVariable.data.push(lateligne);
        cumg += conge[i].duration;
      }
    }
    if (cumg != 0) {
      globaleVariable.data.push(["", "", "", "", "", "TOTAL", cumg + " jour(s)", "", "", ""]);
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
  globaleVariable.all_datas.push(each_data);
  ws = ExcelFile.utils.aoa_to_sheet(globaleVariable.data);

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
  for (r = 0; r < globaleVariable.data.length; r++) {
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
    globaleVariable.hours += hours_fictif;
    globaleVariable.minutes += minutes_fictif;
    return hours_fictif + "H " + minutes_fictif + "MN";
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
function style() {
  var cellule = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  for (c = 0; c < cellule.length; c++) {
    for (i = 1; i <= globaleVariable.data.length; i++) {
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
function style2() {
  var cellule = ["A", "B", "C", "D", "E", "F", "G"];
  for (c = 0; c < cellule.length; c++) {
    for (i = 1; i <= globaleVariable.all_datas.length; i++) {
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

module.exports = {
  setGlobalAdminNotifications, setEachUserNotification, date_diff, sendEmail, generate_excel, calcul_timediff_absence, calcul_timediff_principle, global_Report
}
