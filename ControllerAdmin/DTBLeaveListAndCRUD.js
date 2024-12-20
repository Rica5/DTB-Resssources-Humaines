const UserSchema = require("../models/ModelMember");
const LeaveSchema = require("../models/ModelLeave");
const LeaveRequestTest = require("../models/ModelLeaveRequest");
const moment = require("moment");
const ExcelFile = require("sheetjs-style");
const fs = require("fs");
const Methods = require("../ControllerDTB/GlobalMethods")
const globaleVariable = require("../ControllerDTB/GlobaleVariable")
const { PDFNet } = require("@pdftron/pdfnet-node");


// Page Leavelist
const getPageLeavelist = async (req, res) => {
  var session = req.session;
  if (session.occupation_a == "Admin") {
    var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
    var role = session.idUser == "645a417e9d34ed8965caea9e" ? "Gerant" : "Admin";
    var allPermission = await LeaveSchema.find({exceptType: { $ne: "", $exists: true }, type: "Permission exceptionelle ( rien à deduire )",  validation: false , date_start: { $regex: moment().format("YYYY") } }).select("m_code type exceptType duration")
    
    res.render("PageAdministration/ListeConges.html", {
      notif: dataUser.myNotifications,
      username: session.mailing, 
      role: role,
      dataUser: dataUser,
      allPermission: allPermission
    });

  } else {
    res.redirect("/");
  }
}
//Page leavelist opération
const getLeaveOperation = async (req, res) => {
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
    var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
    var role = "Opération"
    res.render("PageOperation/CongeOperation.html", {
      another: another_post,
      username: session.mailing,
      notif: dataUser.myNotifications,
      role: role,
      dataUser: dataUser
    });
  } else {
    res.redirect("/");
  }
}
//Get recap leaves
const getPageRecap = async (req, res) => {
  var session = req.session;
  if (session.occupation_a == "Admin") {
    var alluser = await UserSchema.find(
      { occupation: "User", status: "Actif" },
      { adresse: 0, password: 0, username: 0, phone: 0 }
    ).sort({
      m_code: 1,
    });
    var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
    var role = session.idUser == "645a417e9d34ed8965caea9e" ? "Gerant" : "Admin";
    for (let index = 0; index < alluser.length; index++) {
      const element = alluser[index];
      element.leave_stat = moment(element.save_at).add(1, "years").locale("Fr").format("MMMM YYYY")
      element.save_at = moment(element.save_at).format("DD/MM/YYYY")
      alluser[index] = element
    }
    res.render("PageAdministration/RecapConges.html", {
      users: alluser,
      username: session.mailing,
      notif: dataUser.myNotifications,
      dataUser: dataUser,
      role: role
    });
  } else {
    res.redirect("/");
  }
}
//All leavelist
const retrieveLeaveList = async (req, res) => {
  var session = req.session;
  if (session.occupation_a == "Admin" || session.occupation_op == "Opération") {
    var all_leave = await LeaveSchema.find({ validation: false })
      .populate({
        path: 'LeaveRequestTest',
        options: { strictPopulate: false }
      }).sort({
        m_code: 1,
        date_start: 1
      });
    var users = await UserSchema.find({
      m_code: { $ne: "N/A" },
      status: "Actif",
    })
      .select(
        "profil m_code remaining_leave leave_stat leave_taked project shift"
      )
      .sort({
        m_code: 1,
      });
    
    res.send([all_leave, users]);
  } else {
    res.redirect("/");
  }
}
const LeaveReport = async (req, res) => {
  var session = req.session;
  var month = req.body.month;
  var year = req.body.year;
  var populateAll = {
    populateConge: ["N/A", "N/A", 0, "", "", "", "", 0, 0, 0],
    populateSansSolde: ["N/A", "N/A", "", "", "", 0, "", 0, 0, 0],
    populatePermission: ["N/A", "N/A", "", 0, "", "", "", 0, 0, 0],
    populateRepos: ["N/A", "N/A", "", "", 0, "", "", 0, 0, 0],
  }
  if (session.occupation_a == "Admin") {
    globaleVariable.monthly_leave = await LeaveSchema.find({
      date_start: { $regex: year + "-" + month, $options: "i" },
      date_end: { $regex: year + "-" + month, $options: "i" },
    });
    var getting = ["en cours"];
    globaleVariable.maternity = await LeaveSchema.find({
      type: "Congé de maternité ( rien à deduire )",
      status: { $in: getting },
    });
    var newsheet_leave = ExcelFile.utils.book_new();
    var m_leave = [];
    var leave_report = [];
    var merging = [];
    var rowLength = [];
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
      "REPOS MALADIE A \n PAYER à calculer par \n RH Maurice car salaire \n minimal",
      "CONGES SANS SOLDE \n OU ABSENCE A \n DEDUIRE SUR SALAIRE \n à calculer par RH \n Maurice car salaire \n minimal",
      "",
    ]);
    newsheet_leave.SheetNames.push("Conge " + months);
    for (i = 0; i < globaleVariable.monthly_leave.length; i++) {
      if (m_leave.includes(globaleVariable.monthly_leave[i].num_agent)) {
      } else {
        m_leave.push(globaleVariable.monthly_leave[i].num_agent);
      }
    }
    

    function transformData(data) {
      const fieldsToCheck = [
        "conge_payer",
        "deduire_sur_salaire",
        "permission_exceptionnelle",
        "rien_a_deduire",
      ];
    
      const transformed = [];
    
      function calculateEndDate(startDate, duration) {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + (duration - 1));
        const formattedEnd = end.toISOString().split("T")[0];
        return formattedEnd;
      }
      data.forEach((item) => {
        let hasDuplicated = false;
        let StartDate = item.date_start;
        // newItem.duration = 0
        

        fieldsToCheck.forEach((field) => {
          if (item[field] !== 0) {
            // Create a duplicate with only the current field
            const duplicate = { ...item._doc };
            hasDuplicated = true;
    
            // Reset all specified fields to 0 except the current field
            fieldsToCheck.forEach((key) => {
              duplicate[key] = key === field ? item[key] : 0;
            });
    
            // calculate duration
            duplicate.duration = Math.max(...fieldsToCheck.map(k => duplicate[k]))
    
            // Adjust date_start and date_end based on the field
            const days = duplicate.duration;
            if (duplicate.date_start !== duplicate.date_end) {
              duplicate.date_start = StartDate; // Keep the same start date
              duplicate.date_end = calculateEndDate(StartDate, days) // Calculate new end date
              StartDate = calculateEndDate(duplicate.date_end, 2);
            }
            transformed.push(duplicate);
          }
        });
    
        // Add the original item if no field was duplicated
        if (!hasDuplicated) {
          transformed.push(item);
        }
      });
    
      return transformed;
    }

    var splitedLeaves = transformData(globaleVariable.monthly_leave) 
        
          
    m_leave = m_leave.sort();
    for (m = 0; m < m_leave.length; m++) {
      var count = 0;
      populateAll.populateConge = ["N/A", "N/A", 0, "", "", "", "", 0, 0, 0]
      populateAll.populatePermission = ["N/A", "N/A", "", 0, "", "", "", 0, 0, 0]
      populateAll.populateRepos = ["N/A", "N/A", "", "", 0, "", "", 0, 0, 0]
      populateAll.populateSansSolde = ["N/A", "N/A", "", "", "", 0, "", 0, 0, 0]
      // console.log("globaleVariable.monthly_leave", globaleVariable.monthly_leave);
      
      for (i = 0; i < splitedLeaves.length; i++) {
        let getUser = splitedLeaves[i]
        if (getUser.num_agent == m_leave[m]) {
          if (getUser.motif.includes("Congé de maternité")) {

          } else {
            // getUser.motif = getUser.motif.replace("rien à deduire", "rien à déduire")
            // getUser.motif = getUser.motif.replace("a déduire sur salaire", "à déduire sur salaire")
            var motif = getUser.duration == 0.25
              ? calcul_timediff_absencereport(getUser.hour_begin, getUser.hour_end) +
              motif_rendered(getUser.motif, getUser.type) +
              date_rendered(
                getUser.date_start,
                getUser.date_end
              )
              : getUser.duration +
              " jour(s) " +
              motif_rendered(getUser.motif, getUser.type) +
              date_rendered(
                getUser.date_start,
                getUser.date_end
              )
            if (getUser.conge_payer != 0 ) {
              if (getUser.duration == 0.25) {
                getUser.duration = 0;
                var hourCalculate = calcul_timediff_absencereport_spec(getUser.hour_begin, getUser.hour_end);
                populateAll.populateConge[7] = populateAll.populateConge[7] + hourCalculate[0];
                populateAll.populateConge[8] = populateAll.populateConge[8] + hourCalculate[1];
              }
              populateAll.populateConge[0] = getUser.num_agent;
              populateAll.populateConge[1] = getUser.m_code;
              populateAll.populateConge[2] = populateAll.populateConge[2] + getUser.conge_payer;
              populateAll.populateConge[6] = populateAll.populateConge[6] == "" ? `${motif}` : populateAll.populateConge[6] + " et \n" + motif;
              while (populateAll.populateConge[8] >= 60) {
                populateAll.populateConge[8] = populateAll.populateConge[8] - 60;
                populateAll.populateConge[7] = populateAll.populateConge[7] + 1;
              }
              while (populateAll.populateConge[7] >= 24) {
                populateAll.populateConge[7] = populateAll.populateConge[7] - 24;
                populateAll.populateConge[2] = populateAll.populateConge[2] + 1;
              }
              populateAll.populateConge[9] = populateAll.populateConge[9] + 1;
            }
            if (getUser.deduire_sur_salaire != 0) {
              if (getUser.duration == 0.25) {
                getUser.duration = 0;
                var hourCalculate = calcul_timediff_absencereport_spec(getUser.hour_begin, getUser.hour_end);
                populateAll.populateSansSolde[7] = populateAll.populateSansSolde[7] + hourCalculate[0];
                populateAll.populateSansSolde[8] = populateAll.populateSansSolde[8] + hourCalculate[1];
              }
              populateAll.populateSansSolde[0] = getUser.num_agent;
              populateAll.populateSansSolde[1] = getUser.m_code;
              populateAll.populateSansSolde[5] = populateAll.populateSansSolde[5] + getUser.deduire_sur_salaire;
              populateAll.populateSansSolde[6] = populateAll.populateSansSolde[6] == "" ? `${motif}` : populateAll.populateSansSolde[6] + " et \n" + motif;
              while (populateAll.populateSansSolde[8] >= 60) {
                populateAll.populateSansSolde[8] = populateAll.populateSansSolde[8] - 60;
                populateAll.populateSansSolde[7] = populateAll.populateSansSolde[7] + 1;
              }
              while (populateAll.populateSansSolde[7] >= 24) {
                populateAll.populateSansSolde[7] = populateAll.populateSansSolde[7] - 24;
                populateAll.populateSansSolde[5] = populateAll.populateSansSolde[5] + 1;
              }
              populateAll.populateSansSolde[9] = populateAll.populateSansSolde[9] + 1;
            }
            if (getUser.permission_exceptionnelle != 0) {
              if (getUser.duration == 0.25) {
                getUser.duration = 0;
                var hourCalculate = calcul_timediff_absencereport_spec(getUser.hour_begin, getUser.hour_end);
                populateAll.populatePermission[7] = populateAll.populatePermission[7] + hourCalculate[0];
                populateAll.populatePermission[8] = populateAll.populatePermission[8] + hourCalculate[1];
              }
              populateAll.populatePermission[0] = getUser.num_agent;
              populateAll.populatePermission[1] = getUser.m_code;
              populateAll.populatePermission[3] = populateAll.populatePermission[3] + getUser.permission_exceptionnelle;
              populateAll.populatePermission[6] = populateAll.populatePermission[6] == "" ? `${motif}` : populateAll.populatePermission[6] + " et \n" + motif;
              while (populateAll.populatePermission[8] >= 60) {
                populateAll.populatePermission[8] = populateAll.populatePermission[8] - 60;
                populateAll.populatePermission[7] = populateAll.populatePermission[7] + 1;
              }
              while (populateAll.populatePermission[7] >= 24) {
                populateAll.populatePermission[7] = populateAll.populatePermission[7] - 24;
                populateAll.populatePermission[3] = populateAll.populatePermission[3] + 1;
              }
              populateAll.populatePermission[9] = populateAll.populatePermission[9] + 1;
            }
            if (getUser.rien_a_deduire != 0) {
              if (getUser.duration == 0.25) {
                getUser.duration = 0;
                var hourCalculate = calcul_timediff_absencereport_spec(getUser.hour_begin, getUser.hour_end);
                populateAll.populateRepos[7] = populateAll.populateRepos[7] + hourCalculate[0];
                populateAll.populateRepos[8] = populateAll.populateRepos[8] + hourCalculate[1];
              }
              populateAll.populateRepos[0] = getUser.num_agent;
              populateAll.populateRepos[1] = getUser.m_code;
              populateAll.populateRepos[4] = populateAll.populateRepos[3] + getUser.rien_a_deduire;
              populateAll.populateRepos[6] = populateAll.populateRepos[6] == "" ? `${motif}` : populateAll.populateRepos[6] + " et \n" + motif;
              while (populateAll.populateRepos[8] >= 60) {
                populateAll.populateRepos[8] = populateAll.populateRepos[8] - 60;
                populateAll.populateRepos[7] = populateAll.populateRepos[7] + 1;
              }
              while (populateAll.populateRepos[7] >= 24) {
                populateAll.populateRepos[7] = populateAll.populateRepos[7] - 24;
                populateAll.populateRepos[3] = populateAll.populateRepos[3] + 1;
              }
              populateAll.populateRepos[9] = populateAll.populateRepos[9] + 1;
            }
            
              
          }
        }
      }
      if (populateAll.populateConge[0] != "N/A") {
        count++;
        populateAll.populateConge[2] = renderResult(populateAll.populateConge[2], populateAll.populateConge[7], populateAll.populateConge[8]);
        populateAll.populateConge[6] = populateAll.populateConge[6].replace(/\d+\.\d+/g, function (match) {
          return match.replace('.', '.');
        });
        rowLength.push([leave_report.length, populateAll.populateConge[9]])
        // populateAll.populateConge.splice(-3);
        leave_report.push(populateAll.populateConge);
      }
      if (populateAll.populatePermission[0] != "N/A") {
        count++;
        populateAll.populatePermission[3] = renderResult(populateAll.populatePermission[3], populateAll.populatePermission[7], populateAll.populatePermission[8]);
        populateAll.populatePermission[6] = populateAll.populatePermission[6].replace(/\d+\.\d+/g, function (match) {
          return match.replace('.', '.');
        });
        rowLength.push([leave_report.length, populateAll.populatePermission[9]])
        populateAll.populatePermission.splice(-3);
        leave_report.push(populateAll.populatePermission);
      }
      if (populateAll.populateRepos[0] != "N/A") {
        count++;
        // console.log("mm", m_leave[m]);
        
        // if (m_leave[m] == "0108") {
          // console.log("populateAll", populateAll);
          console.log("", renderResult(populateAll.populateRepos[5], populateAll.populateRepos[7], populateAll.populateRepos[8]));
          console.log("pop 7, 8", populateAll.populateRepos[7], populateAll.populateRepos[8]);
          
          
          
        // }
        populateAll.populateRepos[4] = renderResult(populateAll.populateRepos[4], populateAll.populateRepos[7], populateAll.populateRepos[8]);
        console.log("popu", populateAll.populateRepos[4]);
        console.log("*****");
        
        
        populateAll.populateRepos[6] = populateAll.populateRepos[6].replace(/\d+\.\d+/g, function (match) {
          return match.replace('.', '.');
        });
        rowLength.push([leave_report.length, populateAll.populateRepos[9]])
        // populateAll.populateRepos.splice(-3);
        leave_report.push(populateAll.populateRepos);
      }

      if (populateAll.populateSansSolde[0] != "N/A") {
        count++;
        populateAll.populateSansSolde[5] = renderResult(populateAll.populateSansSolde[5], populateAll.populateSansSolde[7], populateAll.populateSansSolde[8]);
        populateAll.populateSansSolde[6] = populateAll.populateSansSolde[6].replace(/\d+\.\d+/g, function (match) {
          return match.replace('.', '.');
        });
        rowLength.push([leave_report.length, populateAll.populateSansSolde[9]])
        // populateAll.populateSansSolde.splice(-3);
        leave_report.push(populateAll.populateSansSolde);
      }
      
      merging.push([m, count]);
    }

    

    
    leave_report.push(["", "", "", "", "", "", ""]);
    leave_report.push(["", "", "", "", "", "", ""]);
    for (mat = 0; mat < globaleVariable.maternity.length; mat++) {
      leave_report.push([
        globaleVariable.maternity[mat].num_agent,
        globaleVariable.maternity[mat].m_code,
        "Congé de maternité depuis " +
        moment(globaleVariable.maternity[mat].date_start).format("DD/MM/YYYY") +
        " jusqu'au " +
        moment(globaleVariable.maternity[mat].date_end).format("DD/MM/YYYY"),
      ]);
    }
    leave_report.push(["", "", ""]);
    globaleVariable.ws_leave = ExcelFile.utils.aoa_to_sheet(leave_report);
    globaleVariable.ws_leave["!cols"] = [
      { wpx: 100 },
      { wpx: 60 },
      { wpx: 110 },
      { wpx: 110 },
      { wpx: 110 },
      { wpx: 110 },
      { wpx: 425 },
    ];
    var row_property = [];
    for (r = 0; r < leave_report.length; r++) {
      if (r == 2) {
        row_property.push({ hpt: 90 });
      } else if (r >= 3) {
        if (rowLength[r - 3] && rowLength[r - 3][1] > 1) {
          row_property.push({ hpt: (26 + (rowLength[r - 3][1] * 8)) });
        }
        else {
          row_property.push({ hpt: 26 });
        }
      }
      else {
        row_property.push({ hpt: 26 });
      }
    }
    globaleVariable.ws_leave["!rows"] = row_property;
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
        merge.push({ s: { r: merging[mr][0] + 3 + last, c: 0 }, e: { r: merging[mr][0] + 3 + last + merging[mr][1] - 1, c: 0 } });
        merge.push({ s: { r: merging[mr][0] + 3 + last, c: 1 }, e: { r: merging[mr][0] + 3 + last + merging[mr][1] - 1, c: 1 } });
        last = last + merging[mr][1] - 1;
        field++;
      }
    }
    globaleVariable.ws_leave["!merges"] = merge;
    
    // Appliquer les styles à chaque cellule de départ des fusions
    merge.forEach((range) => {
      const startRow = range.s.r;
      const startCol = range.s.c;
      const cellAddress = ExcelFile.utils.encode_cell({ r: startRow, c: startCol });

      // Vérifier que la cellule existe, sinon la créer
      if (!globaleVariable.ws_leave[cellAddress]) {
        globaleVariable.ws_leave[cellAddress] = {};
      }

      // Appliquer un style à la cellule de départ
      globaleVariable.ws_leave[cellAddress].s = {
        alignment: { horizontal: "center", vertical: "center" }, // Centrage du texte
      };

    });

    style3(last, globaleVariable.maternity.length, field);
    
    newsheet_leave.Sheets["Conge " + months] = globaleVariable.ws_leave;
    session.filename = "Rapport congé " + months + ".xlsx";
    ExcelFile.writeFile(newsheet_leave, session.filename);
    res.send("Ok");
  } else {
    res.send("error");
  }
}

// Monthly report
// const LeaveReport = async (req, res) => {
//   var session = req.session;
//   var month = req.body.month;
//   var year = req.body.year;
//   var populateAll = {
//     populateConge: ["N/A", "N/A", 0, "", "", "", "", 0, 0, 0],
//     populateSansSolde: ["N/A", "N/A", "", "", "", 0, "", 0, 0, 0],
//     populatePermission: ["N/A", "N/A", "", 0, "", "", "", 0, 0, 0],
//     populateRepos: ["N/A", "N/A", "", "", 0, "", "", 0, 0, 0],
//   }
//   if (session.occupation_a == "Admin") {
//     globaleVariable.monthly_leave = await LeaveSchema.find({
//       date_start: { $regex: year + "-" + month, $options: "i" },
//       date_end: { $regex: year + "-" + month, $options: "i" },
//     });
//     var getting = ["en cours"];
//     globaleVariable.maternity = await LeaveSchema.find({
//       type: "Congé de maternité",
//       status: { $in: getting },
//     });
//     var newsheet_leave = ExcelFile.utils.book_new();
//     var m_leave = [];
//     var leave_report = [];
//     var merging = [];
//     var rowLength = [];
//     newsheet_leave.Props = {
//       Title: "Rapport de congé",
//       Subject: "Rapport de congé",
//       Author: "Solumada",
//     };
//     leave_report.push([
//       "Les absences et Congés " +
//       moment(`${year}-${month}-01`).locale("Fr").format("MMMM YYYY"),
//       "",
//       "",
//       "",
//       "",
//       "",
//       "",
//     ]);
//     var months = moment(`${year}-${month}-01`)
//       .locale("Fr")
//       .format("MMMM YYYY");
//     leave_report.push([
//       "Numbering agent",
//       "M-CODE",
//       "Nombre de jours à payer et / ou de déduction sur salaire " + months,
//       "",
//       "",
//       "",
//       "Motifs - observations ou remarques",
//     ]);
//     leave_report.push([
//       "",
//       "",
//       "CONGES PAYES à \n calculer par RH \n Mada car base de \n calcul sur les 12 \n derniers mois de \n salaire brut",
//       "PERMISIION \n EXCEPTIONELLE \n ET/OU FERIE A \n PAYER à calculer par \n RH Maurice car \n salaire minimal",
//       "RIEN A DEDUIRE \n  à calculer par \n RH Maurice car salaire \n minimal",
//       "A DEDUIRE SUR SALAIRE \n à calculer par RH \n Maurice car salaire \n minimal",
//       "",
//     ]);
//     newsheet_leave.SheetNames.push("Conge " + months);
//     for (i = 0; i < globaleVariable.monthly_leave.length; i++) {
//       if (m_leave.includes(globaleVariable.monthly_leave[i].num_agent)) {
//       } else {
//         m_leave.push(globaleVariable.monthly_leave[i].num_agent);
//       }
//     }
//     m_leave = m_leave.sort();
//     // console.log("global", globaleVariable.monthly_leave);
    
//     var data = []
//     for (m = 0; m < m_leave.length; m++) {
//       var count = 0;
//       populateAll.populateConge = ["N/A", "N/A", 0, "", "", "", "", 0, 0, 0]
//       populateAll.populatePermission = ["N/A", "N/A", "", 0, "", "", "", 0, 0, 0]
//       populateAll.populateRepos = ["N/A", "N/A", "", "", 0, "", "", 0, 0, 0]
//       populateAll.populateSansSolde = ["N/A", "N/A", "", "", "", 0, "", 0, 0, 0]
//       for (i = 0; i < globaleVariable.monthly_leave.length; i++) {
//         if (globaleVariable.monthly_leave[i].num_agent == m_leave[m]) {
//           // if (globaleVariable.monthly_leave[i].type.includes("Congé de maternité")) {
//           // } else {
//             // globaleVariable.monthly_leave[i].type = globaleVariable.monthly_leave[i].type.replace("rien à deduire", "rien à déduire")
//             // globaleVariable.monthly_leave[i].type = globaleVariable.monthly_leave[i].type.replace("a déduire sur salaire", "à déduire sur salaire")
//             let getUser = globaleVariable.monthly_leave[i]

//             var motif = globaleVariable.monthly_leave[i].duration == 0.25
//               ? calcul_timediff_absencereport(getUser.hour_begin, getUser.hour_end) +
//               motif_rendered(getUser.conge_payer, getUser.deduire_sur_salaire, 
//                 getUser.permission_exceptionnelle, getUser.rien_a_deduire, getUser.motif
//               ) +
//               date_rendered(
//                 globaleVariable.monthly_leave[i].date_start,
//                 globaleVariable.monthly_leave[i].date_end
//               )
//               : 
//               motif_rendered(getUser.conge_payer, getUser.deduire_sur_salaire, 
//                 getUser.permission_exceptionnelle, getUser.rien_a_deduire, getUser.motif) +
//               date_rendered(
//                 getUser.date_start,
//                 getUser.date_end
//               )
//             // console.log("motifmotif",motif)
//             if (getUser.conge_payer !=0) {
              
//               if (getUser.duration == 0.25) {
//                 getUser.duration = 0;
//                 var hourCalculate = calcul_timediff_absencereport_spec(getUser.hour_begin, getUser.hour_end);
//                 populateAll.populateConge[7] = populateAll.populateConge[7] + hourCalculate[0];
//                 populateAll.populateConge[8] = populateAll.populateConge[8] + hourCalculate[1];
//                 console.log("populateAll.populateConge[7]", populateAll);
                
//               }
//               populateAll.populateConge[0] = getUser.num_agent;
//               populateAll.populateConge[1] = getUser.m_code;
//               populateAll.populateConge[2] = populateAll.populateConge[2] + getUser.conge_payer;
//               populateAll.populateConge[6] = populateAll.populateConge[6] == "" ? `${motif}` : populateAll.populateConge[6] + " et \n" + motif;
//               while (populateAll.populateConge[8] >= 60) {
//                 populateAll.populateConge[8] = populateAll.populateConge[8] - 60;
//                 populateAll.populateConge[7] = populateAll.populateConge[7] + 1;
//               }
//               while (populateAll.populateConge[7] >= 24) {
//                 populateAll.populateConge[7] = populateAll.populateConge[7] - 24;
//                 populateAll.populateConge[2] = populateAll.populateConge[2] + 1;
//               }
//               populateAll.populateConge[9] = populateAll.populateConge[9] + 1;
//               // console.log("populate == ", populateAll);
              
//             }
//             if (globaleVariable.monthly_leave[i].deduire_sur_salaire !== 0 ) {

//               if (globaleVariable.monthly_leave[i].duration == 0.25) {
//                 globaleVariable.monthly_leave[i].duration = 0;
//                 var hourCalculate = calcul_timediff_absencereport_spec(globaleVariable.monthly_leave[i].hour_begin, globaleVariable.monthly_leave[i].hour_end);
//                 populateAll.populateSansSolde[7] = populateAll.populateSansSolde[7] + hourCalculate[0];
//                 populateAll.populateSansSolde[8] = populateAll.populateSansSolde[8] + hourCalculate[1];
//                 console.log("populateAll.populateConge[7]", populateAll);
//               }
//               populateAll.populateSansSolde[0] = globaleVariable.monthly_leave[i].num_agent;
//               populateAll.populateSansSolde[1] = globaleVariable.monthly_leave[i].m_code;
//               populateAll.populateSansSolde[5] = populateAll.populateSansSolde[5] + globaleVariable.monthly_leave[i].deduire_sur_salaire;
//               populateAll.populateSansSolde[6] = populateAll.populateSansSolde[6] == "" ? `${motif}` : populateAll.populateSansSolde[6] + " et \n" + motif;
//               while (populateAll.populateSansSolde[8] >= 60) {
//                 populateAll.populateSansSolde[8] = populateAll.populateSansSolde[8] - 60;
//                 populateAll.populateSansSolde[7] = populateAll.populateSansSolde[7] + 1;
//               }
//               while (populateAll.populateSansSolde[7] >= 24) {
//                 populateAll.populateSansSolde[7] = populateAll.populateSansSolde[7] - 24;
//                 populateAll.populateSansSolde[5] = populateAll.populateSansSolde[5] + 1;
//               }
//               populateAll.populateSansSolde[9] = populateAll.populateSansSolde[9] + 1;
//               // console.log("populate == ", populateAll);
//             }
//             if (globaleVariable.monthly_leave[i].permission_exceptionnelle != 0) {
              
//               if (globaleVariable.monthly_leave[i].duration == 0.25) {
//                 globaleVariable.monthly_leave[i].duration = 0;
//                 var hourCalculate = calcul_timediff_absencereport_spec(globaleVariable.monthly_leave[i].hour_begin, globaleVariable.monthly_leave[i].hour_end);
//                 populateAll.populatePermission[7] = populateAll.populatePermission[7] + hourCalculate[0];
//                 populateAll.populatePermission[8] = populateAll.populatePermission[8] + hourCalculate[1];
//                 console.log("populateAll.populateConge[7]", populateAll);
//               }
//               populateAll.populatePermission[0] = globaleVariable.monthly_leave[i].num_agent;
//               populateAll.populatePermission[1] = globaleVariable.monthly_leave[i].m_code;
//               populateAll.populatePermission[3] = populateAll.populatePermission[3] + globaleVariable.monthly_leave[i].permission_exceptionnelle;
//               populateAll.populatePermission[6] = populateAll.populatePermission[6] == "" ? `${motif}` : populateAll.populatePermission[6] + " et \n" + motif;
//               while (populateAll.populatePermission[8] >= 60) {
//                 populateAll.populatePermission[8] = populateAll.populatePermission[8] - 60;
//                 populateAll.populatePermission[7] = populateAll.populatePermission[7] + 1;
//               }
//               while (populateAll.populatePermission[7] >= 24) {
//                 populateAll.populatePermission[7] = populateAll.populatePermission[7] - 24;
//                 populateAll.populatePermission[3] = populateAll.populatePermission[3] + 1;
//               }
//               populateAll.populatePermission[9] = populateAll.populatePermission[9] + 1;
//               // console.log("populate == ", populateAll);
//             }
//             if (globaleVariable.monthly_leave[i].rien_a_deduire !==0) {
              
//               if (globaleVariable.monthly_leave[i].duration == 0.25) {
//                 globaleVariable.monthly_leave[i].duration = 0;
//                 var hourCalculate = calcul_timediff_absencereport_spec(globaleVariable.monthly_leave[i].hour_begin, globaleVariable.monthly_leave[i].hour_end);
//                 populateAll.populateRepos[7] = populateAll.populateRepos[7] + hourCalculate[0];
//                 populateAll.populateRepos[8] = populateAll.populateRepos[8] + hourCalculate[1];
//                 console.log("populateAll.populateConge[7]", populateAll);
//               }
//               populateAll.populateRepos[0] = globaleVariable.monthly_leave[i].num_agent;
//               populateAll.populateRepos[1] = globaleVariable.monthly_leave[i].m_code;
//               populateAll.populateRepos[4] = populateAll.populateRepos[4] + globaleVariable.monthly_leave[i].rien_a_deduire;
//               populateAll.populateRepos[6] = populateAll.populateRepos[6] == "" ? `${motif}` : populateAll.populateRepos[6] + " et \n" + motif;;
//               while (populateAll.populateRepos[8] >= 60) {
//                 populateAll.populateRepos[8] = populateAll.populateRepos[8] - 60;
//                 populateAll.populateRepos[7] = populateAll.populateRepos[7] + 1;
//               }
//               while (populateAll.populateRepos[7] >= 24) {
//                 populateAll.populateRepos[7] = populateAll.populateRepos[7] - 24;
//                 populateAll.populateRepos[4] = populateAll.populateRepos[4] + 1;
//               }
//               populateAll.populateRepos[9] = populateAll.populateRepos[9] + 1;
//             }
//             // console.log("populateAll", populateAll);
            
//           // }
//         }
//       }
      
      
//       if (populateAll.populateConge[0] != "N/A") {
//         count++;
//         populateAll.populateConge[2] = renderResult(populateAll.populateConge[2], populateAll.populateConge[7], populateAll.populateConge[8]);
//         populateAll.populateConge[6] = populateAll.populateConge[6].replace(/\d+\.\d+/g, function (match) {
//           return match.replace('.', '.');
//         });
//         rowLength.push([data.length, populateAll.populateConge[9]])
//         populateAll.populateConge.splice(-3);
//         data.push(populateAll.populateConge);
//         // console.log("populateAll", populateAll);
        
//       }
//       if (populateAll.populatePermission[0] != "N/A") {
//         count++;
//         populateAll.populatePermission[3] = renderResult(populateAll.populatePermission[3], populateAll.populatePermission[7], populateAll.populatePermission[8]);
//         populateAll.populatePermission[6] = populateAll.populatePermission[6].replace(/\d+\.\d+/g, function (match) {
//           return match.replace('.', '.');
//         });
//         rowLength.push([data.length, populateAll.populatePermission[9]])
//         populateAll.populatePermission.splice(-3);
//         data.push(populateAll.populatePermission);
//         // console.log("populateAll", populateAll);
//       }
//       if (populateAll.populateRepos[0] != "N/A") {
//         count++;
//         populateAll.populateRepos[4] = renderResult(populateAll.populateRepos[4], populateAll.populateRepos[7], populateAll.populateRepos[8]);
//         populateAll.populateRepos[6] = populateAll.populateRepos[6].replace(/\d+\.\d+/g, function (match) {
//           return match.replace('.', '.');
//         });
//         rowLength.push([leave_report.length, populateAll.populateRepos[9]])
//         populateAll.populateRepos.splice(-3);
//         leave_report.push(populateAll.populateRepos);
//         // console.log("populateAll", populateAll);
//       }

//       if (populateAll.populateSansSolde[0] != "N/A") {
//         count++;
//         populateAll.populateSansSolde[5] = renderResult(populateAll.populateSansSolde[5], populateAll.populateSansSolde[7], populateAll.populateSansSolde[8]);
//         populateAll.populateSansSolde[6] = populateAll.populateSansSolde[6].replace(/\d+\.\d+/g, function (match) {
//           return match.replace('.', '.');
//         });
//         rowLength.push([data.length, populateAll.populateSansSolde[9]])
//         populateAll.populateSansSolde.splice(-3);
//         data.push(populateAll.populateSansSolde);
//       }
      
//       merging.push([m, count]);
//     }
//     // Object pour rassembler les résultats fusionnés  
//     const mergedData = {}; 

//     // console.log("data == ", data);
    
//     // Parcourir les données originales  
//     data.forEach(entry => {  
//         const codeAgent = entry[0];  
//         // console.log("entry", entry[1]);
//         // Vérifier si le code agent existe déjà  
//         if (!mergedData[codeAgent]) {  
//           // Si l'agent n'existe pas encore, on initialisé son tableau  
//           mergedData[codeAgent] = [codeAgent, entry[1], '', '', '', ''];  
//         }  
//         // On récupère le tableau de l'agent existant pour ajouter les valeurs  
//         const agentData = mergedData[codeAgent];  
        
//         // Ajouter les valeurs non vides aux colonnes appropriées  
//         agentData[2] = agentData[2] || entry[2]; // Jours payés  
//         agentData[3] = agentData[3] || entry[3]; // Permissions  
//         agentData[4] = agentData[4] || entry[4]; // Autres jours  
//         agentData[5] = agentData[5] || entry[5]; // Jours restants  
//         agentData[6] = entry[6]
//     }  )

//     // Convertir l'objet en tableau  
//     const result = Object.values(mergedData);  

    
//     leave_report.push(...result)
//     leave_report.push(["", "", "", "", "", "", ""]);
//     leave_report.push(["", "", "", "", "", "", ""]);
//     for (mat = 0; mat < globaleVariable.maternity.length; mat++) {
//       leave_report.push([
//         globaleVariable.maternity[mat].num_agent,
//         globaleVariable.maternity[mat].m_code,
//         "Congé de maternité depuis " +
//         moment(globaleVariable.maternity[mat].date_start).format("DD/MM/YYYY") +
//         " jusqu'au " +
//         moment(globaleVariable.maternity[mat].date_end).format("DD/MM/YYYY"),
//       ]);
//     }
//     leave_report.push(["", "", ""]);
//     globaleVariable.ws_leave = ExcelFile.utils.aoa_to_sheet(leave_report);
//     globaleVariable.ws_leave["!cols"] = [
//       { wpx: 100 },
//       { wpx: 60 },
//       { wpx: 110 },
//       { wpx: 110 },
//       { wpx: 110 },
//       { wpx: 110 },
//       { wpx: 425 },
//     ];
//     var row_property = [];
//     for (r = 0; r < leave_report.length; r++) {
//       if (r == 2) {
//         row_property.push({ hpt: 90 });
//       } else if (r >= 3) {
//         if (rowLength[r - 3] && rowLength[r - 3][1] > 1) {
//           row_property.push({ hpt: (26 + (rowLength[r - 3][1] * 8)) });
//         }
//         else {
//           row_property.push({ hpt: 26 });
//         }
//       }
//       else {
//         row_property.push({ hpt: 26 });
//       }
//     }
//     globaleVariable.ws_leave["!rows"] = row_property;
//     var merge = [
//       { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
//       { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } },
//       { s: { r: 1, c: 1 }, e: { r: 2, c: 1 } },
//       { s: { r: 1, c: 2 }, e: { r: 1, c: 5 } },
//       { s: { r: 1, c: 6 }, e: { r: 2, c: 6 } },
//     ];
//     var last = 0;
//     var field = 0;
//     // for (mr = 0; mr < merging.length; mr++) {
//     //   if (merging[mr][1] > 1) {
//     //     merge.push({ s: { r: merging[mr][0] + 3 + last, c: 0 }, e: { r: merging[mr][0] + 3 + last + merging[mr][1] - 1, c: 0 } });
//     //     merge.push({ s: { r: merging[mr][0] + 3 + last, c: 1 }, e: { r: merging[mr][0] + 3 + last + merging[mr][1] - 1, c: 1 } });
//     //     last = last + merging[mr][1] - 1;
//     //     field++;
//     //   }
//     // }
//     globaleVariable.ws_leave["!merges"] = merge;
//     style3(last, globaleVariable.maternity.length, field);
//     newsheet_leave.Sheets["Conge " + months] = globaleVariable.ws_leave;
//     session.filename = "Rapport congé " + months + ".xlsx";
//     ExcelFile.writeFile(newsheet_leave, session.filename);
//     res.send("Ok");
//   } else {
//     res.send("error");
//   }
// }


//About creating leave 
const getPageDefine = async (req, res) => {
  var session = req.session;
  if (session.occupation_a == "Admin") {
    var alluser = await UserSchema.find(
      { occupation: "User", status: "Actif" },
      { adresse: 0, password: 0, username: 0, phone: 0 }
    ).sort({
      m_code: 1,
    });
    var leave_in_progress = await LeaveSchema.find({ status: "en cours" })
    var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
    var role = session.idUser == "645a417e9d34ed8965caea9e" ? "Gerant" : "Admin"
    var allPermission = await LeaveSchema.find({ exceptType: { $ne: "" }, date_start: { $regex: moment().format("YYYY") } }).select("m_code exceptType duration")
    res.render("PageAdministration/CongeEmployer.html", {
      users: alluser,
      username: session.mailing,
      notif: dataUser.myNotifications,
      leave_in_progress: leave_in_progress,
      role: role,
      dataUser: dataUser,
      allPermission: allPermission
    });
  } else {
    res.redirect("/");
  }
}
//Take leave
const createLeave = async (req, res) => {
  var session = req.session;
  if (session.occupation_a == "Admin" || req.body.automatic) {
    var code = req.body.code;
    var type = req.body.type;
    var leavestart = req.body.leavestart;
    var leaveend = req.body.leaveend;
    var hour_begin = req.body.begin;
    var hour_end = req.body.end;
    var val = req.body.court;
    var priority = req.body.leavePiority;
    var motif = req.body.motif;
    var idRequest = req.body.idRequest;
    var exceptType = req.body.exceptType;
    // var deduction = " ( rien à deduire )";
    var user = await UserSchema.findOne({ m_code: code });
    var taked;

    var {
      deduire_sur_salaire = 0,
      conge_payer = 0,
      permission_exceptionnelle = 0,
      rien_a_deduire = 0 } = req.body

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
      res.json({ status: "duplicata" });
    } else {

      // ETO NO MANOMBOKA NY ASA
      if (val == "n") {
        taked = Methods.date_diff(leavestart, leaveend) + 1; // duration avy amin'ny daty
      } else {
        if (val <= 1) {
          leaveend = leavestart; // mitovy ny date roa (start, end)
        }
        taked = val; // egal 1 na 0 na negatif
      }

      //taked : duration entre deux dates
      var last_acc = 0;
      
      if (according_leave(user.leave_stat, moment(user.save_at).format("YYYY-MM"), moment(leavestart).format('YYYY-MM')) && type == "congé") {
        // if (globaleVariable.deduire.includes(type)) {
        //   deduction = " ( a déduire sur salaire )";
        // }
        var day_control = "Terminée";
        if (taked >= 1) {
          day_control = "en attente";
        }
        //ARRANge
        var rest = "";
        var accs = -taked;
        var indice_change = [];
        for (c = 0; c < leave_specific.length; c++) {
          if (Methods.date_diff(leavestart, leave_specific[c].date_start) > 0) {
            if (leave_specific[c - 1]) {
              if (rest == "") {
                rest = leave_specific[c - 1].rest - conge_payer;
                last_acc = leave_specific[c - 1].acc - conge_payer
              }
            } else {
              if (rest == "") {
                if (leave_specific[c].type.includes("Congé Payé") || leave_specific[c].type.includes("congé")) {
                  rest =
                    leave_specific[c].rest +
                    leave_specific[c].conge_payer -
                    conge_payer;
                  last_acc = leave_specific[c].acc + leave_specific[c].conge_payer - conge_payer
                } else {
                  rest = leave_specific[c].rest - conge_payer;
                  last_acc = leave_specific[c].acc - conge_payer
                }
              }
            }
            indice_change.push(c);
          }
        }
        
        if (rest == "") {
          rest = user.remaining_leave - conge_payer;
          last_acc = user.leave_taked - conge_payer
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
          type: type ,
          status: day_control,
          rest: rest,
          motif: motif,
          piece: "",
          validation: false,
          acc: last_acc,
          request: idRequest,
          exceptType: exceptType,
          
          deduire_sur_salaire : deduire_sur_salaire,
          conge_payer : conge_payer,
          permission_exceptionnelle : permission_exceptionnelle,
          rien_a_deduire : rien_a_deduire
        };
        !idRequest ? delete new_leave.request : ""
        var last_rest = rest;
        indice_change.forEach(async (change) => {
          last_rest = last_rest - leave_specific[change].conge_payer;
          if (leave_specific[change].type.includes("Congé Payé") || leave_specific[change].type.includes("congé")) {
            await LeaveSchema.findOneAndUpdate(
              { _id: leave_specific[change]._id },
              {
                rest: last_rest,
                $inc: { acc: accs }
              },
            );
            await LeaveRequestTest.findOneAndUpdate(
              { _id: leave_specific[change].request },
              {
                rest: last_rest,
                $inc: { acc: accs }
              },
            );
          } else {
            await LeaveSchema.findOneAndUpdate(
              { _id: leave_specific[change]._id },
              {
                rest: last_rest,
                $inc: { acc: accs }
              }
            );
            await LeaveRequestTest.findOneAndUpdate(
              { _id: leave_specific[change].request },
              {
                rest: last_rest,
                $inc: { acc: accs }
              }
            );
          }
        });
        await UserSchema.findOneAndUpdate(
          { m_code: user.m_code },
          { $inc: { remaining_leave: -conge_payer, leave_taked: -conge_payer } }
        );
        var d1 = moment(leavestart).format("YYYY-MM-DD");
        var d2 = moment(leaveend).format("YYYY-MM-DD");
        if (split_date(d1, d2) && type != "Congé de maternité") {
          if (idRequest) {
            var thisLeave = await LeaveRequestTest.findOneAndUpdate({ _id: idRequest }, { acc: new_leave.acc, rest: new_leave.rest }, { new: true })
            new_leave.piece = thisLeave.piece;
            const io = req.app.get("io");
            io.sockets.emit("isTreated", [idRequest, thisLeave]);
          }
          var first = first_part(d1);
          var second = second_part(d1, d2);
          
          let n_leaveRest = new_leave.rest
          let n_leaveAcc = new_leave.acc
          new_leave.date_start = first[0];
          new_leave.date_end = first[1];
          new_leave.duration = first[2];
          new_leave.rest = new_leave.rest + second[2] - permission_exceptionnelle - rien_a_deduire - deduire_sur_salaire;
          new_leave.acc = new_leave.acc + second[2] - permission_exceptionnelle - rien_a_deduire - deduire_sur_salaire;
          var theLeave = await LeaveSchema(new_leave).save();
          
          new_leave.date_start = second[0];
          new_leave.date_end = second[1];
          new_leave.duration = second[2];
          new_leave.rest = n_leaveRest //- second[2] //- permission_exceptionnelle - rien_a_deduire - deduire_sur_salaire ;
          new_leave.acc = n_leaveAcc //- second[2]//- permission_exceptionnelle - rien_a_deduire - deduire_sur_salaire;
          
          await LeaveSchema(new_leave).save();
          await conge_define(req);
          await checkleave(req);
          theLeave.status = "Ok";
          res.send(theLeave);
        } else {
          if (idRequest) {
            var thisLeave = await LeaveRequestTest.findOneAndUpdate({ _id: idRequest }, { acc: new_leave.acc, rest: new_leave.rest }, { new: true })
            new_leave.piece = thisLeave.piece;
            const io = req.app.get("io");
            io.sockets.emit("isTreated", [idRequest, thisLeave]);
          }
          var theLeave = await LeaveSchema(new_leave).save();
          await conge_define(req);
          await checkleave(req);
          theLeave.status = "Ok";
          res.send(theLeave);
        }
      } else if (
        type == "régularisation"
      ) {
        // if (globaleVariable.deduire.includes(type)) {
        //   deduction = " ( a déduire sur salaire )";
        // }
        var day_control = "Terminée";
        if (taked >= 1) {
          day_control = "en attente";
        }
        var rest = "";
        for (c = 0; c < leave_specific.length; c++) {
          if (Methods.date_diff(leavestart, leave_specific[c].date_start) > 0) {
            if (leave_specific[c - 1]) {
              if (rest == "") {
                rest = leave_specific[c - 1].rest;
                last_acc = leave_specific[c - 1].acc
              }
            } else {
              if (rest == "") {
                if (leave_specific[c].type.includes("congé")) {
                  rest =
                    leave_specific[c].rest + leave_specific[c].conge_payer;
                  last_acc = leave_specific[c].acc + leave_specific[c].conge_payer
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
          type: type ,
          piece: "",
          status: day_control,
          rest: rest,
          motif: motif,
          validation: false,
          acc: last_acc,
          request: idRequest,
          exceptType: exceptType,
          
          deduire_sur_salaire : deduire_sur_salaire,
          conge_payer : conge_payer,
          permission_exceptionnelle : permission_exceptionnelle,
          rien_a_deduire : rien_a_deduire
        };
        !idRequest ? delete new_leave.request : ""
        var d1 = moment(leavestart).format("YYYY-MM-DD");
        var d2 = moment(leaveend).format("YYYY-MM-DD");
        if (split_date(d1, d2) && type != "Congé de maternité") {
          if (idRequest) {
            var thisLeave = await LeaveRequestTest.findOneAndUpdate({ _id: idRequest }, { acc: new_leave.acc, rest: new_leave.rest }, { new: true })
            new_leave.piece = thisLeave.piece;
            const io = req.app.get("io");
            io.sockets.emit("isTreated", [idRequest, thisLeave]);
          }
          var first = first_part(d1);
          var second = second_part(d1, d2);
          new_leave.date_start = first[0];
          new_leave.date_end = first[1];
          new_leave.duration = first[2];
          var theLeave = await LeaveSchema(new_leave).save();
          new_leave.date_start = second[0];
          new_leave.date_end = second[1];
          new_leave.duration = second[2];
          await LeaveSchema(new_leave).save();
          await conge_define(req);
          await checkleave(req);
          theLeave.status = "Ok";
          res.send(theLeave);
        } else {
          if (idRequest) {
            var thisLeave = await LeaveRequestTest.findOneAndUpdate({ _id: idRequest }, { acc: new_leave.acc, rest: new_leave.rest }, { new: true })
            new_leave.piece = thisLeave.piece;
            const io = req.app.get("io");
            io.sockets.emit("isTreated", [idRequest, thisLeave]);
          }
          var theLeave = await LeaveSchema(new_leave).save();
          await conge_define(req);
          await checkleave(req);
          theLeave.status = "Ok";
          res.send(theLeave);
        }
      } else if (type === 'récupération') {
        // insert récupération
        var day_control = "Terminée";
        if (taked >= 1) {
          day_control = "en attente";
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
          type: type,
          piece: "",
          status: day_control,
          rest: user.remaining_leave,
          motif: motif,
          validation: false,
          acc: user.leave_taked,
          request: idRequest,
          exceptType: exceptType,

          deduire_sur_salaire : deduire_sur_salaire,
          conge_payer : conge_payer,
          permission_exceptionnelle : permission_exceptionnelle,
          rien_a_deduire : rien_a_deduire
        };
        
        var thisLeave = await LeaveRequestTest.findOneAndUpdate({ _id: idRequest }, {
          acc: new_leave.acc,
          rest: new_leave.rest
        }, { new: true });
        
        var theLeave = await LeaveSchema(new_leave).save();
        theLeave.status = "Ok";
        res.send(theLeave);

      } else {
        res.send({ status: "not authorized" });
      }
    }
  } else {
    res.redirect("/");
  }
}
// console.log(Methods.date_diff('2024-09-10', '2024-09-13'))
//Edit leave 
const editLeave = async (req, res) => {
  var session = req.session;
  console.log("tonga??");
  
  if (session.occupation_a == "Admin") {
    var code = req.body.code;
    var type = req.body.type;
    var leavestart = req.body.leavestart;
    var leaveend = req.body.leaveend;
    var val = req.body.court;
    var hour_begin = req.body.begin;
    var hour_end = req.body.end;
    var motif = req.body.motif;
    var exceptType = req.body.exceptType;
    var id = req.body.id;
    // var deduction = " ( rien à deduire )";
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

    console.log("req.body", req.body);
    
    var {conger_payer = 0, deduire_salaire = 0, permission_except=0, rien_a_deduire=0} = req.body
    const conge_payer = Number(conger_payer);  
    const deduire_sur_salaire = Number(deduire_salaire);  
    const permission_exceptionnelle = Number(permission_except);  
    const rien_deduire = Number(req.body.rien_a_deduire);  
    // console.log("rein", req.body.rien_a_deduire); 
    
    var updateconge = conge_payer + deduire_sur_salaire + permission_exceptionnelle + rien_deduire
    console.log("updateconge", updateconge);
    
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
        taked = Methods.date_diff(leavestart, leaveend) + 1;
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
      console.log("leave_edit.reques", leave_edit.request);
      // var cc = await LeaveRequestTest.findById()
      await LeaveRequestTest.findOneAndUpdate(
        { _id:  leave_edit.request},
        { 
          deduire_sur_salaire : deduire_sur_salaire,
          conge_payer : conge_payer,
          permission_exceptionnelle : permission_exceptionnelle,
          rien_a_deduire : rien_deduire }
      );
      if (according_leave(user.leave_stat, moment(user.save_at).format("YYYY-MM"), moment(leavestart).format('YYYY-MM')) && type == "congé") {
        await LeaveSchema.findOneAndDelete({ _id: id });
        leave_specific = await LeaveSchema.find({
          m_code: user.m_code,
          validation: false,
          date_start: { $regex: moment().format("YYYY"), $options: "i" },
        }).sort({
          date_start: 1,
        });
        if (leave_edit.type.includes("congé")) {
          user = await UserSchema.findOneAndUpdate(
            { m_code: user.m_code },
            {
              $inc: {
                remaining_leave: leave_edit.conge_payer,
                leave_taked: leave_edit.conge_payer,
              },
            },
            { new: true, useFindAndModify: false }
          );
        }
        var day_control = "Terminée";
        if (taked >= 1) {
          day_control = "en attente";
        }
        //ARRANge
        var rest = "";
        var accs = leave_edit.conge_payer - conge_payer;
        var indice_change = [];
        for (c = 0; c < leave_specific.length; c++) {
          if (Methods.date_diff(leavestart, leave_specific[c].date_start) > 0) {
            if (leave_specific[c - 1]) {
              if (rest == "") {
                if (
                  leave_edit.type.includes("congé") &&
                  Methods.date_diff(leave_edit.date_start, leavestart) > 0
                ) {
                  rest =
                    leave_specific[c - 1].rest +
                    leave_edit.conge_payer -
                    conge_payer;
                  last_acc =
                    leave_specific[c - 1].acc +
                    leave_edit.conge_payer -
                    conge_payer;
                  console.log("1 Azo " + rest + " " + leave_specific[c-1].date_start)
                } else {
                  rest = leave_specific[c - 1].rest - conge_payer;
                  last_acc = leave_specific[c - 1].acc - conge_payer;
                  console.log("2 Azo " + rest + " " + leave_specific[c-1].date_start)
                }
              }
            } else {
              if (rest == "") {
                if (leave_specific[c].type.includes("congé")) {
                  rest =
                    leave_specific[c].rest +
                    leave_specific[c].conge_payer +
                    leave_edit.conge_payer -
                    conge_payer;
                  last_acc =
                    leave_specific[c].acc +
                    leave_specific[c].conge_payer +
                    leave_edit.conge_payer -
                    conge_payer;
                  console.log("3 Azo " + rest + " " + leave_specific[c].date_start)
                } else {
                  rest =
                    leave_specific[c].rest - conge_payer + leave_edit.conge_payer;
                  last_acc =
                    leave_specific[c].acc - conge_payer + leave_edit.conge_payer;
                  console.log("4 Azo " + rest + " " + leave_specific[c].date_start)
                }
              }
            }

            indice_change.push(c);
          } else {
            var year_change = await LeaveSchema.find({
              m_code: user.m_code,
              validation: false,
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
                leave_specific[leave_specific.length - 1].rest - conge_payer;
              }
            }
          }
          if (
            leave_edit.type.includes("congé") &&
            Methods.date_diff(leave_edit.date_start, leave_specific[c].date_start) >
            0
          ) {

            console.log("LeaveRequest");
            
            await LeaveSchema.findOneAndUpdate(
              { _id: leave_specific[c]._id },
              { rest: leave_specific[c].rest + leave_edit.conge_payer, $inc: { acc: accs },
             }
            );
            var updt = await LeaveRequestTest.findOneAndUpdate(
              { _id: leave_specific[c].request },
              { rest: leave_specific[c].rest + leave_edit.conge_payer, $inc: { acc: accs }, 
              deduire_sur_salaire : deduire_sur_salaire,
              conge_payer : conge_payer,
              permission_exceptionnelle : permission_exceptionnelle,
              rien_a_deduire : rien_deduire }
            );
            console.log("LeaveRequest", updt);
          }
        }
        if (rest == "") {
          rest = user.remaining_leave - conge_payer;
          last_acc = user.leave_taked - conge_payer;
        }
        var new_leave = {
          m_code: user.m_code,
          num_agent: user.num_agent,
          nom: user.first_name + " " + user.last_name,
          date_start: leavestart,
          date_end: leaveend,
          duration: updateconge,
          hour_begin: hour_begin,
          hour_end: hour_end,
          type: type ,
          status: day_control,
          exceptType: exceptType,
          rest: rest,
          motif: motif,
          validation: false,
          acc: last_acc,

          deduire_sur_salaire : deduire_sur_salaire,
          conge_payer : conge_payer,
          permission_exceptionnelle : permission_exceptionnelle,
          rien_a_deduire : rien_deduire
        };
        var last_rest = rest;
        console.log("indice", indice_change);
        
        indice_change.forEach(async (change) => {
          if (leave_specific[change].type.includes("congé")) {
            last_rest = last_rest - leave_specific[change].conge_payer;
            await LeaveSchema.findOneAndUpdate(
              { _id: leave_specific[change]._id },
              { rest: last_rest, $inc: { acc: accs } }
            );
            await LeaveRequestTest.findOneAndUpdate(
              { _id: leave_specific[change].request },
              { rest: last_rest, $inc: { acc: accs },
              deduire_sur_salaire : deduire_sur_salaire,
              conge_payer : conge_payer,
              permission_exceptionnelle : permission_exceptionnelle,
              rien_a_deduire : rien_deduire }
            );
          } else {
            await LeaveSchema.findOneAndUpdate(
              { _id: leave_specific[change]._id },
              { rest: last_rest, $inc: { acc: accs } }
            );
            await LeaveRequestTest.findOneAndUpdate(
              { _id: leave_specific[change].request },
              { rest: last_rest, $inc: { acc: accs },
              deduire_sur_salaire : deduire_sur_salaire,
              conge_payer : conge_payer,
              permission_exceptionnelle : permission_exceptionnelle,
              rien_a_deduire : rien_deduire }
            );
          }
        });
        await UserSchema.findOneAndUpdate(
          { m_code: user.m_code },
          { $inc: { remaining_leave: -conge_payer, leave_taked: -conge_payer } }
        );
        var d1 = moment(leavestart).format("YYYY-MM-DD");
        var d2 = moment(leaveend).format("YYYY-MM-DD");
        if (split_date(d1, d2) && type != "Congé de maternité") {
          var first = first_part(d1);
          var second = second_part(d1, d2);
          new_leave.date_start = first[0];
          new_leave.date_end = first[1];
          new_leave.duration = first[2];
          new_leave.rest = new_leave.rest + second[2] - permission_exceptionnelle - rien_deduire - deduire_sur_salaire;
          new_leave.acc = new_leave.acc + second[2] - permission_exceptionnelle - rien_deduire - deduire_sur_salaire;
          await LeaveSchema(new_leave).save();
          new_leave.date_start = second[0];
          new_leave.date_end = second[1];
          new_leave.duration = second[2];
          new_leave.rest = new_leave.rest// - second[2];
          new_leave.acc = new_leave.acc// - second[2];
          await LeaveSchema(new_leave).save();
          await LeaveRequestTest.findOneAndUpdate({ _id: leave_edit.request }, 
            { acc: new_leave.acc, rest: new_leave.rest ,
              deduire_sur_salaire : deduire_sur_salaire,
              conge_payer : conge_payer,
              permission_exceptionnelle : permission_exceptionnelle,
              rien_a_deduire : rien_deduire})
          //await arrangeAccumulate(code, leavestart);
          await conge_define(req);
          await checkleave(req);
          res.send("Ok");
        } else {
          await LeaveSchema(new_leave).save();
          await LeaveRequestTest.findOneAndUpdate({ _id: leave_edit.request }, 
            { acc: new_leave.acc, rest: new_leave.rest ,
              deduire_sur_salaire : deduire_sur_salaire,
              conge_payer : conge_payer,
              permission_exceptionnelle : permission_exceptionnelle,
              rien_a_deduire : rien_deduire})
          //await arrangeAccumulate(code, leavestart);
          await conge_define(req);
          await checkleave(req);
          res.send("Ok");
        }
      } else if (
        type == "régularisation" || type == "récupération"
      ) {
        await LeaveSchema.findOneAndDelete({ _id: id });
        leave_specific = await LeaveSchema.find({
          m_code: user.m_code,
          validation: false,
          date_start: { $regex: moment().format("YYYY"), $options: "i" },
        }).sort({
          date_start: 1,
        });
        if (leave_edit.type.includes("congé")) {
          user = await UserSchema.findOneAndUpdate(
            { m_code: user.m_code },
            {
              $inc: {
                remaining_leave: leave_edit.conge_payer,
                leave_taked: leave_edit.conge_payer,
              },
            },
            { new: true, useFindAndModify: false }
          );
        }
        // if (globaleVariable.deduire.includes(type)) {
        //   deduction = " ( a déduire sur salaire )";
        // }
        var day_control = "Terminée";
        if (taked >= 1) {
          day_control = "en attente";
        }
        var rest = "";
        for (c = 0; c < leave_specific.length; c++) {
          if (Methods.date_diff(leavestart, leave_specific[c].date_start) > 0) {
            if (leave_specific[c - 1]) {
              if (rest == "") {
                rest = leave_specific[c - 1].rest;
                last_acc = leave_specific[c - 1].acc;
              }
            } else {
              if (rest == "") {
                if (leave_specific[c].type.includes("congé")) {
                  rest =
                    leave_specific[c].rest + leave_specific[c].duration;
                  last_acc =
                    leave_specific[c].acc + leave_specific[c].duration;
                } else {
                  rest = leave_specific[c].rest;
                  last_acc = leave_specific[c].acc;
                }
              }
            }
            if (
              leave_edit.type.includes("congé") &&
              Methods.date_diff(
                leave_edit.date_start,
                leave_specific[c].date_start
              ) > 0
            ) {
              await LeaveSchema.findOneAndUpdate(
                { _id: leave_specific[c]._id },
                { rest: leave_specific[c].rest + leave_edit.conge_payer }
              );
              await LeaveRequestTest.findOneAndUpdate(
                { _id: leave_specific[c].request },
                { rest: leave_specific[c].rest + leave_edit.conge_payer, 
                  deduire_sur_salaire : deduire_sur_salaire,
                  conge_payer : conge_payer,
                  permission_exceptionnelle : permission_exceptionnelle,
                  rien_a_deduire : rien_deduire }
              );
            }
          } else {
            var year_change = await LeaveSchema.find({
              m_code: user.m_code,
              validation: false,
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
          duration: updateconge,
          hour_begin: hour_begin,
          hour_end: hour_end,
          type: type,
          status: day_control,
          exceptType: exceptType,
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
          await LeaveRequestTest.findOneAndUpdate({ _id: leave_edit.request }, { acc: new_leave.acc, rest: new_leave.rest , 
            deduire_sur_salaire : deduire_sur_salaire,
            conge_payer : conge_payer,
            permission_exceptionnelle : permission_exceptionnelle,
            rien_a_deduire : rien_deduire})
          //await arrangeAccumulate(code, leavestart);
          await conge_define(req);
          await checkleave(req);
          res.send("Ok");
        } else {
          await LeaveSchema(new_leave).save();
          await LeaveRequestTest.findOneAndUpdate({ _id: leave_edit.request }, { acc: new_leave.acc, rest: new_leave.rest, 
            deduire_sur_salaire : deduire_sur_salaire,
            conge_payer : conge_payer,
            permission_exceptionnelle : permission_exceptionnelle,
            rien_a_deduire : rien_deduire })
          //await arrangeAccumulate(code, leavestart);
          await conge_define(req);
          await checkleave(req);
          res.send("Ok");
        }
      } else {
        res.send("not authorized");
      }
    }
  } else {
    res.redirect("/");
  }
}
//Abort leave
const abortLeave = async (req, res) => {
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
    if (leave_delete.type.includes("congé")) {
      await UserSchema.findOneAndUpdate(
        { m_code: user.m_code },
        {
          $inc: {
            remaining_leave: leave_delete.conge_payer,
            leave_taked: leave_delete.conge_payer,
          },
        }
      );
    }
    for (c = 0; c < leave_specific.length; c++) {
      if (
        Methods.date_diff(leave_delete.date_start, leave_specific[c].date_start) >
        0 &&
        leave_delete.type.includes("congé")
      ) {
        await LeaveSchema.findOneAndUpdate(
          { _id: leave_specific[c]._id },
          { $inc: { rest: leave_delete.conge_payer } }
        );
      }
    }
    await LeaveRequestTest.findOneAndDelete({ _id: leave_delete.request });
    var notification = {
      title: "Annulation congé",
      content: `Congé du ${moment(leave_delete.date_start).format("DD/MM/YYYY")} au ${moment(leave_delete.date_end).format("DD/MM/YYYY")} pour ${leave_delete.m_code} a été annulée`,
      datetime: moment().format("DD/MM/YYYY hh:mm:ss")
    }
    var concerned = ["Admin", "Surveillant", "Opération"];
    await Methods.setGlobalAdminNotifications(notification, concerned, true, req);
    notification.content = `Congé du ${moment(leave_delete.date_start).format("DD/MM/YYYY")} au ${moment(leave_delete.date_end).format("DD/MM/YYYY")} pour vous a été annulée`
    await Methods.setEachUserNotification(leave_delete.m_code, notification.title, notification.content, req);
    leave_delete.status = "aborted";
    const io = req.app.get("io");
    io.sockets.emit("isTreated", [leave_delete.request, leave_delete]);
    res.send("Ok");
  } else {
    res.redirect("/");
  }
}
// get user leave info
const leaveInfo = async (req, res) => {
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
}



//Download file 
const downloadFile = async (req, res) => {
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
}

//Methode about Leave
//Method to calculate difference time
function calcul_timediff_absencereport_old(startTime, endTime) {
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

function calcul_timediff_absencereport(startTime, endTime) {
  startTime = moment(startTime, "HH:mm:ss a");
  endTime = moment(endTime, "HH:mm:ss a");

  var duration = moment.duration(endTime.diff(startTime));

  // Calculate the total hours
  var hours_fictif = parseInt(duration.asHours());

  // Calculate the remaining minutes and convert them to fractional hours
  var minutes_fictif = parseInt(duration.asMinutes()) % 60;
  var additional_hours = minutes_fictif / 60;

  // Add the fractional hours to hours_fictif
  hours_fictif += additional_hours;

  // Adjust for negative hours (e.g., when crossing midnight)
  if (hours_fictif < 0) {
    hours_fictif += 24;
  }

  // Return the total hours, rounded to two decimal places
  return formatNumber(hours_fictif) + "H";
}

function calcul_timediff_absencereport_spec(startTime, endTime) {
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
    return [hours_fictif, minutes_fictif]
  } else if (minutes_fictif == 0) {
    return [hours_fictif, minutes_fictif];
  } else {
    return [hours_fictif, minutes_fictif]
  }
}

// method to replace , with . and dont show if number after coma is 0 (eg: 2.00 => 2)
function formatNumber(num) {
  // Convert the number to a string with two decimal places
  let formatted = num.toFixed(2);
  
  // Replace comma with a dot if needed (optional if locale uses a comma)
  formatted = formatted.replace(',', '.');

  // Remove unnecessary ".00" or trailing zeros after the decimal
  formatted = formatted.replace(/\.00$/, '');    // Removes ".00"
  formatted = formatted.replace(/(\.\d)0$/, '$1'); // Removes trailing zero after one decimal

  return formatted;
}

//Method to render a result string
function renderResult_old(day, theHour, theMin) {
  var result = "";
  result += day > 0 ? `${day}j ` : "";
  result += (day > 0 && (theHour > 0 || theMin)) > 0 ? `et ` : "";
  result += theHour > 0 ? `${theHour}h` : "";
  result += theMin > 0 ? `${theMin}'` : "";
  result = result.replace(/\d+\.\d+/g, function (match) {
    return match.replace('.', ',');
  });
  return result
}

function renderResult(day, theHour, theMin) {
  // Convert minutes to hours and remaining minutes
  const additionalHours = Math.abs(theMin / 60);
  const remainingMinutes = theMin % 60;
  
  // Add the additional hours to theHour
  const totalHours = theHour + additionalHours;
  
  // console.log("day", day, theHour , additionalHours);
  
  let result = "";
  result += day > 0 ? `${day}j ` : "";
  
  result += (day > 0 && (totalHours > 0 || remainingMinutes > 0)) ? `et ` : "";
  result += totalHours > 0 ? `${formatNumber(totalHours)}H` : "";
  
  result = result.replace(/\d+\.\d+/g, function (match) {
    return match.replace('.', '.');
  });
  
  // console.log("resu ==", result);
  // console.log("****");
  
  return result;
}

  function precede(letter) {
    console.log("ccc", letter);
    
    var vowels = ["a", "e", "i", "o", "y"];
    if(letter)
    if (vowels.includes(letter[0].toLowerCase())) {
      return " d' "
    }
    else {
      return " de "
    }
  }
// Method to render the right motif

// Method to render the right motif
function motif_rendered(mt, type) {
  // if (type.includes("Repos Maladie")) {
  //   // if (mt == "") {
  //     return precede(type) + type;
  //   // } else {
  //   //   return precede(mt) + mt;
  //   // }
  // }
  // else {
    if (mt != "") {
      return precede(mt) + mt;
    }
    //else {
    //   return precede(type) + type.replace("Permission exceptionelle", "Permission exceptionnelle") ;
    // }
  // }
  function precede(letter) {
    var vowels = ["a", "e", "i", "o", "y"];
    if (vowels.includes(letter[0].toLowerCase())) {
      return " d'"
    }
    else {
      return " de "
    }
  }
}
// function motif_rendered(conge_payer, deduire_sur_salaire, permission_exceptionnelle, rien_a_deduire, motif) {
//   let resultat = ""
  
//   if (conge_payer!=0) 
//     resultat =  resultat + conge_payer + ' jour(s)' + precede(motif) + motif
//   if (deduire_sur_salaire!=0){
//     if (conge_payer != 0)
//       resultat = resultat + ", "
//     resultat = resultat + deduire_sur_salaire + ' jour(s)' + precede(motif) + motif
//   }
//   if(permission_exceptionnelle!=0){
//     if (conge_payer != 0 || deduire_sur_salaire != 0) 
//       resultat = resultat + ", "
//     resultat = resultat  + permission_exceptionnelle + ' jour(s)' + precede(motif) + motif
//   }
//   if(rien_a_deduire!=0){
//     if (conge_payer != 0 || deduire_sur_salaire != 0 || permission_exceptionnelle != 0) 
//       resultat = resultat + ", "
//     resultat = resultat + rien_a_deduire + ' jour(s)' + precede(motif) + motif
//   }

//   console.log("");
  
  
//   return resultat


//   // if (type.includes("Repos Maladie")) {
//   //   // if (mt == "") {
//   //     return precede(type) + type;
//   //   // } else {
//   //   //   return precede(mt) + mt;
//   //   // }
//   // }
//   // else {
//   //   // if (mt == "") {
//   //     return precede(type) + type.replace("Permission exceptionelle", "Permission exceptionnelle");
//   //   // } else {
//   //   //   return precede(type) + type.replace("Permission exceptionelle", "Permission exceptionnelle") ;
//   //   // }
//   // }
// }
//Method to convert date
function date_rendered(d1, d2) {
  if (d1 == d2) {
    return " du " + moment(d1).format("DD/MM/YYYY")
  } else {
    return (
      " du " +
      moment(d1).format("DD/MM/YYYY") +
      " au " +
      moment(d2).format("DD/MM/YYYY")
    );
  }
}
//Methode for styling the sheet
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
    for (i = 1; i <= globaleVariable.monthly_leave.length + last + maternity + field; i++) {
      if (globaleVariable.ws_leave[cellule[c] + "" + i]) {
        if (i == 1) {
          globaleVariable.ws_leave[cellule[c] + "" + i].s = {
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
          globaleVariable.ws_leave[cellule[c] + "" + i].s = {
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
          globaleVariable.ws_leave[cellule[c] + "" + i].s = {
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
              horizontal: "left",
              wrapText: true
            },
          };
        } else {
          if (
            globaleVariable.ws_leave[cellule[c] + "" + i].v != "" &&
            globaleVariable.ws_leave[cellule[c] + "" + i].v.includes("Congé") === false
          ) {
            globaleVariable.ws_leave[cellule[c] + "" + i].s = {
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
            globaleVariable.ws_leave[cellule[c] + "" + i].s = {
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
  if (globaleVariable.ws_leave) {
    // Parcourir toutes les cellules du tableau à partir de la 4ᵉ ligne
    Object.keys(globaleVariable.ws_leave).forEach((cellAddress) => {
      const cellRef = ExcelFile.utils.decode_cell(cellAddress); // Décoder l'adresse (par ex. "A4" → {r: 3, c: 0})
  
      // Vérifier si la ligne est >= 4 (r commence à 0 donc 4ème ligne = r >= 3)
      if (cellRef.r >= 3) {
        const cell = globaleVariable.ws_leave[cellAddress];

        // Vérifier si la cellule a une valeur
        if (cell?.v) {        
          const colLetter = cellule[cellRef.c]; // Trouver la lettre de la colonne correspondante (A, B, C, etc.)

          // Appliquer le style centré et les bordures à cette cellule
          globaleVariable.ws_leave[cellAddress].s = {
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            font: { name: "Calibri", sz: 11 },
            fill: {
              patternType: "solid",
              fgColor: { rgb: color[colLetter] }, // Couleur de fond de la cellule
              bgColor: { rgb: color[colLetter] },
            },
            border: {
              left: { style: "thin" },
              right: { style: "thin" },
              top: { style: "thin" },
              bottom: { style: "thin" },
            },
          };
        }
      }
    });
  }
  
}
//Methode for creating and update leave
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
function according_leave(stat, save, start) {
  if (stat == "y") {
    return true
  }
  else if (stat == "n" && Methods.date_diff(save, start) >= 365) {
    return true
  }
  else {
    return false
  }
}
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

//Update leave in progress status
async function checkleave(req) {
  try {
    var all_leave2 = await LeaveSchema.find({ status: "en cours" });
    for (j = 0; j < all_leave2.length; j++) {
      if (
        Methods.date_diff(moment().format("YYYY-MM-DD"), all_leave2[j].date_end) < 0
      ) {
        await UserSchema.findOneAndUpdate(
          { m_code: all_leave2[j].m_code },
          { act_stat: "LEFTING" }
        );
        await LeaveSchema.findOneAndUpdate(
          { _id: all_leave2[j]._id },
          { status: "Terminée" }
        );
        await LeaveSchema.findOneAndUpdate(
          { _id: all_leave2[j].request },
          { status: "done" }
        );
        var temp_notif = {
          title: "Congé terminée",
          content: all_leave2[j].nom + " devrait revenir du congé",
          datetime: moment().format("DD/MM/YYYY hh:mm:ss"),
        }
        var concerned = ["Admin", "Surveillant", "Opération"];
        await Methods.setGlobalAdminNotifications(temp_notif, concerned, false, req);
      }
    }
  } catch (error) {
    await checkleave();
  }
}
//
async function leave_permission() {
  var user_allowed = await UserSchema.find({ leave_stat: "n" });
  for (a = 0; a < user_allowed.length; a++) {
    if (moment(user_allowed[a].save_at).add(1, "years").format("YYYY-MM") == moment().format("YYYY-MM")) {
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
        Methods.date_diff(moment().format("YYYY-MM-DD"), all_leave1[i].date_start) <
        0
      ) {
        if (
          Methods.date_diff(
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
// async function reverse_leave() {
//   var all_user = await UserSchema.find({ status: "Actif" });
//   for (u = 0; u < all_user.length; u++) {
//     var accumul = all_user[u].leave_taked - all_user[u].remaining_leave
//     if (all_user[u].shift != "SHIFT WEEKEND" && accumul == 10) {
//       console.log("Done",all_user[u].m_code)
//       await UserSchema.findOneAndUpdate(
//         { m_code: all_user[u].m_code },
//         { $inc: { leave_taked: -2.5 } }
//       );
//     }
//   }
// }

function getting_null(val) {
  if (val) {
    return val + "";
  } else {
    return "";
  }
}
// to print leave
async function printLeave(req, res) {
  let leaveId = req.params.id;
  try {
    var leave = {};
    const replaceText = async () => {
      leave = await LeaveSchema.findById(leaveId);
      const employee = await UserSchema.findOne({ m_code: leave.m_code });
      const pdfdoc = await PDFNet.PDFDoc.createFromFilePath("LeaveTemplate.pdf");
      await pdfdoc.initSecurityHandler();
      const replacer = await PDFNet.ContentReplacer.create();
      const page = await pdfdoc.getPage(1);

      const leaveTest = await LeaveRequestTest.findOne({ _id: leave.request }).populate({
        path: 'validation.user',
        select: 'usuel'
      })
      if (leaveTest) {
        leave = leaveTest;
        await replacer.addString("teamLeader", getting_null(leave.validation[0].user.usuel));
        await replacer.addString("ROP", getting_null(leave.validation[1].user.usuel));
        await replacer.addString("RH", getting_null(leave.validation[2].user.usuel));
        // date
        await replacer.addString("dateTeam", getting_null(moment(leave.validation[0].date).format("DD/MM/YYYY")));
        await replacer.addString("dateRop", getting_null(moment(leave.validation[1].date).format("DD/MM/YYYY")));
        await replacer.addString("dateRH", getting_null(moment(leave.validation[2].date).format("DD/MM/YYYY")));
        if (leave.validation[3]) {
          await replacer.addString("GERANT", getting_null(leave.validation[3].user.usuel));
          await replacer.addString("dateGERANT", getting_null(moment(leave.validation[3].date).format("DD/MM/YYYY")));
        }
        else {
          await replacer.addString("GERANT", getting_null("Navalona"));
          await replacer.addString("dateGERANT", getting_null("n/a"));
        }
      } else {
        await replacer.addString("teamLeader", getting_null("n/a"));
        await replacer.addString("ROP", getting_null("n/a"));
        await replacer.addString("RH", getting_null("n/a"));
        await replacer.addString("GERANT", getting_null("n/a"));
        // date
        await replacer.addString("dateTeam", getting_null("n/a"));
        await replacer.addString("dateRop", getting_null("n/a"));
        await replacer.addString("dateRH", getting_null("n/a"));
        await replacer.addString("dateGERANT", getting_null("n/a"));
      }
      // replace text
      await replacer.addString("nameEmployee", getting_null(leave.nom));
      await replacer.addString("usuel", getting_null(employee.usuel));
      await replacer.addString("matricule", getting_null(employee.matr));
      await replacer.addString("numDay", getting_null(leave.duration));
      await replacer.addString("code", getting_null(employee.m_code));
      await replacer.addString("shift", getting_null(employee.shift));
      await replacer.addString("beginDate", getting_null(moment().format("DD/MM/YYYY")));
      await replacer.addString("endDate", getting_null(moment().format("DD/MM/YYYY")));
      await replacer.addString("beginHour", getting_null(leave.hour_begin));
      await replacer.addString("endHour", getting_null(leave.hour_end));
      await replacer.addString("motifLeave", getting_null(leave.motif));
      await replacer.addString("timeRecup", getting_null(leave.recovery));
      await replacer.addString("asker", getting_null(employee.usuel));


      await replacer.addString("prev_year", getting_null("2023"));
      await replacer.addString("curr_year", getting_null("2024"));
      await replacer.addString("rest", getting_null(leave.rest));
      await replacer.addString("acc", getting_null(leave.acc));
      // date
      await replacer.addString("dateAsker", getting_null(moment(leave.date).format("DD/MM/YYYY")));
      // Décision de la direction
      const CongePaye = ["Congé Payé"];
      const PermissionExceptionnelle = ["Permission exceptionelle"];
      const RienADeduire = ["Repos Maladie"];
      const ADeduire = ["Absent", "Mise a Pied", "Congé sans solde"];
      // Rien à deduire
      await replacer.addString("cp", getting_null((CongePaye.includes(leave.type)) ? "   x" : ''));
      await replacer.addString("cp_nbr", getting_null(""));
      // A à deduire salaire
      await replacer.addString("ds", getting_null((ADeduire.includes(leave.type)) ? "   x" : ''));
      await replacer.addString("ds_nbr", getting_null(""));
      // Permission exceptionnelle
      await replacer.addString("ps", getting_null((PermissionExceptionnelle.includes(leave.type)) ? "   x" : ""));
      await replacer.addString("ps_nbr", getting_null(""));
      // Rien à deduire
      await replacer.addString("rd", getting_null((RienADeduire.includes(leave.type)) ? "   x" : ''));


      await replacer.process(page);
      var output_path = "./public/Leave/" + leave.m_code + ".pdf";

      pdfdoc.save(output_path, PDFNet.SDFDoc.SaveOptions.e_linearized);

    }

    PDFNet.runWithCleanup(
      replaceText,
      "demo:ricardoramandimbisoa@gmail.com:7afedebe02000000000e72b195b776c08a802c3245de93b77462bc8ad6"
    ).then(() => {
      PDFNet.shutdown();
      console.log("Terminated")
      res.json({
        ok: true,
        file: `Leave/${leave.m_code}.pdf`
      });
    });

  } catch (error) {
    console.log(error)
    res.json({
      ok: false,
    });
  }
}


module.exports = {
  checkleave, leave_permission, conge_define, addin_leave, getPageLeavelist, retrieveLeaveList, LeaveReport, downloadFile,
  getPageDefine, createLeave, editLeave, abortLeave, leaveInfo, getLeaveOperation, printLeave, getPageRecap
}