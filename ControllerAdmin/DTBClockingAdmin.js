const UserSchema = require("../models/ModelMember");
const StatusSchema = require("../models/ModelClocking");
const AbsentSchema = require("../models/ModelAbsence");
const LeaveSchema = require("../models/ModelLeave");
const moment = require("moment");
const ExcelFile = require("sheetjs-style");
const globaleVariable = require("../ControllerDTB/GlobaleVariable")
const Methods = require("../ControllerDTB/GlobalMethods");

// Get page clocking admin

const getPageClocking = async(req,res) => {
    var session = req.session;
  if (session.occupation_a == "Admin") {
        if (session.filtrage == "" && globaleVariable.data_desired[session.m_code]) {
          session.filtrage = null;
          var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
           var role = session.idUser == "645a417e9d34ed8965caea9e" ? "Gerant" : "Admin"
          res.render("PageAdministration/TableauPointage.html", {
            timesheets: globaleVariable.data_desired[session.m_code].datatowrite,
            username: session.mailing,
            notif: dataUser.myNotifications,
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
           var role = session.idUser == "645a417e9d34ed8965caea9e" ? "Gerant" : "Admin"
          res.render("PageAdministration/TableauPointage.html", {
            timesheets: timesheets,
            username: session.mailing,
            notif: dataUser.myNotifications,
            role:role,
            dataUser:dataUser
          });
        }
  } else {
    res.redirect("/");
  }
}
// Filtering data clocking
const filterData = async(req,res) => {
    var session = req.session;
  if (
    session.occupation_a == "Admin" ||
    session.occupation_tl == "Surveillant"
  ) {
    session.filtrage = "";
    globaleVariable.data_desired[session.m_code] = {};
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
        searchit == "" ? delete globaleVariable.filtrage.search : (globaleVariable.filtrage.search = searchit);
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
            globaleVariable.filtrage.date = datestart;
            globaleVariable.date_data.push(globaleVariable.filtrage.date);
            if (globaleVariable.filtrage.search) {
              getdata = await StatusSchema.find({
                $or: [
                  { m_code: { $regex: searchit, $options: "i" } },
                  // { nom: { $regex: searchit, $options: "i" } },
                  { locaux: { $regex: searchit, $options: "i" } },
                ],
                date: globaleVariable.filtrage.date,
              }).sort({
                _id: -1,
              });
              getdataabsence = await AbsentSchema.find({
                date: globaleVariable.filtrage.date,
              }).sort({
                _id: -1,
              });
              getdataleave = await LeaveSchema.find({
                date_start: globaleVariable.filtrage.date,
              }).sort({
                _id: -1,
              });
            } else {
              getdata = await StatusSchema.find({ date: globaleVariable.filtrage.date });
              getdataabsence = await AbsentSchema.find({ date: globaleVariable.filtrage.date });
              getdataleave = await LeaveSchema.find({
                date_start: globaleVariable.filtrage.date,
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
            globaleVariable.data_desired[session.m_code].datatowrite = datatosend[0];
            globaleVariable.data_desired[session.m_code].dataabsence = absent_temp[0];
            globaleVariable.data_desired[session.m_code].dataleave = temp_leave[0];
            res.send(datatosend[0]);
          } else {
            globaleVariable.data_desired[session.m_code].datatowrite = datatosend;
            globaleVariable.data_desired[session.m_code].dataabsence = [];
            globaleVariable.data_desired[session.m_code].dataleave = [];
            res.send(datatosend);
          }
        } else if (datecount.length == 1) {
          if (datecount[0] == 1) {
            globaleVariable.filtrage.date = datestart;
            if (globaleVariable.filtrage.search) {
              datatosend = await StatusSchema.find({
                $or: [
                  { m_code: { $regex: searchit, $options: "i" } },
                  // { nom: { $regex: searchit, $options: "i" } },
                  { locaux: { $regex: searchit, $options: "i" } },
                ],
                date: globaleVariable.filtrage.date,
              }).sort({
                _id: -1,
              });
              globaleVariable.data_desired[session.m_code].dataabsence =
                await AbsentSchema.find({ date: globaleVariable.filtrage.date }).sort({
                  _id: -1,
                });
              globaleVariable.data_desired[session.m_code].dataleave = await LeaveSchema.find({
                date_start: globaleVariable.filtrage.date,
              }).sort({
                _id: -1,
              });
            } else {
              datatosend = await StatusSchema.find({ date: globaleVariable.filtrage.date });
              globaleVariable.data_desired[session.m_code].dataabsence =
                await AbsentSchema.find({ date: globaleVariable.filtrage.date });
              globaleVariable.data_desired[session.m_code].dataleave = await LeaveSchema.find({
                date_start: globaleVariable.filtrage.date,
              });
            }
            globaleVariable.data_desired[session.m_code].datatowrite = datatosend;
            session.searchit = searchit;
            res.send(datatosend);
          } else {
            globaleVariable.filtrage.date = dateend;
            if (globaleVariable.filtrage.search) {
              datatosend = await StatusSchema.find({
                $or: [
                  { m_code: { $regex: searchit, $options: "i" } },
                  // { nom: { $regex: searchit, $options: "i" } },
                  { locaux: { $regex: searchit, $options: "i" } },
                ],
                date: globaleVariable.filtrage.date,
              }).sort({
                _id: -1,
              });
              globaleVariable.data_desired[session.m_code].dataabsence =
                await AbsentSchema.find({ date: globaleVariable.filtrage.date }).sort({
                  _id: -1,
                });
              globaleVariable.data_desired[session.m_code].dataleave = await LeaveSchema.find({
                date_start: globaleVariable.filtrage.date,
              }).sort({
                _id: -1,
              });
            } else {
              datatosend = await StatusSchema.find({ date: globaleVariable.filtrage.date });
            }
            globaleVariable.data_desired[session.m_code].datatowrite = datatosend;
            session.searchit = searchit;
            res.send(datatosend);
          }
        } else {
          delete globaleVariable.filtrage.date;
          datatosend = await StatusSchema.find({
            $or: [
              { m_code: { $regex: searchit, $options: "i" } },
              // { nom: { $regex: searchit, $options: "i" } },
              { locaux: { $regex: searchit, $options: "i" } },
            ],
          }).sort({ _id: -1 });
          globaleVariable.data_desired[session.m_code].datatowrite = datatosend;
          globaleVariable.data_desired[session.m_code].dataabsence = await AbsentSchema.find(
            {}
          ).sort({
            _id: -1,
          });
          globaleVariable.data_desired[session.m_code].dataleave = await LeaveSchema.find(
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
}
//Generate excel file
const generateExcel = async(req,res) => {
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
          for (i = 0; i < globaleVariable.data_desired[session.m_code].datatowrite.length; i++) {
            if (
              all_employes.includes(
                globaleVariable.data_desired[session.m_code].datatowrite[i].m_code
              )
            ) {
            } else {
              all_employes.push(
                globaleVariable.data_desired[session.m_code].datatowrite[i].m_code
              );
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
            var name_user = await StatusSchema.findOne({
              m_code: all_employes[e],
            });
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
            Methods.generate_excel(
              globaleVariable.data_desired[session.m_code].datatowrite,
              globaleVariable.data_desired[session.m_code].dataabsence,
              globaleVariable.data_desired[session.m_code].dataleave,
              all_employes[e]
            );
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
          if (newsheet.SheetNames.length != 0) {
            if (all_employes.length <= 1) {
              session.filename =
                "N°" + globaleVariable.num_file + " " + all_employes[0] + ".xlsx";
              globaleVariable.num_file++;
            } else {
              session.filename = "N°" + globaleVariable.num_file + " Pointage.xlsx";
              globaleVariable.num_file++;
            }
            ExcelFile.writeFile(newsheet, session.filename);
            delete globaleVariable.filtrage.searchit;
            delete globaleVariable.filtrage.date;
            delete globaleVariable.filtrage.search;
            globaleVariable.data_desired[session.m_code].datatowrite = await StatusSchema.find(
              {}
            );
          }
          res.send("Done");
    } else {
      res.redirect("/");
    }
}

//Method to use in Clocking admin
  module.exports = {
        getPageClocking,filterData,generateExcel
  }