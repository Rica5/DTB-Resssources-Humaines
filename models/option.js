const mongoose = require('mongoose');
const Opt = mongoose.Schema({
   add_leave:String,
   paie_generated:String,
   list_paie:String,
   date_change:String,
   month_change:String,
   email_sent:Array,
   sme_cnaps:Number,
   lunch_value:Number,
   transport_value:Number,
   warn_user:Array
})
module.exports = mongoose.model('optionTest',Opt);