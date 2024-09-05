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

module.exports = {
    getListByUserId,
    createAvance,
    updateAvance,
    getOneDemande
}