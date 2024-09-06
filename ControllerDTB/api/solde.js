const Employee = require("../../models/ModelMember");

async function updateSolde(req, res) {
    try {
        
        const {id} = req.params;
        const updated = await Employee.findByIdAndUpdate(id, {
            ...req.body
        }, { new: true });
        
        console.log(updated)
        
        res.json({ ok: true, data: updated });
    } catch (error) {
        console.error("Error updating solde:", error);
        res.json({ o: false, data: [] });
    }
}

module.exports = {
    updateSolde
}