const mongoose = require('mongoose');
const moment  = require('moment');
const Leave = mongoose.Schema({
    m_code:String,
    num_agent:String,
    nom:String,
    date_start:String,
    date_end:String,
    duration:Number,
    type:String,
    exceptType:String,
    status:String,
    rest:Number,
    acc:Number,
    exceptType:String,
    motif:String,
    validation:Boolean,
    hour_begin:String,
    hour_end:String,
    piece:String,
    date: {
        type: String,
        default: moment().format('YYYY-MM-DD')
    },
    request: {
        type:mongoose.Types.ObjectId,
        auto: true,
        ref:"newLeaveRequestTest"
    }
})
module.exports = mongoose.model('cleaveTest',Leave);