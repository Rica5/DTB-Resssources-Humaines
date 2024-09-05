
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

    async getOneDemande(id){
        const response = await fetch(`${this.baseurl}/demande/${id}`)
        return response.json()
    }

    async send(data) {
        const response = await fetch(`${this.baseurl}`, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-type": "application/json"
            }
        });
        
        return response.json();
    }

    async sendUpdate(data, id) {
        const response = await fetch(`${this.baseurl}/${id}`, {
            method : "PUT",
            body: JSON.stringify(data),
            headers: {
                "Content-type": "application/json"
            }
        })

        return response.json()
    }

    async deleteDemande(id){
        const response = await fetch(`${this.baseurl}/delete/${id}`, {
            method: 'DELETE',
        })        
        return response.json()
    }
    loadDataTable(id, url) {
        // Sauvegarder la référence à `this` pour l'utiliser dans les callbacks
        const self = this;
    
        // Initialiser DataTables sur la table avec l'ID fourni
        this.table = $('#' + id).DataTable({
            ajax: {
                url: url,
                dataSrc: "data"
            },
            columns: [
                { 
                    "data": "date",
                    "render": function(data, type, row) {
                        // Utiliser Moment.js pour formater la date
                        return moment(data).format('DD/MM/YYYY'); // Format personnalisé
                    }
                },
                { 
                    "data": "date_of_avance",
                    "render": function(data, type, row) {
                        // Utiliser Moment.js pour formater la date
                        return moment(data).format('MMM YYYY'); // Format personnalisé
                    }
                },
                { "data": "desired_amount" },
                { 
                    "data": "amount_granted",
                    "render": function(data){
                        return data === 0 ? "Pas encore décidé" : data;
                    }
                },
                { "data": "status" },
                { 
                    "data": null,
                    "render": function(data, type, row) {
                        return `<button id="${row._id}" class="edit_btn btn btn-sm btn-secondary mr-2">
                        <i class="fa fa-pencil" aria-hidden="true"></i>
                        </button>
                        <button id="${row._id}" class="del_btn btn btn-sm btn-warning" data-toggle="modal" data-target="#delete-demande" onclick="deleteDemande('${row._id}')">
                            <i class="fa fa-trash" style="color: #E5E5E5" aria-hidden="true"></i>
                        </button>`;
                    }
                },
            ]
        });
    
        // Détecter quand DataTable a terminé le chargement initial
        this.table.on('init', () => {
            attachClickListeners();
        });
    
        // Redétecter les boutons d'édition après chaque redessin du tableau
        this.table.on('draw', () => {
            attachClickListeners();
        });
    
        // Fonction pour ajouter les listeners aux boutons d'édition
        function attachClickListeners() {
            $(`#${id} .edit_btn`).each((i, btn) => {
                $(btn).on('click', handClick);
            });
        }
    
        // Fonction asynchrone pour gérer le clic sur les boutons d'édition
        async function handClick() {
            const getId = $(this).attr("id");
            document.getElementById("demande-avance").style.display = "none";
            document.getElementById("update-avance").style.display = "block";
            
            // Utilisation de `self.getData` pour préserver le contexte de `this`
            try {
                const getData = await self.getOneDemande(getId);

                $("#date-avance-update").val(new Date(getData.data.date).toISOString().split('T')[0])
                $("#shift-update").val(getData.data.shift)
                $("#year-update").val(new Date(getData.data.date_of_avance).getFullYear())
                $("#month-update").val(new Date(getData.data.date_of_avance).getMonth())
                $("#montant_Demande-update").val(getData.data.desired_amount)
                $("#id-update").val(getId)

            } catch (error) {
                console.error("Erreur lors de la récupération des données :", error);
            }
        }
    }
    
    

    reloadDataTable(){
        this.table.ajax.reload()
    }
}

const ui = new SalaryAvanceUI();
ui.loadDataTable("listeDemande", '/api/avance');

function toggleDeleteModal() {
    $('.delete-modal').toggleClass('open');
}

function deleteDemande(id) {
    toggleDeleteModal()
    $('#delete-id').val(id)

}

async function cancelLeaveRequest(){
    var id = $('#delete-id').val()
    await ui.deleteDemande(id)
    ui.reloadDataTable()
    toggleDeleteModal()
}


// Créez une nouvelle instance de la date actuelle
const today = new Date();

// Formatez la date au format yyyy-mm-dd pour qu'elle corresponde à la valeur attendue par l'input
const formattedDate = today.toISOString().split('T')[0];
$("#date-avance").val(formattedDate)


$("#envoyer-avance").on("click", async function () {

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
        await ui.send(demandeAvance)
        ui.reloadDataTable();
        $("#date-avance").val(formattedDate)
        $("#year").val(new Date().getFullYear())
        $("#month").val(new Date().getMonth())
        $("#montant_Demande").val("")
        Toastify({
            text: "Votre demande est envoyé",
            gravity: "bottom",
            position: "center",
            style: {
                "background": "#29E342"
            }
          }).showToast();
        
        $("#urgent").prop("checked", false);
    }
    

})


$("#envoyer-avance-update").on("click",async function () {
    
    var date_avance_update = $("#date-avance-update").val()
    var annee_update = $("#year-update").val()
    var mois_update = $("#month-update").val()
    var montantD_update = $("#montant_Demande-update").val()
    var is_urgent_update = $("#urgent-update").is(":checked");
    var shift_update =  $("#shift-update").val()
    var id_upate = $("#id-update").val()

    console.log("getId", id_upate);
    
    if (!montantD_update) {
        $("#montant_Demande-update").css('border' , '1px solid red')
    }else if (!shift) {
        $("#shift-update").css('border' , '1px solid red')
    }else{
        $("#montant_Demande-update").css('border' , '1px solid #ced4da')
        var demandeAvance = {
            user : users._id,
            date : new Date(date_avance_update),
            date_of_avance: new Date(annee_update, mois_update),
            desired_amount: parseFloat(montantD_update),
            shift: shift_update,
            is_urgent: is_urgent_update,
        }
        await ui.sendUpdate(demandeAvance, id_upate)
        ui.reloadDataTable();
        $("#date-avance-update").val(formattedDate)
        $("#year-update").val(new Date().getFullYear())
        $("#month-update").val(new Date().getMonth())
        $("#montant_Demande-update").val("")        
        $("#urgent-update").prop("checked", false);
        document.getElementById("demande-avance").style.display = "block";
        document.getElementById("update-avance").style.display = "none";
    }
    
})
$("#montant_Demande").on("input", function () {
    $("#montant_Demande").css('border' , '1px solid #ced4da')
    
})
$("#shift").on("input", function () {
    $("#shift").css('border' , '1px solid #ced4da')
    
})