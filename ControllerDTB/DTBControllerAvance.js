const Avance = require("../models/ModelAvance");
const User = require("../models/ModelMember");
async function getVerificationPage(req, res) {
    
    const { name, idUser, occupation_u, m_code } = req.session;

    if (!idUser) {
        let backUrl = req.originalUrl;
        return res.redirect('/?back_url=' + backUrl)
    }
    
    try {
        // request id
        const { id } = req.params;
        const avance = await Avance.findOne({
            _id: id,
            user: idUser,
            status: 'verifying'
        });

        if (occupation_u == "User") {
            var user = await User.findOne({ m_code: m_code });        
            var users = await User.find({ status: "Actif", occupation: "User" }).select('m_code project leave_taked remaining_leave leave_stat save_at');
    
            res.render("./PageEmployee/AvanceConfirmation", {
                users: users, user: user, codeUser: m_code,
                avance: avance,
                username: name
            });
        }
        else {
            res.redirect("/");
        }


    } catch (error) {
        console.log(error)
        res.send('Error');
    }

}

module.exports = {
    getVerificationPage
}