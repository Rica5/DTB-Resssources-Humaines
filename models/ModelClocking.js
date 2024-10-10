const mongoose = require('mongoose');

const Status = mongoose.Schema({
    m_code:String,
    num_agent:String,
    date:String,
    time_start: String,
    time_end:String,
    nom:String,
    entry:String,
    worktime:Number,
    locaux:String,
    late_entry: String,
    start_lunch:String,
    end_lunch: String,
    start_break: String,
    end_break:String
})
module.exports = mongoose.model('cstatus',Status);