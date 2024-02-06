
var myRequestContent = "";
var idActive = "";
var allRequest = [];
var emergencyRequest = [];
var normalRequest = [];
function UpdateRequest(){
    $.ajax({
        url:"/allRequest",
        method:"POST",
        data:{},
        success: function(res) {
            myRequestContent = ""
            allRequest = res;
            emergencyRequest = res.filter(leave => leave.priority  === true);
            normalRequest = res.filter(leave => leave.priority === false);
            renderAllRequest(allRequest);
            $('#allRequest').html(myRequestContent);
        }   
   })
}
function renderAllRequest(Leave){
    Leave.forEach(leave => {
        myRequestContent +=`
    <div id="${leave._id}" class="content-leave">
                        <div class="code-person">
                        <div>
                        <p id="codeUser" class="code-text">${leave.m_code}</p>
                        <p class='text-duration'>${leave.duration} jour(s)</p>
                        </div>
                            
                        </div>
                        <div class="leave-infos">
                            <small id="since" class="text-end"><b>${dateDiffers(leave.datetime,moment().format("DD/MM/YYYY HH:mm:ss"))}</b></small>
                            <p id="motif" class="text-center">${leave.motif}</p>
                            <div class="date-heure">
                                <div class="d">
                                    <h1>
                                        <i class="fa-solid fa-calendar"></i>
                                        Date
                                    </h1>
                                    <div>
                                        <span>Début:</span>
                                        <span>${convertDate(leave.date_start)}</span>
                                    </div>
                                    <div>
                                        <span>Fin:</span>
                                        <span>${convertDate(leave.date_end)}</span>
                                    </div>
                                </div>
                                <div class="h">
                                    <h1>
                                        <i class="fa-solid fa-clock"></i>
                                        Heure
                                    </h1>
                                    <div>
                                        <span>Début:</span>
                                        <span> ${leave.hour_begin}</span>
                                    </div>
                                    <div>
                                        <span>Fin:</span>
                                        <span> ${leave.hour_end}</span>
                                    </div>
                                </div>
                            </div>
                        ${approvingList(leave.validation)}
                            <div class="d-flex justify-content-end">
                                <button onclick="According('${leave._id}','${leave.m_code}','${leave.type}')" class="btn btn-sm btn-success btn-response">Accorder <i class="fa-solid fa-thumbs-up"></i></button>
                                <button onclick="Declined('${leave._id}','${leave.m_code}')" class="btn btn-sm btn-danger btn-response mx-3">Réfuser <i class="fa-solid fa-ban"></i></button>
                            </div>
                        </div>
                      </div>
    `
    });
    
}
UpdateRequest();
function convertDate(given){
    return moment(given).format("DD/MM/YYYY")
}
function dateDiffers(created, now) {
        created = moment(created,"DD/MM/YYYY HH:mm:ss");
        var endings = moment(now, "DD/MM/YYYY HH:mm:ss");
        var duration = moment.duration(endings.diff(created));
        var hoursFictif = duration.asHours();
        var dayNumber = 0
        var stringTime = ""
        if (hoursFictif > 24){
            while(hoursFictif > 24){
                dayNumber ++;
                hoursFictif = hoursFictif - 24
            }
            if (hoursFictif > 0){
                return stringTime = parseInt(dayNumber) + " jour(s) " + parseInt(hoursFictif) + " heure(s)"
            }
            else {
                return stringTime = parseInt(dayNumber) + " jour(s) "
            }
        }
        else if(hoursFictif < 1){
           return stringTime = parseInt(duration.asMinutes()) + " minute(s)"
        }
        else {
            return stringTime = parseInt(hoursFictif) + " heure(s)"
        }
  }

function According(id,code,type){
    if (typeof noType === 'undefined' || noType == "true"){
        $("#typeLeave").val(type);
        $("#typeLeave").prop("disabled",true);
        $("#title").text("Le type de congé décidé par la ressource humaine est:")
    }
    else {
        $('#typeLeave').val("")
    }
    idActive = id;
    var userActive = users.find(user => user.m_code == code);
    $("#codeAccept").text(`Voulez vous vraiment accepter l'absence de ${code}`)
    $("#project").html(renderProject(userActive.project))
    $("#ModalAccord").show();
}
function Declined(id,code){
    idActive = id;
    $("#codeDecline").text(`Veuilez ecrire en dessous la raison du refus d'absence de ${code}`);
    $("#ModalDecline").show();
}
function closeModal(){
    $("#ModalAccord").hide();
    $("#ModalDecline").hide();
}
function renderProject(given){
    var string  = "";
    given = given.split("/")
    if (given.length <= 1 ){
        string += `<div class="project mb-1">
        ${given}
      </div>`
    }
    else {
        given.forEach(element => {
            string += `<div class="project mb-1">
        ${element}
      </div>`
        });
    }
    return string
}
function Approve(){
    $("#waitingApprove").css('opacity','1')
    $.ajax({
        url:"/requestAnswer",
        method:"POST",
        data:{id:idActive,response:true,reason:""},
        success: function(res) {
            UpdateRequest();
            $("#waitingApprove").css('opacity','0')
            closeModal();
            $('#notification').text("Requête accepter avec success");
            $("#notification").attr("class","notice-success")
            $('#notification').show();
            setTimeout(() => {
                $('#notification').hide();
            }, 5000);
        }   
   })
}
function ApproveLast(){
    if (noType == "false"){
        if ($('#typeLeave').val() != ""){
            registerLeave()
           }
           else {
            $('#typeLeave').css('borderColor','red')
           }
    }
 }
function Decline(){
    if ($("#reason").val() != ""){
        $("#waitingDecline").css('opacity','1')
        $.ajax({
            url:"/requestAnswer",
            method:"POST",
            data:{id:idActive,response:false,reason:$("#reason").val()},
            success: function(res) {
                UpdateRequest();
                $("#waitingDecline").css('opacity','0')
                closeModal();
                $('#notification').text("La requête a été refuser");
                $("#notification").attr("class","notice-denied")
                $('#notification').show();
                setTimeout(() => {
                    $('#notification').hide();
                }, 5000);
            }   
       })
    } 
    else {
        $("#reason").attr("class","border-red")
    }  
   
}
function approvingList(all){
    var lists = "";
    all.forEach(element => {
        lists += `<span><i class="fa-solid fa-circle-check"></i> ${element.user.usuel}</span>`
    });
    return `<div class="d-flex approving-list">${lists}</div>`
}
$("#typeLeave").change(() => {
    $("#typeLeave").css('borderColor','#5AC4EC')
})
function registerLeave(){
    $("#waitingApprove").css('opacity','1')
    $.ajax({
        url:"/requestAnswer",
        method:"POST",
        data:{id:idActive,response:true,reason:"",typeleave:$('#typeLeave').val()},
        success: function(data) {
            $.ajax({
                url:"/takeleave",
                method:"POST",
                data:{code:data.m_code,type:data.type,leavestart:data.date_start,leaveend:data.date_end,
                      begin:data.hour_begin,end:data.hour_end,court:data.duration,motif:data.motif,idRequest:data._id},
                success: function(res) {
                    UpdateRequest();
                    $("#waitingApprove").css('opacity','0')
                    closeModal();
                    $('#notification').text("La requête a été valider");
                    $("#notification").attr("class","notice-success")
                    $('#notification').show();
                    setTimeout(() => {
                        $('#notification').hide();
                    }, 5000);
                }   
           })
        }   
   })
}