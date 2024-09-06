const LeaveRequestTest = require("../../models/ModelLeaveRequest");
const moment = require('moment');

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

module.exports = {
    getLeaves
}