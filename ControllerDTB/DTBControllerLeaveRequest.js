const mongoose = require("mongoose");
const UserSchema = require("../models/User");
const StatusSchema = require("../models/status");
const AbsentSchema = require("../models/absent");
const OptSchema = require("../models/option");
const LeaveSchema = require("../models/leave");
const LeaveRequestTest = require("../models/LeaveRequest");
const Log = require("../models/login_histo");
const nodemailer = require("nodemailer");
const extra_fs = require("fs-extra");
const crypto = require("crypto");
const moment = require("moment");
const fs = require("fs");
const Notif = require("../models/notification");

//Home page
const getHomePage = async (req,res) => {
    var session = req.session;
   if ( session.occupation_u == "User"){
        var user = await UserSchema.findOne({m_code:session.m_code});
        res.render("PageEmployee/MonEspace.html",{user:user,codeUser:session.m_code});
   }
   else {
    res.redirect("/");
   }
}

//For Leave Request
const getLeaveRequest = async (req,res) => {
    var session = req.session;
   if ( session.occupation_u == "User"){
    var user = await UserSchema.findOne({m_code:session.m_code});
    res.render("PageEmployee/FaireDemande.html",{user:user,codeUser:session.m_code});
   }
   else {
    res.redirect("/");
   }
}
// Make request
const makeLeaveRequest = async (req,res) => {
    var session = req.session;
    if ( session.occupation_u == "User"){
        try{
            var user = await UserSchema.findOne({m_code:req.body.code})
            var files = ""
            if (req.body.fileIn == "true"){
                files = req.files['join']
            }
                var new_request = {
                    m_code:req.body.code,
                    num_agent:user.num_agent,
                    matr:user.matr,
                    nom:`${user.first_name} ${user.last_name}`,
                    date_start:req.body.startDate,
                    date_end:req.body.endDate,
                    hour_begin:req.body.startTime,
                    hour_end:req.body.endTime,
                    motif:req.body.motif,
                    recovery:req.body.recovery,
                    duration:req.body.duration,
                    type:"",
                    status:"pending",
                    rest:0,
                    acc:0,
                    datetime:moment().format("DD/MM/YYYY HH:mm:ss"),
                    priority:req.body.priority,
                    comment:"",
                    order:false,
                    piece:files != "" ? files.name : files,
                    validation :[],
                }
                files != "" ? files.mv("public/PieceJointe/" + new_request.piece) : "";
             await LeaveRequestTest(new_request).save();
             var notification = {
                title:"Demande d'absence",
                content:`${new_request.m_code} à envoyé une demande d'absence le ${moment(new_request.date_start).format("DD/MM/YYYY")} au ${moment(new_request.date_end).format("DD/MM/YYYY")} (${new_request.duration} jour(s))`,
                datetime:moment().format("DD/MM/YYYY hh:mm:ss")
             }
             var concerned = ["Admin","Surveillant","Opération"]
             await setGlobalAdminNotifications(notification,concerned,true,req);
             res.send("Success")
        }
        catch(err){
            console.log(err)
            res.send("Error")
        }
    }
    else {
        res.redirect("/");
    }
}

//Attached file
const attachedFile = async (req,res) => {
    var session = req.session;
    if ( session.occupation_a == "Admin"){
        try{
                var files = req.files['join'];
                var idLeave = req.body.idLeave;
                var extension = files.name.split(".");
                var name = `${idLeave}.${extension[extension.length - 1]}`
                var thisLeave = await LeaveRequestTest.findOneAndUpdate({_id:idLeave},{piece:name});
               files.mv("public/PieceJointe/" + name);
             res.json({
                status:"Success",
                idLeave:thisLeave._id,
                fileName:name,
                code:thisLeave.m_code,
                start:thisLeave.date_start,
                end:thisLeave.date_end
             })
        }
        catch(err){
            res.json({
                status:"Error",
                err:err
            })
        }
    }
    else {
        res.redirect("/");
    }
}
//get My request
const getMyRequest = async (req,res) => {
    var session = req.session;
    if ( session.occupation_u == "User"){
        var myRequest = await LeaveRequestTest.find({m_code:req.body.code,status:{$ne:"done"}}).sort({"date_start":1});
        res.json(myRequest)
    }
}

//See pending request
const seePending = async (req,res) => {
    var session = req.session;
    if ( session.occupation_tl == "Surveillant"){
        var user = await UserSchema.find({status:"Actif",occupation:"User"}).select('m_code project');
        var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
        var role = "Surveillant";
        res.render("PageTL/DemandeConge.html",{users:user,notif:dataUser.myNotifications,role:role,dataUser:dataUser});
    }
     else if (session.occupation_op == "Opération"){
        var user = await UserSchema.find({status:"Actif",occupation:"User"}).select('m_code project');
        var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
        var role = "Opération";
        res.render("PageOperation/DemandeConge.html",{users:user,notif:dataUser.myNotifications,role:role,dataUser:dataUser});
    }
    else if (session.occupation_a == "Admin") {
        var user = await UserSchema.find({status:"Actif",occupation:"User"}).select('m_code project');
        var role = "Admin";
        role = session.idUser == "645a417e9d34ed8965caea9e" ? "Gerant" : "Admin";
        var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
        res.render("PageAdministration/DemandeConge.html",{users:user,notif:dataUser.myNotifications,role:role,dataUser:dataUser});
    }
    else {
        res.redirect("/");
    }
}
//Every request pending
const getPending = async (req,res) => {
    var session = req.session;
    if ( session.occupation_tl == "Surveillant"){
        var allRequest = await LeaveRequestTest.find({status:{$ne:"done"},validation:[]});
        res.json(allRequest);
    }
    else if (session.occupation_op == "Opération"){
        var allRequest = await LeaveRequestTest.find({status:"progress", $expr: { $eq: [{ $size: '$validation' }, 1] }}).populate({path:"validation.user",select:'usuel'});
        res.json(allRequest);
    }
    else if (session.occupation_a == "Admin") {
        if (session.idUser == "645a417e9d34ed8965caea9e"){
            var allRequest = await LeaveRequestTest.find({status:"progress", $expr: { $eq: [{ $size: '$validation' }, 3] }}).populate({path:"validation.user",select:'usuel'});
            res.json(allRequest);
        }
        else {
            var allRequest = await LeaveRequestTest.find({status:"progress", $expr: { $eq: [{ $size: '$validation' }, 2] }}).populate({path:"validation.user",select:'usuel'});
            res.json(allRequest);
        }  
    }
    else {
        res.redirect("/");
    }
}
async function empty_notification(){
    await UserSchema.updateMany({},{myNotifications:[]})
    console.log("Empty now")
}
//empty_notification();
const answerRequest = async (req,res) => {
    var session = req.session;
    if ( session.occupation_tl == "Surveillant"){
        var id = req.body.id;
        var response = req.body.response;
        var comment = req.body.reason;
        var status = "progress";
        var approbator = {
         user:session.idUser,
         approbation :true
        }
        var thisLeave = await LeaveRequestTest.findOneAndUpdate({_id:id},{$push : {validation:approbator},comment:comment,status:status},{new:true});
        var extension = thisLeave.piece.split(".")
        thisLeave.piece != "" ? renameFile(id,`${thisLeave.piece}`,`${thisLeave._id}.${extension[extension.length - 1]}`) : "";
        var title = `Traitement congé`
        var forRop = `Le TL est mis au courant du congé de ${thisLeave.m_code} du ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")}`;
        var notification = {
            title:"Traitement congé",
            content:forRop,
            datetime:moment().format("DD/MM/YYYY hh:mm:ss"),
         }
         var concerned = ["Opération"]
         await setGlobalAdminNotifications(notification,concerned,false,req);
         const io = req.app.get("io");
         io.sockets.emit("isTreated", [id,thisLeave]);
         io.sockets.emit("tlDone", forRop);
         res.json("Ok");
     }
    else if (session.occupation_op == "Opération"){
        var id = req.body.id;
        var response = req.body.response;
        var comment = req.body.reason;
        var status = response == "true" ? "progress" : "declined";
        var forRH = ""
        var approbator = {
         user:session.idUser,
         approbation :response
        }
        var thisLeave = await LeaveRequestTest.findOneAndUpdate({_id:id},{$push : {validation:approbator},comment:comment,status:status},{new:true})
        var title = `Absence pour ${thisLeave.motif}`
        var content = "";
        if (status == "declined"){
           content =  content = `Votre demande du ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} a été refuser car : <br> ${thisLeave.comment}`;
           setEachUserNotification(thisLeave.m_code,title,content,req);
           forRH = `Le ROP a refuser la demande de ${thisLeave.m_code} le ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")}`;
           var notification = {
            title:"Traitement congé",
            content:forRH,
            datetime:moment().format("DD/MM/YYYY hh:mm:ss"),
         }
         var concerned = ["Admin"]
         await setGlobalAdminNotifications(notification,concerned,false,req);
        }
        else{
            forRH = `Le ROP a traitée la demande de ${thisLeave.m_code} le ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")}`
            var notification = {
                title:"Traitement congé",
                content:forRH,
                datetime:moment().format("DD/MM/YYYY hh:mm:ss"),
             }
             var concerned = ["Admin"]
             await setGlobalAdminNotifications(notification,concerned,false,req);
        }
        const io = req.app.get("io");
        io.sockets.emit("isTreated", [id,thisLeave]);
        io.sockets.emit("ropDone", forRH);
         res.json("Ok");
    }
    else if (session.occupation_a == "Admin") {
        var status = "";
        var id = req.body.id;
        var response = req.body.response;
        var comment = req.body.reason;
        if (session.idUser == "645a417e9d34ed8965caea9e"){
            status = response == "true" ? "approved" : "declined";
            var approbator = {
                user:session.idUser,
                approbation :response
                }
                var thisLeave = await LeaveRequestTest.findOneAndUpdate({_id:id},{$push : {validation:approbator},comment:comment,status:status},{new:true})
                var title = `Absence pour ${thisLeave.motif}`
                var content = "";
                if (status == "declined"){
                   content =  content = `Votre demande du ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} a été refuser car : <br> ${thisLeave.comment}`
                }
                else {
                    content = `Votre demande du ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} a été approuver`
                }
                setEachUserNotification(thisLeave.m_code,title,content,req);
                res.json(thisLeave);
        }
        else {
            var order = req.body.order;
            var preStatus = order == "false" ? "progress" : "approved";
             status = response == "true" ? preStatus : "declined";
             var type = req.body.typeleave;
             var forGerant ="";
             var approbator = {
                user:session.idUser,
                approbation :response
                }
                var thisLeave = await LeaveRequestTest.findOneAndUpdate({_id:id},{$push : {validation:approbator},comment:comment,status:status,type:type,order:req.body.order},{new:true});
                var title = `Absence pour ${thisLeave.motif}`
                var content = "";
                if (status == "declined"){
                   content =  content = `Votre demande du ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} a été refuser car : <br> ${thisLeave.comment}`;
                   setEachUserNotification(thisLeave.m_code,title,content,req);
                   forGerant = `Le RH a refuser la demande de ${thisLeave.m_code} le ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")}`;
                    var notification = {
                        title:"Traitement congé",
                        content:forGerant,
                        datetime:moment().format("DD/MM/YYYY hh:mm:ss"),
                    }
                    var concerned = []
                    await setGlobalAdminNotifications(notification,concerned,true,req);
                }
                else {
                    if (order == "false" ){
                        forGerant = `Le RH a traitée la demande de ${thisLeave.m_code} le ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")}`;
                    var notification = {
                        title:"Traitement congé",
                        content:forGerant,
                        datetime:moment().format("DD/MM/YYYY hh:mm:ss"),
                    }
                    var concerned = []
                    await setGlobalAdminNotifications(notification,concerned,true,req);
                    }
                    else {
                        forGerant = `Le RH a approuvé la demande de ${thisLeave.m_code} le ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} par ordre`;
                    var notification = {
                        title:"Traitement congé",
                        content:forGerant,
                        datetime:moment().format("DD/MM/YYYY hh:mm:ss"),
                    }
                        var concerned = []
                        await setGlobalAdminNotifications(notification,concerned,true,req);
                        content = `Votre demande du ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} a été approuver`
                        setEachUserNotification(thisLeave.m_code,title,content,req);
                    }
                    
                }
                const io = req.app.get("io");
                io.sockets.emit("rhDone", forGerant);
                res.json(thisLeave);
        }
        
    }
    else {
        res.redirect("/");
    }
}

//Get Notifications 
const getNotifications = async (req,res) => {
    var notifications = await UserSchema.findOne({m_code:req.body.code});
    res.json(notifications.myNotifications);
}
async function setGlobalAdminNotifications(notification,concerned,spec,req){
   await UserSchema.updateMany({occupation:{$in:concerned},_id:{$ne:"645a417e9d34ed8965caea9e"}},{$push:{myNotifications:notification}});
   var idNotif = await UserSchema.findOne({occupation:{$in:concerned}});
   if (spec){
    concerned.push("Gerant")
    var otherId = await UserSchema.findOneAndUpdate({_id:"645a417e9d34ed8965caea9e"},{$push:{myNotifications:notification}},{new:true});
    notification.otherId = otherId.myNotifications[otherId.myNotifications.length - 1]._id
   }
   var idNotif = await UserSchema.findOne({occupation:{$in:concerned}});
   idNotif ? notification.idNotif = idNotif.myNotifications[idNotif.myNotifications.length - 1]._id : notification.idNotif = ""
    const io = req.app.get("io");
    io.sockets.emit("notif",[concerned,notification]);
}
async function setEachUserNotification(code,title,content,req){
   var myNotif = {
        title:title,
        content:content,
        datetime:moment().format("DD/MM/YYYY hh:mm"),
        isSeen:false
   }
  await UserSchema.findOneAndUpdate({m_code:code},{$push:{myNotifications:myNotif}},{new :true })
    const io = req.app.get("io");
    io.sockets.emit(code, myNotif);
}

async function removeNotification(req, res) {
    let userId = req.session.idUser;
    try {
        const removed = await UserSchema.findOneAndUpdate(
            { _id: userId}, 
            {$pull: { myNotifications: { _id: req.params.id} }},
            { new: true}
        );
    
        return res.json({
            ok: true,
            message: 'Notification supprimée'
        })
        
    } catch (error) {
        return res.json({
            ok: true,
            message: 'Erreur'
        })
    }
}

async function removeAllNotification(req, res) {
    let userId = req.session.idUser;
    try {
        const removed = await UserSchema.findOneAndUpdate(
            { _id: userId}, 
            {$unset: { myNotifications: "" }},
            { new: true}
        );

    
        return res.json({
            ok: true,
            message: 'Toutes les notifications ont été supprimées.'
        })
        
    } catch (error) {
        return res.json({
            ok: true,
            message: 'Erreur'
        })
    }
}

async function markAsReadNotification(req, res) {
    let userId = req.session.idUser;
    try {
        const updated = await UserSchema.findOneAndUpdate(
            { _id: userId, 'myNotifications._id': req.params.id}, 
            {$set: {"myNotifications.$.isSeen": true }},
            { new: true}
        );

        return res.json({
            ok: true,
            message: 'Notification lu'
        })
        
    } catch (error) {
        return res.json({
            ok: true,
            message: 'Erreur'
        })
    }
}

async function markAsReadAllNotification(req, res) {
    let userId = req.session.idUser;
    try {
        const updated = await UserSchema.findOneAndUpdate(
            { _id: userId}, 
            { $set: { "myNotifications.$[].isSeen": true } },
            { new: true}
        );

        return res.json({
            ok: true,
            message: 'Notifications lu'
        })
        
    } catch (error) {
        return res.json({
            ok: true,
            message: 'Erreur'
        })
    }
    
}
async function renameFile(id,actualPath,newPaths){
    const oldPath = `Public/PieceJointe/${actualPath}`;
    const newPath = `Public/PieceJointe/${newPaths}`;
    fs.rename(oldPath, newPath, async (err) => {
        if (err) {
          console.error('Error renaming file:', err);
        } else {
          await LeaveRequestTest.findOneAndUpdate({_id:id},{piece:newPaths});
          console.log('File renamed successfully.');
        }
      })
}

module.exports = {
    getHomePage, getLeaveRequest, makeLeaveRequest, getMyRequest,seePending, getPending, answerRequest, getNotifications,
    removeAllNotification, removeNotification, markAsReadAllNotification, markAsReadNotification, attachedFile
}