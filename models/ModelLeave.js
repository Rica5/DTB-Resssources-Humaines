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
    motif:String,
    validation:Boolean,
    hour_begin:String,
    hour_end:String,
    piece:String,
    mode: {
        type: String,
        enum: ["congé", "régularisation", "récupération"],
        default: 'congé'
    },
    conge_payer : {
        type: Number,
        default: 0
    },
    deduire_sur_salaire: {
        type: Number,
        default: 0
    },
    permission_exceptionnelle: {
        type: Number,
        default: 0
    },
    rien_a_deduire: {
        type: Number,
        default: 0
    },
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