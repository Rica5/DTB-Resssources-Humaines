const mongoose = require('mongoose');
const Log = mongoose.Schema({
  m_code:String,
  datetime:String,
  ip_adress:String,
  device:String,
  intrusion:Boolean
})
module.exports = mongoose.model('loginTest',Log);