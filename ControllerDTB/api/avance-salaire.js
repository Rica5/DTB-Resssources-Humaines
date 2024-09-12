const Avance = require("../../models/ModelAvance");

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
        const result = await Avance.find({ is_urgent: urgent})
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
        const updated = await Avance.findByIdAndUpdate(_id, {
            amount_granted: amount_granted, status: "approved"
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

module.exports = {
    getListByUserId,
    createAvance,
    updateAvance,
    getOneDemande,
    deleteAvance,
    validateAvance,
    refuseAvance,
    getAllDemand
}