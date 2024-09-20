class RequestSalary {
    constructor() {
    }

    async fetchAllRequests(){
        var result = await fetch("/api/avance/all") // add /true if urgent or /false if non-urgent
        const {data} = await result.json()
        return data
    }
    
    async getOneDemande(id){
        const response = await fetch(`/api/avance/demande/${id}`)
        return response.json()
    }
    
    // function to render salary requests
    async renderAllRequest() {
        // vider les conteneurs
        $("#UrgentList").html("");
        $("#NUrgentList").html("");
        // fetch data
        var data = await this.fetchAllRequests();
        // afficher les nombre de demandes urgent et non urgent dans le boutton
        $("#UrgentBtn span").text(data.filter(d => d.is_urgent).length);
        $("#NUrgentBtn span").text(data.filter(d => !d.is_urgent).length);
        // parcourir les données
        data.forEach(request => {
            const $container = $(request.is_urgent ? "#UrgentList" : "#NUrgentList");
            const item = this.createItem(request);
            $container.append(item);
        });
    }

    async validateRequest(data){
        const response = await fetch(`/api/avance/validate`, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-type": "application/json"
            }
        }) 

        return response.json()
    }

    async verificationRequest(id){
        var result = await fetch("/api/avance/verification/"+id)
        const  { data} = await result.json()
        return data
    }

    async completePayment(id){
        var res = await fetch(`/api/avance/complete/${id}`, { method: 'POST' });
        return res.json()
    }

    currencyFormat(number = 0) {
        return number.toLocaleString('mg-MG', {
            style: 'currency',
            currency: 'MGA'
        })
    }

    // create element for list item
    createItem(props) {
        const div = document.createElement('div');
        const li = document.createElement('li');
        
        div.setAttribute("key", props.user.m_code);
        li.id = `item-${props._id}`;

        // li.setAttribute('style', `--ol-cards-color-accent:#${props.is_urgent ? 'cacaca' : '92D13F'}`);
        li.setAttribute('class', props.is_urgent ? 'urgent' : 'non-urgent');

        li.innerHTML = `
            <div class="step" m-code="${props.user.m_code}"><i class="far fa-user" style="background: aliceblue"></i></div>
            <div class="title">
                <div class="timestamps flexy">
                    <span>${moment(props.date).format('DD/MM/YYYY')}</span>
                    <span>${moment(props.createdAt).locale('fr').fromNow()}</span>
                </div>
                <hr style="color: #767676;" />
                <div class="desire-amount flexy">
                    <label style="color: #817679; font-size: 0.75rem;">Montant souhaité:</label>
                    <span>${this.currencyFormat(props.desired_amount)}</span>
                </div>
                ${((props.amount_granted !== 0)) ? `
                <div class="amount-granted flexy">
                    <label style="color: #817679; font-size: 0.75rem;">Montant accordé:</label>
                    <label style="color: #1622CE">${this.currencyFormat(props.amount_granted)}</label>
                </div>` :''}
            </div>
            <div class="content flexy">
                    <label style="color: #817679; font-size: 0.75rem;">Par:</label>
                    <label class="ellipsis">${props.user.last_name} ${props.user.first_name}</label>
            </div>
            <div class="changeMontant-${props._id} hide" style="grid-column: span 2;">
                <div class="input-group-mod">
                    <span class="input-group-text span-input">MGA</span>
                    <input type="number" class="form-control input-right" 
                        id="granted_${props._id}" 
                        value="${((props.amount_granted !== props.desired_amount) && (props.amount_granted == 0)) ? props.desired_amount : props.amount_granted}"
                        aria-label="Amount (to the nearest dollar)">
                    <span class="input-group-text span-input">.00</span>
                </div>
            </div>

            <div class="bouton" ${props.status === 'verified' ? 'hidden' : ''}>
                <div>
                    <button id="modif-${props._id}" class="btn btn-warning ellipsis flexy" title="Définir le montant accordé" >
                        <span class="mdi mdi-pen"></span> Modifier
                    </button>
                </div>
                <div>
                    <button id="accord-${props._id}" onclick="accordSalary('${props._id}')" class="btn btn-primary ellipsis" title="Accorder le montant">
                        <span class="mdi mdi-thumb-up"></span> Accorder
                    </button>
                </div>
            </div>

            ${props.status == "approved" ? 
                `<div class="">
                    <button onclick="confirmer('${props._id}', '${props.user.m_code}')" class="btn btn-success" title="Envoyer un email">
                        <span class="mdi mdi-email"></span> Demander la confirmation
                    </button>
                </div>`:
                props.status == "verifying" ?
                `<span class="badge badge-warning" style="margin: auto 0;">En attente de confirmation...</span>`
                :
                props.status == "verified" ?
                `<div class="flexy all-line ps-3">
                    <span class="badge badge-success" style="margin: auto 0;">A été confirmé par ${props.user.m_code}</span>
                    <button onclick="payer('${props._id}')" class="btn btn-danger" title="Donner l'avance à l'employé">
                        <span class="mdi mdi-cash-multiple"></span> Payer maintenant
                    </button>
                </div>` : ""
            }
            
        `;

        // Bind event listener
        const button_container = li.querySelector('.bouton');
        const modif_btn = button_container.querySelector(`#modif-${props._id}`);
        const modifTextContent = modif_btn.innerHTML;

        modif_btn.onclick = () => {
            var div = li.querySelector(`.changeMontant-${props._id}`);
            if (div.classList.contains("hide")) {
                div.classList.replace("hide", "show");
                modif_btn.innerHTML = '<span class="mdi mdi-close"></span> Annuler';
            } else {
                modif_btn.innerHTML = modifTextContent;
                div.classList.replace("show", "hide");
            }
        };

        div.append(li)
        return div;
    }

    updateItem(props) {
        // create new li item
        const newItem = this.createItem(props);
        // replace old item if there is no change in urgent field
        $(`#item-${props._id}`).replaceWith(newItem);
        
    }
    
    deleteItem(id) {
        $(`#item-${id}`).remove();
    }

    bindGlobalSearch() {
        
        $('#global-search').on('input',function() {
            $('#allRequest').html('');
            const key = $(this).val().toUpperCase();
            if (!key) {
                // hide all request container
                $('#allRequest').attr('hidden', '');
                return;
            }
            const children = [
                $("#UrgentList").children().clone().toArray(),
                $("#NUrgentList").children().clone().toArray(),
            ].flat().filter(e => $(e).attr('key'));

            const filtered = children.filter(c => {
                return $(c).attr('key').includes(key)
            });

            $('#allRequest').append(`<p style="grid-column: 1 / -1; text-align:center;">Résultats de recherche: ${key}</p>`);
            $('#allRequest').append(filtered.length === 0 ? '<p style="grid-column: 1 / -1; text-align:center; text-transform: uppercase;">Aucunes demandes trouvées</p>' : filtered);
            $('#allRequest').append(`<p  style="grid-column: 1 / -1; text-align:center;">------------------Fin de resultats------------------</p>`);
            $('#allRequest').removeAttr('hidden');

        });
    }

}


var ui = new RequestSalary()
ui.renderAllRequest();
ui.bindGlobalSearch();

async function accordSalary(id) {
    
    var dataValidate = {
        _id: id,
        amount_granted: $(`#granted_${id}`).val()
    }
    
    const { data } = await ui.validateRequest(dataValidate)

    
    if (data) {
        ui.updateItem(data);
        // show notification
        Toastify({
            text: "Demande d'avance accordée",
            gravity: "bottom",
            position: "center",
            style:{
                "background": "#29E342"
            }
        }).showToast();
    }
}

async function confirmer(id, m_code){

    const { data } = await ui.getOneDemande(id);
    // popup dialog
    Swal.fire({
        title: 'Êtes-vous sûr d\'envoyer la demande de confirmation?',
        html: `<p>Un email de confirmation sera envoyé à ${m_code}</p>
                <p>Pour confirmer le montant accordé: <b>${currencyFormat(data.amount_granted)}</b></p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, envoyer!',
        cancelButtonText: 'Non, fermer!',
        customClass: {
          confirmButton: 'my-confirm-button' // Applying the custom class
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            // User clicked the confirm button
            const data = await ui.verificationRequest(id)

            if (data) {

                ui.updateItem(data);

                Toastify({
                    text: "Un Email a été envoyé vers l'utilisateur",
                    gravity: "bottom",
                    position: "center",
                    style: {
                        "background": "#29E342"
                    }
                }).showToast();
            }
        }
    });
}

async function payer(id) {
    const {data} = await ui.getOneDemande(id);

    if (!data) {
        return alert('Request not found');
    }

    Swal.fire({
        title: 'Confirmation de Demande d\'Avance',
        html: `<p>Êtes-vous sûr de vouloir accorder cette avance ?</p>
                <p><strong>Montant accordé : ${currencyFormat(data.amount_granted)}</strong></p>
                <p><strong>Demandeur : ${data.user.m_code}</strong></p>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, payé l\'avance',
        cancelButtonText: 'Non, annuler',
        customClass: {
            confirmButton: 'btn-confirm',
            cancelButton: 'btn-cancel'
        }
    }).then(async (result) => {
            if (result.isConfirmed) {
                // payer l'avance
                const {data} = await ui.completePayment(id);
                if (data && data.status === "paid") {
                    // Action après confirmation
                    Swal.fire('Avance payé', "Un email a été envoyé au demandeur.", 'success');
                    // delete the item from view
                    ui.deleteItem(data._id);
                }
                else
                    Swal.fire('Une erreur s\'est produite', "Un email n'a pas été envoyé au demandeur.", 'erreur');
            } else if (result.isDismissed) {
                // Action après annulation
                Swal.fire('Annulé', 'Le paiement de l\'avance a été annulé.', 'error');
            }
    });
}

$("#UrgentBtn").on("click", function () {
    $("#Urgent").attr("style", "")
    $("#NUrgent").attr("style", "display: none")
    $("#UrgentBtn").addClass("active-btn")
    $("#NUrgentBtn").removeClass("active-btn")
})
$("#NUrgentBtn").on("click", function () {
    $("#NUrgent").attr("style", "")
    $("#Urgent").attr("style", "display: none")
    $("#UrgentBtn").removeClass("active-btn")
    $("#NUrgentBtn").addClass("active-btn")
})


function currencyFormat(number = 0) {
    return number.toLocaleString('mg-MG', {
        style: 'currency',
        currency: 'MGA'
    })
}
