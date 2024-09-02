// Créez une nouvelle instance de la date actuelle
const today = new Date();

// Formatez la date au format yyyy-mm-dd pour qu'elle corresponde à la valeur attendue par l'input
const formattedDate = today.toISOString().split('T')[0];
$("#date-avance").val(formattedDate)



$("#envoyer-avance").on("click", function () {

    var date_avance = $("#date-avance").val()
    var annee = $("#year").val()
    var mois = $("#month").val()
    var montantD = $("#montant_Demande").val()
    
    if (!montantD) {
        $("#montant_Demande").css('border' , '1px solid red')
    }else{
        $("#montant_Demande").css('border' , '1px solid #ced4da')
        var demandeAvance = {
            userId : users._id,
            date :date_avance,
            annee: annee,
            mois: mois,
            montantD: montantD
        }
        console.log("demandeAvance", demandeAvance);
    }
    

})

$("#montant_Demande").on("input", function () {
    $("#montant_Demande").css('border' , '1px solid #ced4da')
    
})