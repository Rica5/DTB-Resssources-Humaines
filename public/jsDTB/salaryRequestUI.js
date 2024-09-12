
class RequestSalary {
    constructor() {
    }

    async fetchRequestUrgent(){
        var result = await fetch("/api/avance/all/true")
        const {ok, data} = await result.json()
        return data
    }
    async fetchRequestNUrgent(){
        var result = await fetch("/api/avance/all/false")
        const {ok, data} = await result.json()
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

    async renderAllNonUrgent(){
        
        $("#NUrgentList").html("")
        var dataNUrg = await this.fetchRequestNUrgent()
        $("#NUrgentBtn span").text(dataNUrg.length)
        dataNUrg.forEach(element =>{
            this.renderNonUrgent(element)
        })
    }


    render(props){
        console.log("props == ");
        
       var listeDemand =  `
        <li style="--ol-cards-color-accent:#ff624f">
            <div class="step" m-code="${props.user.m_code}"><i class="far fa-user" style="background: aliceblue"></i></div>
            <div class="title">${props.desired_amount} MGA</div>
            <div class="content">
            ${props.user.last_name} ${props.user.first_name}<br />
            </div>
            <div class="changeMontant-${props._id} hide" style="grid-column: span 2;">
                <input type="text" id="granted_${props._id}" value="${props.desired_amount}"/>MGA
            </div>
            <div class="bouton">
                <button id="modif-${props._id}" class="btn btn-warning  btnModifMontant" >Modif montant</button>
                <button id="accord-${props._id}" onclick="accordSalaryUrgent('${props._id}')" class="btn btn-primary toutBouton btnAccorde" >Accordée</button>

            </div>
        </li>`

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
        <li style="--ol-cards-color-accent:#00a560">
            <div class="step" m-code="${props.user.m_code}"><i class="far fa-user" style="background: aliceblue"></i></div>
            <div class="title">${props.desired_amount} MGA</div>
            <div class="content">
            ${props.user.last_name} ${props.user.first_name}<br />
            </div>
            <div class="changeMontant-${props._id} hide" style="grid-column: span 2;">
                <input type="text" id="granted_${props._id}" value="${props.desired_amount}"/>MGA
            </div>
            <div class="bouton">
                <button id="modif-${props._id}" class="btn btn-warning toutBouton btnModifMontant" >Modif montant</button>
                <button id="accord-${props._id}" onclick="accordSalaryNUrgent('${props._id}')" class="btn btn-primary toutBouton btnAccorde" >Accordée</button>
            </div>
        </li>`
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