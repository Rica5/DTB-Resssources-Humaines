const mongoose = require('mongoose');

const User = mongoose.Schema({
   username:String,
   last_name:String,
   first_name:String,
   password:String,
   m_code:String,
   num_agent:String,
   occupation:String,
   change:String,
   act_stat:String,
   act_loc:String,
   shift:String,
   late:String,
   count:Number,
   take_break:String,
   remaining_leave:Number,
   leave_taked:Number,
   leave_stat:String,
   save_at:String,
   sexe:String,
   situation:String,
   user_ht:Number,
   project:String,
   matr:String,
   usuel:String,
   cin:String,
   adresse:String,
   cnaps_num:String,
   classification:String,
   contrat:String,
   date_fin:String,
   entry:String,
   status:String,
   profil:String,
   phone:String,
   digit_code: {
      type: String,
      default: '0000'
   },
   myNotifications:[{
      title:String,
      content:String,
      datetime:String,
      isSeen:{
         type:Boolean,
         default:false
      }
   }]
})
module.exports = mongoose.model('newcuserTest',User);