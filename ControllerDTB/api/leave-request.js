const LeaveRequestTest = require("../../models/ModelLeaveRequest");

async function getLeaves(req, res) {
    
    try {
        const result = await LeaveRequestTest.find()
        .populate({
            path: 'validation.user',
            select: 'last_name occupation'
        })
        .sort({
            sendingDate: 'desc'
        });

        res.json({ data: result });
    } catch (error) {
        console.error("Error grouping by sendingDate:", error);
        res.json({ data: [] });
    }
}

module.exports = {
    getLeaves
}