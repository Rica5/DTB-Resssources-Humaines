const mongoose = require('mongoose');

const Notif = mongoose.Schema({
    notifications:Array
})

module.exports = mongoose.model('notificationTest',Notif)