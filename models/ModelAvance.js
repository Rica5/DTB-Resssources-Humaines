const mongoose = require('mongoose');
const Avance = mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'newcuserTest'
    },
    shift: {
        type: String,
        default: ""
    },
    date_of_avance: {
        type: Date,
        default: Date.now
    },
    desired_amount: {
        type: Number,
        default: 0,
        required: true
    },
    amount_granted: {
        type: Number,
        default: 0
    },
    validation: {
        user: {
            type: mongoose.Types.ObjectId,
            ref: 'newcuserTest'
        },
        received_on: {
            type: Date
        },
    },
    is_urgent: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['progress', 'approved', 'rejected', 'verifying', 'verified', 'paid'],
        default: 'progress'
    },
    comment: {
        type: String,
        default: ''
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('avanceTest', Avance);