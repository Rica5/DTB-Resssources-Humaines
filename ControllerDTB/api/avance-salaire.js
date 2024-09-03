const Avance = require("../../models/ModelAvance");

async function getListByUserId(req, res) {
    console.log(req.session)
    try {
        var { id } = req.params;
        if (!id) id = req.session.idUser;
        const result = await Avance.find({ user: id})
        .populate({
            path: 'validation.user',
            select: 'last_name occupation'
        });
        console.log(result)
        res.json({ ok: true, data: result });
    } catch (error) {
        console.error("Error getting list:", error);
        res.json({  ok: false, data: [] });
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

}