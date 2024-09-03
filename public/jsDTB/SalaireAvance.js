
document.getElementById("update-avance").style.display = "none";

class SalaryAvanceUI {

    baseurl = '/api/avance';

    constructor(id, employeeId, amount, dateRequested, status) {
        this.id = id;
        this.employeeId = employeeId;
        this.amount = amount;
        this.dateRequested = dateRequested;
        this.status = status;
        this.table = null
    }

    async getData(id) {
        const response = await fetch(`${this.baseurl}/${id}`);
        return response.json();
    }

    async send(data) {
        const response = await fetch(`${this.baseurl}`, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-type": "application/json"
            }
        });
        console.log("resp", response);
        
        return response.json();
    }

    loadDataTable(id, url) {

            this.table = $('#' + id).DataTable({
                ajax: {
                    url: url,
                    dataSrc: "data"
                },
                columns: [
                    { 
                        "data": "date",
                        "render": function(data, type, row) {
                            // Use Moment.js to format the date
                            return moment(data).format('DD/MM/YYYY'); // Custom format
                        }
                    },
                    { 
                        "data": "date_of_avance",
                        "render": function(data, type, row) {
                            // Use Moment.js to format the date
                            return moment(data).format('MMM YYYY'); // Custom format
                        }
                    },
                    { "data": "desired_amount" },
                    { "data": "amount_granted",
                        "render": function(data){
                            return data === 0 ? "Pas encore décidé" : data
                        }
                     },
                    { "data": "status" },
                    { 
                        "data": "null",
                        "render": function(data, type, row) {
                            // Use Moment.js to format the date
                            return `<button id="${row._id}" class="edit_btn">Edit</button>`; // Custom format
                        }
                    },
                ]
            }); // Initialiser DataTables sur la table


            // Detect when DataTable has finished loading
            this.table.on('init', () => {
                // add click listener on edit buttons
                $(`#${id} .edit_btn`).each((i, btn) => {
                    $(btn).on('click',async () => {
                        // handle edit
                        // console.log(this.id)
                        // alert(this.id)
                        var getId =  $(btn).attr("id")
                        document.getElementById("demande-avance").style.display = "none";
                        document.getElementById("update-avance").style.display = "block";
                        var getD = await this.getData(getId)
                        console.log("this.getData(id)",getD );
                        
                    });
                });
            });
        
    }

    reloadDataTable(){
        this.table.ajax.reload()
    }
}

const ui = new SalaryAvanceUI();
ui.loadDataTable("listeDemande", '/api/avance');


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
    var is_urgent = $("#urgent").is(":checked");
    var shift =  $("#shift").val()
    
    if (!montantD) {
        $("#montant_Demande").css('border' , '1px solid red')
    }else if (!shift) {
        $("#shift").css('border' , '1px solid red')
    }else{
        $("#montant_Demande").css('border' , '1px solid #ced4da')
        var demandeAvance = {
            user : users._id,
            date : new Date(date_avance),
            date_of_avance: new Date(annee, mois),
            desired_amount: parseFloat(montantD),
            shift: shift,
            is_urgent: is_urgent,
        }
        ui.send(demandeAvance)
        ui.reloadDataTable();
    }
    

})

$("#montant_Demande").on("input", function () {
    $("#montant_Demande").css('border' , '1px solid #ced4da')
    
})
$("#shift").on("input", function () {
    $("#shift").css('border' , '1px solid #ced4da')
    
})