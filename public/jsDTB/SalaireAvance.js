
document.getElementById("update-avance").style.display = "none";

class SalaryAvanceUI {

    baseurl = '/api/avance';

    constructor() {
        this.sentCount = 0;
        this.paidCount = 0;
        this.declinedCount = 0;
        this.queries = this.baseurl;
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

    async sendUpdateCode(data){
        const response = await fetch(`${this.baseurl}/updateCode`, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-type": "application/json"
            }
        })

        
        return response.status
    }
    async deleteDemande(id){
        const response = await fetch(`${this.baseurl}/delete/${id}`, {
            method: 'DELETE',
        })        
        return response.json()
    }
    
    createItem(props) {
        const li = document.createElement('li');

        if (props.status === 'verifying') {
            li.classList.add('to-verify');
            li.onclick = () => {
                let url = '/avance/verification/' + props._id
                window.open(url, '__blank')
            }
        }

        li.id = "item-" + props._id;

        if (props.status === 'paid') li.classList.add('paid');

        li.innerHTML = `
        <div class="details">
            <div class="info">
                <span class="date-envoie">${moment(props.date).format('DD/MM/YYYY')}</span>
            </div>
            <div class="amounts">
                <div class="desired-amount flexy-between">
                    <span>Souhaité:</span> <b>${currencyFormat(props.desired_amount)}</b>
                </div>
                <div class="granted-amount flexy-between">
                    <span>Accordé:</span> <b>${currencyFormat(props.amount_granted)}</b>
                </div>
            </div>
            <span class="status ${props.status}">${STATUS[props.status]}</span>
            <div class="actions">
                ${
                    !['verifying', 'verified', 'paid'].includes(props.status) ? `
                    <button class="edit-btn" onclick="editDemande('${props._id}')"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn"  data-toggle="modal" data-target="#delete-demande" onclick="deleteDemande('${props._id}')"><i class="fas fa-trash-alt"></i></button>`: ''
                }
            </div>
        </div>
        <div class="dates">
            <span>Envoyé ${moment(props.createdAt).locale('fr').fromNow()}</span>
            ${ props.validation ? `<span>Reçu le ${moment(props.validation.received_on).format('DD/MM/YYYY [à] HH:mm')}</span>` : ''}
        </div>

        <div class="animated-cursor"></div>
            
        ${props.status === 'verifying' ? `<span class="click-here">Cliquer ici pour une confirmation</span>` : ''}
        `;
        return li;
    }

    updateItem(props) {
        let newItem = this.createItem(props);
        $(`#item-${props._id}`).replaceWith(newItem);
        if (props.status === 'paid') {
            this.paidCount += 1;
        }
        this.updateStatusValues()
    }

    deleteItem(id) {
        $(`#item-${id}`).remove();
        this.sentCount -= 1;
        this.updateStatusValues();
    }

    addItem(parentId, props) {
        const $container = $(`#${parentId}`);
        if ($container.find(`#item-${props._id}`).length === 0) {
            // create new item
            let item = this.createItem(props);
            $container.append(item);
            this.sentCount+=1;
            this.updateStatusValues();
        }
    }

    updateStatusValues() {
        this.updateStatusCount('nbr-sent', this.sentCount)
        this.updateStatusCount('nbr-declined', this.declinedCount)
        this.updateStatusCount('nbr-paid', this.paidCount)
    }

    updateStatusCount(id, nbr) {
        $(`#${id}`).text(nbr)
    }

    async loadList(id, url) {
        let $div = $(`#${id}`);
        $div.html('');
        const res = await fetch(url);
        const { data } = await res.json();

        data.forEach(d => {
            let item = this.createItem(d);
            $div.append(item);
        });

        // set variables count
        const count = (...status) => data.filter(d => status.includes(d.status)).length;
        this.sentCount = data.length;
        this.declinedCount = count('declined');
        this.paidCount = count('paid');

        this.updateStatusValues();
    }

    bindFilters() {
        let self = this;
        let $month =  $('#f-month'),
            $year =  $('#f-year'); 

        let date = new Date();
        $year.val(date.getFullYear());
        $month.val(String(date.getMonth() + 1).padStart(2, '0'));

        $month.on('change', function() {
            self.queries = `${self.baseurl}?month=${$(this).val()}&year=${$("#f-year").val()}`;
            console.log(self.queries)
            self.loadList("salary-list", self.queries);
        });


        $year.on('change', function() {
            self.queries = `${self.baseurl}?month=${$("#f-month").val()}&year=${$(this).val()}`;
            self.loadList("salary-list", self.queries);
        });
    }

}


var STATUS = {
    verified: 'Confirmé',
    paid: 'Payé',
    verifying: 'A confirmer',
    progress: 'En cours',
    rejected: 'Rejeté',
    approved: 'Accordé'
}

const ui = new SalaryAvanceUI();
ui.loadList("salary-list", '/api/avance');
ui.bindFilters()


async function editDemande(id) {
    document.getElementById("demande-avance").style.display = "none";
    document.getElementById("update-avance").style.display = "block";
    
    // Utilisation de `self.getData` pour préserver le contexte de `this`
    try {
        const data = await ui.getOneDemande(id);

        $("#date-avance-update").val(new Date(data.data.date).toISOString().split('T')[0])
        $("#shift-update").val(data.data.shift)
        $("#year-update").val(new Date(data.data.date_of_avance).getFullYear())
        $("#month-update").val(new Date(data.data.date_of_avance).getMonth())
        $("#montant_Demande-update").val(data.data.desired_amount)
        $("#id-update").val(id)

    } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
    }
}


function currencyFormat(number = 0) {
    return number.toLocaleString('mg-MG', {
        style: 'currency',
        currency: 'MGA'
    })
}


function toggleDeleteModal() {
    $('.delete-modal').toggleClass('open');
}

function deleteDemande(id) {
    toggleDeleteModal()
    $('#delete-id').val(id)

}

async function cancelLeaveRequest(){
    var id = $('#delete-id').val()
    const {data} = await ui.deleteDemande(id);
    ui.deleteItem(data._id);
    toggleDeleteModal()
    Toastify({
        text: "Votre demande a été annulé",
        gravity: "bottom",
        position: "center",
        style: {
            "background": "#29E342"
        }
    }).showToast();
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
    var montantD = convertToNumber($("#montant_Demande").val())
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
        const { data } = await ui.send(demandeAvance);
        ui.addItem("salary-list", data);

        $("#date-avance").val(formattedDate)
        $("#year").val(new Date().getFullYear())
        $("#month").val(new Date().getMonth())
        $("#montant_Demande").val("")
        Toastify({
            text: "Votre demande a été envoyée",
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
    var montantD_update = convertToNumber($("#montant_Demande-update").val())
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

        const { data } = await ui.sendUpdate(demandeAvance, id_upate);

        ui.updateItem(data);

        Toastify({
            text: "Une demande a été modifié",
            gravity: "bottom",
            position: "center",
            style: {
                "background": "#29E342"
            }
        }).showToast();
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

function convertToNumber(formattedValue) {
    // Remove all spaces
    let numericValue = formattedValue.replace(/\s/g, '');

    // Convert the cleaned string to a float
    return parseFloat(numericValue);
}

function formatNumber(input) {
    // Get the current cursor position
    let cursorPosition = input.selectionStart;

    // Get the initial length of the value (for later adjustment)
    let initialLength = input.value.length;

    // Remove all non-digit characters
    let value = input.value.replace(/\D/g, '');

    // Add spaces every 3 digits
    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    // Update the input with the formatted value
    input.value = value;

    // Get the new length of the value after formatting
    let newLength = value.length;

    // Adjust the cursor position (account for spaces added/removed)
    cursorPosition = cursorPosition + (newLength - initialLength);

    // Set the new cursor position
    input.setSelectionRange(cursorPosition, cursorPosition);
}


const submitBtn = document.getElementById('modifierCode');

var userId = $("#userId").val()
var code =""
$('#show-code').on('click', function(){
    let $btn = $(this);
    let $code = $('#digits-4');
    code = $("#codeHidden").val()
    if ($btn.hasClass('show')) {
        $btn.removeClass('show').addClass('hide');
        // add masked text
        $code.addClass('masked-text');
        $code.html('');
    } else {
        $btn.removeClass('hide').addClass('show');
        // show the code
        $code.removeClass('masked-text');
        $code.html(code);
    }
})
console.log(code);

var inputs = document.querySelectorAll('.code-container-1 input');
inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        const nextInput = inputs[index + 1];
        if (nextInput && input.value !== '') {
            nextInput.focus();
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && input.value === '') {
            const prevInput = inputs[index - 1];
            if (prevInput) {
                prevInput.focus();
            }
        }
    });
});
submitBtn.addEventListener('click', async () => {
    code = ""
    
    // const inputs = document.querySelectorAll('.inputField'); 
    inputs.forEach(input => {
        code += input.value;
    });
    
    let isMasked = document.getElementById('digits-4').classList.contains('masked-text');
    
    if (code.length === 4) {
        var data = {
            code: code,
            id: userId
        }
        await ui.sendUpdateCode(data);

        $('#modif_code').modal('hide'); // Si tu utilises Bootstrap pour gérer la modal

        // Vider les champs d'input après avoir récupéré leurs valeurs
        inputs.forEach(input => {
            input.value = ''; // Vider chaque champ d'input
        });

        // Mettre à jour le contenu de l'élément h3 avec le nouveau code
        $("#digits-4").text("")
        $("#codeHidden").val(code)
        // Si le code était masqué avant la mise à jour, le garder masqué
        if (isMasked) {
            $("#digits-4").addClass('masked-text')
        } else {
            $("#digits-4").text(code)
            $("#digits-4'").removeClass("masked-text")
        }

        
        Toastify({
            text: "Le code a été modifié",
            gravity: "bottom",
            position: "center",
            style: {
                "background": "#29E342"
            }
        }).showToast();

    } else {
        alert('Veuillez remplir tous les champs.');
    }
});

