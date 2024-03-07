const mongoose = require('mongoose');
const moment  = require('moment');
const Leave = mongoose.Schema({
    m_code:String,
    num_agent:String,
    matr:String,
    nom:String,
    date_start:String,
    date_end:String,
    hour_begin:String,
    hour_end:String,
    motif:String,
    recovery:String,
    duration:Number,
    type:String,
    exceptType:String,
    status:String,
    rest:Number,
    acc:Number,
    datetime:String,
    priority:Boolean,
    comment:String,
    order:Boolean,
    piece:String,
    date: String,
    validation:[{
        user:{
            type:mongoose.Types.ObjectId,
            ref:"cuserTest"
        },
        approbation : {
            type:Boolean,
            default:false
        },
        date: {
            type: String,
            default: moment().format('YYYY-MM-DD')
        }
    }],
   
})
module.exports = mongoose.model('LeaveRequestTest',Leave);