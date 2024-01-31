const mongoose = require('mongoose');
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
    status:String,
    rest:Number,
    acc:Number,
    datetime:String,
    priority:Boolean,
    comment:String,
    validation:[{
        user:{
            type:mongoose.Types.ObjectId,
            ref:"cuserTest"
        },
        approbation : {
            type:Boolean,
            default:false
        },
    }],
   
})
module.exports = mongoose.model('LeaveRequestTest',Leave);