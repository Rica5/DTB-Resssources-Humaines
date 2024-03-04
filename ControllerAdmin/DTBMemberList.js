const mongoose = require("mongoose");
const UserSchema = require("../models/ModelMember");
const StatusSchema = require("../models/ModelClocking");
const LeaveSchema = require("../models/ModelLeave");
const OptSchema = require("../models/ModelApplicationSetting");
const crypto = require("crypto");
const moment = require("moment");
const Methods = require("../ControllerDTB/GlobalMethods")
const globalVariable = require("../ControllerDTB/GlobaleVariable")

// Get page Userlist
const getPageUserList = async(req,res) => {
    var session = req.session;
  if (session.occupation_a == "Admin") {
    session.filtrage = null;
        if (globalVariable.maj_done == false) {
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
          globalVariable.maj_done = true;
        }
        var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
         var role = session.idUser == "645a417e9d34ed8965caea9e" ? "Gerant" : "Admin"
        res.render("PageAdministration/ListeUtilisateurs.html", {
          notif: dataUser.myNotifications,
          username: session.mailing,
          role:role,
          dataUser:dataUser
        });
  } else {
    res.redirect("/");
  }
}
// get all employee
const allMember = async(req,res) => {
        var session = req.session;
        if (session.occupation_a == "Admin") {
              var users = await UserSchema.find({}).sort({
                first_name: 1,
              });
              res.send(users);
        }
}
//Add employee 
const addMember = async(req,res) => {
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
        Methods.sendEmail(
          email,
          "Authentification Solumada",
          htmlRender(email, passdefault, occupation)
        );
        res.send(email + "," + occupation);
      }
}
//Get user by ID
const getUser = async(req,res) =>{
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
}
//Update User
const updateUser = async(req,res) => {
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
}
// Delete User 
const deleteUser = async(req,res) => {
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
}
const reactivateUser = async(req,res) => {
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
}
const changeProfil = async(req,res) => {
  await put_profil(req.files["fileup"], req.body.names, req.session, res);
}
// Method to use on member list
//Profil 
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
//Get project of user from tools
async function ProjectFromTools() {
    const firstConnection = mongoose.createConnection(
      "mongodb+srv://solumada:solumada@cluster0.xdzjimf.mongodb.net/?retryWrites=true&w=majority"
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
  //Method to slice project
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
  //Method to rename shift
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
  //convert date if not null
  function return_date(date_given) {
    if (moment(date_given).format("YYYY-MM-DD") == "Invalid date") {
      return "";
    } else {
      return moment(date_given).format("YYYY-MM-DD");
    }
  }
  //Methode to give a random password 
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

  module.exports = {
    getPageUserList,allMember,getUser,addMember,updateUser,deleteUser,reactivateUser,changeProfil
  }