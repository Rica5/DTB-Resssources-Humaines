const { text } = require("body-parser");
const Avance = require("../../models/ModelAvance");
const crypto = require('crypto')
const nodemailer = require("nodemailer")

async function getListByUserId(req, res) {
    try {
        var { id } = req.params;
        if (!id) id = req.session.idUser;
        const result = await Avance.find({ user: id})
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

async function getOneDemande(req, res) {
    try {
        var { id } = req.params;
g
        const result = await Avance.findOne({ _id: id})
        
        res.json({ ok: true, data: result });
    } catch (error) {
        console.error("Error getting list:", error);
        res.json({  ok: false, data: null });
    }

}

async function updateAvance(req, res) {
    
    try {
        const { id } = req.params;
        const result = await Avance.findByIdAndUpdate(id, req.body, { new: true });

        res.json({ ok: true, data: result });
    } catch (error) {
        console.error("Error creating avance:", error);
        res.json({  ok: false, data: [] });
    }
    
}

async function createAvance(req, res) {
    
    try {

        const result = await Avance.create(req.body)        
        res.json({ ok: true, data: result });
    } catch (error) {
        console.error("Error creating avance:", error);
        res.json({  ok: false, data: [] });
    }
    
}

async function deleteAvance(req, res) {
    try{
        const id = req.params.id
        const result = await Avance.findByIdAndDelete({_id: id})
        res.json({ok: true, data: "success"})
    }catch(error){
        console.error("Error creating avance:", error);
        res.json({  ok: false, data: [] });

    }
}


async function getAllDemand(req, res) {
    try {
        var { urgent } = req.params;
        const result = await Avance.find({ is_urgent: urgent, status:{$ne: "paid"} })
        .populate('user')
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

        const getAvance = await Avance.findOne({_id: _id})
        
        var updated  
        if (getAvance.status == "progress") {
            updated = await Avance.findByIdAndUpdate(_id, {
                amount_granted: amount_granted, status: "approved"
            }, { new: true });
                
        }else{
            updated = {}
        }
        
        
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
            status: "refused",
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
    var id = req.params.id

    const getAvance = await Avance.findOne({_id: id}).populate("user")
    await Avance.findByIdAndUpdate(id, {status: "verify"}, {new: true})
    
    var token = generateTokenWithId(id)
    const emailUser = getAvance.user.username
    
    sendVerificationEmail(emailUser, token)
    

    res.status(200).json({ok: true})
    
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

function sendVerificationEmail(userEmail, token) {
    const verificationLink = '/';
    var mailOptions = {
        from : `"Vérification"  <dtb@solumada.mg>`,
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
    payerAvance
}