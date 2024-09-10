
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
        var data = await this.fetchRequestUrgent()
        $("#UrgentBtn span").text(data.length)
        data.forEach(element => {
            this.render(element)
        });


    }

    async renderAllNonUrgent(){
        
        var dataNUrg = await this.fetchRequestNUrgent()
        $("#NUrgentBtn span").text(dataNUrg.length)
        dataNUrg.forEach(element =>{
            this.renderNonUrgent(element)
        })
    }


    render(props){
        
       var listeDemand =  `
        <li style="--ol-cards-color-accent:#00a560">
            <div class="step" m-code="${props.user.m_code}"><i class="far fa-user" style="background: aliceblue"></i></div>
            <div class="title">${props.desired_amount} MGA</div>
            <div class="content">
            ${props.user.last_name} ${props.user.first_name}<br />
            </div>
            <div class="bouton">
            <button id="modif-${props._id}" class="btn btn-warning  btnModifMontant" >Modif montant</button>
            <button id="accord-${props._id}" class="btn btn-primary toutBouton btnAccorde" >Accordée</button>

            </div>
        </li>`

        $("#UrgentList").append(listeDemand)
    }

    renderNonUrgent(props){
        var listeDemand = `
        <li style="--ol-cards-color-accent:#ff624f">
            <div class="step" m-code="${props.user.m_code}"><i class="far fa-user" style="background: aliceblue"></i></div>
            <div class="title">${props.desired_amount} MGA</div>
            <div class="content">
            ${props.user.last_name} ${props.user.first_name}<br />
            </div>
            <div class="bouton">
            <button id="modif-${props._id}" class="btn btn-warning toutBouton btnModifMontant" >Modif montant</button>
            <button id="accord-${props._id}" class="btn btn-primary toutBouton btnAccorde" >Accordée</button>

            </div>
        </li>`
        $("#NUrgentList").append(listeDemand)
    }

}

var ui = new RequestSalary()
ui.renderAllUrgent()
ui.renderAllNonUrgent()

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