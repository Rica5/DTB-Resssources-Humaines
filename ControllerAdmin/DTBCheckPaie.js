
const UserSchema = require("../models/ModelMember");
const OptSchema = require("../models/ModelApplicationSetting");
const extra_fs = require("fs-extra");
const moment = require("moment");
const { PDFNet } = require("@pdftron/pdfnet-node");
const ExcelFile = require("sheetjs-style");
const fs = require("fs");

var list_paie = [];

// The logic
const getPagePaie = async(req,res) => {
    var session = req.session;
    if (session.occupation_a == "Admin") {
          var opt = await OptSchema.findOne({ _id: "636247a2c1f6301f15470344" });
          var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
           var role = session.idUser == "645a417e9d34ed8965caea9e" ? "Gerant" : "Admin"
          res.render("PageAdministration/CalculPaie.html", {
            opt: opt,
            username: session.mailing,
            notif: dataUser.myNotifications,
            role:role,
            dataUser:dataUser
          });
    } else {
      res.redirect("/");
    }
}
// When the file to be processed is uploaded
const uploadPaie = async(req,res) => {
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
}
//Empty data 
const emptyPaie = async(req,res) => {
    await update_opt_paie("n", "delete", "");
    extra_fs.emptyDirSync("./public/Paie");
    res.redirect("/fiche");
}



//Methods to use in check paie
//Function to read the excel file
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
        sme = ((sme * 8) / 100) * 2;
        fs.unlink(name_file, function (err) {
          if (err) {
            console.error(err);
          }
          else {
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
        });
  }
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
          //res.send("Erreur sur " + data[number]["M-CODE"]);
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

module.exports = {
    getPagePaie,uploadPaie,emptyPaie
}
