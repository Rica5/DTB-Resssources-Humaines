const MOMENT = require("moment");
const Avance = require("../../models/ModelAvance");
const DateAvance = require("../../models/ModelDatesAvance");
const User = require("../../models/ModelMember");
const crypto = require('crypto')
const nodemailer = require("nodemailer")   
const ExcelJS = require('exceljs');
const mongoose = require('mongoose');

  // Override the moment function to always return Baghdad time  
function moment(...args) {  
    // Call the original moment function with the provided arguments  
    const localDate = MOMENT(...args);  

    // Calculate the timezone offset  
    const serverOffset = localDate.utcOffset(); // Server's timezone offset in minutes  
    const baghdadOffset = 180; // Baghdad's timezone offset in minutes  

    // Calculate the time difference in minutes  
    const offsetDifference = baghdadOffset - serverOffset;  

    // Adjust the local date by the difference to get Baghdad time  
    const baghdadTime = localDate.clone().add(offsetDifference, 'minutes');  

    return baghdadTime;  
}  


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
                    ...(+month > 0 ? {  // Use month check to determine condition
                        $and: [
                            { $eq: [{ $year: "$createdAt" }, +year] },
                            { $eq: [{ $month: "$createdAt" }, +month ] }
                        ]
                    } : {  // If month is not provided or 0, only use year condition
                        $eq: [{ $year: "$createdAt" }, +year]
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

async function createAvance(req, res) {
    
    try {
        const { date_of_avance } = req.body;
        const [year, month] = date_of_avance.split('-');
        const exists = await Avance.aggregate([
            {
                $addFields: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                }
            },
            {
                $match: {
                    year: +year,
                    user: new mongoose.Types.ObjectId(req.session.idUser),
                    month: +month // Filter records where the month is October (10)
                }
            }
        ]);

        console.log(year, month)

        
        if (exists.length > 0) {
            return res.json({ok: false, message: 'Vous avez déjà envoyé une demande.'})
        }
        // find avance if exists
        // const exists = await Avance.find
        const result = await Avance.create(req.body)  

        // Emission de l'événement Socket.io à l'admin
        const avance = await Avance.findById(result._id).populate('user');

        // Émettre l'événement "notif" pour les administrateurs
        sendSocket(req, "createAvance", avance);
        
        // notify admin
        notifyAdmin(
            "Demande d'avance",
            `${avance.user?.m_code} a envoyé une demande d'avance du mois ${afficherMoisAnnee(avance.createdAt)}.`,
            req
        );
        
        res.json({ ok: true, data: result });

    } catch (error) {
        console.error("Error creating avance:", error);
        res.json({  ok: false, data: [] });
    }
    
}

async function deleteAvance(req, res) {
    try{
        const id = req.params.id
        const result = await Avance.findByIdAndDelete({_id: id}, { new: true }).populate('user');
        // send socket to admin
        sendSocket(req, 'cancelAvance', result);
        // notify admin
        notifyAdmin(
            "Demande d'avance",
            `${result.user?.m_code} a annulé sa demande d'avance du mois ${afficherMoisAnnee(result.createdAt)}.`,
            req
        );
        res.json({ok: true, data: result})
    }catch(error){
        console.error("Error cancelling avance:", error);
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
                            { $eq: [{ $year: "$createdAt" }, +year] },
                            { $eq: [{ $month: "$createdAt" }, +month] }
                        ]
                    } : {  // If month is not provided or 0, only use year condition
                        $eq: [{ $year: "$createdAt" }, +year]
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
        worksheet.getCell('A1').value = `Avance ${moisNoms[month-1]}`;
        
        // Fetch data based on the year and month  
        const data = await Avance.find({  
            ...(year && {  
                $expr: {  
                    ...(month != 0 ? {  
                        $and: [  
                            { $eq: [{ $year: "$createdAt" }, +year] },  
                            { $eq: [{ $month: "$createdAt" }, +month] }  
                        ]  
                    } : {  
                        $eq: [{ $year: "$createdAt" }, +year]  
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
        let rowIndex = 3;
        while (true) {
            
            const row = worksheet.getRow(rowIndex);  
            const rowData = row.values;

            if (rowData.length === 0) {
                break;
            }

            // Check for matches in the database  
            for (const entry of data) {  
                const fullName = `${entry.user.first_name} ${entry.user.last_name}`.trim();  
                const mcode = `${entry.user.m_code}`
                if (entry.status !== "rejected") {

                    // Match the full name with the cell value  
                    if (rowData[1] === fullName || rowData[2] == mcode) {  
                        if (entry.amount_granted > 0)
                            worksheet.getCell(`C${rowIndex}`).value = Number(entry.amount_granted); // Write to column C  
                        if (entry.status == "paid") {
                            worksheet.getCell(`D${rowIndex}`).value = "Payé"
                        } else if (entry.status == "rejected") {
                            worksheet.getCell(`D${rowIndex}`).value = "Refusé"
                        }
                        break; // Exit loop after finding a match  
                    }  
                }
            }  

            rowIndex++;
        }
        // get total of amount_granted (la cell "C142" est à modifier s'il ya une changement sur le données du fichier excel)
        const total = data.filter(d => d.status !== 'rejected').reduce((total, item) => total + item.amount_granted, 0);
        worksheet.getCell(`C142`).value = Number(total);

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
    // try {
    //     var { urgent } = req.params;
    //     const result = await Avance.find({
    //         ...(urgent && { is_urgent: urgent}),
    //         status:{$nin: ["paid", "rejected"]}
    //     })
    //     .populate('user')
    //     .populate('confirmed_by')
    //     .populate({
    //         path: 'validation.user',
    //         select: 'last_name occupation'
    //     });
        
    //     res.status(200).json({ ok: true, data: result });
    // } catch (error) {
    //     console.error("Error getting list:", error);
    //     res.json({  ok: false, data: [] });
    // }

    try {
        const { urgent, month, year } = req.query;
        
        // Création de l'objet de filtre de base
        let filters = {
            status: { $nin: ["paid", "rejected"] },
        };

        // Filtrage par urgence si spécifié
        if (urgent) {
            filters.is_urgent = urgent === 'true'; // Convertir en booléen si nécessaire
        }

        if (month === '0') {
            // Pas de filtre sur le mois, donc cela retournera toutes les années
            filters.createdAt = {
                $gte: new Date(`${year}-01-01`), // Début de l'année
                $lt: new Date(`${parseInt(year) + 1}-01-01`) // Début de l'année suivante
            };
        } else if (month && year) {
            filters.createdAt = {
                $gte: new Date(`${year}-${month}-01`), // Début du mois
                $lt: new Date(`${year}-${parseInt(month) + 1}-01`) // Début du mois suivant
            };
        }
        

        const result = await Avance.find(filters)
            .populate('user')
            .populate('confirmed_by')
            .populate({
                path: 'validation.user',
                select: 'last_name occupation'
            });

        res.status(200).json({ ok: true, data: result });
    } catch (error) {
        console.error("Error getting list:", error);
        res.json({ ok: false, data: [] });
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

        // send socket to user to update his request status
        sendSocket(req, 'update_status', updated);

        // send notification to user concernet
        notifyEmployee(
            updated.user.m_code,
            "Montant accordé",
            `Un montant de ${parseFloat(amount_granted)} Ar a été accordé pour votre demande.`,
            req
        );
        
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

//TANDREMO AN !!!
async function updateAllCongeAnnee(req, res) {
    var allUser = await User.find()
    var congeWeekEnd = req.body.congeWeekEnd;
    var congeNormal = req.body.congeNormal
    console.log("congeWeekEnd", congeWeekEnd);
    console.log("congeNormal", congeNormal);
    return ;
    for (let i = 0; i < allUser.length; i++) {
        const element = allUser[i];
            
        var new_leave_taked_WeekEnd = Number(element.remaining_leave) + congeWeekEnd
        var new_leave_taked_Week = Number(element.remaining_leave) + congeNormal   // 27.5 + 
            
        if (element.shift=="SHIFT WEEKEND" && element.remaining_leave < 0){
                // console.log("eleme====", element.leave_taked);
                // console.log("eleme now==", Number(element.remaining_leave) + Number(congeWeekEnd));
                
            if (element.leave_taked !== new_leave_taked_WeekEnd) {
                console.log("mcode", element.m_code);
            }
            await User.findByIdAndUpdate({_id: element._id}, {leave_taked: new_leave_taked_WeekEnd})
        }else if(element.remaining_leave < 0) {
            // console.log("eleme====", element.leave_taked);
            // console.log("eleme now==", Number(element.remaining_leave) + Number(congeNormal));
            if (element.leave_taked !== new_leave_taked_Week) {
                console.log("mcode", element.m_code);
            }
            await User.findByIdAndUpdate({_id: element._id}, {leave_taked: new_leave_taked_Week})
        }
            // console.log("*************");
            // console.log();
        
    }

    console.log("finif");
    
    
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


// when Admin reject or refuse the salary request
async function refuseRequest(req, res) {
    try {
        const { idUser } = req.session;
        const { id } = req.params; // id of avance
        const { comment } = req.body;


        const updateAvance = await Avance.findOneAndUpdate({
            _id: id,
        }, {
            status: 'rejected',
            confirmed_by: idUser,
            comment: comment
        }, { new: true})
        .populate('user')
        .populate('confirmed_by')
        .populate({
            path: 'validation.user',
            select: 'last_name occupation'
        });

        // send socket to user to update his request status
        sendSocket(req, 'update_status', updateAvance);

        let displayMonth = afficherMoisAnnee(updateAvance.createdAt); // eg: d'Octobre 2024

        // send notification to user concerned
        notifyEmployee(
            updateAvance.user.m_code, 
            "Demande d'avance réfusée",
            `Votre demande d'avance du mois ${displayMonth} a été réfusée car ${comment}.`,
            req
        );
        
        // send notification to Admins
        await notifyAdmin(
            "Demande d'avance réfusée",
            `La demande d'avance sur salaire du mois ${displayMonth} de ${updateAvance.user.m_code} a été réfusée car ${comment}.`,
            req
        )

        res.json({
            ok: true,
            data: updateAvance
        });

    } catch (err) {
        console.log(err);
        res.json({
            ok: false,
            message: "Error while refusing the request"
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

        
        // send socket to user to update his request status
        sendSocket(req, 'update_status', updateAvance);

        let displayMonth = afficherMoisAnnee(updateAvance.createdAt); // eg: d'Octobre 2024

        // send notification to users
        await notifyEmployee(
            updateAvance.user.m_code,
            "Demande d'vance récupérée",
            `${isAutrui ? "Un tiers a" : "Vous avez"} récupéré votre avance sur salaire du mois ${displayMonth}.`,
            req
        )

        // send notification to Admin
        await notifyAdmin(
            "Demande d'vance récupérée",
            `${updateAvance.user.m_code} a récupéré son avance sur salaire du mois ${displayMonth}.`,
            req
        )

        sendCompletedRequestEmail(updateAvance);

        // regenerer ou mettre à jour le code pour renforcer la sécurité
        if (isAutrui) {
            const newCode = Math.floor(1000 + Math.random() * 9000).toString();
            // update user
            await User.findByIdAndUpdate(updateAvance.user._id, {
                digit_code: newCode
            });
            // notify code changement
            await notifyEmployee(
                updateAvance.user.m_code,
                "Changement du code",
                "Votre code a été modifié suite à l'action d'une autre personne.",
                req
            );

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

        // get users thats are new (urgence_salary field is false)
        const _users_hasNewAccess = await User.find({ _id : { $in: users }, urgence_salary: false });

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

        // notify user
        _users_hasNewAccess.map(async (u) => {
            notifyEmployee(u.m_code,
                "Accès aux urgences",
                "Vous avez un accès pour envoyer une demande urgente !",
                req
            );
        });
    
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

// method to send notification to user by its m-code
async function notifyEmployee(m_code, title, content, req) {
    try {

        var notification = {
            _id: new mongoose.Types.ObjectId(), // generate id
            title: title,
            content: content,
            datetime: moment().format("DD/MM/YYYY HH:mm"),
            isSeen: false
        }
        await User.findOneAndUpdate({ m_code: m_code }, { $push: { myNotifications: notification } });
    
        sendSocket(req, m_code, notification);

    } catch(err) {
        console.error(err)
    }
}

async function notifyAdmin(title, content, req) {
    try {

        var notification = {
            _id: new mongoose.Types.ObjectId(), // generate id
            title: title,
            content: content,
            datetime: moment().format("DD/MM/YYYY HH:mm"),
            isSeen: false
        }

        const concerned = ['Admin'];

        await User.findOneAndUpdate({ occupation: { $in: concerned } }, { $push: { myNotifications: notification } });
    
        sendSocket(req, "notif", [concerned, notification]);

    } catch(err) {
        console.error(err)
    }
}
// Créer un tableau des mois en français
const moisNoms = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

function afficherMoisAnnee(dateInput) {

    let date;
    
    // Si dateInput est une chaîne (ex. "2024-10-15"), on la convertir en Date
    if (typeof dateInput === "string") {
        date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
        date = dateInput;
    } else {
        throw new Error("Invalid date input");
    }

    // Obtenir l'année et le mois à partir de l'objet Date
    const annee = date.getFullYear();
    const mois = date.getMonth(); // getMonth() retourne un index de 0 (Janvier) à 11 (Décembre)

    // Obtenir le nom du mois
    const moisNom = moisNoms[mois];

    // Vérifier si le mois commence par une voyelle
    const voyelles = ["A", "E", "I", "O", "U", "Y"];
    const article = voyelles.includes(moisNom.charAt(0)) ? "d'" : "de";

    // Retourner la chaîne avec "de" ou "d'" suivi du mois et de l'année
    return `${article} ${moisNom} ${annee}`;
}

module.exports = {
    getListByUserId,
    createAvance,
    updateAvance,
    getOneDemande,
    deleteAvance,
    validateAvance,
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
    checkUrgenceAccess,
    refuseRequest,
    updateAllCongeAnnee
}