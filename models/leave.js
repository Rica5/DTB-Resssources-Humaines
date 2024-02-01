const mongoose = require('mongoose');
const Leave = mongoose.Schema({
    m_code:String,
    num_agent:String,
    nom:String,
    date_start:String,
    date_end:String,
    duration:Number,
    type:String,
    status:String,
    rest:Number,
    acc:Number,
    motif:String,
    validation:Boolean,
    hour_begin:String,
    hour_end:String,
    request: {
        type:mongoose.Types.ObjectId,
        ref:"LeaveRequestTest"
    }
})
module.exports = mongoose.model('cleaveTest',Leave);