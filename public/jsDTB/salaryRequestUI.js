class RequestSalary {
    months = [  
        "Les 12 mois", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",  
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"  
    ];  
    constructor() {
        this.typedCode = '';
        this.countUrgent =  Number($("#UrgentBtn span").text() || 0);
        this.countNUrgent =  Number($("#NUrgentBtn span").text() || 0);
        this.modifTextContent = 'Modifier';
        this.month = new Date().getMonth() + 1;  
        this.year = new Date().getFullYear();
    }



    updateCounts() {
        $("#UrgentBtn span").text(this.countUrgent);
        $("#NUrgentBtn span").text(this.countNUrgent);
    }

    async fetchAllRequests(){
        // var result = await fetch("/api/avance/all") // add /true if urgent or /false if non-urgent
        
        var result = await fetch(`/api/avance/request?month=${this.month}&year=${this.year}`)
        const {data} = await result.json()
        return data
    }
    
    addFilters() {  
        // Création des options pour le mois et l'année  
        const monthOptions = this.months.map((month, index) => `<option value="${index}">${month}</option>`).join('');  
        const currentYear = new Date().getFullYear();  
        const yearOptions = Array.from({ length: currentYear - 2023 + 1 }, (_, i) => 2024 + i)  
                                  .map(year => `<option value="${year}">${year}</option>`)  
                                  .join('');  

        $('#f-month').html(monthOptions).val(new Date().getMonth() + 1);  
        $('#f-year').html(yearOptions).val(currentYear);  

        // Ajout des écouteurs d'événements  
        $('#f-month').on('change', () => {  
            this.month = +$('#f-month').val();  
            $("#exportBtn").toggle(this.month !== 0);  
            this.renderAllRequest();  
        });  

        $('#f-year').on('change', () => {  
            this.year = +$('#f-year').val();  
            this.renderAllRequest();  
        });  
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
        this.countUrgent = data.filter(d => d.is_urgent).length;
        this.countNUrgent = data.filter(d => !d.is_urgent).length;
        this.updateCounts();

        // parcourir les données
        data.forEach(request => {
            const $container = $(request.is_urgent ? "#UrgentList" : "#NUrgentList");
            const item = this.createItem(request);
            $container.append(item);
        });
    }

    // function to render salary requests
    async renderOneRequest(data) {

        // parcourir les données
        const $container = $(data.is_urgent ? "#UrgentList" : "#NUrgentList");
        const item = this.createItem(data);
        $container.append(item);
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

    async filterUserPerShift(shift){
        var data = await this.fetchAllRequests()
        var dataShift = data;

        if (["1", "2", "3", "w"].includes(shift)) {
            dataShift = data.filter(user => {
                if (["I", "01", "Matin", "1"].includes(user.shift)) user.shift = "1";
                if (["II", "02", "Soir", "2"].includes(user.shift)) user.shift = "2";
                if (["Weekend", "Week-end", "W.E", 'w.e'].includes(user.shift)) user.shift = "w";
                return user.shift.includes(shift)
            });
        } else if (shift === "jours") {
            dataShift = data.filter(user => ["1", "2", "1 - 2", "1/2", "1 / 2", "1-2", "Matin", "Soir", "3", "w", "I", "II", "01", "02", "03", "Weekend", "Week-end", "WE", "we", "We", "W.E"].every(str => !str.toLowerCase().includes(user.shift.toLowerCase())));
        }
        
        // const {data} = await result.json()
        // vider les conteneurs
        $("#UrgentList").html("");
        $("#NUrgentList").html("");
        // fetch data
        // var data = await this.fetchAllRequests();
        // afficher les nombre de demandes urgent et non urgent dans le boutton
        $("#UrgentBtn span").text(dataShift.filter(d => d.is_urgent).length);
        $("#NUrgentBtn span").text(dataShift.filter(d => !d.is_urgent).length);
        // parcourir les données
        dataShift.forEach(request => {
            const $container = $(request.is_urgent ? "#UrgentList" : "#NUrgentList");
            const item = this.createItem(request);
            $container.append(item);
        });
        // return data
    }

    async completePayment({id, autruiInfo, isAutrui}){
        var res = await fetch(`/api/avance/complete/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ autruiInfo, isAutrui })
        });
        return res.json()
    }

    async reject(id, comment) {
        var res = await fetch(`/api/avance/reject/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ comment: comment })
        });
        return res.json();
    }

    currencyFormat(number = 0) {
        return number.toLocaleString('mg-MG', {
            style: 'currency',
            currency: 'MGA'
        })
    }

    // create element for list item
    createItem(props, isForSearch = false) {
        const div = document.createElement('div');
        const li = document.createElement('li');
        
        div.setAttribute("key", props.user.m_code);
        div.setAttribute("style", "position: relative;");
        li.id = isForSearch ? `search-item-${props._id}` : `item-${props._id}`;

        // li.setAttribute('style', `--ol-cards-color-accent:#${props.is_urgent ? 'cacaca' : '92D13F'}`);
        li.setAttribute('class', props.is_urgent ? 'urgent' : 'non-urgent');

        li.innerHTML = `
            <div class="step" m-code="${props.user.m_code}"><i class="far fa-user" style="background: aliceblue"></i></div>
            <div class="content flexy" style="position: absolute;top: 106px;left: 10px;font-size: 0.85rem;">
                <label style="color: #817679;">Shift:</label>
                <label class="ellipsis">${props.shift}</label>
            </div>
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

            <div class="bouton d-flex align-items-center justify-content-between" ${props.status === 'verified' ? 'hidden' : ''} style="grid-column: span 2;">
                <div class="d-flex" style="gap: 6px">
                    <div>
                        <button id="modif-${props._id}" onclick="updateSalary('${props._id}', '${isForSearch}')" class="btn btn-warning ellipsis flexy" title="Définir le montant accordé" >
                            <span class="mdi mdi-pen"></span> Modifier
                        </button>
                    </div>
                    <div>
                        <button id="accord-${props._id}" onclick="accordSalary('${props._id}')" class="btn btn-primary ellipsis" title="Accorder le montant">
                            <span class="mdi mdi-thumb-up"></span> Accorder
                        </button>
                    </div>
                    <div>
                        <button id="refuse-${props._id}" onclick="refuseDemand('${props._id}')" class="btn btn-secondary ellipsis" title="Refuser la demande">
                            <span class="mdi mdi-thumb-down"></span> Refuser
                        </button>
                    </div>
                </div>
                <div>
                    Mois de ${moment(props.date_of_avance).locale('fr').format('MMMM YYYY')}
                </div>
            </div>

            ${
                props.status == "verifying" ?
                `<span class="badge badge-warning" style="margin: auto 0;">En attente de confirmation...</span>`
                :
                props.status == "verified" ?
                `<div class="flexy all-line ps-3">
                    <span class="badge badge-success" style="margin: auto 0; ${props.confirmed_by ? '' : 'opacity: 0;'}">A été accordé par ${props.confirmed_by?.usuel}</span>
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
        this.modifTextContent = modif_btn.innerHTML;

        // modif_btn.onclick = () => {
        //     var div = li.querySelector(`.changeMontant-${props._id}`);
        //     if (div.classList.contains("hide")) {
        //         div.classList.replace("hide", "show");
        //         modif_btn.innerHTML = '<span class="mdi mdi-close"></span> Annuler';
        //     } else {
        //         modif_btn.innerHTML = modifTextContent;
        //         div.classList.replace("show", "hide");
        //     }
        // };

        div.append(li)
        return div;
    }

    updateItem(props) {
        // create new li item
        const newItem = this.createItem(props);
        const newItemEdit = this.createItem(props, true);
        // replace old item if there is no change in urgent field
        $(`#item-${props._id}`).replaceWith(newItem);
        $(`#search-item-${props._id}`).replaceWith(newItemEdit);
        $(newItem).appendTo((props.is_urgent)?"#UrgentList":"#NUrgentList")
        
    }
    
    deleteItem(id, isUrgent) {
        $(`#item-${id}`).parent().remove();
        $(`#search-item-${id}`).parent().remove(); // from search if exists
        this.countUrgent -= isUrgent ? 1 : 0;
        this.countNUrgent -= !isUrgent ? 1 : 0;
        this.updateCounts();
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

            // change id of element
            filtered.forEach(f => {
                const li = f.firstElementChild;
                if (li) {
                    let id = li.id?.replace('item-', '');
                    li.setAttribute('id', `search-${li.getAttribute('id')}`);

                    const modif_btn = li.querySelector(`#modif-${id}`);
                    if(modif_btn)
                        modif_btn.setAttribute('onclick', `updateSalary('${id}', 'true')`);
                }
            })

            $('#allRequest').append(`<p style="grid-column: 1 / -1; text-align:center;">Résultats de recherche: ${key}</p>`);
            $('#allRequest').append(filtered.length === 0 ? '<p style="grid-column: 1 / -1; text-align:center; text-transform: uppercase;">Aucunes demandes trouvées</p>' : filtered);
            $('#allRequest').append(`<p  style="grid-column: 1 / -1; text-align:center;">------------------Fin de resultats------------------</p>`);
            $('#allRequest').removeAttr('hidden');

        });
    }

    async verifyCode(email, code) {
        console.log(code, email)
        const res = await fetch('/api/avance/verify-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code, email })
        });


        const { data } = await res.json();

        return data;
    }

    bindCodeListeners() {
        let self = this;
        const inputs = document.querySelectorAll('.code-input');

        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                if (value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }

                // Automatically validate when all inputs are filled
                if (Array.from(inputs).every(input => input.value.length === 1)) {
                    const code = Array.from(inputs).map(input => input.value).join('');
                    validateCode(code); // Call validation function
                }
            });

            // Handle backspace: move focus to the previous input if empty
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });

            // Handle paste: fill all fields when pasting a 4-digit code
            input.addEventListener('paste', (e) => {
                const pasteData = e.clipboardData.getData('text');
                if (/^\d{4}$/.test(pasteData)) { // Check if the pasted data is exactly 4 digits
                    pasteData.split('').forEach((char, i) => {
                        if (inputs[i]) {
                            inputs[i].value = char;
                        }
                    });
                    inputs[3].focus(); // Focus the last input field after paste
                    validateCode(pasteData); // Auto-validate after pasting
                }
                e.preventDefault(); // Prevent default paste behavior
            });
        });

        // Example validation function
        function validateCode(code) {
            if (code.length === 4) {
                // alert('Code entered: ' + code);
            }
            self.typedCode = code;
        }
    }
    
    bindSocket() {
        if (typeof io !== 'undefined') {

            const socket = io();

            // access set
            socket.on('updateAvance', async (data) => {              
                
                // update counts
                if (data.is_urgent) {
                    // find if it exist in urgent container
                    if ($('#UrgentList').find(`#item-${data._id}`).length === 0) {
                        this.countUrgent += 1;
                        this.countNUrgent -= 1;
                    }
                } else {
                    if ($('#NUrgentList').find(`#item-${data._id}`).length === 0) {
                        this.countUrgent -= 1;
                        this.countNUrgent += 1;
                    }
                }
                
                this.updateCounts();

                this.updateItem(data);

                // show notification
                Toastify({
                    text: `${data.user.m_code} a modifié sa demande d'avance.`,
                    gravity: "bottom",
                    position: "center",
                    style:{
                        "background": "#29E342"
                    }
                }).showToast();
            });

            
            // Écoute l'événement 'createAvance' envoyé par le serveur
            socket.on("createAvance", (data) => {
                // Vérifie si l'utilisateur actuel est un admin concerné
                
                ui.renderOneRequest(data);
                
                // Mettre à jour le compteur d'urgence ou non urgence
                if (data.is_urgent) {
                    this.countUrgent += 1;
                } else {
                    this.countNUrgent += 1;
                }
                this.updateCounts();

                // show notification
                Toastify({
                    text: `${data.user.m_code} a ajouté sa demande d'avance.`,
                    gravity: "bottom",
                    position: "center",
                    style:{
                        "background": "#29E342"
                    }
                }).showToast();
            });

            
            // Écoute l'événement 'cancelAvance' envoyé par le serveur
            socket.on("cancelAvance", function(data) {
                // Vérifie si l'utilisateur actuel est un admin concerné
                ui.deleteItem(data._id, data.is_urgent);
                // show notification
                Toastify({
                    text: `${data.user.m_code} a annulé sa demande d'avance.`,
                    gravity: "bottom",
                    position: "center",
                    style:{
                        "background": "#29E342"
                    }
                }).showToast();
            });

        }
    }
}


var ui = new RequestSalary()
ui.addFilters()
ui.renderAllRequest();
ui.bindGlobalSearch();
ui.bindSocket()


function filterUserPerShift(){
    var shift = $("#select-shift").val();
    console.log("shif", shift);
    ui.filterUserPerShift(shift)
}

async function updateSalary(id, isForSearch) {
    
    
    const li = document.getElementById((isForSearch === "true") ? `search-item-${id}` : `item-${id}`);
    const button_container = li.querySelector('.bouton');
    const modif_btn = button_container.querySelector(`#modif-${id}`);

    var div = li.querySelector(`.changeMontant-${id}`);
    if (div.classList.contains("hide")) {
        div.classList.replace("hide", "show");
        modif_btn.innerHTML = '<span class="mdi mdi-close"></span> Annuler';
    } else {
        modif_btn.innerHTML = ui.modifTextContent;
        div.classList.replace("show", "hide");
    }
}

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
    ui.typedCode = '';
    Swal.fire({
        title: 'Validation de l\'Avance en Espèces',
        html: `<p>Veuillez entrer votre code de validation à 4 chiffres pour confirmer la remise de l'avance en espèces.</p>
                <p><strong>Montant de l'avance : ${currencyFormat(data.amount_granted)}</strong></p>
                <p><strong>Demandeur : ${data.user.m_code}</strong></p>
                <div class="container-code">
                    <input type="text" maxlength="1" class="code-input" id="digit1" autocomplete="off" autofocus>
                    <input type="text" maxlength="1" class="code-input" id="digit2" autocomplete="off">
                    <input type="text" maxlength="1" class="code-input" id="digit3" autocomplete="off">
                    <input type="text" maxlength="1" class="code-input" id="digit4" autocomplete="off">
                </div>
                <p class="instructions">Saisissez les chiffres un par un. Ce code est requis pour la remise de l'avance en espèces.</p>
                <div class="form-check mt-3">
                <label class="form-check-label" for="autruiCheckbox">
                    <input type="checkbox" class="form-check-input" id="autruiCheckbox"> Un tiers récupère l'avance pour le demandeur
                </label>
                </div>
                <div id="autruiInfo" style="display: none; margin-top: 10px;">
                    <textarea id="autruiText" class="swal2-textarea" placeholder="Veuillez entrer les informations sur la personne représentant le demandeur."></textarea>
                </div>`,
        icon: 'warning',
        showCancelButton: true,
        allowOutsideClick: false,
        confirmButtonText: 'Confirmer le paiement',
        cancelButtonText: 'Annuler la transaction',
        customClass: {
            confirmButton: 'btn-confirm',
            cancelButton: 'btn-cancel'
        },
        preConfirm: async () => {
            const enteredCode = ui.typedCode;
            
            // Validation de code
            const correctCode  = await ui.verifyCode(data.user.username, enteredCode);
                
            const autruiChecked = document.getElementById('autruiCheckbox').checked;
            const autruiInfo = document.getElementById('autruiText').value;


            if (!correctCode) {
                Swal.showValidationMessage('Le code saisi est incorrect. Veuillez entrer un code valide.');
                return false;
            }

            // Validation du champ "Autrui" si sélectionné
            if (autruiChecked && !autruiInfo.trim()) {
                Swal.showValidationMessage('Veuillez entrer les informations sur la personne représentant le demandeur.');
                return false;
            }

            return {
                code: enteredCode,
                autruiChecked,
                autruiInfo: autruiChecked ? autruiInfo : null
            };
        },
        didOpen: () => {
            // code comportement
            ui.bindCodeListeners();

            // Ajout du comportement lors de l'ouverture du Swal
            const autruiCheckbox = document.getElementById('autruiCheckbox');
            const autruiInfo = document.getElementById('autruiInfo');

            // Afficher le textarea si la checkbox est cochée
            autruiCheckbox.addEventListener('change', function () {
                if (this.checked) {
                    autruiInfo.style.display = 'block';  // Affiche le champ d'information
                } else {
                    autruiInfo.style.display = 'none';   // Cache le champ d'information
                }
            });
        }
    }).then(async (result) => {
        const { isConfirmed, value } = result;
        if (isConfirmed) {
            
            // Logic for confirmed action
            const {data} = await ui.completePayment({id, isAutrui: value.autruiChecked, autruiInfo: value.autruiInfo});

            if (data && data.status === "paid") {

                if (value.autruiChecked) {
                    Swal.fire('Avance confirmée', "L'avance en espèces a été donnée à une personne représentant le demandeur.", 'success');
                } else {
                    Swal.fire('Avance confirmée', "L'avance en espèces a été donnée à l'employé.", 'success');
                }

                ui.deleteItem(data._id, data.is_urgent);
            } else {

                Swal.fire('Une erreur s\'est produite', "Un email n'a pas été envoyé au demandeur.", 'error');

            }

        } else if (isDismissed) {
            Swal.fire('Annulé', 'La remise de l\'avance a été annulée.', 'error');
        }
    });

}


async function refuseDemand(id) {
    
    const {data} = await ui.getOneDemande(id);

    if (!data) return;

    Swal.fire({
        title: 'Refuser la demande de salaire',
        input: 'textarea',
        inputLabel: `Raison du refus pour ${data.user.m_code}`,
        inputPlaceholder: 'Écrivez votre commentaire ici...',
        inputAttributes: {
            'aria-label': 'Écrivez votre commentaire ici'
        },
        showCancelButton: true,
        confirmButtonText: 'Refuser',
        cancelButtonText: 'Annuler',
        inputValidator: (value) => {
            if (!value) {
                return 'Vous devez écrire un commentaire pour refuser la demande !';
            }

        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { ok, data: rejected } = await ui.reject(data._id, result.value);
            if (ok) {
                Swal.fire('Refusé', 'La demande a été refusée avec succès.', 'success');
                ui.deleteItem(rejected._id, rejected.is_urgent)
            }
            else
                Swal.fire('Echeck', 'Une erreur est survenue.', 'danger');
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

