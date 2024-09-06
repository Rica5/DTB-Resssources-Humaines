const Employee = require("../../models/ModelMember");
const moment = require('moment');

async function updateSolde(req, res) {
    try {
        
        const {id} = req.params;
        const updated = await Employee.findById(id)
        
        console.log(updated)
        
        res.json({ data: updated });
    } catch (error) {
        console.error("Error updating solde:", error);
        res.json({ data: [] });
    }
}

module.exports = {
    updateSolde
}