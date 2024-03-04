const nodemailer = require("nodemailer");
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
var pointage_journalier = [];
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

module.exports = {
    date_data,data,all_datas,num_file,hours,minutes,data_desired,monthly_leave,maternity,filtrage,maj_done,deduire,ws_leave,
    ws_left,ws_individual,datestart_leave,dateend_leave,mailing_all,mailing_spec,transporter,pointage_journalier
}