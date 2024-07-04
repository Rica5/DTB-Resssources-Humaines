const UserSchema = require("../models/ModelMember");
const LeaveSchema = require("../models/ModelLeave");
const LeaveRequestTest = require("../models/ModelLeaveRequest");
const moment = require("moment");
const fs = require("fs");
// const id_gerant = "645a417e9d34ed8965caea9e"     //Gérant Id du Navalona
const id_gerant = "6673ecbf0f644c29f7a997f7"
//Home page
const getHomePage = async (req, res) => {
    var session = req.session;
    if (session.occupation_u == "User") {
        var user = await UserSchema.findOne({ m_code: session.m_code });
        res.render("PageEmployee/MonEspace.html", { user: user, codeUser: session.m_code });
    }
    else {
        res.redirect("/");
    }
}

//For Leave Request
const getLeaveRequest = async (req, res) => {
    var session = req.session;
    if (session.occupation_u == "User") {
        var user = await UserSchema.findOne({ m_code: session.m_code });        
        var users = await UserSchema.find({ status: "Actif", occupation: "User" }).select('m_code project leave_taked remaining_leave leave_stat save_at');

        res.render("PageEmployee/FaireDemande.html", {users: users, user: user, codeUser: session.m_code });
    }
    else {
        res.redirect("/");
    }
}

//For Leave Request (to get and update leave request)
const getLeaveRequestById = async (req, res) => {
    let requestId = req.params.id;
    try {
        // select leave request by id
        const leave = await LeaveRequestTest.findById(requestId);
        return res.json({
            ok: true,
            leave
        });
    } catch (error) {
        console.log(error);
        return res.json({ ok: false });
    }
}
// Make request
const makeLeaveRequest = async (req, res) => {
    var session = req.session;
    if (session.occupation_u == "User") {
        try {
            var user = await UserSchema.findOne({ m_code: req.body.code })
            var files = ""
            if (req.body.fileIn == "true") {
                files = req.files['join']
            }
            var new_request = {
                m_code: req.body.code,
                num_agent: user.num_agent,
                matr: user.matr,
                nom: `${user.first_name} ${user.last_name}`,
                date_start: req.body.startDate,
                date_end: req.body.endDate,
                hour_begin: req.body.startTime,
                hour_end: req.body.endTime,
                motif: req.body.motif,
                recovery: req.body.recovery,
                duration: req.body.duration,
                deductedDay: req.body.deductedDay,
                type: "",
                exceptType: "",
                status: "pending",
                rest: 0,
                acc: 0,
                datetime: moment().format("DD/MM/YYYY HH:mm:ss"),
                priority: req.body.priority,
                leavePriority: req.body.leavePriority,
                comment: "",
                order: false,
                piece: files != "" ? files.name : files,
                validation: [],
            }
            files != "" ? files.mv("public/PieceJointe/" + new_request.piece) : "";
            await LeaveRequestTest(new_request).save();
            var notification = {
                title: "Demande d'absence",
                content: `${new_request.m_code} a envoyé une demande d'absence le ${moment(new_request.date_start).format("DD/MM/YYYY")} au ${moment(new_request.date_end).format("DD/MM/YYYY")} (${new_request.duration} jour(s))`,
                datetime: moment().format("DD/MM/YYYY hh:mm:ss")
            }
            var concerned = ["Admin", "Surveillant", "Opération"]
            await setGlobalAdminNotifications(notification, concerned, true, req);
            res.send("Success")
        }
        catch (err) {
            console.log(err)
            res.send("Error")
        }
    }
    else {
        res.redirect("/");
    }
}

// Make request
const updateLeaveRequest = async (req, res) => {
    var leaveId = req.params.id;
    var session = req.session;
    if (session.occupation_u == "User") {
        try {
            var user = await UserSchema.findOne({ m_code: req.body.code })
            var files = ""
            if (req.body.fileIn == "true") {
                files = req.files['join']
                console.log(files)
            }
            var new_request = {
                m_code: req.body.code,
                num_agent: user.num_agent,
                matr: user.matr,
                nom: `${user.first_name} ${user.last_name}`,
                date_start: req.body.startDate,
                date_end: req.body.endDate,
                hour_begin: req.body.startTime,
                hour_end: req.body.endTime,
                motif: req.body.motif,
                recovery: req.body.recovery,
                duration: req.body.duration,
                deductedDay: req.body.deductedDay,
                type: "",
                exceptType: "",
                status: "pending",
                rest: 0,
                acc: 0,
                datetime: moment().format("DD/MM/YYYY HH:mm:ss"),
                priority: req.body.priority,
                leavePriority: req.body.leavePriority,
                comment: "",
                order: false,
                piece: files != "" ? files.name : files,
                validation: [],
            }
            files != "" ? files.mv("public/PieceJointe/" + new_request.piece) : "";

            await LeaveRequestTest.findByIdAndUpdate(leaveId, new_request);
            var notification = {
                title: "Modification d'une demande d'absence",
                content: `${new_request.m_code} a modifié une demande d'absence le ${moment(new_request.date_start).format("DD/MM/YYYY")} au ${moment(new_request.date_end).format("DD/MM/YYYY")} (${new_request.duration} jour(s))`,
                datetime: moment().format("DD/MM/YYYY hh:mm:ss")
            }
            var concerned = ["Admin", "Surveillant", "Opération"]
            await setGlobalAdminNotifications(notification, concerned, true, req);
            res.send("Success")
        }
        catch (err) {
            console.log(err)
            res.send("Error")
        }
    }
    else {
        res.redirect("/");
    }
}

//Attached file
const attachedFile = async (req, res) => {
    var session = req.session;
    if (session.occupation_a == "Admin") {
        try {
            var files = req.files['join'];
            var idLeave = req.body.idLeave;
            var extension = files.name.split(".");
            var name = `${idLeave}.${extension[extension.length - 1]}`
            var thisLeave = await LeaveRequestTest.findOneAndUpdate({ _id: idLeave }, { piece: name });
            files.mv("public/PieceJointe/" + name);
            res.json({
                status: "Success",
                idLeave: thisLeave._id,
                fileName: name,
                code: thisLeave.m_code,
                start: thisLeave.date_start,
                end: thisLeave.date_end
            })
        }
        catch (err) {
            res.json({
                status: "Error",
                err: err
            })
        }
    }
    else {
        res.redirect("/");
    }
}
const attachedFileAnother = async (req,res) => {
    var session = req.session;
    if ( session.occupation_a == "Admin"){
        try{
                var files = req.files['join'];
                var idLeave = req.body.idLeave;
                var extension = files.name.split(".");
                var name = `${idLeave}.${extension[extension.length - 1]}`
                var thisLeave = await LeaveSchema.findOneAndUpdate({_id:idLeave},{piece:name});
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
            console.log(err)
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
const getMyRequest = async (req, res) => {
    var session = req.session;
    if (session.occupation_u == "User") {
        var myRequest = await LeaveRequestTest.find({ m_code: req.body.code, status: { $ne: "done" } }).sort({ "date_start": 1 });
        res.json(myRequest)
    }
}

//See pending request
const seePending = async (req, res) => {
    var session = req.session;
    if (session.occupation_tl == "Surveillant") {
        var user = await UserSchema.find({ status: "Actif", occupation: "User" }).select('m_code project leave_taked remaining_leave leave_stat save_at');
        var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
        var role = "Surveillant";
        res.render("PageTL/DemandeConge.html", { users: user, notif: dataUser.myNotifications, role: role, dataUser: dataUser });
    }
    else if (session.occupation_op == "Opération") {
        var user = await UserSchema.find({ status: "Actif", occupation: "User" }).select('m_code project leave_taked remaining_leave leave_stat save_at');
        var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
        var role = "Opération";
        res.render("PageOperation/DemandeConge.html", { users: user, notif: dataUser.myNotifications, role: role, dataUser: dataUser });
    }
    else if (session.occupation_a == "Admin") {
        var user = await UserSchema.find({ status: "Actif", occupation: "User" }).select('m_code project leave_taked remaining_leave leave_stat save_at');
        var allPermission = await LeaveSchema.find({ exceptType: { $ne: "" }, date_start: { $regex: moment().format("YYYY") } }).select("m_code exceptType duration")
        var role = "Admin";
        role = session.idUser == id_gerant ? "Gerant" : "Admin";
        var dataUser = await UserSchema.findOne({ _id: session.idUser }).select("profil usuel myNotifications");
        res.render("PageAdministration/DemandeConge.html", { users: user, notif: dataUser.myNotifications, role: role, dataUser: dataUser, allPermission: allPermission });
    }
    else {
        res.redirect("/");
    }
}
//Every request pending
const getPending = async (req, res) => {
    var session = req.session;
    if (session.occupation_tl == "Surveillant") {
        var allRequest = await LeaveRequestTest.find({ status: { $ne: "done" }, validation: [] }).sort({ leavePriority: 'desc' });
        res.json(allRequest);
    }
    else if (session.occupation_op == "Opération") {
        var allRequest = await LeaveRequestTest.find({ status: "progress", $expr: { $eq: [{ $size: '$validation' }, 1] } }).populate({ path: "validation.user", select: 'usuel' }).sort({ leavePriority: 'desc' });
        res.json(allRequest);
    }
    else if (session.occupation_a == "Admin") {
        if (session.idUser == id_gerant) {
            var allRequest = await LeaveRequestTest.find({ status: "progress", $expr: { $eq: [{ $size: '$validation' }, 3] } }).populate({ path: "validation.user", select: 'usuel' }).sort({ leavePriority: 'desc' });
            res.json(allRequest);
        }
        else {
            var allRequest = await LeaveRequestTest.find({ status: "progress", $expr: { $eq: [{ $size: '$validation' }, 2] } }).populate({ path: "validation.user", select: 'usuel' }).sort({ leavePriority: 'desc' });
            res.json(allRequest);
        }
    }
    else {
        res.redirect("/");
    }
}
async function empty_notification() {
    await UserSchema.updateMany({}, { myNotifications: [] })
    console.log("Empty now")
}
//empty_notification();
const answerRequest = async (req, res) => {
    var session = req.session;
    if (session.occupation_tl == "Surveillant") {
        var id = req.body.id;
        var response = req.body.response;
        var comment = req.body.reason;
        var status = "progress";
        var approbator = {
            user: session.idUser,
            approbation: true,
            date:moment().format("YYYY-MM-DD")
        }
        var thisLeave = await LeaveRequestTest.findOneAndUpdate({ _id: id }, { $push: { validation: approbator }, comment: comment, status: status }, { new: true }).populate({ path: "validation.user", select: "usuel" });
        var extension = thisLeave.piece.split(".")
        thisLeave.piece != "" ? renameFile(id, `${thisLeave.piece}`, `${thisLeave._id}.${extension[extension.length - 1]}`) : "";
        var title = `Traitement de congé`
        var forRop = `${thisLeave.validation[0].user.usuel} est mis au courant du congé de ${thisLeave.m_code} du ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")}`;
        var notification = {
            title: "Traitement de congé",
            content: forRop,
            datetime: moment().format("DD/MM/YYYY hh:mm:ss"),
        }
        var concerned = ["Opération"]
        await setGlobalAdminNotifications(notification, concerned, false, req);
        const io = req.app.get("io");
        io.sockets.emit("isTreated", [id, thisLeave]);
        io.sockets.emit("tlDone", forRop);
        res.json("Ok");
    }
    else if (session.occupation_op == "Opération") {
        var id = req.body.id;
        var response = req.body.response;
        var comment = req.body.reason;
        var status = response == "true" ? "progress" : "declined";
        var forRH = ""
        var approbator = {
            user: session.idUser,
            approbation: response,
            date:moment().format("YYYY-MM-DD")
        }
        var thisLeave = await LeaveRequestTest.findOneAndUpdate({ _id: id }, { $push: { validation: approbator }, comment: comment, status: status }, { new: true }).populate({ path: "validation.user", select: "usuel" });
        var title = `Absence pour ${thisLeave.motif}`
        var content = "";
        if (status == "declined") {
            content = content = `Votre demande du ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} a été refusée car : <br> ${thisLeave.comment}`;
            setEachUserNotification(thisLeave.m_code, title, content, req);
            forRH = `${thisLeave.validation[1].user.usuel} a refusé la demande de ${thisLeave.m_code} le ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} car : <br> ${thisLeave.comment}`;
            var notification = {
                title: "Refus de congé",
                content: forRH,
                datetime: moment().format("DD/MM/YYYY hh:mm:ss"),
            }
            var concerned = ["Admin", "Surveillant"]
            await setGlobalAdminNotifications(notification, concerned, true, req);
        }
        else {
            forRH = `${thisLeave.validation[1].user.usuel} a traité la demande de ${thisLeave.m_code} le ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")}`
            var notification = {
                title: "Traitement de congé",
                content: forRH,
                datetime: moment().format("DD/MM/YYYY hh:mm:ss"),
            }
            var concerned = ["Admin"]
            await setGlobalAdminNotifications(notification, concerned, false, req);
        }
        const io = req.app.get("io");
        io.sockets.emit("isTreated", [id, thisLeave]);
        io.sockets.emit("ropDone", forRH);
        res.json("Ok");
    }
    else if (session.occupation_a == "Admin") {
        var status = "";
        var id = req.body.id;
        var response = req.body.response;
        var comment = req.body.reason;
        // if (session.idUser == "645a417e9d34ed8965caea9e") {
        if (session.idUser == id_gerant) {
            status = response == "true" ? "approved" : "declined";
            var approbator = {
                user: session.idUser,
                approbation: response,
                date:moment().format("YYYY-MM-DD")
            }
            var thisLeave = await LeaveRequestTest.findOneAndUpdate({ _id: id }, { $push: { validation: approbator }, comment: comment, status: status }, { new: true })
            var title = `Absence pour ${thisLeave.motif}`
            var content = "";
            if (status == "declined") {
                content = content = `Votre demande du ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} a été refusée car : <br> ${thisLeave.comment}`
            }
            else {
                content = `Votre demande du ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} a été approuvée`
            }
            var notification = {
                title: "Congé approuvé",
                content: `Le demande de ${thisLeave.m_code} le ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} a été approuvée`,
                datetime: moment().format("DD/MM/YYYY hh:mm:ss")
            }
            var concerned = ["Admin", "Surveillant", "Opération"]
            await setGlobalAdminNotifications(notification, concerned, true, req);
            setEachUserNotification(thisLeave.m_code, title, content, req);
            res.json(thisLeave);
        }
        else {
            var order = req.body.order;
            var preStatus = order == "false" ? "progress" : "approved";
            status = response == "true" ? preStatus : "declined";
            var type = req.body.typeleave;
            var forGerant = "";
            var approbator = {
                user: session.idUser,
                approbation: response,
                date:moment().format("YYYY-MM-DD")
            }
            var thisLeave;
            req.body.motif ? thisLeave = await LeaveRequestTest.findOneAndUpdate({ _id: id }, { $push: { validation: approbator }, comment: comment, status: status, type: type, order: req.body.order, exceptType: req.body.exceptType, motif: req.body.motif }, { new: true }).populate({ path: "validation.user", select: "usuel" })
                : thisLeave = await LeaveRequestTest.findOneAndUpdate({ _id: id }, { $push: { validation: approbator }, comment: comment, status: status, type: type, order: req.body.order, exceptType: req.body.exceptType }, { new: true }).populate({ path: "validation.user", select: "usuel" });
            var title = `Absence pour ${thisLeave.motif}`
            var content = "";
            if (status == "declined") {
                content = content = `Votre demande du ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} a été refusée car : <br> ${thisLeave.comment}`;
                setEachUserNotification(thisLeave.m_code, title, content, req);
                forGerant = `${thisLeave.validation[1].user.usuel} a refusé la demande de ${thisLeave.m_code} le ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} car : <br> ${thisLeave.comment}`;
                var notification = {
                    title: "Refus de congé",
                    content: forGerant,
                    datetime: moment().format("DD/MM/YYYY hh:mm:ss"),
                }
                var concerned = ["Surveillant", "Opération"]
                await setGlobalAdminNotifications(notification, concerned, true, req);
            }
            else {
                if (order == "false") {
                    forGerant = `${thisLeave.validation[2].user.usuel} a traité la demande de ${thisLeave.m_code} le ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")}`;
                    var notification = {
                        title: "Traitement de congé",
                        content: forGerant,
                        datetime: moment().format("DD/MM/YYYY hh:mm:ss"),
                    }
                    var concerned = []
                    await setGlobalAdminNotifications(notification, concerned, true, req);
                }
                else {
                    forGerant = `Le demande de ${thisLeave.m_code} le ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} a été approuvée`;
                    var notification = {
                        title: "Congé approuvé",
                        content: forGerant,
                        datetime: moment().format("DD/MM/YYYY hh:mm:ss"),
                    }
                    var concerned = ["Admin", "Opération", "Surveillant"]
                    await setGlobalAdminNotifications(notification, concerned, true, req);
                    content = `Votre demande du ${moment(thisLeave.date_start).format("DD/MM/YYYY")} au ${moment(thisLeave.date_end).format("DD/MM/YYYY")} a été approuvée`
                    setEachUserNotification(thisLeave.m_code, title, content, req);
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
const getNotifications = async (req, res) => {
    var notifications = await UserSchema.findOne({ m_code: req.body.code });
    let sorted = notifications.myNotifications.sort((a, b) => `${b._id}`.localeCompare(`${a._id}`));
    res.json(sorted);
}
async function setGlobalAdminNotifications(notification, concerned, spec, req) {
    await UserSchema.updateMany({ occupation: { $in: concerned }, _id: { $ne: id_gerant } }, { $push: { myNotifications: notification } });
    var idNotif = await UserSchema.findOne({ occupation: { $in: concerned } });
    if (spec) {
        concerned.push("Gerant")
        var otherId = await UserSchema.findOneAndUpdate({ _id: id_gerant }, { $push: { myNotifications: notification } }, { new: true });
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

async function removeNotification(req, res) {
    let userId = req.session.idUser;
    try {
        const removed = await UserSchema.findOneAndUpdate(
            { _id: userId },
            { $pull: { myNotifications: { _id: req.params.id } } },
            { new: true }
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
            { _id: userId },
            { $unset: { myNotifications: "" } },
            { new: true }
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
            { _id: userId, 'myNotifications._id': req.params.id },
            { $set: { "myNotifications.$.isSeen": true } },
            { new: true }
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
            { _id: userId },
            { $set: { "myNotifications.$[].isSeen": true } },
            { new: true }
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
async function renameFile(id, actualPath, newPaths) {
    const oldPath = `Public/PieceJointe/${actualPath}`;
    const newPath = `Public/PieceJointe/${newPaths}`;
    fs.rename(oldPath, newPath, async (err) => {
        if (err) {
            console.error('Error renaming file:', err);
        } else {
            await LeaveRequestTest.findOneAndUpdate({ _id: id }, { piece: newPaths });
            console.log('File renamed successfully.');
        }
    })
}

async function cancelLeaveRequest(req, res) {
    let leaveId = req.params.id;
    try {
        const deleted = await LeaveRequestTest.findByIdAndDelete(leaveId);
        
        var notification = {
            title: "Annulation d'une demande d'absence",
            content: `${deleted.m_code} a annulé une demande d'absence le ${moment(deleted.date_start).format("DD/MM/YYYY")} au ${moment(deleted.date_end).format("DD/MM/YYYY")} (${deleted.duration} jour(s))`,
            datetime: moment().format("DD/MM/YYYY hh:mm:ss")   
        }
        var concerned = ["Admin", "Surveillant", "Opération"]
        await setGlobalAdminNotifications(notification, concerned, true, req);

        res.json({ ok: true })
    } catch (error) {
        console.log(error)
        res.json({ ok: false })
    }
}

module.exports = {
    getHomePage, getLeaveRequest, makeLeaveRequest, getMyRequest, seePending, getPending, answerRequest, getNotifications,
    removeAllNotification, removeNotification, markAsReadAllNotification, markAsReadNotification, attachedFile,
    getLeaveRequestById, updateLeaveRequest, cancelLeaveRequest, attachedFileAnother
}