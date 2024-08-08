const mongoose = require('mongoose');
const moment = require('moment');
const Leave = mongoose.Schema({
    m_code: String,
    num_agent: String,
    matr: String,
    nom: String,
    date_start: String,
    date_end: String,
    hour_begin: String,
    hour_end: String,
    motif: String,
    recovery: String,
    duration: Number,
    type: String,
    exceptType: String,
    status: String,
    rest: Number,
    acc: Number,
    datetime: String,
    priority: Boolean,
    leavePriority: {
        type: Number,
        enum: [3, 2, 1],
        default: 2
    },
    mode: {
        type: String,
        enum: ["congé", "régularisation", "récupération"],
        default: 'congé'
    },
    shift: {
        type: String,
        default: ''
    },
    comment: String,
    order: Boolean,
    piece: String,
    date: String,
    deductedDay: {
        type: Number,
        default: 0
    },
    validation: [{
        user: {
            type: mongoose.Types.ObjectId,
            ref: "newcuserTest"
        },
        approbation: {
            type: Boolean,
            default: false
        },
        date: {
            type: String,
            default: moment().format('YYYY-MM-DD')
        },
        comment: {
            type: String,
            default: ""
        }
    }],

}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

Leave.virtual('priorityValue').get(function() {
    const priorityMap = {
        3: 'Urgente',
        2: 'Moyenne',
        1: 'Basse'
    };
    return priorityMap[this.leavePriority];
});

Leave.virtual('dateValue').get(function() {
    let date = new Date(this.date_start);
    return date;
});

module.exports = mongoose.model('newLeaveRequestTest', Leave);