const Avance = require("../models/ModelAvance");
async function getVerificationPage(req, res) {
    
    const { name } = req.session;
    
    try {
        // request id
        const { id } = req.params;
        const avance = await Avance.findById(id);

        res.render('./PageEmployee/AvanceConfirmation', {
            avance: avance,
            username: name
        });

    } catch (error) {
        console.log(error)
        res.send('Error');
    }

}

module.exports = {
    getVerificationPage
}