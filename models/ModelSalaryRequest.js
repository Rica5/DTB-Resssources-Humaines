const mongoose = require('mongoose');
const moment = require('moment');
const Leave = mongoose.Schema({
    m_code: String,
    num_agent: String,
    matr: String,
    nom: String,
    status: String,
    shift: {
        type: String,
        default: ''
    },
    leavePriority: {
        type: Number,
        enum: [3, 2, 1],
        default: 2
    },
    comment: String,
    date: {
        type: Date,
        default: Date.now
    },
    deductedDay: {
        type: Number,
        default: 0
    },
    validation: [{
        user: {
            type: mongoose.Types.ObjectId,
            ref: "cuserTest"
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
    timestamps: true,
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

module.exports = mongoose.model('newLeaveRequestTest', Leave);