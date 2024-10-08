const moment = require("moment");
const Avance = require("../../models/ModelAvance");
const DateAvance = require("../../models/ModelDatesAvance");
const User = require("../../models/ModelMember");
const crypto = require('crypto')
const nodemailer = require("nodemailer")   
const ExcelJS = require('exceljs');


async function getListByUserId(req, res) {
    try {
        var { id } = req.params;
        if (!id) id = req.session.idUser;
        // queries
        const { year = new Date().getFullYear(), month=0 } = req.query;

        const result = await Avance.find({
            user: id,
            ...(year && {  // Only add $expr if year is provided
                $expr: {
                    ...(month >= 0 ? {  // Use month check to determine condition
                        $and: [
                            { $eq: [{ $year: "$date_of_avance" }, +year] },
                            { $eq: [{ $month: "$date_of_avance" }, +month] }
                        ]
                    } : {  // If month is not provided or 0, only use year condition
                        $eq: [{ $year: "$date_of_avance" }, +year]
                    })
                }
            })
        })
        .populate({
            path: 'validation.user',
            select: 'last_name occupation'
        })
        .populate('confirmed_by')
        .sort({
            createdAt: 'desc',
        });
        res.status(200).json({ ok: true, data: result });
    } catch (error) {
        console.error("Error getting list:", error);
        res.json({  ok: false, data: [] });
    }

}

async function getOneDemande(req, res) {
    try {
        var { id } = req.params;

        const result = await Avance.findOne({ _id: id})
        .populate('user')
        .populate('confirmed_by')
        .populate({
            path: 'validation.user',
            select: 'last_name occupation'
        });
        
        res.json({ ok: true, data: result });
    } catch (error) {
        console.error("Error getting list:", error);
        res.json({  ok: false, data: null });
    }

}

async function updateAvance(req, res) {
    
    try {
        const { id } = req.params;
        const result = await Avance.findByIdAndUpdate(id, req.body, { new: true })
        .populate('user')
        .populate('confirmed_by')
        .populate({
            path: 'validation.user',
            select: 'last_name occupation'
        });


        sendSocket(req, "updateAvance", result)
        res.json({ ok: true, data: result });
    } catch (error) {
        console.error("Error creating avance:", error);
        res.json({  ok: false, data: [] });
    }
    
}

async function setGlobalAdminNotifications(notification, concerned, spec, req) {
    await User.updateMany({ occupation: { $in: concerned }, _id: { $ne: id_gerant } }, { $push: { myNotifications: notification } });
    var idNotif = await UserSchema.findOne({ occupation: { $in: concerned } });
    if (spec) {
        concerned.push("Gerant")
        var otherId = await User.findOneAndUpdate({ _id: id_gerant }, { $push: { myNotifications: notification } }, { new: true });
        notification.otherId = otherId.myNotifications[otherId.myNotifications.length - 1]._id
    }
    var idNotif = await UserSchema.findOne({ occupation: { $in: concerned } });
    idNotif ? notification.idNotif = idNotif.myNotifications[idNotif.myNotifications.length - 1]._id : notification.idNotif = ""
    const io = req.app.get("io");
    io.sockets.emit("notif", [concerned, notification]);
}

async function createAvance(req, res) {
    
    try {
        const result = await Avance.create(req.body)  
        // Emission de l'événement Socket.io à l'admin
        const io = req.app.get("io");
        
        const userCreate = await Avance.findById(result._id).populate('user');
        // Définir la liste des destinataires (par exemple, les admins)
        const concerned = await User.find({ occupation: "Admin" }, '_id'); // Récupérer uniquement les IDs des admins
        const adminIds = concerned.map(admin => admin._id.toString());

        // var notification = {
        //     title: "Création d'une demande d'avance",
        //     content: `${userCreate.user.m_code} a créé une demande d'avance de ${userCreate.desired_amount}`,
        //     datetime: moment().format("DD/MM/YYYY HH:mm:ss")   
        // }

        // var concernNotif = ["^$$"]
        // await setGlobalAdminNotifications(notification, concernNotif, true, req);
        // Émettre l'événement "notif" pour les administrateurs
        io.sockets.emit("createAvance", [adminIds, userCreate]);      
        res.json({ ok: true, data: result });




    } catch (error) {
        console.error("Error creating avance:", error);
        res.json({  ok: false, data: [] });
    }
    
}

async function deleteAvance(req, res) {
    try{
        const id = req.params.id
        const result = await Avance.findByIdAndDelete({_id: id}, { new: true })
        res.json({ok: true, data: result})
    }catch(error){
        console.error("Error creating avance:", error);
        res.json({  ok: false, data: null });

    }
}

async function getPaidDemands(req, res) {
    try {
        var { year= new Date().getFullYear(), month=0 } = req.query;
        const result = await Avance.find({
            // status: "paid",
            ...(year && {  // Only add $expr if year is provided
                $expr: {
                    ...(month > 0 ? {  // Use month check to determine condition
                        $and: [
                            { $eq: [{ $year: "$date_of_avance" }, +year] },
                            { $eq: [{ $month: "$date_of_avance" }, +month-1] }
                        ]
                    } : {  // If month is not provided or 0, only use year condition
                        $eq: [{ $year: "$date_of_avance" }, +year]
                    })
                }
            })
        })
        .populate('user')
        .populate('confirmed_by')
        .populate({
            path: 'validation.user',
            select: 'last_name occupation'
        });
        
        res.status(200).json({ ok: true, data: result});
    } catch (error) {
        console.error("Error getting list:", error);
        res.json({  ok: false, data: [] });
    }

}



async function exportFile(req, res) {
    
    try {  
        const workbook = new ExcelJS.Workbook();  
        await workbook.xlsx.readFile('avance-template.xlsx');  

        // Sélectionner la feuille de calcul  
        const worksheet = workbook.getWorksheet(1);  
        
        // Extract year and month from query, default to current year and month 0  
        var { year = new Date().getFullYear(), month = 0 } = req.query;  
        console.log("Year:", year, "Month:", month);  
        
        // Fetch data based on the year and month  
        const data = await Avance.find({  
            ...(year && {  
                $expr: {  
                    ...(month != 0 ? {  
                        $and: [  
                            { $eq: [{ $year: "$date" }, +year] },  
                            { $eq: [{ $month: "$date" }, +month] }  
                        ]  
                    } : {  
                        $eq: [{ $year: "$date" }, +year]  
                    })  
                }  
            })  
        })  
        .populate('user')  
        .populate('confirmed_by')
        .populate({  
            path: 'validation.user',  
            select: 'last_name occupation'  
        });  

        // Loop through specified rows in the worksheet  
        for (let rowIndex = 3; rowIndex < 102; rowIndex++) {  
            const row = worksheet.getRow(rowIndex);  
            const rowData = row.values;  

            // Check for matches in the database  
            for (const entry of data) {  
                const fullName = `${entry.user.first_name} ${entry.user.last_name}`.trim();  
                const mcode = `${entry.user.m_code}`
                
                // Match the full name with the cell value  
                if (rowData[1] === fullName || rowData[2] == mcode) {  
                    worksheet.getCell(`C${rowIndex}`).value = Number(entry.amount_granted); // Write to column C  
                    if (entry.status == "paid") {
                        worksheet.getCell(`D${rowIndex}`).value = "Payé"
                    }
                    break; // Exit loop after finding a match  
                }  
            }   
        }  

        // Write buffer and prepare response  
        const buffer = await workbook.xlsx.writeBuffer();  

        // Set headers for the response to download the Excel file  
        res.setHeader('Content-Disposition', 'attachment; filename="votre_fichier_modifié.xlsx"');  
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');  
        res.send(buffer);  
        
    } catch (error) {  
        console.error("Error during file export:", error);  
        res.status(500).send("Internal Server Error"); // Handle any errors  
    }  
}


async function getAllDemand(req, res) {
    try {
        var { urgent } = req.params;
        const result = await Avance.find({
            ...(urgent && { is_urgent: urgent}),
            status:{$ne: "paid"}
        })
        .populate('user')
        .populate('confirmed_by')
        .populate({
            path: 'validation.user',
            select: 'last_name occupation'
        });
        
        res.status(200).json({ ok: true, data: result });
    } catch (error) {
        console.error("Error getting list:", error);
        res.json({  ok: false, data: [] });
    }

}

async function validateAvance(req, res) {
    try {
        // req body avec le montant accordé
        const { amount_granted, _id} = req.body;
        // avance id
        // const { id } = req.params;
        // update avance

        // const getAvance = await Avance.findOne({_id: _id})
        var updated = await Avance.findOneAndUpdate(
            { _id },
            { amount_granted: parseFloat(amount_granted), status: "verified", confirmed_by: req.session.idUser },
            { new: true }
        )
        .populate({
            path: 'validation.user',
            select: 'last_name occupation'
        })
        .populate('user')
        .populate('confirmed_by')
        .exec();
        
        res.json({
            ok: true,
            data: updated
        })

    } catch (error) {
        console.log(error);
        res.status(503).json({
            ok: false,
            message: 'Error'
        })
    }
}


async function refuseAvance(req, res) {
    try {
        // req body avec le montant accordé
        const { comment } = req.body;
        // avance id
        const { id } = req.params;

        // update avance
        const updated = await Avance.findByIdAndUpdate(id, {
            status: "rejected",
            comment: comment
        }, { new: true });

        
        res.json({
            ok: true,
            data: updated
        })

    } catch (error) {
        console.log(error);
        res.status(503).json({
            ok: false,
            message: 'Error'
        })
    }
}


async function verificationDemand(req, res) {
    const id = req.params.id;

    // Update the document and immediately populate the user field
    const updatedAvance = await Avance.findByIdAndUpdate(
        id, 
        { status: "verifying" }, 
        { new: true }
    ).populate("user");

    if (!updatedAvance) {
        return res.status(404).json({ ok: false, message: 'Avance not found' });
    }

    const { user } = updatedAvance;
    const { username: emailUser } = user; // Destructure directly from user object

    // Generate token and send email
    const token = generateTokenWithId(id);
    const fullUrl = req.protocol + '://' + req.get('host');
    sendVerificationEmail(emailUser, token, id, fullUrl);

    res.status(200).json({ ok: true, data: updatedAvance });

}

async function payerAvance(req, res) {
    var id = req.params.id
    await Avance.findByIdAndUpdate(id, {status: "paid"}, {new: true})

    res.status(200).json({ok: true})
}

function generateTokenWithId(id) {
    const randomBytes = crypto.randomBytes(16).toString("hex")
    const token = crypto
    .createHash('sha256')
    .update(id + randomBytes)
    .digest('hex')

    const expirationTime = Date.now() + 24 * 60 * 60 * 1000
    return {token, expirationTime}
}


var transporter = nodemailer.createTransport({
    
    host: 'da-uk2.hostns.io',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'dtb@solumada.mg', // your email address
        pass: 'Dev2024', // your email password
    },

});

function sendVerificationEmail(userEmail, token, requestId, url) {
    const verificationLink = `${url}/avance/verification/${requestId}`;
    var mailOptions = {
        from : `"DTB - Avance sur salaire"  <dtb@solumada.mg>`,
        to: userEmail,
        subject: "Vérification de la Réception de l'Avance",
        text: `Veuillez cliquer sur le lien suivant pour confirmer que vous avez bien reçcu votre avance  : ${verificationLink}`
    }

    transporter.sendMail(mailOptions, (error, info)=>{
        if (error) {
            console.log(error);
        } else {
            console.log("Email envoyé: " + info.response);
            
        }
    })
}


function sendCompletedRequestEmail(avance, token) {
    function currencyFormat(number = 0) {
        try {
            return number.toLocaleString('mg-MG', {
                style: 'currency',
                // currency: 'MGA'
            });
        } catch (e) {
            // Fallback formatting if locale or currency is not supported
            return `${number.toLocaleString()} MGA`;
        }
    }
    

    var mailOptions = {
        from : `"DTB - Avance sur salaire"  <dtb@solumada.mg>`,
        to: [avance.user.username, avance.validation.user?.username],
        subject: `Confirmation de demande d'avance sur salaire pour ${avance.user.m_code}`,
        html: `
        <div class="content">
            <p>Bonjour ${avance.user.usuel},</p>
            <p>
                Nous avons le plaisir de vous informer que vous avez reçu votre avance sur salaire suite à votre rendez-vous avec le service des Ressources Humaines.
            </p>
            <p>
                <span class="highlight">Montant souhaité: </span> <b>${currencyFormat(avance.desired_amount)}</b><br>
                <span class="highlight">Montant accordé: </span> <b>${currencyFormat(avance.amount_granted)}</b><br>
                <span class="highlight">Date de la demande: </span> ${moment(avance.date).format('DD/MM/YYYY')}<br>
                <span class="highlight">Reçu le: </span> ${moment(avance.validation.received_on).format('DD/MM/YYYY [à] HH:mm')}
            </p>
            <p>
                Veuillez conserver cet email comme preuve de réception de votre avance.
                Si vous avez des questions ou des préoccupations supplémentaires, n'hésitez pas à contacter notre service des Ressources Humaines.
            </p>

            <p>Cordialement,</p>
            <p>L'équipe des Ressources Humaines</p>
        </div>
        <div class="footer">
            Cet email est généré automatiquement. Merci de ne pas y répondre directement.
        </div>`
    }

    transporter.sendMail(mailOptions, (error, info)=>{
        if (error) {
            console.log(error);
        } else {
            console.log("Email envoyé: " + info.response);
            
        }
    });
}

// when user confirm the salary request
async function employeeConfirmRequest(req, res) {
    try {
        const { idUser } = req.session;
        const { id } = req.params; // id of avance

        const updateAvance = await Avance.findOneAndUpdate({
            _id: id,
            user: idUser,
        }, {
            status: 'verified',
        })
        .populate('user')
        .populate('confirmed_by')
        .populate({
            path: 'validation.user',
            select: 'last_name occupation'
        });

        res.json({
            ok: true,
            data: updateAvance
        });

    } catch (err) {
        console.log(err);
        res.json({
            ok: false,
            message: "Error while confirming the request"
        })
    }
}


// give the salary to the employee and send an email
async function completeRequest(req, res) {
    try {
        const { idUser } = req.session;
        const { id } = req.params; // id of avance
        const { isAutrui } = req.body;

        const updateAvance = await Avance.findOneAndUpdate({
            _id: id,
        }, {
            status: 'paid',
            validation: {
                user: idUser,
                received_on: new Date()
            },
            ...req.body
        }, {
            new: true
        })
        .populate('user')
        .populate('confirmed_by')
        .populate({
            path: 'validation.user',
            select: 'username last_name occupation'
        });

        sendCompletedRequestEmail(updateAvance);

        // regenerer ou mettre à jour le code pour renforcer la sécurité
        if (isAutrui) {
            const newCode = Math.floor(1000 + Math.random() * 9000).toString();
            // update user
            await User.findByIdAndUpdate(updateAvance.user._id, {
                digit_code: newCode
            });
        }

        res.json({
            ok: true,
            data: updateAvance
        });

    } catch (err) {
        console.log(err);
        res.json({
            ok: false,
            message: "Error while confirming the request"
        });
    }
}

async function addPeriodDates(req, res) {
    try {
        const { month, ...data } = req.body;
        const exists = await DateAvance.findOne({ month: month });
        if (exists) {
            // update existing
            const updated = await DateAvance.findByIdAndUpdate(exists._id, {
                ...data,
                month: month
            }, { new: true });

            // send socket
            sendSocket(req, 'dates_set', updated);

            res.json({
                ok: true,
                data: updated
            });
        } else {
            // add new 
            const created = await DateAvance.create({...data, month});

            res.json({
                ok: true,
                data: created
            });
        }

    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            data: null
        });
    }
}

async function getPeriodInMonth(req, res) {
    try {
        const { month } = req.params;
        var data = await DateAvance.findOne({ month: month });
        if (!data) {
            data = await DateAvance.create({
                month: month,
                start_date: moment(month, 'YYYY-MM').startOf('month').toDate(),
                end_date: moment(month, 'YYYY-MM').endOf('month').add(-3, 'day').toDate(),
            });
        }
        res.json({
            ok: true,
            data: data
        });

    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            data: null
        });
    }
}

async function checkAvanceCode(req, res) {
    try {
        const { code, email } = req.body;
        const userWithTheCode = await User.findOne({
            username: email,
            digit_code: code
        });

        console.log(req.body, userWithTheCode)

        res.json({
            ok: true, data: userWithTheCode !== null
        });
    } catch (error) {
        res.json({
            ok: false,
            data: null
        })
    }
}


// method to give access

async function giveAccess(req, res) {

    const { users } = req.body;
    try {

        if (users.length != 0) {
            // give access to user
            await User.updateMany(
                { _id: { $in: users } },
                { $set: { urgence_salary: true }}
            );
        }
        // remove access
        await User.updateMany(
            { _id: { $nin: users } },
            { $set: { urgence_salary: false }}
        );

        // send socket
        sendSocket(req, 'access_set', users);
    
        res.json({
            ok: true,
            data: users
        });

    } catch (err) {
        
        res.json({
            ok: false,
            data: []
        });
    }

}

async function checkUrgenceAccess(req, res) {
    const { idUser } = req.session;
    const user = await User.findById(idUser);

    res.json({
        data: user
    })
}

function sendSocket(req, _event, data) {
    const io = req.app.get("io");
    // send socket
    io.sockets.emit(_event, data);
}

module.exports = {
    getListByUserId,
    createAvance,
    updateAvance,
    getOneDemande,
    deleteAvance,
    validateAvance,
    refuseAvance,
    getAllDemand,
    verificationDemand,
    payerAvance,
    employeeConfirmRequest,
    completeRequest,
    getPaidDemands,
    addPeriodDates,
    getPeriodInMonth,
    checkAvanceCode,
    exportFile,
    giveAccess,
    checkUrgenceAccess
}