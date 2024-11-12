const UserSchema = require("../models/ModelMember");
const StatusSchema = require("../models/ModelClocking");
const AbsentSchema = require("../models/ModelAbsence");
const LeaveSchema = require("../models/ModelLeave");
const moment = require("moment");
const ExcelFile = require("sheetjs-style");

const globaleVariable = require("../ControllerDTB/GlobaleVariable")

//Get page pointage
const getPageClockingTL = async(req,res) => {
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
        if (session.filtrage == "" && globaleVariable.data_desired[session.m_code]) {
          session.filtrage = null;
          var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
          var role = "Surveillant"
          res.render("PageTL/TableauPointageTL.html", {
            timesheets: globaleVariable.data_desired[session.m_code].datatowrite,
            username: session.mailing,
            notif: dataUser.myNotifications,
            show_another: show_another,
            role:role,
            dataUser:dataUser
          });
        } else {
          globaleVariable.data_desired[session.m_code] = {};
          var timesheets = await StatusSchema.find({
            date: moment().format("YYYY-MM-DD"),
          });
          globaleVariable.data_desired[session.m_code].datatowrite = timesheets;
          globaleVariable.data_desired[session.m_code].dataabsence = await AbsentSchema.find({
            date: moment().format("YYYY-MM-DD"),
          });
          globaleVariable.data_desired[session.m_code].dataleave = await LeaveSchema.find({
            $or: [
              { date_start: moment().format("YYYY-MM-DD") },
              { date_start: moment().format("YYYY-MM-DD") },
            ],
          });
          var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
          var role = "Surveillant"
          res.render("PageTL/TableauPointageTL.html", {
            timesheets: timesheets,
            username: session.mailing,
            notif: dataUser.myNotifications,
            show_another: show_another,
            role:role,
            dataUser:dataUser
          });
        }
  } else {
    res.redirect("/");
  }
}
//Generate excel TL
const generateClockingTL = async(req,res) => {
    var session = req.session;
  if (session.occupation_tl == "Surveillant") {
    var newsheet = ExcelFile.utils.book_new();
    newsheet.Props = {
      Title: "Timesheets",
      Subject: "Logged Time",
      Author: "Solumada",
    };
    newsheet.SheetNames.push("TOUS LES EMPLOYER");
        globaleVariable.pointage_journalier.push([
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
        globaleVariable.pointage_journalier.push(["", "", "", "", "", "", "", "", "", "", ""]);
        globaleVariable.pointage_journalier.push([
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
        var pointages = globaleVariable.data_desired[session.m_code].datatowrite;
        var abs = globaleVariable.data_desired[session.m_code].dataabsence;
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
            globaleVariable.pointage_journalier.push([
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
            globaleVariable.pointage_journalier.push([
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
        globaleVariable.pointage_journalier.sort((a, b) => {
          const nameA = a[1].toLowerCase();
          const nameB = b[1].toLowerCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });
        global_ReportTl(globaleVariable.pointage_journalier);
        newsheet.Sheets["TOUS LES EMPLOYER"] = ws;
        globaleVariable.pointage_journalier = [];
        if (newsheet.SheetNames.length != 0) {
          session.filename = "N°" + globaleVariable.num_file + " Pointage.xlsx";
          globaleVariable.num_file++;
          ExcelFile.writeFile(newsheet, session.filename);
          delete globaleVariable.filtrage.searchit;
          delete globaleVariable.filtrage.date;
          delete globaleVariable.filtrage.search;
        }
        res.send("Done");
  } else {
    res.redirect("/");
  }
}
// get all users for tl
const allUserForTL = async(req,res) => {
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
}


function calcul_timediff_absencetl(startTime, endTime) {
  if (startTime != "") {
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
          return minutes_fictif + " minutes";
      }
      else if (minutes_fictif == 0) {
          return hours_fictif + " heures";
      }
      else {
          return hours_fictif + " heures " + minutes_fictif + " minutes";
      }
  }
  else {
      return "heure non défini"
  }
}
//Method to use
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
  function style6() {
    var cellule = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
    for (c = 0; c < cellule.length; c++) {
      for (i = 1; i <= globaleVariable.pointage_journalier.length; i++) {
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
  
  module.exports = {
    getPageClockingTL,generateClockingTL,allUserForTL
  }