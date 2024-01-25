

$("#makeRequest").click(() =>{
    $("#makeRequest").attr("class","switch-button active-btn")
    $("#myRequest").attr("class","switch-button mx-2")
    $("#myUpcoming").attr("class","switch-button")
    $("#container-none").hide()
    $("#container-request").hide()
    $("#container-upcoming").hide()
    $("#container-make").show()
})

$("#myRequest").click(() =>{
    $("#myRequest").attr("class","switch-button active-btn mx-2")
    $("#makeRequest").attr("class","switch-button")
    $("#myUpcoming").attr("class","switch-button")
    $("#container-none").hide()
    $("#container-request").show()
    $("#container-upcoming").hide()
    $("#container-make").hide()
})

$("#myUpcoming").click(() =>{
    $("#makeRequest").attr("class","switch-button")
    $("#myRequest").attr("class","switch-button mx-2")
    $("#myUpcoming").attr("class","switch-button active-btn")
    $("#container-none").hide()
    $("#container-request").hide()
    $("#container-upcoming").show()
    $("#container-make").hide()
})




$("#envoye-demande").on('click', function() {
    var nom = $("#nom").text();
    var matricule = $("#matricule").text();
    var mcode = $("#mcode").text();
    var dateDebut = $("#date-debut").val();
    var heureDebut = $("#heure-debut").val();
    var dateFin = $("#date-fin").val();
    var heureFin = $("#heure-fin").val();
    var motif = $("#motif").val().trim();
    var recuperation = $("#recuperation").val().trim();

    // Vous pouvez utiliser ces valeurs comme nécessaire
    console.log("Nom:", nom);
    console.log("Matricule:", matricule);
    console.log("M-code:", mcode);
    console.log("Date début:", dateDebut);
    console.log("Heure début:", heureDebut);
    console.log("Date fin:", dateFin);
    console.log("Heure fin:", heureFin);
    console.log("Motif:", motif);
    console.log("Récupération:", recuperation);
});