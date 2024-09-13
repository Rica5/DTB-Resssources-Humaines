
class RequestSalary {
    constructor() {
    }

    async fetchRequestUrgent(){
        var result = await fetch("/api/avance/all/true")
        const {ok, data} = await result.json()
        console.log("fetcUrgent", data);
        return data
    }
    async fetchRequestNUrgent(){
        var result = await fetch("/api/avance/all/false")
        const {ok, data} = await result.json()
        console.log("fetchRequestNUrgent", data);
        
        return data
    }

    async renderAllUrgent(){
        $("#UrgentList").html("")
        var data = await this.fetchRequestUrgent()
        $("#UrgentBtn span").text(data.length)
        data.forEach(element => {
            this.render(element)
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
        const  {ok, data} = await result.json()
        return data
    }

    async renderAllNonUrgent(){
        
        $("#NUrgentList").html("")
        var dataNUrg = await this.fetchRequestNUrgent()
        $("#NUrgentBtn span").text(dataNUrg.length)
        dataNUrg.forEach(element =>{
            this.renderNonUrgent(element)
        })
    }


    async paid(id){
        var res = await fetch(`/api/avance/payer`+id )
        return res
    }


    render(props){
        console.log("props == ");
        
       var listeDemand =  `
        <li style="--ol-cards-color-accent:#ff624f">
            <div class="step" m-code="${props.user.m_code}"><i class="far fa-user" style="background: aliceblue"></i></div>
            <div class="title">
                <div class="desire-amount">
                    ${props.desired_amount} MGA
                </div>
                ${((props.amount_granted !== 0)) ? `
                <div class="amount-granted">
                    <label style="color: #817679; font-size: x-small;">Montant accordé:</label>
                    <label style="color: #27A9E3"> ${props.amount_granted} MGA </label>
                </div>` :''}
            </div>
            <div class="content">
            ${props.user.last_name} ${props.user.first_name}<br />
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
            <div class="bouton">
                <button id="modif-${props._id}" class="btn btn-warning  btnModifMontant toutBouton" >Modif montant</button>
                <button id="accord-${props._id}" onclick="accordSalaryUrgent('${props._id}')" class="btn btn-primary toutBouton btnAccorde" >Accordée</button>
            </div>

            ${props.status == "approved" ? 
                `<div class="">
                    <button onclick="confirmer('${props._id}')" class="btn btn-success paye">Envoyé la confirmation</button>
                </div>`:
                props.status == "verify" ?
                    
                `<div class="">
                <button onclick="payer('${props._id}')" class="btn btn-success paye">Payé</button>
            </div>` : ""
            }
        </li>`
        // <button class="btn btn-secondary" id="ok-${props._id}" onclick="accordSalaryUrgent('${props._id}')">OK</button>

        $("#UrgentList").append(listeDemand)
        $(`#modif-${props._id}`).on("click", function () {
            var div = $(`.changeMontant-${props._id}`)
            if (div.hasClass("hide")) {
                div.removeClass("hide").addClass("show")
            }else{
                div.removeClass("show").addClass("hide")
            }
        })
    }

    renderNonUrgent(props){
        var listeDemand = `
        
        <li style="--ol-cards-color-accent:#92D13F">
            <div class="step" m-code="${props.user.m_code}"><i class="far fa-user" style="background: aliceblue"></i></div>
            <div class="title">
                <div class="desire-amount">
                    ${props.desired_amount} MGA
                </div>
                ${((props.amount_granted !== props.desired_amount) && (props.amount_granted !== 0)) ? `
                <div class="amount-granted">
                    <label style="color: #817679">accordée</label>
                    <label style="color: #27A9E3"> ${props.amount_granted} MGA </label>
                </div>` :''}
            </div>
            <div class="content">
            ${props.user.last_name} ${props.user.first_name}<br />
            </div>
            <div class="changeMontant-${props._id} hide" style="grid-column: span 2;">
                <div class="input-group-mod">
                    <span class="input-group-text span-input">Ar</span>
                    <input type="number" class="form-control input-right" 
                    id="granted_${props._id}" 
                    value="${((props.amount_granted !== props.desired_amount) && (props.amount_granted == 0)) ? props.desired_amount : props.amount_granted}"
                        aria-label="Amount (to the nearest dollar)">
                    <span class="input-group-text span-input">.00</span>

                </div>
            </div>
            <div class="bouton">
                <button id="modif-${props._id}" class="btn btn-warning  btnModifMontant toutBouton" >Modif montant</button>
                <button id="accord-${props._id}" onclick="accordSalaryNUrgent('${props._id}')" class="btn btn-primary toutBouton btnAccorde" >Accordée</button>
            </div>
           
            ${props.status == "approved" ? 
                `<div class="">
                    <button onclick="confirmer('${props._id}')" class="btn btn-success paye">Envoyé la confirmation</button>
                </div>`:
                props.status == "verify" ?
                    
                `<div class="">
                <button onclick="payer('${props._id}')" class="btn btn-success paye">Payé</button>
            </div>` : ""
            }
        </li>`

        //accordSalaryNUrgent
        $("#NUrgentList").append(listeDemand)
        $(`#modif-${props._id}`).on("click", function () {
            var div = $(`.changeMontant-${props._id}`)
            if (div.hasClass("hide")) {
                div.removeClass("hide").addClass("show")
            }else{
                div.removeClass("show").addClass("hide")
            }
        })
    }

}

var ui = new RequestSalary()
ui.renderAllUrgent()
ui.renderAllNonUrgent()

async function accordSalaryUrgent(id) {
    var dataValidate = {
        _id: id,
        amount_granted: $(`#granted_${id}`).val()
    }
    
    await ui.validateRequest(dataValidate)

    Toastify({
        text: "Demande d'avance accordée",
        gravity: "bottom",
        position: "center",
        style:{
            "background": "#29E342"
        }
    }).showToast();

    
    ui.renderAllUrgent()
    ui.renderAllNonUrgent()
    
}

async function accordSalaryNUrgent(id) {
    
    var dataValidate = {
        _id: id,
        amount_granted: $(`#granted_${id}`).val()
    }
    
    await ui.validateRequest(dataValidate)

    Toastify({
        text: "Demande d'avance accordée",
        gravity: "bottom",
        position: "center",
        style:{
            "background": "#29E342"
        }
    }).showToast();
    
    ui.renderAllUrgent()
    ui.renderAllNonUrgent()
}

async function confirmer(id){
    await ui.verificationRequest(id)

    Toastify({
        text: "Email envoyé vers l'utilisateur",
        gravity: "bottom",
        position: "center",
        style: {
            "background": "#29E342"
        }
    }).showToast()
    ui.renderAllUrgent()
    ui.renderAllNonUrgent()
}

async function payer(id) {
    
}
// $(`#accord-${props._id}`).on("click", async function(){
// })
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