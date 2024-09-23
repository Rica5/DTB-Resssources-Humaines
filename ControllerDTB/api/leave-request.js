const LeaveRequestTest = require("../../models/ModelLeaveRequest");
const moment = require('moment');
const UserSchema = require("../../models/ModelMember");
const id_gerant = "645a417e9d34ed8965caea9e"  //Gérant Id du Navalona

async function getLeaves(req, res) {
    try {
        const date = new Date();
        const { month = date.getMonth(), year = date.getFullYear() } = req.query;
        const filterDate = moment().year(+year).month(+month);

        console.log(filterDate.toDate(), month, year)
        console.log(filterDate.startOf('month').toDate(), filterDate.endOf('month').toDate())

        const data = await LeaveRequestTest.find()
        .populate({
            path: 'validation.user',
            select: 'last_name occupation'
        })
        .sort({
            sendingDate: 'desc'
        });

        // filter result
        const result = data.filter(d => {
            let date = moment(d.sendingDate);
            return date.isSameOrAfter(filterDate.startOf('month')) && date.isSameOrBefore(filterDate.endOf('month'))
        });

        res.json({ data: result });
    } catch (error) {
        console.error("Error grouping by sendingDate:", error);
        res.json({ data: [] });
    }
}

async function getListGerantDemandC(req, res) {
    try {
        
        // ids RH
        var RH_Ids = await UserSchema.find({ occupation: "Admin", _id: { $ne: id_gerant } });
        RH_Ids = RH_Ids.map(e => e._id);

        var allRequest = await LeaveRequestTest.find({
            status: { $nin: ["approved", "declined"] },
            "validation.user": { $in: RH_Ids}
        })
        .populate({ path: "validation.user", select: 'usuel' })
        .sort({ leavePriority: 'desc' });
        
        // allRequest = allRequest.filter(leave => leave.validation.filter(v => !v.approbation).length < 2);
        res.json({data: allRequest});
    } catch (error) {
        console.error("Error get data Gerant", error)
        res.json({data: []})
    }
}

module.exports = {
    getLeaves, getListGerantDemandC
}